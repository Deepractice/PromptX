import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Resource } from '@modelcontextprotocol/sdk/types.js';
import { BaseMCPServer } from '~/servers/BaseMCPServer.js';
import type { MCPServerOptions, ToolWithHandler } from '~/interfaces/MCPServer.js';

/**
 * 测试用的具体实现
 */
class TestMCPServer extends BaseMCPServer {
  public transportConnected = false;
  
  constructor(options: MCPServerOptions) {
    super(options);
    // 测试环境禁用错误恢复策略，避免重试
    this.errorRecoveryStrategy = undefined;
  }
  
  protected async connectTransport(): Promise<void> {
    this.transportConnected = true;
  }
  
  protected async disconnectTransport(): Promise<void> {
    this.transportConnected = false;
  }
  
  protected async readResource(resource: Resource): Promise<any> {
    return {
      contents: [
        {
          uri: resource.uri,
          mimeType: resource.mimeType || 'text/plain',
          text: `Content of ${resource.uri}`
        }
      ]
    };
  }
  
  // 暴露保护方法用于测试
  public getTools() {
    return this.tools;
  }
  
  public getResources() {
    return this.resources;
  }
  
  public getPrompts() {
    return this.prompts;
  }
  
  public getSessions() {
    return this.sessions;
  }
  
  public getActiveRequests() {
    return this.activeRequests;
  }
}

describe('BaseMCPServer', () => {
  let server: TestMCPServer;
  const options: MCPServerOptions = {
    name: 'test-server',
    version: '1.0.0'
  };
  
  beforeEach(() => {
    server = new TestMCPServer(options);
  });
  
  describe('State Management', () => {
    it('should initialize with IDLE state', () => {
      expect(server.getState()).toBe('IDLE');
      expect(server.isRunning()).toBe(false);
    });
    
    it('should transition to RUNNING state on start', async () => {
      await server.start();
      expect(server.getState()).toBe('RUNNING');
      expect(server.isRunning()).toBe(true);
      expect(server.transportConnected).toBe(true);
    });
    
    it('should transition to STOPPED state on stop', async () => {
      await server.start();
      await server.stop();
      expect(server.getState()).toBe('STOPPED');
      expect(server.isRunning()).toBe(false);
      expect(server.transportConnected).toBe(false);
    });
    
    it('should prevent duplicate starts', async () => {
      await server.start();
      await expect(server.start()).rejects.toThrow('already running');
    });
    
    it('should prevent invalid stop', async () => {
      await expect(server.stop()).rejects.toThrow('Invalid state transition');
    });
  });
  
  describe('Tool Management', () => {
    const createTestTool = (name: string): ToolWithHandler => ({
      name,
      description: `Test tool ${name}`,
      inputSchema: {
        type: 'object',
        properties: {
          message: { type: 'string' }
        }
      },
      handler: vi.fn(async (args) => ({
        content: [{
          type: 'text',
          text: `Processed: ${args.message}`
        }]
      }))
    });
    
    beforeEach(async () => {
      await server.start();
    });
    
    it('should register and retrieve tools', () => {
      const tool = createTestTool('test-tool');
      server.registerTool(tool);
      
      expect(server.getTools().size).toBe(1);
      expect(server.getTool('test-tool')).toBeDefined();
      expect(server.getTool('test-tool')?.name).toBe('test-tool');
    });
    
    it('should list all tools', () => {
      const tool1 = createTestTool('tool1');
      const tool2 = createTestTool('tool2');
      
      server.registerTool(tool1);
      server.registerTool(tool2);
      
      const tools = server.listTools();
      expect(tools).toHaveLength(2);
      expect(tools.map(t => t.name)).toContain('tool1');
      expect(tools.map(t => t.name)).toContain('tool2');
    });
    
    it('should prevent duplicate tool registration', () => {
      const tool = createTestTool('duplicate');
      server.registerTool(tool);
      
      expect(() => server.registerTool(tool)).toThrow('already registered');
    });
    
    it('should unregister tools', () => {
      const tool = createTestTool('to-remove');
      server.registerTool(tool);
      
      expect(server.getTool('to-remove')).toBeDefined();
      
      server.unregisterTool('to-remove');
      expect(server.getTool('to-remove')).toBeUndefined();
    });
    
    it('should execute tool handlers', async () => {
      const tool = createTestTool('executable');
      server.registerTool(tool);
      
      const result = await server.executeTool('executable', { message: 'test' });
      
      expect(tool.handler).toHaveBeenCalledWith({ message: 'test' });
      expect(result.content[0].text).toBe('Processed: test');
    });
    
    it('should handle tool execution errors', async () => {
      const errorTool: ToolWithHandler = {
        ...createTestTool('error-tool'),
        handler: vi.fn(async () => {
          throw new Error('Execution failed');
        })
      };
      
      server.registerTool(errorTool);
      
      await expect(server.executeTool('error-tool', {}))
        .rejects.toThrow('Execution failed');
      
      // Server should remain running
      expect(server.isRunning()).toBe(true);
      
      // Error count should increase
      const metrics = server.getMetrics();
      expect(metrics.errorCount).toBeGreaterThan(0);
    });
    
    it('should track tool execution metrics', async () => {
      const tool = createTestTool('metric-tool');
      server.registerTool(tool);
      
      const metricsBefore = server.getMetrics();
      await server.executeTool('metric-tool', { message: 'test' });
      const metricsAfter = server.getMetrics();
      
      expect(metricsAfter.requestCount).toBe(metricsBefore.requestCount + 1);
      expect(metricsAfter.avgResponseTime).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('Resource Management', () => {
    const createTestResource = (uri: string): Resource => ({
      uri,
      name: `Resource ${uri}`,
      description: `Test resource at ${uri}`,
      mimeType: 'text/plain'
    });
    
    beforeEach(async () => {
      await server.start();
    });
    
    it('should register and retrieve resources', () => {
      const resource = createTestResource('file://test.txt');
      server.registerResource(resource);
      
      expect(server.getResources().size).toBe(1);
      expect(server.getResource('file://test.txt')).toBeDefined();
      expect(server.getResource('file://test.txt')?.uri).toBe('file://test.txt');
    });
    
    it('should list all resources', () => {
      const resource1 = createTestResource('file://test1.txt');
      const resource2 = createTestResource('file://test2.txt');
      
      server.registerResource(resource1);
      server.registerResource(resource2);
      
      const resources = server.listResources();
      expect(resources).toHaveLength(2);
      expect(resources.map(r => r.uri)).toContain('file://test1.txt');
      expect(resources.map(r => r.uri)).toContain('file://test2.txt');
    });
    
    it('should prevent duplicate resource registration', () => {
      const resource = createTestResource('file://duplicate.txt');
      server.registerResource(resource);
      
      expect(() => server.registerResource(resource)).toThrow('already registered');
    });
    
    it('should unregister resources', () => {
      const resource = createTestResource('file://to-remove.txt');
      server.registerResource(resource);
      
      expect(server.getResource('file://to-remove.txt')).toBeDefined();
      
      server.unregisterResource('file://to-remove.txt');
      expect(server.getResource('file://to-remove.txt')).toBeUndefined();
    });
  });
  
  describe('Session Management', () => {
    beforeEach(async () => {
      await server.start();
    });
    
    it('should create sessions with unique IDs', async () => {
      const session1 = await server.createSession();
      const session2 = await server.createSession();
      
      expect(session1.id).toBeDefined();
      expect(session2.id).toBeDefined();
      expect(session1.id).not.toBe(session2.id);
    });
    
    it('should store session metadata', async () => {
      const metadata = { user: 'test', role: 'admin' };
      const session = await server.createSession(metadata);
      
      expect(session.metadata).toEqual(metadata);
    });
    
    it('should retrieve sessions by ID', async () => {
      const session = await server.createSession();
      const retrieved = server.getSession(session.id);
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(session.id);
    });
    
    it('should update session activity on access', async () => {
      const session = await server.createSession();
      const initialActivity = session.lastActivity;
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const retrieved = server.getSession(session.id);
      expect(retrieved?.lastActivity).toBeGreaterThan(initialActivity);
    });
    
    it('should destroy sessions', async () => {
      const session = await server.createSession();
      expect(server.getSession(session.id)).toBeDefined();
      
      await server.destroySession(session.id);
      expect(server.getSession(session.id)).toBeUndefined();
    });
    
    it('should list all sessions', async () => {
      await server.createSession();
      await server.createSession();
      
      const sessions = server.listSessions();
      expect(sessions).toHaveLength(2);
    });
  });
  
  describe('Health Check', () => {
    it('should report healthy state when running', async () => {
      await server.start();
      
      const health = await server.healthCheck();
      expect(health.status).toBe('healthy');
      expect(health.checks.server.status).toBe('up');
    });
    
    it('should report unhealthy state when stopped', async () => {
      const health = await server.healthCheck();
      expect(health.checks.server.status).toBe('down');
    });
    
    it('should include resource counts', async () => {
      await server.start();
      
      const tool = {
        name: 'test',
        description: 'test',
        inputSchema: {},
        handler: vi.fn()
      };
      server.registerTool(tool);
      
      const health = await server.healthCheck();
      expect(health.checks.resources.registered).toBe(1);
      expect(health.checks.resources.available).toBe(1);
    });
    
    it('should include memory information', async () => {
      await server.start();
      
      const health = await server.healthCheck();
      expect(health.checks.memory.used).toBeGreaterThan(0);
      expect(health.checks.memory.limit).toBeGreaterThan(0);
      expect(health.checks.memory.percentage).toBeGreaterThanOrEqual(0);
      expect(health.checks.memory.percentage).toBeLessThanOrEqual(100);
    });
  });
  
  describe('Metrics', () => {
    beforeEach(async () => {
      await server.start();
    });
    
    it('should track uptime', async () => {
      const metrics1 = server.getMetrics();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const metrics2 = server.getMetrics();
      expect(metrics2.uptime).toBeGreaterThan(metrics1.uptime);
    });
    
    it('should track active connections', async () => {
      await server.createSession();
      await server.createSession();
      
      const metrics = server.getMetrics();
      expect(metrics.activeConnections).toBe(2);
    });
    
    it('should include memory usage', () => {
      const metrics = server.getMetrics();
      expect(metrics.memoryUsage).toBeDefined();
      expect(metrics.memoryUsage.heapUsed).toBeGreaterThan(0);
    });
  });
  
  describe('Graceful Shutdown', () => {
    it('should wait for active requests before shutdown', async () => {
      await server.start();
      
      const tool: ToolWithHandler = {
        name: 'slow-tool',
        description: 'Slow tool',
        inputSchema: {},
        handler: vi.fn(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return { content: [{ type: 'text', text: 'Done' }] };
        })
      };
      
      server.registerTool(tool);
      
      // Start a slow operation
      const execPromise = server.executeTool('slow-tool', {});
      
      // Immediately request graceful shutdown
      const shutdownPromise = server.gracefulShutdown(1000);
      
      // Both should complete
      const [execResult] = await Promise.all([execPromise, shutdownPromise]);
      
      expect(execResult.content[0].text).toBe('Done');
      expect(server.getState()).toBe('STOPPED');
    });
    
    it('should timeout if operations take too long', async () => {
      await server.start();
      
      const tool: ToolWithHandler = {
        name: 'very-slow-tool',
        description: 'Very slow tool',
        inputSchema: {},
        handler: vi.fn(async () => {
          await new Promise(resolve => setTimeout(resolve, 10000));
          return { content: [{ type: 'text', text: 'Done' }] };
        })
      };
      
      server.registerTool(tool);
      
      // Start a very slow operation
      server.executeTool('very-slow-tool', {}).catch(() => {});
      
      // Request shutdown with short timeout
      await server.gracefulShutdown(50);
      
      expect(server.getState()).toBe('STOPPED');
    });
  });
  
  describe('Concurrent Operations', () => {
    beforeEach(async () => {
      await server.start();
    });
    
    it('should handle concurrent tool registrations', () => {
      const tools = Array.from({ length: 10 }, (_, i) => ({
        name: `tool-${i}`,
        description: `Tool ${i}`,
        inputSchema: {},
        handler: vi.fn()
      }));
      
      // Register all tools
      tools.forEach(tool => server.registerTool(tool));
      
      expect(server.getTools().size).toBe(10);
      expect(server.listTools()).toHaveLength(10);
    });
    
    it('should handle concurrent tool executions', async () => {
      const tool: ToolWithHandler = {
        name: 'concurrent-tool',
        description: 'Concurrent tool',
        inputSchema: {},
        handler: vi.fn(async (args: any) => ({
          content: [{ type: 'text', text: `Result: ${args.id}` }]
        }))
      };
      
      server.registerTool(tool);
      
      // Execute multiple times concurrently
      const promises = Array.from({ length: 10 }, (_, i) =>
        server.executeTool('concurrent-tool', { id: i })
      );
      
      const results = await Promise.all(promises);
      
      results.forEach((result, i) => {
        expect(result.content[0].text).toBe(`Result: ${i}`);
      });
      
      expect(tool.handler).toHaveBeenCalledTimes(10);
    });
    
    it('should track active requests correctly', async () => {
      const tool: ToolWithHandler = {
        name: 'tracking-tool',
        description: 'Tracking tool',
        inputSchema: {},
        handler: vi.fn(async () => {
          // Check active requests during execution
          expect(server.getActiveRequests()).toBeGreaterThan(0);
          await new Promise(resolve => setTimeout(resolve, 50));
          return { content: [{ type: 'text', text: 'Done' }] };
        })
      };
      
      server.registerTool(tool);
      
      expect(server.getActiveRequests()).toBe(0);
      
      const promise = server.executeTool('tracking-tool', {});
      
      // Wait a bit to ensure handler is called
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await promise;
      
      expect(server.getActiveRequests()).toBe(0);
    });
  });
});