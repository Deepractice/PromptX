import express, { Express, Request, Response } from 'express';
import { Server as HttpServer } from 'http';
import type { Resource } from '@modelcontextprotocol/sdk/types.js';
import { BaseMCPServer } from '~/servers/BaseMCPServer.js';
import type { MCPServerOptions, SessionContext } from '~/interfaces/MCPServer.js';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * HTTP流式MCP服务器实现
 * 
 * 支持HTTP JSON-RPC和SSE（Server-Sent Events）
 * 适用于Web应用和HTTP API集成
 * 
 * 不变式：
 * 1. 每个会话独立管理
 * 2. SSE连接保持活跃
 * 3. 支持并发请求
 * 4. 会话超时自动清理
 */
export class StreamableHttpMCPServer extends BaseMCPServer {
  private app?: Express;
  private httpServer?: HttpServer;
  private port: number = 8080;
  private sseConnections = new Map<string, Response>();
  private sessionTimeouts = new Map<string, NodeJS.Timeout>();
  
  constructor(options: MCPServerOptions) {
    super(options);
  }
  
  /**
   * 连接HTTP传输层
   */
  protected async connectTransport(): Promise<void> {
    this.logger.info('Starting HTTP server...');
    
    // 从选项中获取端口
    this.port = (this.options as any).port || 8080;
    
    // 创建Express应用
    this.app = express();
    
    // 设置中间件
    this.setupMiddleware();
    
    // 设置路由
    this.setupRoutes();
    
    // 启动HTTP服务器
    await new Promise<void>((resolve, reject) => {
      this.httpServer = this.app!.listen(this.port, () => {
        this.logger.info(`HTTP server listening on port ${this.port}`);
        resolve();
      });
      
      this.httpServer.on('error', reject);
    });
  }
  
  /**
   * 设置中间件
   */
  private setupMiddleware(): void {
    if (!this.app) return;
    
    // JSON解析
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // CORS支持
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(204);
      } else {
        next();
      }
    });
    
    // 请求日志
    this.app.use((req, res, next) => {
      this.logger.debug(`${req.method} ${req.path}`);
      next();
    });
  }
  
  /**
   * 设置路由
   */
  private setupRoutes(): void {
    if (!this.app) return;
    
    // 健康检查
    this.app.get('/health', async (req, res) => {
      const health = await this.healthCheck();
      res.json({
        ...health,
        server: {
          name: this.options.name,
          version: this.options.version,
          port: this.port
        }
      });
    });
    
    // SSE端点
    this.app.get('/sse/:sessionId', (req, res) => {
      this.handleSSEConnection(req, res);
    });
    
    // RPC端点
    this.app.post('/rpc/:sessionId', async (req, res) => {
      await this.handleRPCRequest(req, res);
    });
    
    // 工具列表
    this.app.get('/tools', (req, res) => {
      res.json({ tools: this.listTools() });
    });
    
    // 资源列表
    this.app.get('/resources', (req, res) => {
      res.json({ resources: this.listResources() });
    });
    
    // 提示词列表
    this.app.get('/prompts', (req, res) => {
      res.json({ prompts: this.listPrompts() });
    });
  }
  
  /**
   * 处理SSE连接
   */
  private handleSSEConnection(req: Request, res: Response): void {
    const sessionId = req.params.sessionId;
    const clientIp = req.ip || req.connection?.remoteAddress;
    
    this.logger.info(`[SSE_CONNECT] Session: ${sessionId}, Client: ${clientIp}`);
    
    // 设置SSE响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // 禁用Nginx缓冲
    });
    
    // 保存连接
    this.sseConnections.set(sessionId, res);
    this.logger.debug(`[SSE_ACTIVE] Active SSE connections: ${this.sseConnections.size}`);
    
    // 发送初始消息
    res.write(`data: ${JSON.stringify({ type: 'connected', sessionId })}\n\n`);
    
    // 心跳保持连接
    const heartbeat = setInterval(() => {
      this.logger.debug(`[SSE_HEARTBEAT] Session: ${sessionId}`);
      res.write(': heartbeat\n\n');
    }, 30000);
    
    // 清理函数
    const cleanup = () => {
      clearInterval(heartbeat);
      this.sseConnections.delete(sessionId);
      res.end();
      this.logger.info(`SSE connection closed: ${sessionId}`);
    };
    
    // 客户端断开连接
    res.on('close', cleanup);
    res.on('error', cleanup);
  }
  
  /**
   * 处理RPC请求
   */
  private async handleRPCRequest(req: Request, res: Response): Promise<void> {
    const sessionId = req.params.sessionId;
    const message = req.body;
    const clientIp = req.ip || req.connection?.remoteAddress;
    
    this.logger.info(`[HTTP_RPC] Session: ${sessionId}, Method: ${message.method}, ID: ${message.id}, Client: ${clientIp}`);
    
    try {
      // 验证JSON-RPC格式
      if (!message.jsonrpc || message.jsonrpc !== '2.0') {
        this.logger.warn(`[HTTP_INVALID] Invalid JSON-RPC format from ${clientIp}`);
        res.json({
          jsonrpc: '2.0',
          id: message.id || null,
          error: {
            code: -32600,
            message: 'Invalid Request'
          }
        });
        return;
      }
      
      // 获取或创建会话
      let session = this.getSession(sessionId);
      if (!session) {
        this.logger.info(`[SESSION_CREATE] Creating new session: ${sessionId}`);
        session = await this.createSessionWithId(sessionId);
      } else {
        this.logger.debug(`[SESSION_REUSE] Reusing existing session: ${sessionId}`);
      }
      
      // 更新会话活动时间
      this.updateSessionActivity(sessionId);
      
      // 处理请求
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
      
      // 发送响应
      res.json({
        jsonrpc: '2.0',
        id: message.id,
        result
      });
      
      // 通过SSE发送通知（如果有连接）
      this.sendSSEMessage(sessionId, {
        type: 'rpc_completed',
        method: message.method,
        id: message.id
      });
      
    } catch (error: any) {
      this.logger.error(`RPC error for session ${sessionId}:`, error);
      
      res.json({
        jsonrpc: '2.0',
        id: message.id || null,
        error: {
          code: -32603,
          message: error.message || 'Internal error'
        }
      });
      
      // 通过SSE发送错误通知
      this.sendSSEMessage(sessionId, {
        type: 'rpc_error',
        error: error.message
      });
    }
  }
  
  /**
   * 创建指定ID的会话
   */
  private async createSessionWithId(sessionId: string): Promise<SessionContext> {
    const session: SessionContext = {
      id: sessionId,
      createdAt: Date.now(),
      lastActivity: Date.now()
    };
    
    this.sessions.set(sessionId, session);
    this.logger.info(`Session created: ${sessionId}`);
    
    // 设置会话超时
    this.setupSessionTimeout(sessionId);
    
    return session;
  }
  
  /**
   * 更新会话活动时间
   */
  private updateSessionActivity(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = Date.now();
      
      // 重置超时
      this.setupSessionTimeout(sessionId);
    }
  }
  
  /**
   * 设置会话超时
   */
  private setupSessionTimeout(sessionId: string): void {
    // 清除现有超时
    const existingTimeout = this.sessionTimeouts.get(sessionId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    // 设置新超时
    const timeout = this.options.sessionTimeout || 30 * 60 * 1000; // 默认30分钟
    const newTimeout = setTimeout(() => {
      this.cleanupSession(sessionId);
    }, timeout);
    
    this.sessionTimeouts.set(sessionId, newTimeout);
  }
  
  /**
   * 清理会话
   */
  private cleanupSession(sessionId: string): void {
    this.logger.info(`[SESSION_CLEANUP] Starting cleanup for session: ${sessionId}`);
    
    // 关闭SSE连接
    const sseConnection = this.sseConnections.get(sessionId);
    if (sseConnection) {
      this.logger.debug(`[SESSION_CLEANUP] Closing SSE connection for: ${sessionId}`);
      sseConnection.end();
      this.sseConnections.delete(sessionId);
    }
    
    // 清除超时
    const timeout = this.sessionTimeouts.get(sessionId);
    if (timeout) {
      this.logger.debug(`[SESSION_CLEANUP] Clearing timeout for: ${sessionId}`);
      clearTimeout(timeout);
      this.sessionTimeouts.delete(sessionId);
    }
    
    // 删除会话
    this.sessions.delete(sessionId);
    this.logger.info(`[SESSION_CLEANUP] Session cleaned up: ${sessionId}, Active sessions: ${this.sessions.size}`);
  }
  
  /**
   * 发送SSE消息
   */
  private sendSSEMessage(sessionId: string, data: any): void {
    const connection = this.sseConnections.get(sessionId);
    if (connection) {
      connection.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  }
  
  /**
   * 断开HTTP传输层
   */
  protected async disconnectTransport(): Promise<void> {
    this.logger.info('Stopping HTTP server...');
    
    // 关闭所有SSE连接
    for (const [sessionId, connection] of this.sseConnections) {
      connection.end();
    }
    this.sseConnections.clear();
    
    // 清除所有会话超时
    for (const timeout of this.sessionTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.sessionTimeouts.clear();
    
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
      this.logger.error(`Failed to read resource: ${resource.uri}`, error);
      throw new Error(`Failed to read resource: ${error.message}`);
    }
  }
  
  /**
   * 获取服务器信息
   */
  getServerInfo(): any {
    return {
      type: 'http',
      port: this.port,
      endpoints: {
        rpc: `/rpc/:sessionId`,
        sse: `/sse/:sessionId`,
        health: '/health',
        tools: '/tools',
        resources: '/resources',
        prompts: '/prompts'
      }
    };
  }
}