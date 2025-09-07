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
 * 不变式：
 * 1. 所有输入必须是合法的JSON-RPC消息
 * 2. 所有输出必须写入stdout
 * 3. 错误信息写入stderr
 * 4. stdin结束时优雅关闭
 */
export class StdioMCPServer extends BaseMCPServer {
  private transport?: StdioServerTransport;
  private buffer: string = '';
  private messageHandlers: Map<string, Function> = new Map();
  
  private signalHandlers: Array<() => void> = [];
  
  constructor(options: MCPServerOptions) {
    super(options);
    this.setupProcessHandlers();
  }
  
  /**
   * 设置进程信号处理
   */
  private setupProcessHandlers(): void {
    // 处理进程退出信号
    const sigintHandler = async () => {
      this.logger.info('Received SIGINT, shutting down gracefully...');
      await this.gracefulShutdown(5000);
      process.exit(0);
    };
    
    const sigtermHandler = async () => {
      this.logger.info('Received SIGTERM, shutting down gracefully...');
      await this.gracefulShutdown(5000);
      process.exit(0);
    };
    
    process.on('SIGINT', sigintHandler);
    process.on('SIGTERM', sigtermHandler);
    
    // 保存处理器引用以便清理
    this.signalHandlers.push(
      () => process.removeListener('SIGINT', sigintHandler),
      () => process.removeListener('SIGTERM', sigtermHandler)
    );
  }
  
  /**
   * 清理信号处理器
   */
  private cleanupSignalHandlers(): void {
    this.signalHandlers.forEach(cleanup => cleanup());
    this.signalHandlers = [];
  }
  
  /**
   * 连接标准输入输出传输层
   */
  protected async connectTransport(): Promise<void> {
    this.logger.info('Connecting stdio transport...');
    
    // 创建stdio传输
    this.transport = new StdioServerTransport();
    
    // 连接到MCP服务器
    await this.server.connect(this.transport);
    
    // 设置stdin处理
    this.setupStdinHandling();
    
    this.logger.info('Stdio transport connected');
  }
  
  /**
   * 设置标准输入处理
   */
  private setupStdinHandling(): void {
    // 处理输入数据
    process.stdin.on('data', (chunk: Buffer) => {
      this.handleStdinData(chunk);
    });
    
    // 处理输入结束
    process.stdin.on('end', () => {
      this.logger.info('Stdin closed, shutting down...');
      this.stop().catch(err => {
        this.logger.error('Error during shutdown', err);
      });
    });
    
    // 恢复stdin（如果之前被暂停）
    process.stdin.resume();
  }
  
  /**
   * 处理标准输入数据
   */
  private handleStdinData(chunk: Buffer): void {
    const chunkStr = chunk.toString();
    this.logger.debug(`[STDIN_DATA] Received ${chunkStr.length} bytes`);
    
    this.buffer += chunkStr;
    
    // 按行分割处理
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';
    
    this.logger.debug(`[STDIN_PARSE] Processing ${lines.length} lines, buffer remaining: ${this.buffer.length} bytes`);
    
    for (const line of lines) {
      if (line.trim()) {
        this.logger.debug(`[STDIN_LINE] Processing message: ${line.substring(0, 100)}...`);
        this.processJsonRpcMessage(line);
      }
    }
  }
  
  /**
   * 处理JSON-RPC消息
   */
  private processJsonRpcMessage(line: string): void {
    try {
      const message = JSON.parse(line);
      
      // 验证JSON-RPC格式
      if (!message.jsonrpc || message.jsonrpc !== '2.0') {
        this.sendErrorResponse(message.id, -32600, 'Invalid Request');
        return;
      }
      
      // 处理请求
      this.handleJsonRpcRequest(message);
    } catch (error) {
      this.logger.error('Failed to parse JSON-RPC message', error);
      this.sendErrorResponse(null, -32700, 'Parse error');
    }
  }
  
  /**
   * 处理JSON-RPC请求
   */
  private async handleJsonRpcRequest(message: any): Promise<void> {
    const requestId = message.id;
    const method = message.method;
    
    this.logger.info(`[RPC_REQUEST] ID: ${requestId}, Method: ${method}`);
    
    try {
      // 交给MCP SDK处理
      // SDK会自动调用我们在BaseMCPServer中注册的处理器
      // 这里我们只需要确保消息格式正确
      
      // 对于特定方法，可以添加额外处理
      if (message.method === 'tools/call') {
        this.logger.info(`[TOOL_CALL] Tool: ${message.params?.name}, ID: ${requestId}`);
      }
      
      // 构造响应
      let result: any;
      
      switch (message.method) {
        case 'tools/list':
          result = { tools: this.listTools() };
          break;
        case 'resources/list':
          result = { resources: this.listResources() };
          break;
        case 'prompts/list':
          result = { prompts: this.listPrompts() };
          break;
        case 'tools/call':
          result = await this.executeTool(
            message.params.name,
            message.params.arguments
          );
          break;
        case 'resources/read':
          const resource = this.getResource(message.params.uri);
          if (resource) {
            result = await this.readResource(resource);
          } else {
            throw new Error(`Resource not found: ${message.params.uri}`);
          }
          break;
        default:
          throw new Error(`Unknown method: ${message.method}`);
      }
      
      this.sendResponse(message.id, result);
    } catch (error: any) {
      this.logger.error(`Error handling request: ${message.method}`, error);
      this.sendErrorResponse(
        message.id,
        -32603,
        error.message || 'Internal error'
      );
    }
  }
  
  /**
   * 发送响应
   */
  private sendResponse(id: any, result: any): void {
    const response = {
      jsonrpc: '2.0',
      id,
      result
    };
    
    process.stdout.write(JSON.stringify(response) + '\n');
  }
  
  /**
   * 发送错误响应
   */
  private sendErrorResponse(id: any, code: number, message: string): void {
    const response = {
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message
      }
    };
    
    process.stdout.write(JSON.stringify(response) + '\n');
  }
  
  /**
   * 断开标准输入输出传输层
   */
  protected async disconnectTransport(): Promise<void> {
    this.logger.info('Disconnecting stdio transport...');
    
    // 清理信号处理器
    this.cleanupSignalHandlers();
    
    // 移除事件监听器
    process.stdin.removeAllListeners('data');
    process.stdin.removeAllListeners('end');
    
    // 暂停stdin
    process.stdin.pause();
    
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
    process.stderr.write(
      `MCP Server started: ${this.options.name} v${this.options.version}\n`
    );
  }
}