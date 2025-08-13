const { FastMCP } = require('fastmcp');
const { z } = require('zod');
const { getToolDefinitions } = require('../mcp/toolDefinitions');
const { cli } = require('../core/pouch');
const { MCPOutputAdapter } = require('../mcp/MCPOutputAdapter');
const { getGlobalServerEnvironment } = require('../utils/ServerEnvironment');
const logger = require('../utils/logger');
const { displayCompactBanner } = require('../utils/banner');

/**
 * MCP HTTP Server Command - 使用 FastMCP 重写
 * 解决 Issue #248: 统一使用 StreamableHTTP 传输层
 */
class MCPServerHttpCommand {
  constructor() {
    this.name = 'promptx-mcp-streamable-http-server';
    this.version = '1.0.0';
    this.server = null;
    this.outputAdapter = new MCPOutputAdapter();
    this.debug = process.env.MCP_DEBUG === 'true';
  }

  /**
   * 执行命令
   */
  async execute(options = {}) {
    const { 
      port = 3000, 
      host = 'localhost',
      stateless = false 
    } = options;

    // 显示启动 banner
    displayCompactBanner('MCP HTTP Server (FastMCP)');
    
    // 初始化 ServerEnvironment
    const serverEnv = getGlobalServerEnvironment();
    serverEnv.initialize({ transport: 'http', host, port });

    try {
      // 创建 FastMCP 实例
      this.server = new FastMCP({
        name: this.name,
        version: this.version,
        instructions: 'PromptX MCP Server - AI-powered command execution framework with cognition capabilities',
        // 自定义日志器
        logger: this.debug ? logger : undefined
      });

      // 注册所有 PromptX 工具
      await this.registerPromptXTools();
      
      // 启动服务器
      await this.server.start({
        transportType: 'httpStream',
        httpStream: {
          port,
          endpoint: '/mcp',
          stateless,
          // 启用 JSON 响应用于健康检查
          enableJsonResponse: true
        }
      });

      logger.info(`✅ MCP HTTP Server (FastMCP) started`);
      logger.info(`📍 Endpoint: http://${host}:${port}/mcp`);
      logger.info(`📊 Mode: ${stateless ? 'Stateless' : 'Stateful'}`);
      logger.info(`🔧 Tools: ${this.getToolDefinitions().length} registered`);
      
      if (this.debug) {
        logger.debug('Debug mode enabled - verbose logging active');
      }

      // 保持进程运行
      process.on('SIGINT', async () => {
        logger.info('\n🛑 Shutting down MCP server...');
        await this.stop();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        await this.stop();
        process.exit(0);
      });

      return { success: true, port, host };
    } catch (error) {
      logger.error('Failed to start MCP HTTP server:', error);
      throw error;
    }
  }

  /**
   * 注册 PromptX 工具到 FastMCP
   */
  async registerPromptXTools() {
    const tools = this.getToolDefinitions();
    
    for (const tool of tools) {
      try {
        // 转换工具定义为 FastMCP 格式
        const fastMCPTool = {
          name: tool.name,
          description: tool.description,
          // 将 inputSchema 转换为 Zod schema
          parameters: this.convertToZodSchema(tool.inputSchema),
          execute: async (args, context) => {
            return await this.executePromptXTool(tool.name, args, context);
          }
        };

        this.server.addTool(fastMCPTool);
        
        if (this.debug) {
          logger.debug(`Registered tool: ${tool.name}`);
        }
      } catch (error) {
        logger.error(`Failed to register tool ${tool.name}:`, error);
      }
    }
  }

  /**
   * 执行 PromptX 工具
   */
  async executePromptXTool(toolName, args, context) {
    try {
      // 记录工具调用
      if (context?.log) {
        context.log.info(`Executing PromptX tool: ${toolName}`, args);
      }

      // 查找工具定义
      const tool = this.getToolDefinitions().find(t => t.name === toolName);
      if (!tool) {
        throw new Error(`Tool not found: ${toolName}`);
      }

      // 执行工具
      let result;
      if (tool.handler) {
        // 直接调用处理器
        result = await tool.handler(args);
      } else if (tool.command) {
        // 通过 CLI 执行
        const cliArgs = this.convertToCliArgs(tool.command, args);
        result = await cli.execute(cliArgs);
      } else {
        throw new Error(`Tool ${toolName} has no handler or command`);
      }

      // 格式化输出
      return this.outputAdapter.format(result);
    } catch (error) {
      logger.error(`Tool execution failed for ${toolName}:`, error);
      
      // FastMCP 的错误处理
      if (error.message?.includes('User')) {
        // 用户错误，直接抛出
        throw error;
      }
      
      // 系统错误，包装后抛出
      throw new Error(`Tool execution failed: ${error.message}`);
    }
  }

  /**
   * 转换 JSON Schema 到 Zod Schema
   */
  convertToZodSchema(jsonSchema) {
    if (!jsonSchema) {
      return z.object({});
    }

    // 基础转换逻辑
    if (jsonSchema.type === 'object') {
      const shape = {};
      
      if (jsonSchema.properties) {
        for (const [key, prop] of Object.entries(jsonSchema.properties)) {
          shape[key] = this.convertPropertyToZod(prop);
          
          // 处理必需字段
          if (!jsonSchema.required?.includes(key)) {
            shape[key] = shape[key].optional();
          }
        }
      }
      
      return z.object(shape);
    }
    
    // 默认返回空对象 schema
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
        return schema;
      }
        
      case 'number':
      case 'integer':
        return z.number().describe(prop.description || '');
        
      case 'boolean':
        return z.boolean().describe(prop.description || '');
        
      case 'array':
        if (prop.items) {
          return z.array(this.convertPropertyToZod(prop.items));
        }
        return z.array(z.any());
        
      case 'object':
        return this.convertToZodSchema(prop);
        
      default:
        return z.any();
    }
  }

  /**
   * 转换参数为 CLI 格式
   */
  convertToCliArgs(command, args) {
    const cliArgs = [command];
    
    for (const [key, value] of Object.entries(args)) {
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

  /**
   * 获取工具定义
   */
  getToolDefinitions() {
    return getToolDefinitions();
  }

  /**
   * 停止服务器
   */
  async stop() {
    if (this.server) {
      try {
        await this.server.stop();
        logger.info('MCP HTTP server stopped');
      } catch (error) {
        logger.error('Error stopping server:', error);
      }
    }
  }

  /**
   * 输出日志
   */
  log(message) {
    if (this.debug) {
      logger.debug(`[MCP HTTP] ${message}`);
    }
  }
}

module.exports = MCPServerHttpCommand;