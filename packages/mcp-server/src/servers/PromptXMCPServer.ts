/**
 * PromptXMCPServer - PromptX 专用的 MCP 服务器
 * 
 * 集成了所有 PromptX 工具，提供统一的启动接口
 * 支持 stdio 和 http 两种传输模式
 */

import { StdioMCPServer } from './StdioMCPServer.js';
import { StreamableHttpMCPServer } from './StreamableHttpMCPServer.js';
import { allTools } from '../tools/index.js';
import type { MCPServer } from '../interfaces/MCPServer.js';
import logger from '@promptx/logger';

export interface PromptXServerOptions {
  // 基础选项
  transport: 'stdio' | 'http';
  name?: string;
  version?: string;
  
  // HTTP 特定选项
  port?: number;
  host?: string;
  corsEnabled?: boolean;
  cors?: boolean; // 别名兼容
  
  // PromptX 特定选项
  workingDirectory?: string;  // 工作目录
  ideType?: string;           // IDE 类型（cursor, vscode, claude 等）
  debug?: boolean;            // 调试模式
}

export class PromptXMCPServer {
  private server: MCPServer;
  private options: PromptXServerOptions;
  
  constructor(options: PromptXServerOptions) {
    this.options = options;
    
    // 处理别名
    if (options.cors !== undefined && options.corsEnabled === undefined) {
      options.corsEnabled = options.cors;
    }
    
    // 根据 transport 创建对应的服务器
    if (options.transport === 'stdio') {
      this.server = new StdioMCPServer({
        name: options.name || 'promptx-mcp-server',
        version: options.version || process.env.npm_package_version || '1.0.0'
      });
    } else {
      this.server = new StreamableHttpMCPServer({
        name: options.name || 'promptx-mcp-server',
        version: options.version || process.env.npm_package_version || '1.0.0',
        port: options.port || 5203,
        host: options.host || 'localhost',
        corsEnabled: options.corsEnabled || false
      });
    }
    
    // 自动注册 PromptX 工具
    this.registerTools();
  }
  
  /**
   * 注册所有 PromptX 工具
   */
  private registerTools(): void {
    // 注册标准工具集
    allTools.forEach(tool => {
      this.server.registerTool(tool);
      logger.debug(`Registered tool: ${tool.name}`);
    });
    
    logger.info(`Registered ${allTools.length} PromptX tools`);
    
    // 未来可以在这里加载：
    // 1. 项目特定工具（基于 workingDirectory）
    // 2. IDE 特定工具（基于 ideType）
    // 3. 用户自定义工具
  }
  
  /**
   * 启动服务器
   */
  async start(): Promise<void> {
    await this.server.start();
  }
  
  /**
   * 停止服务器
   */
  async stop(): Promise<void> {
    await this.server.stop();
  }
  
  /**
   * 优雅关闭
   */
  async gracefulShutdown(timeoutMs?: number): Promise<void> {
    await this.server.gracefulShutdown(timeoutMs || 5000);
  }
  
  /**
   * 获取内部服务器实例（用于高级操作）
   */
  getServer(): MCPServer {
    return this.server;
  }
  
  // ========== 静态方法 ==========
  
  /**
   * 统一启动方法（向后兼容 MCPServerManager.launch）
   * 
   * 这个方法会：
   * 1. 创建并启动服务器
   * 2. 设置信号处理
   * 3. 保持进程存活（stdio 模式）
   */
  static async launch(options: PromptXServerOptions): Promise<PromptXMCPServer> {
    // 设置环境变量，通知 logger 当前的传输模式
    process.env.MCP_TRANSPORT = options.transport;

    // MCP STDIO模式最佳实践：劫持console防止stdout污染
    if (options.transport === 'stdio') {
      // 将所有console输出重定向到stderr，遵循MCP官方最佳实践
      // 参考：https://modelcontextprotocol.io/quickstart/server
      const originalLog = console.log;
      console.log = console.error;  // 重定向到stderr
      console.info = console.error;
      console.debug = console.error;
      console.warn = console.error;
      // 保留原始方法以备需要
      (console as any)._originalLog = originalLog;
    }

    const server = new PromptXMCPServer(options);

    // 设置信号处理
    const shutdown = async (signal: string) => {
      logger.info(`\nReceived ${signal}, shutting down gracefully...`);
      try {
        await server.gracefulShutdown(5000);
        logger.info('Server stopped cleanly');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    };
    
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    
    // 启动服务器
    await server.start();
    
    // 显示启动信息
    if (options.transport === 'http') {
      const port = options.port || 5203;
      const host = options.host || '127.0.0.1';
      logger.info(`HTTP Server Ready at http://${host}:${port}`);
      logger.info('Use MCP-Session-Id header for session management');
    } else {
      logger.info('STDIO Server Ready');
      logger.info('Listening for JSON-RPC messages on stdin');
    }
    
    // 保持进程存活（对于 stdio 模式，防止进程退出）
    if (options.transport === 'stdio') {
      await new Promise(() => {}); // 永远等待
    }
    
    return server;
  }
}

// 导出向后兼容的别名
export { PromptXMCPServer as MCPServerManager };
export default PromptXMCPServer;