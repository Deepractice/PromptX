import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { StreamableHttpMCPServer } from '~/servers/StreamableHttpMCPServer.js';
import type { MCPServerOptions, ToolWithHandler } from '~/interfaces/MCPServer.js';
import type { Server as HttpServer } from 'http';
import type { Express } from 'express';

/**
 * StreamableHttpMCPServer测试
 * 
 * 不变式验证：
 * 1. HTTP传输层正确性
 * 2. SSE流式响应
 * 3. 会话管理
 * 4. 并发请求处理
 */

// Mock express
const mockApp: Partial<Express> = {
  use: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  listen: vi.fn((port: number, callback?: Function) => {
    if (callback) callback();
    return mockHttpServer;
  })
};

const mockHttpServer: Partial<HttpServer> = {
  close: vi.fn((callback?: Function) => {
    if (callback) callback();
  }),
  listening: true,
  address: vi.fn(() => ({ port: 3000 }))
};

vi.mock('express', () => {
  const express = vi.fn(() => mockApp);
  express.json = vi.fn(() => (req: any, res: any, next: any) => next());
  express.urlencoded = vi.fn(() => (req: any, res: any, next: any) => next());
  return {
    default: express
  };
});

// Mock SDK
vi.mock('@modelcontextprotocol/sdk/server/index.js', () => {
  return {
    Server: vi.fn().mockImplementation(() => ({
      connect: vi.fn().mockResolvedValue(undefined),
      setRequestHandler: vi.fn(),
      close: vi.fn()
    }))
  };
});

describe('StreamableHttpMCPServer', () => {
  let server: StreamableHttpMCPServer;
  const options: MCPServerOptions = {
    name: 'test-http-server',
    version: '1.0.0'
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
    server = new StreamableHttpMCPServer(options);
  });
  
  afterEach(async () => {
    if (server && server.isRunning()) {
      await server.stop();
    }
  });
  
  describe('HTTP Server Setup', () => {
    it('should start HTTP server on specified port', async () => {
      await server.start({ ...options, port: 3000 });
      
      expect(server.isRunning()).toBe(true);
      expect(mockApp.listen).toHaveBeenCalledWith(3000, expect.any(Function));
    });
    
    it('should use default port if not specified', async () => {
      await server.start();
      
      expect(mockApp.listen).toHaveBeenCalledWith(8080, expect.any(Function));
    });
    
    it('should setup middleware', async () => {
      await server.start();
      
      expect(mockApp.use).toHaveBeenCalled();
    });
    
    it('should setup routes', async () => {
      await server.start();
      
      expect(mockApp.get).toHaveBeenCalledWith('/health', expect.any(Function));
      expect(mockApp.get).toHaveBeenCalledWith('/sse/:sessionId', expect.any(Function));
      expect(mockApp.post).toHaveBeenCalledWith('/rpc/:sessionId', expect.any(Function));
    });
    
    it('should stop HTTP server on disconnect', async () => {
      await server.start();
      await server.stop();
      
      expect(mockHttpServer.close).toHaveBeenCalled();
      expect(server.isRunning()).toBe(false);
    });
  });
  
  describe('Session Management', () => {
    it('should create new session on request', async () => {
      await server.start();
      
      const req = { params: { sessionId: 'new-session' } };
      const res = {
        json: vi.fn(),
        status: vi.fn().mockReturnThis()
      };
      
      // Get the POST handler
      const postHandler = (mockApp.post as any).mock.calls.find(
        (call: any[]) => call[0] === '/rpc/:sessionId'
      )?.[1];
      
      expect(postHandler).toBeDefined();
      
      // First request should create session
      await postHandler(
        { ...req, body: { jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} } },
        res
      );
      
      const sessions = server.listSessions();
      expect(sessions.some(s => s.id === 'new-session')).toBe(true);
    });
    
    it('should handle multiple sessions concurrently', async () => {
      await server.start();
      
      const postHandler = (mockApp.post as any).mock.calls.find(
        (call: any[]) => call[0] === '/rpc/:sessionId'
      )?.[1];
      
      const sessions = ['session1', 'session2', 'session3'];
      const responses: any[] = [];
      
      for (const sessionId of sessions) {
        const res = {
          json: vi.fn(),
          status: vi.fn().mockReturnThis()
        };
        responses.push(res);
        
        await postHandler(
          {
            params: { sessionId },
            body: { jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }
          },
          res
        );
      }
      
      const activeSessions = server.listSessions();
      expect(activeSessions.length).toBeGreaterThanOrEqual(3);
    });
    
    it('should cleanup inactive sessions', async () => {
      const shortTimeout = 100; // 100ms for testing
      await server.start({ ...options, sessionTimeout: shortTimeout });
      
      const postHandler = (mockApp.post as any).mock.calls.find(
        (call: any[]) => call[0] === '/rpc/:sessionId'
      )?.[1];
      
      // Create a session
      await postHandler(
        {
          params: { sessionId: 'timeout-session' },
          body: { jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }
        },
        { json: vi.fn(), status: vi.fn().mockReturnThis() }
      );
      
      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, shortTimeout + 50));
      
      const sessions = server.listSessions();
      expect(sessions.some(s => s.id === 'timeout-session')).toBe(false);
    });
  });
  
  describe('RPC Request Handling', () => {
    it('should handle JSON-RPC requests', async () => {
      await server.start();
      
      const tool: ToolWithHandler = {
        name: 'http-test-tool',
        description: 'Test tool for HTTP',
        inputSchema: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        handler: vi.fn(async (args) => ({
          content: [{
            type: 'text',
            text: `HTTP: ${args.message}`
          }]
        }))
      };
      
      server.registerTool(tool);
      
      const postHandler = (mockApp.post as any).mock.calls.find(
        (call: any[]) => call[0] === '/rpc/:sessionId'
      )?.[1];
      
      const res = {
        json: vi.fn(),
        status: vi.fn().mockReturnThis()
      };
      
      await postHandler(
        {
          params: { sessionId: 'test-session' },
          body: {
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/call',
            params: {
              name: 'http-test-tool',
              arguments: { message: 'Hello HTTP' }
            }
          }
        },
        res
      );
      
      expect(tool.handler).toHaveBeenCalledWith({ message: 'Hello HTTP' });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          jsonrpc: '2.0',
          id: 1
        })
      );
    });
    
    it('should handle errors gracefully', async () => {
      await server.start();
      
      const postHandler = (mockApp.post as any).mock.calls.find(
        (call: any[]) => call[0] === '/rpc/:sessionId'
      )?.[1];
      
      const res = {
        json: vi.fn(),
        status: vi.fn().mockReturnThis()
      };
      
      // Request non-existent tool
      await postHandler(
        {
          params: { sessionId: 'error-session' },
          body: {
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/call',
            params: {
              name: 'non-existent',
              arguments: {}
            }
          }
        },
        res
      );
      
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          jsonrpc: '2.0',
          id: 1,
          error: expect.objectContaining({
            message: expect.stringContaining('not found')
          })
        })
      );
    });
  });
  
  describe('SSE Support', () => {
    it('should setup SSE endpoint', async () => {
      await server.start();
      
      expect(mockApp.get).toHaveBeenCalledWith('/sse/:sessionId', expect.any(Function));
    });
    
    it('should handle SSE connections', async () => {
      await server.start();
      
      const sseHandler = (mockApp.get as any).mock.calls.find(
        (call: any[]) => call[0] === '/sse/:sessionId'
      )?.[1];
      
      expect(sseHandler).toBeDefined();
      
      const res = {
        writeHead: vi.fn(),
        write: vi.fn(),
        end: vi.fn(),
        on: vi.fn()
      };
      
      sseHandler(
        { params: { sessionId: 'sse-session' } },
        res
      );
      
      // Should setup SSE headers
      expect(res.writeHead).toHaveBeenCalledWith(200, expect.objectContaining({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }));
      
      // Should send initial message
      expect(res.write).toHaveBeenCalled();
    });
    
    it('should cleanup SSE on client disconnect', async () => {
      await server.start();
      
      const sseHandler = (mockApp.get as any).mock.calls.find(
        (call: any[]) => call[0] === '/sse/:sessionId'
      )?.[1];
      
      const res = {
        writeHead: vi.fn(),
        write: vi.fn(),
        end: vi.fn(),
        on: vi.fn((event: string, handler: Function) => {
          if (event === 'close') {
            // Simulate client disconnect
            setTimeout(() => handler(), 10);
          }
        })
      };
      
      sseHandler(
        { params: { sessionId: 'sse-disconnect' } },
        res
      );
      
      // Wait for disconnect handler
      await new Promise(resolve => setTimeout(resolve, 20));
      
      // Should have called end
      expect(res.end).toHaveBeenCalled();
    });
  });
  
  describe('Health Check', () => {
    it('should provide health endpoint', async () => {
      await server.start();
      
      const healthHandler = (mockApp.get as any).mock.calls.find(
        (call: any[]) => call[0] === '/health'
      )?.[1];
      
      expect(healthHandler).toBeDefined();
      
      const res = {
        json: vi.fn()
      };
      
      await healthHandler({}, res);
      
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: expect.stringMatching(/healthy|degraded|unhealthy/),
          server: expect.objectContaining({
            name: 'test-http-server',
            version: '1.0.0'
          })
        })
      );
    });
  });
  
  describe('CORS Support', () => {
    it('should handle CORS headers', async () => {
      await server.start();
      
      // Middleware should be setup for CORS
      expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function));
    });
  });
});