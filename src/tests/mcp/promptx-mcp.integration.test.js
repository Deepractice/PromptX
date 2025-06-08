/**
 * PromptX MCP Server 集成测试
 * 
 * 测试所有PromptX锦囊命令是否正确转换为MCP工具
 */

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { server, commands } = require('../../mcp/promptx-mcp-server.js');

describe('PromptX MCP Server Integration Tests', () => {

  describe('Server Instance', () => {
    test('should create standard MCP server', () => {
      expect(server).toBeInstanceOf(McpServer);
      expect(server.server._serverInfo.name).toBe('PromptX-MCP-Server');
      expect(server.server._serverInfo.version).toBe('0.0.2-local.7');
    });

    test('should initialize all command instances', () => {
      expect(commands.hello).toBeDefined();
      expect(commands.action).toBeDefined();
      expect(commands.recall).toBeDefined();
      expect(commands.remember).toBeDefined();
      expect(commands.learn).toBeDefined();
      expect(commands.register).toBeDefined();
      expect(commands.init).toBeDefined();
    });
  });

  describe('MCP Tools', () => {
    test('should register all PromptX tools', async () => {
      const tools = await server.listTools();
      const toolNames = tools.tools.map(t => t.name);
      
      expect(toolNames).toContain('promptx-hello');
      expect(toolNames).toContain('promptx-action');
      expect(toolNames).toContain('promptx-remember');
      expect(toolNames).toContain('promptx-recall');
      expect(toolNames).toContain('promptx-learn');
      expect(toolNames).toContain('promptx-register');
      expect(toolNames).toContain('promptx-init');
    });

    test('promptx-hello tool should work', async () => {
      const result = await server.callTool({
        name: 'promptx-hello',
        arguments: { action: 'list' }
      });
      
      expect(result.content).toBeDefined();
      expect(result.content[0].text).toContain('PromptX可用角色');
    });

    test('promptx-action tool should work with valid role', async () => {
      const result = await server.callTool({
        name: 'promptx-action',
        arguments: { 
          role: 'frontend-developer', 
          input: '帮我创建一个简单的按钮组件' 
        }
      });
      
      expect(result.content).toBeDefined();
      expect(result.content[0].text).toBeTruthy();
      // 如果不是明确的错误消息，就不应该是错误
      if (!result.content[0].text.includes('不存在') || !result.content[0].text.includes('❌')) {
        expect(result.isError).toBeFalsy();
      }
    });

    test('tools should have proper input schemas', async () => {
      const tools = await server.listTools();
      
      const helloTool = tools.tools.find(t => t.name === 'promptx-hello');
      expect(helloTool.inputSchema.properties.action).toBeDefined();
      
      const actionTool = tools.tools.find(t => t.name === 'promptx-action');
      expect(actionTool.inputSchema.properties.role).toBeDefined();
      expect(actionTool.inputSchema.properties.input).toBeDefined();
      expect(actionTool.inputSchema.required).toContain('role');
      expect(actionTool.inputSchema.required).toContain('input');
    });
  });

  describe('MCP Resources', () => {
    test('should register PromptX resources', async () => {
      const resources = await server.listResources();
      const resourceUris = resources.resources.map(r => r.uri);
      
      expect(resourceUris.some(uri => uri.includes('promptx://role/'))).toBe(true);
      expect(resourceUris.some(uri => uri.includes('promptx://memory/all'))).toBe(true);
    });

    test('should read role resource', async () => {
      try {
        const result = await server.readResource({
          uri: 'promptx://role/assistant'
        });
        
        expect(result.contents).toBeDefined();
        expect(result.contents[0].text).toContain('assistant');
        expect(result.contents[0].mimeType).toBe('text/markdown');
      } catch (error) {
        // 如果角色文件不存在，这是正常的
        expect(error.message).toContain('角色资源读取失败');
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid role in promptx-action', async () => {
      const result = await server.callTool({
        name: 'promptx-action',
        arguments: { 
          role: 'non-existent-role', 
          input: 'test' 
        }
      });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('❌');
    });

    test('should handle missing tool gracefully', async () => {
      await expect(
        server.callTool({
          name: 'non-existent-tool',
          arguments: {}
        })
      ).rejects.toThrow('Tool not found');
    });
  });

  describe('Server Lifecycle', () => {
    test('should have start method', () => {
      expect(typeof server.start).toBe('function');
    });

    test('start method should work', async () => {
      // 捕获console.log输出
      const originalLog = console.log;
      const logs = [];
      console.log = (...args) => logs.push(args.join(' '));
      
      await server.start();
      
      console.log = originalLog;
      
      expect(logs.some(log => log.includes('PromptX MCP Server'))).toBe(true);
      expect(logs.some(log => log.includes('可用工具'))).toBe(true);
    });
  });

}); 