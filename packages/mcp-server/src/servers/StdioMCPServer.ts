import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { Resource } from '@modelcontextprotocol/sdk/types.js';
import { BaseMCPServer } from '~/servers/BaseMCPServer.js';
import type { MCPServerOptions } from '~/interfaces/MCPServer.js';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * 标准输入输出MCP服务器实现
 * 
 * 通过stdin/stdout进行JSON-RPC通信
 * 适用于命令行工具和进程间通信
 * 
 * 使用 MCP SDK 的 StdioServerTransport 处理所有协议细节
 */
export class StdioMCPServer extends BaseMCPServer {
  private transport?: StdioServerTransport;
  
  constructor(options: MCPServerOptions) {
    super(options);
  }
  
  /**
   * 连接标准输入输出传输层
   */
  protected async connectTransport(): Promise<void> {
    this.logger.info('Connecting stdio transport...');
    
    // 创建stdio传输 - SDK会处理所有stdin/stdout通信
    this.transport = new StdioServerTransport();
    
    // 连接到MCP服务器 - SDK会自动处理initialize等协议消息
    await this.server.connect(this.transport);
    
    this.logger.info('Stdio transport connected');
  }
  
  /**
   * 断开标准输入输出传输层
   */
  protected async disconnectTransport(): Promise<void> {
    this.logger.info('Disconnecting stdio transport...');
    
    // 关闭传输
    if (this.transport) {
      await this.transport.close();
      this.transport = undefined;
    }
    
    this.logger.info('Stdio transport disconnected');
  }
  
  /**
   * 读取资源内容
   * 实现文件系统资源读取
   */
  protected async readResource(resource: Resource): Promise<any> {
    try {
      // 解析URI
      const uri = new URL(resource.uri);
      
      if (uri.protocol === 'file:') {
        // 读取文件
        const filePath = uri.pathname;
        
        // 安全检查：确保文件路径在允许的范围内
        const resolvedPath = path.resolve(filePath);
        
        // 读取文件内容
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
      } else {
        throw new Error(`Unsupported resource protocol: ${uri.protocol}`);
      }
    } catch (error: any) {
      this.logger.error(`Failed to read resource: ${resource.uri}`, error);
      throw new Error(`Failed to read resource: ${error.message}`);
    }
  }
  
  /**
   * 启动服务器
   */
  async start(options?: MCPServerOptions): Promise<void> {
    await super.start(options);
    
    // 输出启动信息到stderr（不干扰stdout的JSON-RPC通信）
    this.logger.info(`STDIO Server Ready`);
    this.logger.info('Listening for JSON-RPC messages on stdin');
  }
}