import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { StdioMCPServer } from '~/servers/StdioMCPServer.js';
import type { MCPServerOptions, ToolWithHandler } from '~/interfaces/MCPServer.js';

// Mock the SDK transport
vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => {
  return {
    StdioServerTransport: vi.fn().mockImplementation(() => ({
      close: vi.fn().mockResolvedValue(undefined),
      send: vi.fn(),
      onMessage: vi.fn(),
      onError: vi.fn(),
      start: vi.fn()
    }))
  };
});

// Mock the SDK server
vi.mock('@modelcontextprotocol/sdk/server/index.js', () => {
  return {
    Server: vi.fn().mockImplementation(() => ({
      connect: vi.fn().mockResolvedValue(undefined),
      setRequestHandler: vi.fn(),
      close: vi.fn()
    }))
  };
});

// Mock fs/promises
vi.mock('fs/promises', () => {
  return {
    readFile: vi.fn().mockResolvedValue('Test file content')
  };
});

/**
 * StdioMCPServer测试
 * 
 * 不变式验证：
 * 1. 标准输入输出传输正确性
 * 2. JSON-RPC消息格式正确性
 * 3. 流式通信不中断
 */

// Mock stdio
const mockStdin = {
  on: vi.fn(),
  once: vi.fn(),
  off: vi.fn(),
  removeListener: vi.fn(),
  removeAllListeners: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  setEncoding: vi.fn()
};

const mockStdout = {
  write: vi.fn((data: string, callback?: Function) => {
    if (callback) callback();
    return true;
  })
};

const mockStderr = {
  write: vi.fn()
};

// Mock process
const originalProcess = process;

describe('StdioMCPServer', () => {
  let server: StdioMCPServer;
  const options: MCPServerOptions = {
    name: 'test-stdio-server',
    version: '1.0.0'
  };
  
  beforeEach(() => {
    // Mock process.stdin/stdout/stderr
    Object.defineProperty(process, 'stdin', {
      value: mockStdin,
      writable: true,
      configurable: true
    });
    Object.defineProperty(process, 'stdout', {
      value: mockStdout,
      writable: true,
      configurable: true
    });
    Object.defineProperty(process, 'stderr', {
      value: mockStderr,
      writable: true,
      configurable: true
    });
    
    // Clear mocks
    vi.clearAllMocks();
    
    server = new StdioMCPServer(options);
  });
  
  afterEach(async () => {
    // 停止服务器（如果正在运行）
    if (server && server.isRunning()) {
      await server.stop();
    }
    
    // 清理所有进程监听器
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('SIGTERM');
    
    // Restore original process
    Object.defineProperty(process, 'stdin', {
      value: originalProcess.stdin,
      writable: true,
      configurable: true
    });
    Object.defineProperty(process, 'stdout', {
      value: originalProcess.stdout,
      writable: true,
      configurable: true
    });
    Object.defineProperty(process, 'stderr', {
      value: originalProcess.stderr,
      writable: true,
      configurable: true
    });
  });
  
  describe('Transport Connection', () => {
    it('should connect to stdio transport on start', async () => {
      await server.start();
      
      expect(server.isRunning()).toBe(true);
      expect(mockStdin.on).toHaveBeenCalledWith('data', expect.any(Function));
      expect(mockStdin.on).toHaveBeenCalledWith('end', expect.any(Function));
    });
    
    it('should disconnect from stdio transport on stop', async () => {
      await server.start();
      await server.stop();
      
      expect(server.isRunning()).toBe(false);
      expect(mockStdin.removeAllListeners).toHaveBeenCalled();
      expect(mockStdin.pause).toHaveBeenCalled();
    });
    
    it('should resume stdin on connect', async () => {
      await server.start();
      expect(mockStdin.resume).toHaveBeenCalled();
    });
  });
  
  describe('Message Handling', () => {
    it('should handle JSON-RPC requests from stdin', async () => {
      await server.start();
      
      // Get the data handler
      const dataHandler = mockStdin.on.mock.calls.find(
        call => call[0] === 'data'
      )?.[1];
      
      expect(dataHandler).toBeDefined();
      
      // Simulate incoming JSON-RPC request
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {}
      };
      
      // Send request through stdin
      dataHandler(Buffer.from(JSON.stringify(request) + '\n'));
      
      // Give time for async processing
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Check if response was written to stdout
      expect(mockStdout.write).toHaveBeenCalled();
      const response = mockStdout.write.mock.calls[0]?.[0];
      expect(response).toContain('jsonrpc');
      expect(response).toContain('"id":1');
    });
    
    it('should handle tool registration and execution', async () => {
      await server.start();
      
      const tool: ToolWithHandler = {
        name: 'stdio-test-tool',
        description: 'Test tool for stdio',
        inputSchema: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        handler: vi.fn(async (args) => ({
          content: [{
            type: 'text',
            text: `Echo: ${args.message}`
          }]
        }))
      };
      
      server.registerTool(tool);
      
      // Get the data handler
      const dataHandler = mockStdin.on.mock.calls.find(
        call => call[0] === 'data'
      )?.[1];
      
      // Send tool execution request
      const request = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'stdio-test-tool',
          arguments: { message: 'Hello Stdio' }
        }
      };
      
      dataHandler(Buffer.from(JSON.stringify(request) + '\n'));
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(tool.handler).toHaveBeenCalledWith({ message: 'Hello Stdio' });
    });
    
    it('should handle multiple requests in sequence', async () => {
      await server.start();
      
      const dataHandler = mockStdin.on.mock.calls.find(
        call => call[0] === 'data'
      )?.[1];
      
      // Send multiple requests
      const requests = [
        { jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} },
        { jsonrpc: '2.0', id: 2, method: 'resources/list', params: {} },
        { jsonrpc: '2.0', id: 3, method: 'prompts/list', params: {} }
      ];
      
      for (const request of requests) {
        dataHandler(Buffer.from(JSON.stringify(request) + '\n'));
      }
      
      // Wait for all processing
      await new Promise(resolve => setTimeout(resolve, 20));
      
      // Should have responses for all requests
      expect(mockStdout.write.mock.calls.length).toBeGreaterThanOrEqual(3);
    });
    
    it('should handle chunked JSON input', async () => {
      await server.start();
      
      const dataHandler = mockStdin.on.mock.calls.find(
        call => call[0] === 'data'
      )?.[1];
      
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {}
      };
      
      const fullMessage = JSON.stringify(request) + '\n';
      const chunk1 = fullMessage.slice(0, 10);
      const chunk2 = fullMessage.slice(10);
      
      // Send in chunks
      dataHandler(Buffer.from(chunk1));
      dataHandler(Buffer.from(chunk2));
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Should still process the complete message
      expect(mockStdout.write).toHaveBeenCalled();
    });
  });
  
  describe('Error Handling', () => {
    it('should handle malformed JSON input', async () => {
      await server.start();
      
      const dataHandler = mockStdin.on.mock.calls.find(
        call => call[0] === 'data'
      )?.[1];
      
      // Send malformed JSON
      dataHandler(Buffer.from('{ invalid json }\n'));
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Should write error response
      expect(mockStdout.write).toHaveBeenCalled();
      const response = mockStdout.write.mock.calls[0]?.[0];
      expect(response).toContain('error');
    });
    
    it('should handle stdin end event', async () => {
      await server.start();
      
      const endHandler = mockStdin.on.mock.calls.find(
        call => call[0] === 'end'
      )?.[1];
      
      expect(endHandler).toBeDefined();
      
      // Trigger end event
      endHandler();
      
      // Server should stop
      expect(server.isRunning()).toBe(false);
    });
    
    it('should log errors to stderr', async () => {
      await server.start();
      
      const dataHandler = mockStdin.on.mock.calls.find(
        call => call[0] === 'data'
      )?.[1];
      
      // Send request for non-existent tool
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'non-existent-tool',
          arguments: {}
        }
      };
      
      dataHandler(Buffer.from(JSON.stringify(request) + '\n'));
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Error response should be sent
      const response = mockStdout.write.mock.calls[0]?.[0];
      expect(response).toContain('error');
      expect(response).toContain('not found');
    });
  });
  
  describe('Resource Reading', () => {
    it('should implement resource reading', async () => {
      await server.start();
      
      // Register a test resource
      server.registerResource({
        uri: 'file://test.txt',
        name: 'Test Resource',
        description: 'A test resource',
        mimeType: 'text/plain'
      });
      
      const dataHandler = mockStdin.on.mock.calls.find(
        call => call[0] === 'data'
      )?.[1];
      
      // Request resource read
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'resources/read',
        params: {
          uri: 'file://test.txt'
        }
      };
      
      dataHandler(Buffer.from(JSON.stringify(request) + '\n'));
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Should return resource content
      const response = mockStdout.write.mock.calls[0]?.[0];
      expect(response).toContain('result');
    });
  });
  
  describe('Graceful Shutdown', () => {
    it('should complete pending operations before shutdown', async () => {
      await server.start();
      
      const tool: ToolWithHandler = {
        name: 'slow-tool',
        description: 'Slow tool',
        inputSchema: {},
        handler: vi.fn(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
          return { content: [{ type: 'text', text: 'Done' }] };
        })
      };
      
      server.registerTool(tool);
      
      const dataHandler = mockStdin.on.mock.calls.find(
        call => call[0] === 'data'
      )?.[1];
      
      // Start tool execution
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'slow-tool',
          arguments: {}
        }
      };
      
      dataHandler(Buffer.from(JSON.stringify(request) + '\n'));
      
      // Immediately request shutdown
      const shutdownPromise = server.gracefulShutdown(200);
      
      await shutdownPromise;
      
      // Tool should have completed
      expect(tool.handler).toHaveBeenCalled();
    });
  });
});