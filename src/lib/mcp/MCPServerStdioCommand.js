const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { cli } = require('../core/pouch');
const { MCPOutputAdapter } = require('../mcp/MCPOutputAdapter');
const { getDirectoryService } = require('../utils/DirectoryService');
const { getToolDefinitions } = require('../mcp/toolDefinitions');
const { getGlobalServerEnvironment } = require('../utils/ServerEnvironment');
const treeKill = require('tree-kill');

/**
 * MCP Server Stdio 适配器 - 函数调用架构
 * 将MCP协议请求转换为PromptX函数调用，实现零开销适配
 * 支持智能工作目录检测，确保MCP和CLI模式下的一致性
 */
class MCPServerStdioCommand {
  constructor() {
    this.name = 'promptx-mcp-server';
    this.version = '1.0.0';
    this.debug = process.env.MCP_DEBUG === 'true';
    
    // 🚀 初始化ServerEnvironment - stdio模式
    const serverEnv = getGlobalServerEnvironment();
    serverEnv.initialize({ transport: 'stdio' });
    
    // 🎯 新架构：智能检测执行上下文
    this.executionContext = this.getExecutionContext();
    
    // 调试信息输出
    this.log(`🎯 检测到执行模式: ${this.executionContext.mode}`);
    this.log(`📍 原始工作目录: ${this.executionContext.originalCwd}`);
    this.log(`📁 目标工作目录: ${this.executionContext.workingDirectory}`);
    
    // 如果需要切换工作目录
    if (this.executionContext.workingDirectory !== this.executionContext.originalCwd) {
      this.log(`🔄 切换工作目录: ${this.executionContext.originalCwd} -> ${this.executionContext.workingDirectory}`);
      try {
        process.chdir(this.executionContext.workingDirectory);
        this.log(`✅ 工作目录切换成功`);
      } catch (error) {
        this.log(`❌ 工作目录切换失败: ${error.message}`);
        this.log(`🔄 继续使用原始目录: ${this.executionContext.originalCwd}`);
      }
    }
    
    // 基本调试信息
    this.log(`📂 最终工作目录: ${process.cwd()}`);
    this.log(`📋 预期记忆文件路径: ${require('path').join(process.cwd(), '.promptx/memory/declarative.md')}`);
    
    // DirectoryService路径信息将在需要时异步获取
    
    // 🎯 新架构：输出完整调试信息
    if (this.debug) {
      this.initializeDebugInfo();
    }
    
    // 创建输出适配器
    this.outputAdapter = new MCPOutputAdapter();
    
    // 创建MCP服务器实例 - 使用正确的API
    this.server = new Server(
      {
        name: this.name,
        version: this.version
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );
    
    this.setupHandlers();
  }
  
  /**
   * 调试日志 - 输出到stderr，不影响MCP协议
   */
  log(message) {
    if (this.debug) {
      console.error(`[MCP DEBUG] ${message}`);
    }
  }
  
  /**
   * 启动MCP Server
   */
  async execute(options = {}) {
    try {
      // 设置进程清理处理器
      this.setupProcessCleanup();
      
      
      this.log('🚀 启动MCP Server...');
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      this.log('✅ MCP Server 已启动，等待连接...');
      
      // 保持进程运行
      return new Promise((resolve) => {
        // MCP服务器现在正在运行，监听stdin输入
        process.on('SIGINT', () => {
          this.log('🛑 收到SIGINT信号，正在关闭...');
          this.cleanup();
          resolve();
        });
        
        process.on('SIGTERM', () => {
          this.log('🛑 收到SIGTERM信号，正在关闭...');
          this.cleanup();
          resolve();
        });
      });
    } catch (error) {
      // 输出到stderr
      console.error(`❌ MCP Server 启动失败: ${error.message}`);
      this.cleanup();
      throw error;
    }
  }
  
  /**
   * 设置进程清理处理器
   */
  setupProcessCleanup() {
    // 处理各种退出情况
    const exitHandler = (signal) => {
      this.log(`收到信号: ${signal}`);
      this.cleanup();
      process.exit(0);
    };
    
    // 捕获所有可能的退出信号
    process.on('exit', () => this.cleanup());
    process.on('SIGHUP', () => exitHandler('SIGHUP'));
    process.on('SIGQUIT', () => exitHandler('SIGQUIT'));
    process.on('uncaughtException', (err) => {
      console.error('未捕获的异常:', err);
      this.cleanup();
      process.exit(1);
    });
    process.on('unhandledRejection', (reason, promise) => {
      console.error('未处理的Promise拒绝:', reason);
      this.cleanup();
      process.exit(1);
    });
  }
  
  /**
   * 清理资源
   */
  cleanup() {
    this.log('🔧 清理MCP Server资源');
  }

  /**
   * 🎯 新架构：智能检测执行上下文
   */
  getExecutionContext() {
    const args = process.argv;
    const command = args[2];
    const isMCPMode = command === 'mcp-server';
    
    return {
      mode: isMCPMode ? 'MCP' : 'CLI',
      workingDirectory: process.cwd(),
      originalCwd: process.cwd()
    };
  }

  /**
   * 🎯 新架构：初始化调试信息
   */
  async initializeDebugInfo() {
    try {
      const directoryService = getDirectoryService();
      await directoryService.initialize();
      const debugInfo = await directoryService.getDebugInfo();
      this.log(`🔍 完整调试信息: ${JSON.stringify(debugInfo, null, 2)}`);
    } catch (error) {
      this.log(`⚠️ 调试信息获取失败: ${error.message}`);
    }
  }
  


  
  /**
   * 设置MCP工具处理程序 - 使用正确的MCP SDK API
   */
  setupHandlers() {
    // 使用Schema常量进行注册
    const { 
      ListToolsRequestSchema, 
      CallToolRequestSchema 
    } = require('@modelcontextprotocol/sdk/types.js');
    
    // 注册工具列表处理程序
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      this.log('📋 收到工具列表请求');
      return {
        tools: this.getToolDefinitions()
      };
    });
    
    // 注册工具调用处理程序
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      this.log(`🔧 调用工具: ${name} 参数: ${JSON.stringify(args)}`);
      return await this.callTool(name, args || {});
    });
  }
  
  /**
   * 获取工具定义
   */
  getToolDefinitions() {
    return getToolDefinitions();
  }
  
  /**
   * 执行工具调用
   */
  async callTool(toolName, args) {
    try {
      // 将MCP参数转换为CLI函数调用参数
      const cliArgs = this.convertMCPToCliParams(toolName, args);
      this.log(`🎯 CLI调用: ${toolName} -> ${JSON.stringify(cliArgs)}`);
      this.log(`🗂️ 当前工作目录: ${process.cwd()}`);
      
      // 直接调用PromptX CLI函数 - 启用静默模式避免console.log干扰MCP协议
      const result = await cli.execute(toolName.replace('promptx_', ''), cliArgs, true);
      this.log(`✅ CLI执行完成: ${toolName}`);
      
      // 使用输出适配器转换为MCP响应格式
      return this.outputAdapter.convertToMCPFormat(result);
      
    } catch (error) {
      this.log(`❌ 工具调用失败: ${toolName} - ${error.message}`);
      return this.outputAdapter.handleError(error);
    }
  }
  
  /**
   * 转换MCP参数为CLI函数调用参数
   */
  convertMCPToCliParams(toolName, mcpArgs) {
    const paramMapping = {
      'promptx_init': (args) => args.workingDirectory ? [args] : [],
      
      'promptx_welcome': () => [],
      
      'promptx_action': (args) => [args.role],
      
      'promptx_learn': (args) => args.resource ? [args.resource] : [],
      
      'promptx_recall': (args) => {
        // 支持context.role_id参数传递
        const result = [];
        
        // 处理query参数
        if (args && args.query && typeof args.query === 'string' && args.query.trim() !== '') {
          result.push(args.query);
        }
        
        // 处理context参数
        if (args && args.context) {
          result.push('--context', JSON.stringify(args.context));
        }
        
        return result;
      },
      
      'promptx_remember': (args) => {
        const result = [args.content];
        
        // 处理tags参数
        if (args.tags) {
          result.push('--tags', args.tags);
        }
        
        // 处理context参数
        if (args.context) {
          result.push('--context', JSON.stringify(args.context));
        }
        
        return result;
      },
      
      
      'promptx_tool': (args) => [args]
    };
    
    const mapper = paramMapping[toolName];
    if (!mapper) {
      throw new Error(`未知工具: ${toolName}`);
    }
    
    return mapper(mcpArgs);
  }
}

module.exports = { MCPServerStdioCommand }; 