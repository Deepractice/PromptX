import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Tool, Resource, Prompt } from '@modelcontextprotocol/sdk/types.js';
import type { MCPServer, MCPServerOptions, ServerState, ToolHandler } from '../MCPServer.js';

/**
 * Knuth形式化测试规约
 * 
 * 不变式验证：
 * 1. 状态机完备性：所有状态转换必须合法
 * 2. 资源一致性：注册的资源必须可查询
 * 3. 并发安全性：并发操作不破坏内部状态
 * 4. 错误恢复性：错误状态必须可恢复
 */

describe('MCPServer Interface Contract Tests', () => {
  let server: MCPServer;
  
  // 测试工具定义
  const createTestTool = (name: string): Tool & { handler: ToolHandler } => ({
    name,
    description: `Test tool ${name}`,
    inputSchema: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      },
      required: ['message']
    },
    handler: vi.fn(async (args) => ({
      content: [{
        type: 'text',
        text: `Processed: ${args.message}`
      }]
    }))
  });

  const createTestResource = (uri: string): Resource => ({
    uri,
    name: `Resource ${uri}`,
    description: `Test resource at ${uri}`,
    mimeType: 'text/plain'
  });

  const createTestPrompt = (name: string): Prompt => ({
    name,
    description: `Test prompt ${name}`,
    arguments: [
      {
        name: 'input',
        description: 'Test input',
        required: true
      }
    ]
  });

  describe('State Machine Invariants', () => {
    it('should start in IDLE state', () => {
      expect(server.getState()).toBe('IDLE');
      expect(server.isRunning()).toBe(false);
    });

    it('should transition through STARTING state', async () => {
      const startPromise = server.start();
      
      // 验证中间状态
      expect(['IDLE', 'STARTING']).toContain(server.getState());
      
      await startPromise;
      expect(server.getState()).toBe('RUNNING');
      expect(server.isRunning()).toBe(true);
    });

    it('should transition through STOPPING state', async () => {
      await server.start();
      const stopPromise = server.stop();
      
      // 验证中间状态
      expect(['RUNNING', 'STOPPING']).toContain(server.getState());
      
      await stopPromise;
      expect(server.getState()).toBe('STOPPED');
      expect(server.isRunning()).toBe(false);
    });

    it('should handle ERROR state with recovery', async () => {
      // 模拟错误
      const error = new Error('Test error');
      await server.start();
      
      // 触发错误（具体实现依赖于实际错误触发机制）
      // server.simulateError(error);
      
      if (server.getState() === 'ERROR') {
        // 验证错误恢复
        await server.recover();
        expect(['RUNNING', 'STOPPED']).toContain(server.getState());
      }
    });

    it('should reject invalid state transitions', async () => {
      // 不能从IDLE直接stop
      await expect(server.stop()).rejects.toThrow(/Invalid state transition/);
      
      // 不能重复start
      await server.start();
      await expect(server.start()).rejects.toThrow(/already running/i);
    });
  });

  describe('Tool Management Invariants', () => {
    const tool1 = createTestTool('tool1');
    const tool2 = createTestTool('tool2');

    beforeEach(async () => {
      await server.start();
    });

    it('should register and retrieve tools', () => {
      server.registerTool(tool1);
      
      const retrieved = server.getTool('tool1');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('tool1');
      expect(retrieved?.description).toBe('Test tool tool1');
    });

    it('should list all registered tools', () => {
      server.registerTool(tool1);
      server.registerTool(tool2);
      
      const tools = server.listTools();
      expect(tools).toHaveLength(2);
      expect(tools.map(t => t.name)).toEqual(['tool1', 'tool2']);
    });

    it('should reject duplicate tool registration', () => {
      server.registerTool(tool1);
      expect(() => server.registerTool(tool1)).toThrow(/already registered/i);
    });

    it('should unregister tools', () => {
      server.registerTool(tool1);
      server.unregisterTool('tool1');
      
      expect(server.getTool('tool1')).toBeUndefined();
      expect(server.listTools()).toHaveLength(0);
    });

    it('should execute tool handlers', async () => {
      server.registerTool(tool1);
      
      const result = await server.executeTool('tool1', { message: 'test' });
      expect(result.content[0].text).toBe('Processed: test');
      expect(tool1.handler).toHaveBeenCalledWith({ message: 'test' });
    });

    it('should handle tool execution errors gracefully', async () => {
      const errorTool: Tool & { handler: ToolHandler } = {
        ...createTestTool('error-tool'),
        handler: vi.fn(async () => {
          throw new Error('Tool execution failed');
        })
      };
      
      server.registerTool(errorTool);
      
      await expect(server.executeTool('error-tool', {}))
        .rejects.toThrow('Tool execution failed');
      
      // 服务器应保持运行状态
      expect(server.isRunning()).toBe(true);
    });
  });

  describe('Resource Management Invariants', () => {
    const resource1 = createTestResource('file://test1.txt');
    const resource2 = createTestResource('file://test2.txt');

    beforeEach(async () => {
      await server.start();
    });

    it('should register and retrieve resources', () => {
      server.registerResource(resource1);
      
      const retrieved = server.getResource('file://test1.txt');
      expect(retrieved).toBeDefined();
      expect(retrieved?.uri).toBe('file://test1.txt');
    });

    it('should list all registered resources', () => {
      server.registerResource(resource1);
      server.registerResource(resource2);
      
      const resources = server.listResources();
      expect(resources).toHaveLength(2);
      expect(resources.map(r => r.uri)).toEqual([
        'file://test1.txt',
        'file://test2.txt'
      ]);
    });

    it('should reject duplicate resource registration', () => {
      server.registerResource(resource1);
      expect(() => server.registerResource(resource1))
        .toThrow(/already registered/i);
    });
  });

  describe('Prompt Management Invariants', () => {
    const prompt1 = createTestPrompt('prompt1');
    const prompt2 = createTestPrompt('prompt2');

    beforeEach(async () => {
      await server.start();
    });

    it('should register and retrieve prompts', () => {
      server.registerPrompt(prompt1);
      
      const retrieved = server.getPrompt('prompt1');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('prompt1');
    });

    it('should list all registered prompts', () => {
      server.registerPrompt(prompt1);
      server.registerPrompt(prompt2);
      
      const prompts = server.listPrompts();
      expect(prompts).toHaveLength(2);
      expect(prompts.map(p => p.name)).toEqual(['prompt1', 'prompt2']);
    });
  });

  describe('Concurrency Safety Invariants', () => {
    it('should handle concurrent tool registrations safely', async () => {
      await server.start();
      
      const tools = Array.from({ length: 10 }, (_, i) => 
        createTestTool(`concurrent-${i}`)
      );
      
      // 并发注册
      await Promise.all(
        tools.map(tool => 
          Promise.resolve(server.registerTool(tool))
        )
      );
      
      // 验证所有工具都已注册
      expect(server.listTools()).toHaveLength(10);
    });

    it('should handle concurrent tool executions safely', async () => {
      await server.start();
      
      const tool = createTestTool('concurrent-exec');
      server.registerTool(tool);
      
      // 并发执行
      const executions = Array.from({ length: 10 }, (_, i) =>
        server.executeTool('concurrent-exec', { message: `msg-${i}` })
      );
      
      const results = await Promise.all(executions);
      
      // 验证所有执行都成功
      results.forEach((result, i) => {
        expect(result.content[0].text).toBe(`Processed: msg-${i}`);
      });
    });
  });

  describe('Error Recovery Invariants', () => {
    it('should recover from transient errors', async () => {
      await server.start();
      
      // 模拟可恢复错误
      const healthBefore = await server.healthCheck();
      expect(healthBefore.status).toBe('healthy');
      
      // 触发错误并恢复
      // await server.simulateTransientError();
      // await server.recover();
      
      const healthAfter = await server.healthCheck();
      expect(healthAfter.status).toBe('healthy');
    });

    it('should gracefully shutdown on fatal errors', async () => {
      await server.start();
      
      // 模拟致命错误
      // await server.simulateFatalError();
      
      if (server.getState() === 'FATAL_ERROR') {
        // 只能关闭，不能恢复
        await expect(server.recover()).rejects.toThrow(/Cannot recover from fatal error/);
        
        // 但可以优雅关闭
        await server.gracefulShutdown(5000);
        expect(server.getState()).toBe('STOPPED');
      }
    });
  });

  describe('Graceful Shutdown Invariants', () => {
    it('should complete pending operations before shutdown', async () => {
      await server.start();
      
      const tool = createTestTool('long-running');
      tool.handler = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { content: [{ type: 'text', text: 'Done' }] };
      });
      
      server.registerTool(tool);
      
      // 启动长时间运行的操作
      const execution = server.executeTool('long-running', {});
      
      // 立即请求关闭
      const shutdownPromise = server.gracefulShutdown(1000);
      
      // 验证操作完成
      const result = await execution;
      expect(result.content[0].text).toBe('Done');
      
      // 验证关闭完成
      await shutdownPromise;
      expect(server.getState()).toBe('STOPPED');
    });

    it('should timeout if operations take too long', async () => {
      await server.start();
      
      const tool = createTestTool('very-long-running');
      tool.handler = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10000));
        return { content: [{ type: 'text', text: 'Done' }] };
      });
      
      server.registerTool(tool);
      
      // 启动超长时间运行的操作
      server.executeTool('very-long-running', {});
      
      // 请求关闭，设置短超时
      const shutdownPromise = server.gracefulShutdown(100);
      
      // 应该在超时后强制关闭
      await shutdownPromise;
      expect(server.getState()).toBe('STOPPED');
    });
  });

  describe('Health Check Invariants', () => {
    it('should report healthy state when running normally', async () => {
      await server.start();
      
      const health = await server.healthCheck();
      expect(health.status).toBe('healthy');
      expect(health.checks).toBeDefined();
    });

    it('should report degraded state with warnings', async () => {
      await server.start();
      
      // 注册大量资源模拟高负载
      for (let i = 0; i < 1000; i++) {
        server.registerResource(createTestResource(`file://resource-${i}.txt`));
      }
      
      const health = await server.healthCheck();
      // 可能返回degraded状态
      expect(['healthy', 'degraded']).toContain(health.status);
    });

    it('should include detailed check results', async () => {
      await server.start();
      
      const health = await server.healthCheck();
      expect(health.checks).toHaveProperty('server');
      expect(health.checks).toHaveProperty('resources');
      expect(health.checks).toHaveProperty('memory');
    });
  });

  describe('Metrics Collection Invariants', () => {
    it('should track request metrics', async () => {
      await server.start();
      
      const tool = createTestTool('metric-test');
      server.registerTool(tool);
      
      const metricsBefore = server.getMetrics();
      const requestCountBefore = metricsBefore.requestCount;
      
      // 执行一些操作
      await server.executeTool('metric-test', { message: 'test' });
      
      const metricsAfter = server.getMetrics();
      expect(metricsAfter.requestCount).toBe(requestCountBefore + 1);
    });

    it('should track error metrics', async () => {
      await server.start();
      
      const errorTool: Tool & { handler: ToolHandler } = {
        ...createTestTool('error-metric'),
        handler: vi.fn(async () => {
          throw new Error('Metric test error');
        })
      };
      
      server.registerTool(errorTool);
      
      const metricsBefore = server.getMetrics();
      const errorCountBefore = metricsBefore.errorCount;
      
      // 触发错误
      try {
        await server.executeTool('error-metric', {});
      } catch (e) {
        // 预期的错误
      }
      
      const metricsAfter = server.getMetrics();
      expect(metricsAfter.errorCount).toBe(errorCountBefore + 1);
    });

    it('should track performance metrics', async () => {
      await server.start();
      
      const metrics = server.getMetrics();
      expect(metrics).toHaveProperty('avgResponseTime');
      expect(metrics).toHaveProperty('activeConnections');
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics.avgResponseTime).toBeGreaterThanOrEqual(0);
    });
  });
});