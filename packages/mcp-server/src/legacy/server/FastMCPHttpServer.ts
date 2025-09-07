/**
 * FastMCPHttpServer - 基于 FastMCP 的 MCP HTTP 服务器实现
 * 使用 FastMCP 框架实现 HTTP/SSE 传输的 MCP 服务器
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { randomUUID } from 'crypto';
import express, { Request, Response } from 'express';
import { MCPOutputAdapter } from '../MCPOutputAdapter'
import logger from '@promptx/logger'

// 动态导入 @promptx/core 的 CommonJS 模块
let getGlobalServerEnvironment: any
let cli: any

const SESSION_ID_HEADER_NAME = 'mcp-session-id';

/**
 * FastMCP HTTP 服务器实现 - 使用正确的 Schema 模式
 */
export class FastMCPHttpServer {
  name: string
  version: string
  description: string
  mcpServer: Server
  transports: { [sessionId: string]: StreamableHTTPServerTransport }
  app: express.Application | null
  httpServer: any
  tools: Map<string, any>
  toolDefinitions: any[]
  outputAdapter: MCPOutputAdapter
  status: any
  config: any
  sessions: Map<string, any>
  
  constructor(options: any = {}) {
    // 服务器配置
    this.name = options.name || 'promptx-mcp-http-server';
    this.version = options.version || '1.0.0';
    this.description = options.description || 'PromptX MCP Server - AI-powered command execution framework';
    
    // MCP Server 实例
    this.mcpServer = new Server(
      {
        name: this.name,
        version: this.version,
      },
      {
        capabilities: {
          tools: {},
          logging: {},
        },
      }
    );
    
    // HTTP 服务器
    this.transports = {};
    this.app = null;
    this.httpServer = null;
    
    // 工具管理
    this.tools = new Map();
    this.toolDefinitions = [];
    
    // 输出适配器
    this.outputAdapter = new MCPOutputAdapter();
    
    // 状态管理
    this.status = {
      running: false,
      transport: 'http',
      startTime: null,
      processedMessages: 0,
      lastError: null,
      connections: 0,
      port: null,
      host: null,
      endpoint: null
    };
    
    // 配置选项
    this.config = {
      debug: options.debug || process.env.MCP_DEBUG === 'true',
      port: options.port || 5203,
      host: options.host || 'localhost',
      endpoint: options.endpoint || '/mcp',
      stateless: options.stateless || false,
      autoRegisterTools: options.autoRegisterTools !== false,
      cors: options.cors || {
        origin: '*',
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
      },
      auth: options.auth || null,
      ssl: options.ssl || null,
      interceptors: [],
      metrics: {
        enabled: options.enableMetrics || false,
        requestsTotal: 0,
        responseTimeSum: 0,
        responseTimeCount: 0,
        errors: 0,
        toolExecutions: {}
      }
    };
    
    // 会话管理（stateful 模式）
    this.sessions = new Map();
  }

  // ========== 接口必须方法 ==========

  /**
   * 获取服务器元信息
   */
  getMetadata() {
    return {
      name: this.name,
      version: this.version,
      transport: 'http',
      capabilities: {
        tools: true,
        resources: true,
        prompts: false,
        stateless: this.config.stateless,
        sse: true,
        cors: true,
        auth: !!this.config.auth
      }
    };
  }

  /**
   * 启动 HTTP 服务器
   */
  async start(options: any = {}) {
    // 合并配置选项
    Object.assign(this.config, options);
    
    try {
      // 动态导入 @promptx/core 模块
      if (!getGlobalServerEnvironment) {
        const core = await import('@promptx/core')
        const coreExports = core.default || core
        getGlobalServerEnvironment = (coreExports as any).utils?.getGlobalServerEnvironment || (coreExports as any).getGlobalServerEnvironment || (() => ({ initialize: () => {}, isInitialized: () => false }))
        cli = (coreExports as any).cli || (coreExports as any).pouch?.cli
      }
      
      // 初始化 ServerEnvironment
      const serverEnv = getGlobalServerEnvironment();
      if (!serverEnv.isInitialized()) {
        serverEnv.initialize({ 
          transport: 'http', 
          host: this.config.host, 
          port: this.config.port 
        });
      }

      // 设置工具处理
      await this.setupTools();

      // 自动注册工具
      if (this.config.autoRegisterTools) {
        await this.registerPromptXTools();
      }

      // 创建 Express 应用
      this.app = express();
      this.app.use(express.json());

      const router = express.Router();

      // POST 请求处理
      router.post(this.config.endpoint, async (req: Request, res: Response) => {
        await this.handlePostRequest(req, res);
      });

      // GET 请求处理 (SSE)
      router.get(this.config.endpoint, async (req: Request, res: Response) => {
        await this.handleGetRequest(req, res);
      });

      this.app.use('/', router);

      // 启动 HTTP 服务器
      await new Promise<void>((resolve) => {
        this.httpServer = this.app!.listen(this.config.port, () => {
          resolve();
        });
      });
      
      // 更新状态
      this.status.running = true;
      this.status.startTime = new Date();
      this.status.port = this.config.port;
      this.status.host = this.config.host;
      this.status.endpoint = this.config.endpoint;
      
      logger.info(`MCP HTTP Server started on http://${this.config.host}:${this.config.port}${this.config.endpoint}`);
      logger.info(`Mode: ${this.config.stateless ? 'Stateless' : 'Stateful'} (Schema)`);
      logger.info(`Tools: ${this.tools.size} registered`);
      
      if (this.config.debug) {
        logger.debug('Debug mode enabled');
      }
      
      // 设置信号处理
      this.setupSignalHandlers();
      
    } catch (error) {
      this.status.lastError = error;
      logger.error('Failed to start HTTP server:', error);
      throw error;
    }
  }

  /**
   * 停止服务器
   */
  async stop() {
    if (this.httpServer) {
      return new Promise<void>((resolve) => {
        // 设置超时强制关闭
        const timeout = setTimeout(() => {
          logger.warn('Forcing server shutdown due to timeout');
          this.status.running = false;
          resolve();
        }, 1000); // 1秒超时

        this.httpServer.close(() => {
          clearTimeout(timeout);
          this.status.running = false;
          logger.info('MCP HTTP Server stopped gracefully');
          resolve();
        });
      });
    }
  }

  /**
   * 注册工具
   */
  registerTool(tool) {
    if (this.tools.has(tool.name)) {
      if (this.config.debug) {
        logger.debug(`Tool ${tool.name} already registered, skipping`);
      }
      return;
    }
    
    // 注册到 FastMCP
    this.registerToolToFastMCP(tool);
  }

  /**
   * 处理 HTTP 请求（FastMCP 内部处理）
   */
  async handleHttpRequest(request, response) {
    // FastMCP 自动处理 HTTP 请求
    // 这个方法主要是为了接口兼容性
    this.status.processedMessages++;
    
    if (this.config.metrics.enabled) {
      this.config.metrics.requestsTotal++;
    }
  }

  /**
   * 获取服务器状态
   */
  getStatus() {
    const uptime = this.status.startTime 
      ? (Date.now() - new Date(this.status.startTime).getTime()) / 1000 
      : 0;

    return {
      running: this.status.running,
      transport: 'http',
      endpoint: this.status.endpoint,
      port: this.status.port,
      host: this.status.host,
      connections: this.status.connections,
      sessions: this.config.stateless ? null : {
        count: this.sessions.size,
        ids: Array.from(this.sessions.keys())
      },
      uptime,
      processedMessages: this.status.processedMessages,
      lastError: this.status.lastError
    };
  }

  // ========== 可选接口方法 ==========

  /**
   * 处理 SSE 连接
   */
  handleSseConnection(request, response) {
    // FastMCP 自动处理 SSE
    this.status.connections++;
    
    response.on('close', () => {
      this.status.connections--;
    });
  }

  /**
   * 认证请求
   */
  async authenticateRequest(request) {
    if (!this.config.auth) {
      return true;
    }
    
    // 实现认证逻辑
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return false;
    }
    
    // 示例：Bearer token 认证
    if (this.config.auth.type === 'bearer') {
      const token = authHeader.replace('Bearer ', '');
      return token === this.config.auth.token;
    }
    
    return true;
  }

  /**
   * 创建会话
   */
  createSession(sessionId) {
    if (this.config.stateless) {
      return null;
    }
    
    const session = {
      id: sessionId,
      createdAt: new Date(),
      lastAccess: new Date(),
      data: {}
    };
    
    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * 获取会话
   */
  getSession(sessionId) {
    if (this.config.stateless) {
      return null;
    }
    
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastAccess = new Date();
    }
    return session;
  }

  /**
   * 删除会话
   */
  deleteSession(sessionId) {
    this.sessions.delete(sessionId);
  }

  /**
   * 配置 CORS
   */
  configureCors(corsOptions) {
    this.config.cors = corsOptions;
  }

  /**
   * 配置速率限制
   */
  configureRateLimit(rateLimitOptions) {
    // 可以集成 express-rate-limit 或类似库
    this.config.rateLimit = rateLimitOptions;
  }

  /**
   * 健康检查
   */
  getHealthCheck() {
    const uptime = this.status.startTime 
      ? (Date.now() - new Date(this.status.startTime).getTime()) / 1000 
      : 0;

    return {
      status: this.status.running ? 'healthy' : 'unhealthy',
      uptime,
      memory: process.memoryUsage(),
      tools: this.tools.size,
      errors: this.config.metrics.errors
    };
  }

  /**
   * 获取指标
   */
  getMetrics() {
    const avgResponseTime = this.config.metrics.responseTimeCount > 0
      ? this.config.metrics.responseTimeSum / this.config.metrics.responseTimeCount
      : 0;

    return {
      requestsTotal: this.config.metrics.requestsTotal,
      requestsPerSecond: 0, // 需要实现计算逻辑
      averageResponseTime: avgResponseTime,
      activeConnections: this.status.connections,
      toolExecutions: this.config.metrics.toolExecutions
    };
  }

  // ========== 内部辅助方法 ==========

  /**
   * 加载工具定义文件
   */
  async loadToolDefinitions() {
    // 动态导入定义文件
    const definitions = await import('../definitions/index')
    
    // 如果导出了 tools 数组，使用它；否则使用对象的值
    if (definitions.tools && Array.isArray(definitions.tools)) {
      return definitions.tools;
    }
    
    // 将对象转换为数组，排除 tools 属性本身
    const tools: any[] = [];
    for (const key in definitions) {
      if (key !== 'tools' && definitions[key] && typeof definitions[key] === 'object') {
        tools.push((definitions as any)[key]);
      }
    }
    
    return tools;
  }

  /**
   * 注册 PromptX 工具
   */
  async registerPromptXTools() {
    const tools = await this.loadToolDefinitions();
    
    for (const tool of tools) {
      try {
        // 检查是否已经注册过
        if (this.tools.has(tool.name)) {
          if (this.config.debug) {
            logger.debug(`Tool ${tool.name} already registered, skipping`);
          }
          continue;
        }
        
        // 注册到 FastMCP
        await this.registerToolToFastMCP(tool);
        
        if (this.config.debug) {
          logger.debug(`Registered tool: ${tool.name}`);
        }
      } catch (error) {
        logger.error(`Failed to register tool ${tool.name}:`, error);
      }
    }
  }

  /**
   * 注册工具
   */
  async registerToolToFastMCP(tool) {
    // 检查是否已经注册过
    if (this.tools.has(tool.name)) {
      if (this.config.debug) {
        logger.debug(`Tool ${tool.name} already registered, skipping`);
      }
      return;
    }
    
    // 直接保存工具定义，Schema 处理器会使用它们
    this.tools.set(tool.name, tool);
  }

  /**
   * 执行 PromptX 工具
   */
  async executePromptXTool(toolName, args) {
    const startTime = Date.now();
    
    try {
      // 从已注册的工具中获取定义
      const toolDef = this.tools.get(toolName);
      if (!toolDef) {
        throw new Error(`Tool not found: ${toolName}`);
      }

      let result;
      
      // 工具名需要去掉 promptx_ 前缀
      const commandName = toolName.replace(/^promptx_/, '');
      
      // 转换参数为 CLI 格式
      const cliArgs = this.convertToCliArgs(toolName, args);
      
      // cli.execute 接收两个参数：命令名和参数数组
      result = await cli.execute(commandName, cliArgs);

      // 记录指标
      if (this.config.metrics.enabled) {
        const responseTime = Date.now() - startTime;
        this.config.metrics.responseTimeSum += responseTime;
        this.config.metrics.responseTimeCount++;
        
        // 记录工具执行次数
        if (!this.config.metrics.toolExecutions[toolName]) {
          this.config.metrics.toolExecutions[toolName] = 0;
        }
        this.config.metrics.toolExecutions[toolName]++;
      }

      // 格式化输出
      return this.outputAdapter.convertToMCPFormat(result);
    } catch (error) {
      // 记录错误
      if (this.config.metrics.enabled) {
        this.config.metrics.errors++;
      }
      
      logger.error(`Tool execution failed for ${toolName}:`, error);
      throw error;
    }
  }


  /**
   * 转换参数为 CLI 格式
   */
  convertToCliArgs(toolName, args) {
    // 为不同的工具提供特定的转换逻辑
    switch (toolName) {
      case 'promptx_init':
        if (args && args.workingDirectory) {
          return [{ workingDirectory: args.workingDirectory, ideType: args.ideType }];
        }
        return [];
      
      case 'welcome':
        return [];
      
      case 'action':
        return args && args.role ? [args.role] : [];
      
      case 'learn':
        return args && args.resource ? [args.resource] : [];
      
      case 'recall': {
        if (!args || !args.role) {
          throw new Error('role 参数是必需的');
        }
        const recallArgs = [args.role];
        if (args && args.query && typeof args.query === 'string' && args.query.trim() !== '') {
          recallArgs.push(args.query);
        }
        return recallArgs;
      }
      
      case 'remember':
        if (!args || !args.role) {
          throw new Error('role 参数是必需的');
        }
        if (!args || !args.engrams || !Array.isArray(args.engrams)) {
          throw new Error('engrams 参数是必需的且必须是数组');
        }
        // 保持对象格式，RememberCommand.parseArgs期望接收对象
        return [args];
      
      case 'toolx': {
        if (!args || !args.tool_resource || !args.parameters) {
          throw new Error('tool_resource 和 parameters 参数是必需的');
        }
        const toolArgs = [args.tool_resource, JSON.stringify(args.parameters)];
        if (args.rebuild) {
          toolArgs.push('--rebuild');
        }
        if (args.timeout) {
          (toolArgs as any).push('--timeout', args.timeout);
        }
        return toolArgs;
      }
      
      default: {
        // 通用转换逻辑
        const cliArgs: any[] = [];
        for (const [key, value] of Object.entries(args || {})) {
          if (typeof value === 'boolean') {
            if (value) {
              cliArgs.push(`--${key}`);
            }
          } else if (value !== null && value !== undefined) {
            (cliArgs as any).push(`--${key}`, String(value));
          }
        }
        return cliArgs;
      }
    }
  }

  /**
   * 设置信号处理器
   */
  setupSignalHandlers() {
    const shutdown = async (signal) => {
      logger.info(`\n Received ${signal}, shutting down gracefully...`);
      await this.stop();
      process.exit(0);
    };

    process.once('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));
  }

  // ========== Schema 模式处理方法 ==========

  /**
   * 设置工具处理器
   */
  private async setupTools() {
    // 注册工具列表处理器
    this.mcpServer.setRequestHandler(
      ListToolsRequestSchema,
      async () => {
        const tools = [];
        for (const [name, tool] of this.tools) {
          tools.push({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
          });
        }
        return { tools };
      }
    );

    // 注册工具调用处理器
    this.mcpServer.setRequestHandler(
      CallToolRequestSchema,
      async (request: any) => {
        const toolName = request.params.name;
        const tool = this.tools.get(toolName);
        
        if (!tool) {
          throw new Error(`Tool not found: ${toolName}`);
        }

        try {
          // executePromptXTool 已经返回格式化的 MCP 响应，直接返回
          const result = await this.executePromptXTool(toolName, request.params.arguments);
          return result;
        } catch (error: any) {
          throw new Error(`Tool execution failed: ${error.message}`);
        }
      }
    );
  }

  /**
   * 处理 GET 请求（SSE 模式）
   */
  private async handleGetRequest(req: Request, res: Response) {
    const sessionId = req.headers[SESSION_ID_HEADER_NAME] as string | undefined;
    
    if (!sessionId || !this.transports[sessionId]) {
      res.status(400).json(this.createErrorResponse('Bad Request: invalid session ID or method.'));
      return;
    }

    logger.debug(`Establishing SSE stream for session ${sessionId}`);
    const transport = this.transports[sessionId];
    
    await transport.handleRequest(req, res);
  }

  /**
   * 处理 POST 请求
   */
  private async handlePostRequest(req: Request, res: Response) {
    const sessionId = req.headers[SESSION_ID_HEADER_NAME] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    logger.debug('=== POST Request ===');
    logger.debug('Headers:', JSON.stringify(req.headers, null, 2));
    logger.debug('Body:', JSON.stringify(req.body, null, 2));
    logger.debug('Session ID:', sessionId);

    try {
      // 重用现有 transport
      if (sessionId && this.transports[sessionId]) {
        logger.debug('Reusing existing transport for session:', sessionId);
        transport = this.transports[sessionId];
        await transport.handleRequest(req, res, req.body);
        return;
      }

      // 创建新 transport
      if (!sessionId && this.isInitializeRequest(req.body)) {
        logger.debug('Creating new transport for initialize request');
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
        });

        await this.mcpServer.connect(transport);
        await transport.handleRequest(req, res, req.body);

        // 获取生成的 session ID
        const generatedSessionId = transport.sessionId;
        logger.debug('Generated session ID:', generatedSessionId);
        
        if (generatedSessionId) {
          this.transports[generatedSessionId] = transport;
        }

        return;
      }

      logger.debug('Invalid request - no session ID and not initialize request');
      res.status(400).json(
        this.createErrorResponse('Bad Request: invalid session ID or method.')
      );
      return;
    } catch (error) {
      logger.error('Error handling MCP request:', error);
      res.status(500).json(this.createErrorResponse('Internal server error.'));
      return;
    }
  }

  /**
   * 检查是否为初始化请求
   */
  private isInitializeRequest(body: any): boolean {
    return body && typeof body === 'object' && body.method === 'initialize';
  }

  /**
   * 创建错误响应
   */
  private createErrorResponse(message: string) {
    return {
      jsonrpc: '2.0',
      error: {
        code: -32600,
        message,
      },
      id: null,
    };
  }
}