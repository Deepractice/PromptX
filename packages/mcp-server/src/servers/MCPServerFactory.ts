import type { MCPServer, MCPServerOptions, MCPServerFactory as IMCPServerFactory } from '~/interfaces/MCPServer.js';
import { StdioMCPServer } from '~/servers/StdioMCPServer.js';
import { StreamableHttpMCPServer } from '~/servers/StreamableHttpMCPServer.js';

/**
 * MCP服务器工厂实现
 * 
 * 根据类型创建不同的服务器实例
 * 使用工厂模式封装实例化逻辑
 */
export class MCPServerFactory implements IMCPServerFactory {
  /**
   * 创建服务器实例
   */
  createServer(type: 'stdio' | 'http', options: MCPServerOptions): MCPServer {
    switch (type) {
      case 'stdio':
        return new StdioMCPServer(options);
        
      case 'http':
        return new StreamableHttpMCPServer(options);
        
      default:
        throw new Error(`Unknown server type: ${type}`);
    }
  }
  
  /**
   * 静态工厂方法
   */
  static create(type: 'stdio' | 'http', options: MCPServerOptions): MCPServer {
    const factory = new MCPServerFactory();
    return factory.createServer(type, options);
  }
}

/**
 * 便捷函数：创建标准输入输出服务器
 */
export function createStdioServer(options: MCPServerOptions): MCPServer {
  return MCPServerFactory.create('stdio', options);
}

/**
 * 便捷函数：创建HTTP服务器
 */
export function createHttpServer(options: MCPServerOptions & { port?: number }): MCPServer {
  return MCPServerFactory.create('http', options);
}

/**
 * 默认导出工厂实例
 */
export default new MCPServerFactory();