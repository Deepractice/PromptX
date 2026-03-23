import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ReadResourceRequestSchema,
  isInitializeRequest,
  type CallToolRequest
} from '@modelcontextprotocol/sdk/types.js';
import type { Resource } from '@modelcontextprotocol/sdk/types.js';
import { BaseMCPServer } from '~/servers/BaseMCPServer.js';
import type { MCPServerOptions } from '~/interfaces/MCPServer.js';
import { WorkerpoolAdapter } from '~/workers/index.js';
import type { ToolWorkerPool } from '~/interfaces/ToolWorkerPool.js';
import packageJson from '../../package.json' assert { type: 'json' };

interface ParsedMcpUrl {
  host: string;
  port: number;
  path: string;
  fullUrl: string;
}

function parseMcpUrl(rawUrl: string): ParsedMcpUrl {
  const parsed = new URL(rawUrl);
  const host = parsed.hostname || '127.0.0.1';
  const port = parsed.port
    ? Number.parseInt(parsed.port, 10)
    : parsed.protocol === 'https:' ? 443 : 80;
  const mcpPath = (parsed.pathname || '/mcp').replace(/\/$/, '') || '/mcp';
  return { host, port, path: mcpPath, fullUrl: `${parsed.protocol}//${host}:${port}${mcpPath}` };
}

type SessionEntry = {
  server: Server;
  transport: StreamableHTTPServerTransport;
};

/**
 * HTTP流式MCP服务器实现
 *
 * 基于 raw node:http + StreamableHTTPServerTransport
 * 参考 ShopAgent workspace-mcp 的简洁模式
 */
export class StreamableHttpMCPServer extends BaseMCPServer {
  private httpServer?: ReturnType<typeof createServer>;
  private endpoint: ParsedMcpUrl;
  private workerPool: ToolWorkerPool;

  // HTTP Session管理 - 每个session独立的Server和Transport
  private httpSessions = new Map<string, SessionEntry>();

  constructor(options: MCPServerOptions & {
    url?: string;
    port?: number;
    host?: string;
  }) {
    super(options);
    const url = options.url ||
      `http://${options.host || '127.0.0.1'}:${options.port || 8080}/mcp`;
    this.endpoint = parseMcpUrl(url);

    // 初始化 worker pool
    this.workerPool = new WorkerpoolAdapter({
      minWorkers: 2,
      maxWorkers: 4,
      workerTimeout: 30000
    });
  }

  /**
   * 连接HTTP传输层
   */
  protected async connectTransport(): Promise<void> {
    this.logger.info('Starting HTTP server...');

    // 初始化 worker pool
    await this.workerPool.initialize();
    this.logger.info('Worker pool initialized');

    // 创建HTTP服务器
    this.httpServer = createServer(async (req, res) => {
      try {
        await this.handleHttpRequest(req, res);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`HTTP request failed: ${message}`);
        if (!res.headersSent) {
          this.sendJsonRpcError(res, 500, -32603, 'Internal server error');
        }
      }
    });

    // 启动HTTP服务器
    await new Promise<void>((resolve, reject) => {
      this.httpServer!.once('error', reject);
      this.httpServer!.listen(this.endpoint.port, this.endpoint.host, () => {
        this.httpServer!.off('error', reject);
        resolve();
      });
    });

    this.logger.info(`HTTP server listening on ${this.endpoint.fullUrl}`);
  }

  /**
   * 构建协议服务器实例
   */
  private buildProtocolServer(): Server {
    const server = new Server(
      { name: this.options.name, version: this.options.version },
      { capabilities: { tools: {}, resources: {}, prompts: {} } }
    );

    // 工具列表请求
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      this.logger.debug('Handling list tools request');
      return {
        tools: Array.from(this.tools.values()).map(({ handler, ...tool }) => tool)
      };
    });

    // 工具调用请求
    server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
      const { name, arguments: args } = request.params;
      this.logger.info(`Tool call: ${name} ${this.summarizeArgs(args || {})}`);
      return this.executeTool(name, args);
    });

    // 资源列表请求
    server.setRequestHandler(ListResourcesRequestSchema, async () => {
      this.logger.debug('Handling list resources request');
      return {
        resources: Array.from(this.resources.values())
      };
    });

    // 读取资源请求
    server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      this.logger.debug(`Handling read resource: ${request.params.uri}`);
      const resource = this.resources.get(request.params.uri);
      if (!resource) {
        throw new Error(`Resource not found: ${request.params.uri}`);
      }
      return this.readResource(resource);
    });

    // 提示词列表请求
    server.setRequestHandler(ListPromptsRequestSchema, async () => {
      this.logger.debug('Handling list prompts request');
      return {
        prompts: Array.from(this.prompts.values())
      };
    });

    // 获取提示词请求
    server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      this.logger.debug(`Handling get prompt: ${request.params.name}`);
      const prompt = this.prompts.get(request.params.name);
      if (!prompt) {
        throw new Error(`Prompt not found: ${request.params.name}`);
      }
      return { prompt };
    });

    return server;
  }

  /**
   * 处理HTTP请求
   */
  private async handleHttpRequest(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<void> {
    const method = (req.method || '').toUpperCase();
    const requestUrl = new URL(
      req.url || '/',
      `http://${req.headers.host || `${this.endpoint.host}:${this.endpoint.port}`}`
    );

    this.applyCorsHeaders(res);

    if (method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (requestUrl.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        service: 'mcp-server',
        version: packageJson.version,
        sessions: this.httpSessions.size,
        uptime: process.uptime(),
      }));
      return;
    }

    if (requestUrl.pathname !== this.endpoint.path) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }

    if (method === 'POST') {
      let body: unknown;
      try {
        body = await this.parseRequestBody(req);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Invalid JSON body';
        const statusCode = message.includes('too large') ? 413 : 400;
        this.sendJsonRpcError(res, statusCode, -32700, message);
        return;
      }

      const sessionId = this.getSessionId(req);

      // 已有session，复用
      if (sessionId && this.httpSessions.has(sessionId)) {
        const entry = this.httpSessions.get(sessionId)!;
        await entry.transport.handleRequest(req, res, body);
        return;
      }

      // 新session（initialize请求）
      if (!sessionId && isInitializeRequest(body)) {
        const server = this.buildProtocolServer();
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (sid) => {
            this.httpSessions.set(sid, { server, transport });
            this.logger.info(`Session initialized: ${sid}`);
          },
        });

        let closed = false;
        transport.onclose = () => {
          if (closed) return;
          closed = true;
          const sid = transport.sessionId;
          if (sid && this.httpSessions.delete(sid)) {
            this.logger.info(`Session closed: ${sid}`);
          }
          void server.close().catch(() => { /* ignore */ });
        };

        await server.connect(transport);
        await transport.handleRequest(req, res, body);
        return;
      }

      // 无效请求
      this.sendJsonRpcError(res, 400, -32000, 'Bad Request: No valid session ID provided');
      return;
    }

    if (method === 'GET' || method === 'DELETE') {
      const sessionId = this.getSessionId(req);
      if (!sessionId || !this.httpSessions.has(sessionId)) {
        this.sendJsonRpcError(res, 400, -32000, 'Invalid or missing session ID');
        return;
      }
      const entry = this.httpSessions.get(sessionId)!;
      await entry.transport.handleRequest(req, res);
      return;
    }

    res.writeHead(405, { Allow: 'GET, POST, DELETE' });
    res.end();
  }

  /**
   * 获取session ID
   */
  private getSessionId(req: IncomingMessage): string | undefined {
    const value = req.headers['mcp-session-id'];
    if (Array.isArray(value)) return value[0];
    if (typeof value === 'string' && value.trim()) return value;
    return undefined;
  }

  /**
   * 解析请求体
   */
  private async parseRequestBody(req: IncomingMessage): Promise<unknown> {
    const chunks: Buffer[] = [];
    let totalBytes = 0;
    const maxBytes = 2 * 1024 * 1024; // 2MB

    for await (const chunk of req) {
      const data = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
      totalBytes += data.length;
      if (totalBytes > maxBytes) {
        throw new Error(`Request body too large (> ${maxBytes} bytes)`);
      }
      chunks.push(data);
    }

    if (chunks.length === 0) return undefined;
    const raw = Buffer.concat(chunks).toString('utf8').trim();
    if (!raw) return undefined;

    try {
      return JSON.parse(raw);
    } catch {
      throw new Error('Invalid JSON body');
    }
  }

  /**
   * 参数摘要（截断长字段）
   */
  private summarizeArgs(args: Record<string, unknown>): string {
    const summary: Record<string, unknown> = { ...args };
    if (typeof summary.content === 'string') {
      const s = summary.content as string;
      summary.content = s.length > 80 ? `${s.slice(0, 80)}... (${s.length} chars)` : s;
    }
    if (typeof summary.path === 'string') {
      const p = summary.path as string;
      summary.path = p.length > 120 ? `...${p.slice(-100)}` : p;
    }
    return JSON.stringify(summary);
  }

  /**
   * 发送JSON-RPC错误响应
   */
  private sendJsonRpcError(
    res: ServerResponse,
    statusCode: number,
    code: number,
    message: string
  ): void {
    this.applyCorsHeaders(res);
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ jsonrpc: '2.0', error: { code, message }, id: null }));
  }

  /**
   * 应用CORS头
   */
  private applyCorsHeaders(res: ServerResponse): void {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Mcp-Session-Id');
    res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');
  }

  /**
   * 断开HTTP传输层
   */
  protected async disconnectTransport(): Promise<void> {
    this.logger.info('Stopping HTTP server...');

    // 关闭所有sessions
    for (const [sid, entry] of this.httpSessions.entries()) {
      this.logger.info(`Closing session: ${sid}`);
      try {
        await entry.transport.close();
      } catch {
        /* ignore */
      }
      try {
        await entry.server.close();
      } catch {
        /* ignore */
      }
      this.httpSessions.delete(sid);
    }

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

    // 终止 worker pool
    await this.workerPool.terminate();
    this.logger.info('Worker pool terminated');
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to read resource: ${resource.uri} - ${message}`);
      throw new Error(`Failed to read resource: ${message}`);
    }
  }

  /**
   * 重写 executeTool 方法，使用 WorkerPool 执行所有工具
   */
  async executeTool(name: string, args: any): Promise<any> {
    if (!this.isRunning()) {
      this.logger.warn(`Attempted to execute tool '${name}' while server is not running`);
      throw new Error('Server is not running');
    }

    const tool = this.tools.get(name);
    if (!tool) {
      this.logger.error(`Tool not found: ${name}. Available tools: ${Array.from(this.tools.keys()).join(', ')}`);
      throw new Error(`Tool not found: ${name}`);
    }

    const startTime = Date.now();

    this.logger.info(`[TOOL_EXEC_START] Tool: ${name} (via WorkerPool)`);
    this.logger.debug(`[TOOL_ARGS] ${name}: ${JSON.stringify(args)}`);

    try {
      const result = await this.workerPool.execute(tool, args);

      const responseTime = Date.now() - startTime;
      this.logger.info(`[TOOL_EXEC_SUCCESS] Tool: ${name}, Time: ${responseTime}ms`);

      // 更新指标
      this.metrics.requestCount++;
      this.metrics.avgResponseTime =
        (this.metrics.avgResponseTime * (this.metrics.requestCount - 1) + responseTime) /
        this.metrics.requestCount;

      return result;

    } catch (error: unknown) {
      const responseTime = Date.now() - startTime;
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[TOOL_EXEC_ERROR] Tool: ${name}, Time: ${responseTime}ms, Error: ${message}`);

      // 更新错误计数
      this.metrics.errorCount++;
      this.lastError = error instanceof Error ? error : new Error(String(error));

      throw error;
    }
  }
}
