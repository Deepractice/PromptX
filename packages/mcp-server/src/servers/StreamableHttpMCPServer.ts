import express, { Express, Request, Response } from 'express';
import { Server as HttpServer } from 'http';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { 
  InitializeRequestSchema,
  LoggingMessageNotification,
  JSONRPCNotification,
  JSONRPCError,
  Notification,
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ReadResourceRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import type { Resource, Tool, Prompt } from '@modelcontextprotocol/sdk/types.js';
import { BaseMCPServer } from '~/servers/BaseMCPServer.js';
import type { MCPServerOptions, ToolWithHandler } from '~/interfaces/MCPServer.js';
import { WorkerpoolAdapter } from '~/workers/index.js';
import type { ToolWorkerPool } from '~/interfaces/ToolWorkerPool.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';
import packageJson from '../../package.json' assert { type: 'json' };

const SESSION_ID_HEADER_NAME = "mcp-session-id";

/**
 * HTTP流式MCP服务器实现
 * 
 * 使用 MCP SDK 的 StreamableHTTPServerTransport 处理所有协议细节
 * 支持HTTP JSON-RPC和SSE（Server-Sent Events）
 */
export class StreamableHttpMCPServer extends BaseMCPServer {
  private app?: Express;
  private httpServer?: HttpServer;
  private port: number;
  private host: string;
  private corsEnabled: boolean;
  private workerPool: ToolWorkerPool;
  
  // 支持多个并发连接 - 每个session独立的Server和Transport实例
  private servers: Map<string, Server> = new Map();
  private transports: Map<string, StreamableHTTPServerTransport> = new Map();
  
  constructor(options: MCPServerOptions & {
    port?: number;
    host?: string;
    corsEnabled?: boolean;
  }) {
    super(options);
    this.port = options.port || 8080;
    this.host = options.host || '127.0.0.1';  // 使用 IPv4 避免 IPv6 问题
    this.corsEnabled = options.corsEnabled || false;
    
    // 初始化 worker pool
    this.workerPool = new WorkerpoolAdapter({
      minWorkers: 2,
      maxWorkers: 4,
      workerTimeout: 30000
    });
  }
  
  /**
   * 连接HTTP传输层
   */
  protected async connectTransport(): Promise<void> {
    this.logger.info('Starting HTTP server...');
    
    // 初始化 worker pool
    await this.workerPool.initialize();
    this.logger.info('Worker pool initialized');
    
    // 创建Express应用
    this.app = express();
    
    // 设置Express应用 - 完全仿照官方
    this.setupExpress();
    
    // 启动HTTP服务器
    await new Promise<void>((resolve, reject) => {
      this.httpServer = this.app!.listen(this.port, this.host, () => {
        this.logger.info(`HTTP server listening on http://${this.host}:${this.port}/mcp`);
        resolve();
      });
      
      this.httpServer.on('error', reject);
    });
  }
  
  /**
   * 获取或创建session对应的Server实例
   * 
   * 形式化规约：
   * 前置条件：sessionId ≠ null ∧ sessionId ≠ ""
   * 后置条件：返回的Server是sessionId唯一对应的
   * 不变式：servers.get(sessionId) 存在 ⟺ transports.get(sessionId) 存在
   */
  private getOrCreateServer(sessionId: string): Server {
    // 断言：sessionId必须有效
    if (!sessionId) {
      throw new Error('SessionId cannot be null or empty');
    }
    
    // 如果已存在，直接返回
    if (this.servers.has(sessionId)) {
      return this.servers.get(sessionId)!;
    }
    
    // 创建新的Server实例（注意：不监听端口）
    const server = new Server(
      {
        name: this.options.name,
        version: this.options.version
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {}
        }
      }
    );
    
    // 为这个Server注册处理器（独立副本）
    this.setupServerHandlers(server);
    
    // 保存Server实例
    this.servers.set(sessionId, server);
    this.logger.info(`Created new Server instance for session: ${sessionId}`);
    
    return server;
  }
  
  /**
   * 为Server实例设置请求处理器
   * 注意：这些处理器是每个Server独立的
   */
  private setupServerHandlers(server: Server): void {
    // 工具列表请求
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      this.logger.debug('Handling list tools request');
      return {
        tools: Array.from(this.tools.values()).map(({ handler, ...tool }) => tool)
      };
    });
    
    // 工具调用请求
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      this.logger.debug(`Handling tool call: ${request.params.name}`);
      return this.executeTool(request.params.name, request.params.arguments);
    });
    
    // 资源列表请求
    server.setRequestHandler(ListResourcesRequestSchema, async () => {
      this.logger.debug('Handling list resources request');
      return {
        resources: Array.from(this.resources.values())
      };
    });
    
    // 读取资源请求
    server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      this.logger.debug(`Handling read resource: ${request.params.uri}`);
      const resource = this.resources.get(request.params.uri);
      if (!resource) {
        throw new Error(`Resource not found: ${request.params.uri}`);
      }
      return this.readResource(resource);
    });
    
    // 提示词列表请求
    server.setRequestHandler(ListPromptsRequestSchema, async () => {
      this.logger.debug('Handling list prompts request');
      return {
        prompts: Array.from(this.prompts.values())
      };
    });
    
    // 获取提示词请求
    server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      this.logger.debug(`Handling get prompt: ${request.params.name}`);
      const prompt = this.prompts.get(request.params.name);
      if (!prompt) {
        throw new Error(`Prompt not found: ${request.params.name}`);
      }
      return { prompt };
    });
  }
  
  /**
   * 设置中间件和路由 - 完全仿照官方实现
   */
  private setupExpress(): void {
    if (!this.app) return;
    
    // 仿照官方：只有基础的 JSON 解析
    this.app.use(express.json());
    
    // 仿照官方：使用 Router
    const router = express.Router();
    
    // 健康检查端点 - 在其他路由之前定义
    router.get('/health', (req, res) => {
      this.handleHealthCheck(req, res);
    });
    
    // 仿照官方：路由定义
    router.post('/mcp', async (req, res) => {
      await this.handlePostRequest(req, res);
    });
    
    router.get('/mcp', async (req, res) => {
      await this.handleGetRequest(req, res);
    });
    
    // 仿照官方：挂载路由
    this.app.use('/', router);
  }
  
  /**
   * 处理健康检查请求
   * 
   * 形式化保证：
   * - 无副作用（幂等性）
   * - O(1)时间复杂度
   * - 始终返回有效JSON
   */
  private handleHealthCheck(req: Request, res: Response): void {
    const healthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'mcp-server',
      uptime: process.uptime(),
      version: this.getVersion(),
      transport: 'http',
      sessions: this.servers.size,  // 显示当前活跃的session数量
      servers: this.servers.size,   // 独立Server实例数量
      transports: this.transports.size  // Transport实例数量
    };
    
    res.status(200).json(healthStatus);
  }
  
  /**
   * 获取服务版本信息
   */
  private getVersion(): string {
    return packageJson.version || 'unknown';
  }
  
  /**
   * 处理 GET 请求（SSE）
   * 使用独立的Server实例处理SSE连接
   */
  private async handleGetRequest(req: Request, res: Response): Promise<void> {
    const sessionId = req.headers[SESSION_ID_HEADER_NAME] as string | undefined;
    
    if (!sessionId) {
      res.status(400).json(
        this.createErrorResponse('Bad Request: session ID required for SSE.')
      );
      return;
    }
    
    // 确保session存在（获取或创建Server和Transport）
    if (!this.transports.has(sessionId)) {
      this.logger.info(`Session ${sessionId} not found for SSE, creating...`);
      
      // 获取或创建Server
      const server = this.getOrCreateServer(sessionId);
      
      // 创建Transport
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => sessionId
      });
      
      // 连接
      await server.connect(transport);
      this.transports.set(sessionId, transport);
    }
    
    this.logger.info(`Establishing SSE stream for session ${sessionId}`);
    
    // 设置 SSE 必需的响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // 禁用 Nginx 缓冲
    
    // 启动心跳机制 - 每 20 秒发送一次
    const heartbeatInterval = setInterval(() => {
      try {
        // SSE 心跳格式：注释行
        res.write(':heartbeat\n\n');
        this.logger.info(`Sent SSE heartbeat for session ${sessionId}`);
      } catch (error) {
        this.logger.error(`Failed to send heartbeat for session ${sessionId}: ${error}`);
        clearInterval(heartbeatInterval);
      }
    }, 20000); // 20 秒间隔
    
    // 监听连接关闭事件
    req.on('close', () => {
      this.logger.info(`SSE connection closed for session ${sessionId}`);
      clearInterval(heartbeatInterval);
      // 注意：暂时不清理session，因为客户端可能重连
    });
    
    const transport = this.transports.get(sessionId)!;
    await transport.handleRequest(req, res);
    await this.streamMessages(transport);
    
    return;
  }
  
  /**
   * 发送 SSE 流消息 - 完全复制官方实现
   */
  private async streamMessages(transport: StreamableHTTPServerTransport): Promise<void> {
    try {
      // 基于 LoggingMessageNotificationSchema 触发客户端的 setNotificationHandler
      const message = {
        method: 'notifications/message',
        params: { level: 'info', data: 'SSE Connection established' }
      };
      
      this.sendNotification(transport, message);
      
      let messageCount = 0;
      
      const interval = setInterval(async () => {
        messageCount++;
        
        const data = `Message ${messageCount} at ${new Date().toISOString()}`;
        
        const message = {
          method: 'notifications/message',
          params: { level: 'info', data: data }
        };
        
        try {
          this.sendNotification(transport, message);
          
          if (messageCount === 2) {
            clearInterval(interval);
            
            const message = {
              method: 'notifications/message',
              params: { level: 'info', data: 'Streaming complete!' }
            };
            
            this.sendNotification(transport, message);
          }
        } catch (error) {
          this.logger.error(`Error sending message: ${error}`);
          clearInterval(interval);
        }
      }, 1000);
    } catch (error) {
      this.logger.error(`Error sending message: ${error}`);
    }
  }
  
  /**
   * 发送通知 - 完全复制官方实现
   */
  private async sendNotification(
    transport: StreamableHTTPServerTransport,
    notification: any
  ): Promise<void> {
    const rpcNotification = {
      ...notification,
      jsonrpc: '2.0'
    };
    await transport.send(rpcNotification);
  }
  
  /**
   * 处理 POST 请求（JSON-RPC）
   * 使用独立的Server实例处理每个session
   */
  private async handlePostRequest(req: Request, res: Response): Promise<void> {
    const sessionId = req.headers[SESSION_ID_HEADER_NAME] as string | undefined;
    
    this.logger.info('=== POST Request ===');
    this.logger.info(`Headers: ${JSON.stringify(req.headers, null, 2)}`);
    this.logger.info(`Body: ${JSON.stringify(req.body, null, 2)}`);
    this.logger.info(`Session ID: ${sessionId}`);
    
    try {
      // 处理已有session的请求
      if (sessionId && this.transports.has(sessionId)) {
        this.logger.info(`Reusing existing Server and Transport for session: ${sessionId}`);
        const transport = this.transports.get(sessionId)!;
        await transport.handleRequest(req, res, req.body);
        return;
      }
      
      // 处理initialize请求（创建新session）
      if (!sessionId && this.isInitializeRequest(req.body)) {
        this.logger.info('Creating new session for initialize request');
        
        // 生成新的session ID
        const newSessionId = randomUUID();
        
        // 获取或创建该session的Server
        const server = this.getOrCreateServer(newSessionId);
        
        // 创建新的Transport
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => newSessionId
        });
        
        // 连接Server和Transport
        await server.connect(transport);
        
        // 保存Transport（Server已在getOrCreateServer中保存）
        this.transports.set(newSessionId, transport);
        
        // 处理请求
        await transport.handleRequest(req, res, req.body);
        
        this.logger.info(`New session created: ${newSessionId}`);
        return;
      }
      
      // 处理带session ID但Transport不存在的情况（可能是服务器重启）
      if (sessionId && !this.transports.has(sessionId)) {
        this.logger.info(`Session ${sessionId} not found, recreating...`);
        
        // 获取或创建Server
        const server = this.getOrCreateServer(sessionId);
        
        // 创建新的Transport
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => sessionId
        });
        
        // 连接
        await server.connect(transport);
        this.transports.set(sessionId, transport);
        
        // 处理请求
        await transport.handleRequest(req, res, req.body);
        return;
      }
      
      // 无效请求
      this.logger.info('Invalid request - no session ID and not initialize request');
      this.logger.info(`isInitializeRequest result: ${this.isInitializeRequest(req.body)}`);
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: invalid session ID or method.'
        },
        id: randomUUID()
      });
      
    } catch (error) {
      this.logger.error(`Error handling MCP request: ${error}`);
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error.'
        },
        id: randomUUID()
      });
    }
  }
  
  /**
   * 检查是否是 initialize 请求 - 完全复制官方实现
   */
  private isInitializeRequest(body: any): boolean {
    const isInitial = (data: any) => {
      const result = InitializeRequestSchema.safeParse(data);
      return result.success;
    };
    if (Array.isArray(body)) {
      return body.some((request) => isInitial(request));
    }
    return isInitial(body);
  }
  
  /**
   * 创建错误响应 - 完全复制官方实现
   */
  private createErrorResponse(message: string): any {
    return {
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: message
      },
      id: randomUUID()
    };
  }
  
  /**
   * 断开HTTP传输层
   */
  protected async disconnectTransport(): Promise<void> {
    this.logger.info('Stopping HTTP server...');
    
    // 关闭所有 transports 和 servers
    for (const [sessionId, transport] of this.transports.entries()) {
      this.logger.info(`Closing transport for session: ${sessionId}`);
      await transport.close();
    }
    
    // 清理所有servers（不需要显式关闭，因为它们不监听端口）
    this.servers.clear();
    this.transports.clear();
    
    // 关闭HTTP服务器
    if (this.httpServer) {
      await new Promise<void>((resolve) => {
        this.httpServer!.close(() => {
          this.logger.info('HTTP server stopped');
          resolve();
        });
      });
      
      this.httpServer = undefined;
    }
    
    // 终止 worker pool
    await this.workerPool.terminate();
    this.logger.info('Worker pool terminated');
    
    this.app = undefined;
  }
  
  /**
   * 清理特定session的资源
   * 可以在session超时或客户端断开时调用
   */
  private async cleanupSession(sessionId: string): Promise<void> {
    this.logger.info(`Cleaning up session: ${sessionId}`);
    
    // 关闭Transport
    const transport = this.transports.get(sessionId);
    if (transport) {
      await transport.close();
      this.transports.delete(sessionId);
    }
    
    // 移除Server（垃圾回收会处理）
    this.servers.delete(sessionId);
    
    this.logger.info(`Session cleaned up: ${sessionId}`);
  }
  
  /**
   * 读取资源内容
   */
  protected async readResource(resource: Resource): Promise<any> {
    try {
      const uri = new URL(resource.uri);
      
      if (uri.protocol === 'file:') {
        const filePath = uri.pathname;
        const resolvedPath = path.resolve(filePath);
        const content = await fs.readFile(resolvedPath, 'utf-8');
        
        return {
          contents: [
            {
              uri: resource.uri,
              mimeType: resource.mimeType || 'text/plain',
              text: content
            }
          ]
        };
      } else if (uri.protocol === 'http:' || uri.protocol === 'https:') {
        // 支持HTTP资源
        const response = await fetch(resource.uri);
        const content = await response.text();
        
        return {
          contents: [
            {
              uri: resource.uri,
              mimeType: resource.mimeType || response.headers.get('content-type') || 'text/plain',
              text: content
            }
          ]
        };
      } else {
        throw new Error(`Unsupported resource protocol: ${uri.protocol}`);
      }
    } catch (error: any) {
      this.logger.error(`Failed to read resource: ${resource.uri} - ${error}`);
      throw new Error(`Failed to read resource: ${error.message}`);
    }
  }
  
  /**
   * 重写 executeTool 方法，使用 WorkerPool 执行所有工具
   */
  async executeTool(name: string, args: any): Promise<any> {
    if (!this.isRunning()) {
      this.logger.warn(`Attempted to execute tool '${name}' while server is not running`);
      throw new Error('Server is not running');
    }
    
    const tool = this.tools.get(name);
    if (!tool) {
      this.logger.error(`Tool not found: ${name}. Available tools: ${Array.from(this.tools.keys()).join(', ')}`);
      throw new Error(`Tool not found: ${name}`);
    }
    
    const startTime = Date.now();
    
    this.logger.info(`[TOOL_EXEC_START] Tool: ${name} (via WorkerPool)`);
    this.logger.debug(`[TOOL_ARGS] ${name}: ${JSON.stringify(args)}`);
    
    try {
      // 所有工具都通过 WorkerPool 执行
      const result = await this.workerPool.execute(tool, args);
      
      const responseTime = Date.now() - startTime;
      this.logger.info(`[TOOL_EXEC_SUCCESS] Tool: ${name}, Time: ${responseTime}ms`);
      
      // 更新指标
      this.metrics.requestCount++;
      this.metrics.avgResponseTime = 
        (this.metrics.avgResponseTime * (this.metrics.requestCount - 1) + responseTime) / 
        this.metrics.requestCount;
      
      return result;
      
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      this.logger.error(`[TOOL_EXEC_ERROR] Tool: ${name}, Time: ${responseTime}ms, Error: ${error.message}`);
      
      // 更新错误计数
      this.metrics.errorCount++;
      this.lastError = error;
      
      // 重新抛出错误
      throw error;
    }
  }
}