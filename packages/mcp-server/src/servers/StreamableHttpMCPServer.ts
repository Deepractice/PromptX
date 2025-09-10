import express, { Express, Request, Response } from 'express';
import { Server as HttpServer } from 'http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { 
  InitializeRequestSchema,
  LoggingMessageNotification,
  JSONRPCNotification,
  JSONRPCError,
  Notification
} from '@modelcontextprotocol/sdk/types.js';
import type { Resource } from '@modelcontextprotocol/sdk/types.js';
import { BaseMCPServer } from '~/servers/BaseMCPServer.js';
import type { MCPServerOptions } from '~/interfaces/MCPServer.js';
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
  
  // 支持多个并发连接
  private transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};
  
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
      sessions: Object.keys(this.transports).length
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
   */
  private async handleGetRequest(req: Request, res: Response): Promise<void> {
    const sessionId = req.headers[SESSION_ID_HEADER_NAME] as string | undefined;
    
    if (!sessionId || !this.transports[sessionId]) {
      res.status(400).json(
        this.createErrorResponse('Bad Request: invalid session ID or method.')
      );
      return;
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
    });
    
    const transport = this.transports[sessionId];
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
   */
  private async handlePostRequest(req: Request, res: Response): Promise<void> {
    const sessionId = req.headers[SESSION_ID_HEADER_NAME] as string | undefined;
    
    this.logger.info('=== POST Request ===');
    this.logger.info(`Headers: ${JSON.stringify(req.headers, null, 2)}`);
    this.logger.info(`Body: ${JSON.stringify(req.body, null, 2)}`);
    this.logger.info(`Session ID: ${sessionId}`);
    
    try {
      // 重用现有 transport
      if (sessionId && this.transports[sessionId]) {
        this.logger.info(`Reusing existing transport for session: ${sessionId}`);
        const transport = this.transports[sessionId];
        await transport.handleRequest(req, res, req.body);
        return;
      }
      
      // 创建新 transport（仅当是 initialize 请求时）
      if (!sessionId && this.isInitializeRequest(req.body)) {
        this.logger.info('Creating new transport for initialize request');
        
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID()
        });
        
        await this.server.connect(transport);
        
        await transport.handleRequest(req, res, req.body);
        
        // session ID will only be available after handling the first request
        const newSessionId = transport.sessionId;
        this.logger.info(`Generated session ID: ${newSessionId}`);
        if (newSessionId) {
          this.transports[newSessionId] = transport;
        }
        
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
    
    // 关闭所有 transports
    for (const transport of Object.values(this.transports)) {
      await transport.close();
    }
    this.transports = {};
    
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