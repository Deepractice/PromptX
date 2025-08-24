/**
 * FastMCPStdioServer - 基于 FastMCP 的 MCP Stdio 服务器实现
 * 使用 FastMCP 框架实现标准输入输出传输的 MCP 服务器
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
 * FastMCP Stdio 服务器实现
 */
class FastMCPStdioServer {
  constructor(options = {}) {
    // 服务器配置
    this.name = options.name || 'promptx-mcp-stdio-server';
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
      transport: 'stdio',
      startTime: null,
      processedMessages: 0,
      lastError: null
    };
    
    // 配置选项
    this.config = {
      debug: options.debug || process.env.MCP_DEBUG === 'true',
      autoRegisterTools: options.autoRegisterTools !== false,
      interceptors: [],
      metrics: {
        enabled: options.enableMetrics || false,
        messagesReceived: 0,
        messagesSent: 0,
        errors: 0,
        responseTimeSum: 0,
        responseTimeCount: 0
      }
    };
    
    // 流配置
    this.streams = {
      input: null,
      output: null,
      error: null
    };
  }

  /**
   * 获取服务器元信息
   */
  getMetadata() {
    return {
      name: this.name,
      version: this.version,
      transport: 'stdio',
      capabilities: {
        tools: true,
        resources: false,
        prompts: false,
        experimental: {
          streaming: false,
          batching: false
        }
      }
    };
  }

  /**
   * 启动服务器
   */
  async start(options = {}) {
    if (this.status.running) {
      throw new Error('Server is already running');
    }

    const {
      inputStream = process.stdin,
      outputStream = process.stdout,
      errorStream = process.stderr,
      debug = this.config.debug
    } = options;

    // 保存流引用
    this.streams.input = inputStream;
    this.streams.output = outputStream;
    this.streams.error = errorStream;

    try {
      // 初始化 ServerEnvironment
      const serverEnv = getGlobalServerEnvironment();
      serverEnv.initialize({ transport: 'stdio' });

      // 创建 FastMCP 实例
      this.server = new FastMCP({
        name: this.name,
        version: this.version,
        instructions: this.description,
        // 使用自定义日志器
        logger: debug ? this.createLogger() : undefined
      });

      // 自动注册 PromptX 工具
      if (this.config.autoRegisterTools) {
        await this.registerPromptXTools();
      } else {
        // 只有在没有自动注册的情况下，才注册已添加的自定义工具
        for (const [, tool] of this.tools) {
          await this.registerToolToFastMCP(tool);
        }
      }

      // 启动 stdio 传输
      await this.server.start({
        transportType: 'stdio',
        stdio: {
          inputStream,
          outputStream,
          errorStream
        }
      });

      // 更新状态
      this.status.running = true;
      this.status.startTime = new Date().toISOString();
      
      if (debug) {
        logger.info('✅ FastMCP Stdio Server started');
        logger.info(`📊 Tools: ${this.tools.size} registered`);
      }

      // 设置信号处理
      this.setupSignalHandlers();

      return { success: true };
    } catch (error) {
      this.status.lastError = error.message;
      logger.error('Failed to start stdio server:', error);
      throw error;
    }
  }

  /**
   * 停止服务器
   */
  async stop() {
    if (!this.status.running) {
      return;
    }

    try {
      if (this.server) {
        await this.server.stop();
      }
      
      this.status.running = false;
      
      if (this.config.debug) {
        logger.info('🛑 FastMCP Stdio Server stopped');
      }
    } catch (error) {
      logger.error('Error stopping server:', error);
      throw error;
    }
  }

  /**
   * 注册工具
   */
  registerTool(tool) {
    // 验证工具结构
    if (!tool.name || !tool.description) {
      throw new Error('Tool must have name and description');
    }

    // 如果服务器已运行，立即注册到 FastMCP
    if (this.server) {
      this.registerToolToFastMCP(tool).catch(error => {
        logger.error(`Failed to register tool ${tool.name}:`, error);
      });
    } else {
      // 服务器未运行时，先保存工具定义
      this.tools.set(tool.name, tool);
    }
  }

  /**
   * 处理 stdio 消息（FastMCP 自动处理，这里用于兼容接口）
   */
  async handleStdioMessage(message) {
    this.status.processedMessages++;
    
    // 记录指标
    if (this.config.metrics.enabled) {
      this.config.metrics.messagesReceived++;
    }

    // 执行拦截器
    for (const interceptor of this.config.interceptors) {
      try {
        await interceptor(message);
      } catch (error) {
        logger.error('Interceptor error:', error);
      }
    }

    // FastMCP 自动处理实际的消息路由
    return { 
      handled: true,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 获取服务器状态
   */
  getStatus() {
    return {
      running: this.status.running,
      transport: this.status.transport,
      tools: this.tools.size,
      streams: {
        input: !!this.streams.input,
        output: !!this.streams.output
      },
      startTime: this.status.startTime,
      processedMessages: this.status.processedMessages,
      lastError: this.status.lastError
    };
  }

  /**
   * 设置流处理器（可选方法）
   */
  setStreamHandlers(handlers) {
    // FastMCP 内部处理流，这里主要用于调试
    if (handlers.onData) {
      this.streams.input?.on('data', handlers.onData);
    }
    if (handlers.onError) {
      this.streams.input?.on('error', handlers.onError);
    }
    if (handlers.onClose) {
      this.streams.input?.on('close', handlers.onClose);
    }
  }

  /**
   * 启用日志记录（可选方法）
   */
  enableLogging(config = {}) {
    this.config.debug = true;
    
    if (config.level) {
      logger.setLevel(config.level);
    }
    
    if (config.logFile) {
      logger.addFileTransport(config.logFile);
    }
  }

  /**
   * 注册消息拦截器（可选方法）
   */
  registerMessageInterceptor(interceptor) {
    if (typeof interceptor === 'function') {
      this.config.interceptors.push(interceptor);
    }
  }

  /**
   * 获取性能指标（可选方法）
   */
  getMetrics() {
    const uptime = this.status.startTime 
      ? (Date.now() - new Date(this.status.startTime).getTime()) / 1000 
      : 0;

    const avgResponseTime = this.config.metrics.responseTimeCount > 0
      ? this.config.metrics.responseTimeSum / this.config.metrics.responseTimeCount
      : 0;

    return {
      messagesReceived: this.config.metrics.messagesReceived,
      messagesSent: this.config.metrics.messagesSent,
      averageResponseTime: avgResponseTime,
      errors: this.config.metrics.errors,
      uptime
    };
  }

  // ========== 内部辅助方法 ==========

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
        
        // 创建 FastMCP 工具配置
        const fastMCPTool = {
          name: tool.name,
          description: tool.description,
          // 转换 JSON Schema 到 Zod
          parameters: this.convertToZodSchema(tool.inputSchema),
          execute: async (args) => {
            return await this.executePromptXTool(tool.name, args);
          }
        };
        
        // 注册到 FastMCP
        this.server.addTool(fastMCPTool);
        
        // 保存到工具映射  
        this.tools.set(tool.name, tool);
        
        if (this.config.debug) {
          logger.debug(`Registered PromptX tool: ${tool.name}`);
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
        this.config.metrics.messagesSent++;
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
        logger.info('[FastStdioMCPServer] convertToCliArgs toolx:');
        logger.info('[FastStdioMCPServer] args:', args);
        logger.info('[FastStdioMCPServer] args.parameters:', args.parameters);
        
        if (!args || !args.tool_resource || !args.parameters) {
          throw new Error('tool_resource 和 parameters 参数是必需的');
        }
        const toolArgs = [args.tool_resource, JSON.stringify(args.parameters)];
        logger.info('[FastStdioMCPServer] toolArgs after JSON.stringify:', toolArgs);
        
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
          } else if (Array.isArray(value)) {
            value.forEach(v => {
              cliArgs.push(`--${key}`, String(v));
            });
          } else if (value !== null && value !== undefined) {
            cliArgs.push(`--${key}`, String(value));
          }
        }
        return cliArgs;
      }
    }
  }

  /**
   * 创建自定义日志器
   */
  createLogger() {
    return {
      debug: (msg, ...args) => logger.debug(`[FastMCP Stdio] ${msg}`, ...args),
      info: (msg, ...args) => logger.info(`[FastMCP Stdio] ${msg}`, ...args),
      warn: (msg, ...args) => logger.warn(`[FastMCP Stdio] ${msg}`, ...args),
      error: (msg, ...args) => logger.error(`[FastMCP Stdio] ${msg}`, ...args)
    };
  }

  /**
   * 设置信号处理
   */
  setupSignalHandlers() {
    const shutdown = async (signal) => {
      if (this.config.debug) {
        logger.info(`\n🛑 Received ${signal}, shutting down...`);
      }
      await this.stop();
      process.exit(0);
    };

    process.once('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));
  }
}

module.exports = FastMCPStdioServer;