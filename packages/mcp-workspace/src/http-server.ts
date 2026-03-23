/**
 * Workspace MCP HTTP 服务器
 *
 * 基于 Streamable HTTP 协议提供 MCP 服务
 */

import { randomUUID } from 'node:crypto';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

import { Server as McpProtocolServer } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  isInitializeRequest,
  type CallToolRequest,
} from '@modelcontextprotocol/sdk/types.js';

import { WORKSPACE_TOOLS, handleWorkspaceTool } from './tools/index.js';
import { createLogger } from '@promptx/logger';

const logger = createLogger();
const MCP_VERSION = '1.0.0';

type SessionEntry = {
  server: McpProtocolServer;
  transport: StreamableHTTPServerTransport;
};

interface ParsedMcpUrl {
  host: string;
  port: number;
  path: string;
  fullUrl: string;
}

export interface HttpServerConfig {
  mcpUrl: string;
}

export async function startHttpServer(config: HttpServerConfig): Promise<void> {
  const endpoint = parseMcpUrl(config.mcpUrl);
  const sessions = new Map<string, SessionEntry>();

  const httpServer = createServer(async (req, res) => {
    try {
      await handleHttpRequest(req, res, endpoint, sessions);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`HTTP request failed: ${message}`);
      if (!res.headersSent) {
        sendJsonRpcError(res, 500, -32603, 'Internal server error');
      }
    }
  });

  await new Promise<void>((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(endpoint.port, endpoint.host, () => {
      httpServer.off('error', reject);
      resolve();
    });
  });

  logger.info(`Starting v${MCP_VERSION} (http)...`);
  logger.info(`URL: ${endpoint.fullUrl}`);
  logger.info('Ready');

  const shutdown = async () => {
    logger.info('Shutting down...');
    for (const [sid, entry] of sessions.entries()) {
      try { await entry.transport.close(); } catch { /* ignore */ }
      try { await entry.server.close(); } catch { /* ignore */ }
      sessions.delete(sid);
    }
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    process.exit(0);
  };

  process.once('SIGINT', () => { void shutdown(); });
  process.once('SIGTERM', () => { void shutdown(); });
}

function buildProtocolServer(): McpProtocolServer {
  const server = new McpProtocolServer(
    { name: 'workspace-mcp', version: MCP_VERSION },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: WORKSPACE_TOOLS,
  }));

  server.setRequestHandler(
    CallToolRequestSchema,
    async (request: CallToolRequest) => {
      const { name, arguments: args } = request.params;
      logger.info(`Tool call: ${name} ${summarizeArgs(args || {})}`);
      return handleWorkspaceTool(name, args || {});
    }
  );

  return server;
}

async function handleHttpRequest(
  req: IncomingMessage,
  res: ServerResponse,
  endpoint: ParsedMcpUrl,
  sessions: Map<string, SessionEntry>
): Promise<void> {
  const method = (req.method || '').toUpperCase();
  const requestUrl = new URL(
    req.url || '/',
    `http://${req.headers.host || `${endpoint.host}:${endpoint.port}`}`
  );

  applyCorsHeaders(res);

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (requestUrl.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'workspace-mcp',
      version: MCP_VERSION,
      sessions: sessions.size,
    }));
    return;
  }

  if (requestUrl.pathname !== endpoint.path) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
    return;
  }

  if (method === 'POST') {
    let body: unknown;
    try {
      body = await parseRequestBody(req);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Invalid JSON body';
      const statusCode = message.includes('too large') ? 413 : 400;
      sendJsonRpcError(res, statusCode, -32700, message);
      return;
    }

    const sessionId = getSessionId(req);

    if (sessionId && sessions.has(sessionId)) {
      const entry = sessions.get(sessionId)!;
      await entry.transport.handleRequest(req, res, body);
      return;
    }

    if (!sessionId && isInitializeRequest(body)) {
      const server = buildProtocolServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sid) => {
          sessions.set(sid, { server, transport });
          logger.info(`Session initialized: ${sid}`);
        },
      });

      let closed = false;
      transport.onclose = () => {
        if (closed) return;
        closed = true;
        const sid = transport.sessionId;
        if (sid && sessions.delete(sid)) {
          logger.info(`Session closed: ${sid}`);
        }
        void server.close().catch(() => { /* ignore */ });
      };

      await server.connect(transport);
      await transport.handleRequest(req, res, body);
      return;
    }

    sendJsonRpcError(res, 400, -32000, 'Bad Request: No valid session ID provided');
    return;
  }

  if (method === 'GET' || method === 'DELETE') {
    const sessionId = getSessionId(req);
    if (!sessionId || !sessions.has(sessionId)) {
      sendJsonRpcError(res, 400, -32000, 'Invalid or missing session ID');
      return;
    }
    const entry = sessions.get(sessionId)!;
    await entry.transport.handleRequest(req, res);
    return;
  }

  res.writeHead(405, { Allow: 'GET, POST, DELETE' });
  res.end();
}

function parseMcpUrl(rawUrl: string): ParsedMcpUrl {
  const parsed = new URL(rawUrl);
  const host = parsed.hostname || '127.0.0.1';
  const port = parsed.port
    ? Number.parseInt(parsed.port, 10)
    : parsed.protocol === 'https:' ? 443 : 80;
  const path = (parsed.pathname || '/mcp').replace(/\/$/, '') || '/mcp';
  return { host, port, path, fullUrl: `${parsed.protocol}//${host}:${port}${path}` };
}

function getSessionId(req: IncomingMessage): string | undefined {
  const value = req.headers['mcp-session-id'];
  if (Array.isArray(value)) return value[0];
  if (typeof value === 'string' && value.trim()) return value;
  return undefined;
}

async function parseRequestBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let totalBytes = 0;
  const maxBytes = 2 * 1024 * 1024;

  for await (const chunk of req) {
    const data = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
    totalBytes += data.length;
    if (totalBytes > maxBytes) throw new Error(`Request body too large (> ${maxBytes} bytes)`);
    chunks.push(data);
  }

  if (chunks.length === 0) return undefined;
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return undefined;

  try { return JSON.parse(raw); }
  catch { throw new Error('Invalid JSON body'); }
}

function summarizeArgs(args: Record<string, unknown>): string {
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

function sendJsonRpcError(res: ServerResponse, statusCode: number, code: number, message: string): void {
  applyCorsHeaders(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ jsonrpc: '2.0', error: { code, message }, id: null }));
}

function applyCorsHeaders(res: ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Mcp-Session-Id');
  res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');
}
