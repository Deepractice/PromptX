/**
 * FastMCPHttpServer - 基于 FastMCP 的 MCP HTTP 服务器实现
 * 使用 FastMCP 框架实现 HTTP/SSE 传输的 MCP 服务器
 */

const { FastMCP } = require('fastmcp');
const { z } = require('zod');
const fs = require('fs');
const path = require('path');
const logger = require('../../utils/logger');
const { MCPOutputAdapter } = require('../MCPOutputAdapter');
const { getGlobalServerEnvironment } = require('../../utils/ServerEnvironment');
const { cli } = require('../../core/pouch');

/**
 * FastMCP HTTP 服务器实现
 */
class FastMCPHttpServer {
  constructor(options = {}) {
    // 服务器配置
    this.name = options.name || 'promptx-mcp-http-server';
    this.version = options.version || '1.0.0';
    this.description = options.description || 'PromptX MCP Server - AI-powered command execution framework';
    
    // FastMCP 实例
    this.server = null;
    
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
  async start(options = {}) {
    // 合并配置选项
    Object.assign(this.config, options);
    
    try {
      // 初始化 ServerEnvironment
      const serverEnv = getGlobalServerEnvironment();
      if (!serverEnv.isInitialized()) {
        serverEnv.initialize({ 
          transport: 'http', 
          host: this.config.host, 
          port: this.config.port 
        });
      }

      // 创建 FastMCP 实例
      this.server = new FastMCP({
        name: this.name,
        version: this.version,
        instructions: this.description,
        logger: this.config.debug ? this.createLogger() : undefined
      });
      
      // 自动注册工具
      if (this.config.autoRegisterTools) {
        await this.registerPromptXTools();
      }
      
      // 启动服务器
      await this.server.start({
        transportType: 'httpStream',
        httpStream: {
          port: this.config.port,
          endpoint: this.config.endpoint,
          stateless: this.config.stateless,
          enableJsonResponse: true,
          // CORS 配置
          cors: this.config.cors,
          // 认证配置
          auth: this.config.auth,
          // SSL 配置
          ssl: this.config.ssl
        }
      });
      
      // 更新状态
      this.status.running = true;
      this.status.startTime = new Date();
      this.status.port = this.config.port;
      this.status.host = this.config.host;
      this.status.endpoint = this.config.endpoint;
      
      logger.info(`✅ MCP HTTP Server started on http://${this.config.host}:${this.config.port}${this.config.endpoint}`);
      logger.info(`📊 Mode: ${this.config.stateless ? 'Stateless' : 'Stateful'}`);
      logger.info(`🔧 Tools: ${this.tools.size} registered`);
      
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
    if (this.server) {
      try {
        await this.server.stop();
        this.status.running = false;
        logger.info('MCP HTTP Server stopped');
      } catch (error) {
        logger.error('Error stopping server:', error);
        throw error;
      }
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
   * 创建日志器
   */
  createLogger() {
    return {
      log: (...args) => logger.log(...args),
      info: (...args) => logger.info(...args),
      warn: (...args) => logger.warn(...args),
      error: (...args) => logger.error(...args),
      debug: (...args) => logger.debug(...args)
    };
  }

  /**
   * 加载工具定义文件
   */
  loadToolDefinitions() {
    // 从 index.js 读取所有工具定义
    const definitions = require('../definitions');
    
    // 如果导出了 tools 数组，使用它；否则使用对象的值
    if (definitions.tools && Array.isArray(definitions.tools)) {
      return definitions.tools;
    }
    
    // 将对象转换为数组，排除 tools 属性本身
    const tools = [];
    for (const key in definitions) {
      if (key !== 'tools' && definitions[key] && typeof definitions[key] === 'object') {
        tools.push(definitions[key]);
      }
    }
    
    return tools;
  }

  /**
   * 注册 PromptX 工具
   */
  async registerPromptXTools() {
    const tools = this.loadToolDefinitions();
    
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
   * 注册工具到 FastMCP
   */
  async registerToolToFastMCP(tool) {
    // 检查是否已经注册过
    if (this.tools.has(tool.name)) {
      if (this.config.debug) {
        logger.debug(`Tool ${tool.name} already registered, skipping`);
      }
      return;
    }
    
    const fastMCPTool = {
      name: tool.name,
      description: tool.description,
      // 转换 JSON Schema 到 Zod
      parameters: this.convertToZodSchema(tool.inputSchema),
      execute: tool.handler || (async (args) => {
        return await this.executePromptXTool(tool.name, args);
      })
    };

    this.server.addTool(fastMCPTool);
    
    // 注册成功后保存到映射
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
   * 转换 JSON Schema 到 Zod Schema
   */
  convertToZodSchema(jsonSchema) {
    if (!jsonSchema) {
      return z.object({});
    }

    if (jsonSchema.type === 'object') {
      const shape = {};
      
      if (jsonSchema.properties) {
        for (const [key, prop] of Object.entries(jsonSchema.properties)) {
          shape[key] = this.convertPropertyToZod(prop);
          
          // 处理可选字段
          if (!jsonSchema.required?.includes(key)) {
            shape[key] = shape[key].optional();
          }
        }
      }
      
      return z.object(shape);
    }
    
    return z.object({});
  }

  /**
   * 转换单个属性到 Zod
   */
  convertPropertyToZod(prop) {
    switch (prop.type) {
      case 'string': {
        let schema = z.string();
        if (prop.description) {
          schema = schema.describe(prop.description);
        }
        if (prop.enum) {
          schema = z.enum(prop.enum);
        }
        if (prop.pattern) {
          schema = schema.regex(new RegExp(prop.pattern));
        }
        if (prop.minLength) {
          schema = schema.min(prop.minLength);
        }
        if (prop.maxLength) {
          schema = schema.max(prop.maxLength);
        }
        return schema;
      }
      
      case 'number':
      case 'integer': {
        let schema = z.number();
        if (prop.description) {
          schema = schema.describe(prop.description);
        }
        if (prop.minimum !== undefined) {
          schema = schema.min(prop.minimum);
        }
        if (prop.maximum !== undefined) {
          schema = schema.max(prop.maximum);
        }
        if (prop.type === 'integer') {
          schema = schema.int();
        }
        return schema;
      }
      
      case 'boolean':
        return z.boolean().describe(prop.description || '');
      
      case 'array':
        if (prop.items) {
          return z.array(this.convertPropertyToZod(prop.items));
        }
        return z.array(z.any());
      
      case 'object':
        // 如果没有定义 properties，则返回一个接受任何属性的对象
        if (!prop.properties) {
          return z.record(z.any());
        }
        return this.convertToZodSchema(prop);
      
      default:
        return z.any();
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
          toolArgs.push('--timeout', args.timeout);
        }
        return toolArgs;
      }
      
      default: {
        // 通用转换逻辑
        const cliArgs = [];
        for (const [key, value] of Object.entries(args || {})) {
          if (typeof value === 'boolean') {
            if (value) {
              cliArgs.push(`--${key}`);
            }
          } else if (value !== null && value !== undefined) {
            cliArgs.push(`--${key}`, String(value));
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
      logger.info(`\n🛑 Received ${signal}, shutting down gracefully...`);
      await this.stop();
      process.exit(0);
    };

    process.once('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));
  }
}

module.exports = FastMCPHttpServer;