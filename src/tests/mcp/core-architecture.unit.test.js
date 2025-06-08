/**
 * MCP Core Architecture Tests - TDD Phase 1
 * 
 * Tests for verifying PromptX MCP server compliance with official MCP standards
 * Following official @modelcontextprotocol/sdk patterns
 */

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

describe('MCP Server Architecture - TDD Phase 1', () => {
  
  describe('TDD-1.1: McpServer Instance Creation', () => {
    test('should create standard McpServer instance', () => {
      // 🟢 GREEN: 验证McpServer实例和配置
      const { server } = require('../../mcp/server.js');
      
      expect(server).toBeInstanceOf(McpServer);
      expect(server.server._serverInfo.name).toBe('PromptX-MCP-Server');
      expect(server.server._serverInfo.version).toBe('0.0.2-local.6');
    });

    test('should have proper server configuration', () => {
      const { server } = require('../../mcp/server.js');
      
      // 验证服务器基本属性
      expect(server).toBeDefined();
      expect(typeof server.server._serverInfo.name).toBe('string');
      expect(typeof server.server._serverInfo.version).toBe('string');
      expect(server.server._serverInfo.name.length).toBeGreaterThan(0);
      expect(server.server._serverInfo.version.length).toBeGreaterThan(0);
    });
  });

  describe('TDD-1.2: Transport Layer Standardization', () => {
    test('should connect to StdioServerTransport', async () => {
      // 🔴 RED: 这个测试应该失败，因为当前没有标准的传输连接
      const { server } = require('../../mcp/server.js');
      const transport = new StdioServerTransport();
      
      await expect(server.connect(transport)).resolves.not.toThrow();
      expect(server.isConnected || server.transport).toBeTruthy();
    });

    test('should handle connection lifecycle', async () => {
      const { server } = require('../../mcp/server.js');
      const transport = new StdioServerTransport();
      
      // 测试连接状态管理
      await server.connect(transport);
      expect(server.isConnected || server.transport).toBeTruthy();
      
      // 清理连接
      if (server.close) {
        await server.close();
      }
    });
  });

  describe('TDD-1.3: Tool Registration System', () => {
    test('should register promptx-discover-roles tool', async () => {
      // 🔴 RED: 测试工具注册功能
      const { server } = require('../../mcp/server.js');
      
      const tools = await server.listTools();
      expect(tools.tools).toContainEqual(
        expect.objectContaining({
          name: 'promptx-discover-roles',
          description: expect.stringContaining('Discover available PromptX roles')
        })
      );
    });

    test('should register promptx-execute-role tool', async () => {
      const { server } = require('../../mcp/server.js');
      
      const tools = await server.listTools();
      expect(tools.tools).toContainEqual(
        expect.objectContaining({
          name: 'promptx-execute-role',
          description: expect.stringContaining('Execute a PromptX role')
        })
      );
    });
  });

  describe('TDD-1.4: Resource Registration System', () => {
    test('should register promptx role resources', async () => {
      // 🔴 RED: 测试资源注册功能
      const { server } = require('../../mcp/server.js');
      
      const resources = await server.listResources();
      expect(resources.resources).toContainEqual(
        expect.objectContaining({
          uri: expect.stringMatching(/promptx:\/\/role\/.+/),
          name: expect.stringContaining('PromptX Role')
        })
      );
    });

    test('should register thought resources', async () => {
      const { server } = require('../../mcp/server.js');
      
      const resources = await server.listResources();
      expect(resources.resources).toContainEqual(
        expect.objectContaining({
          uri: expect.stringMatching(/promptx:\/\/thought\/.+/),
          name: expect.stringContaining('Thought')
        })
      );
    });
  });

  describe('TDD Integration Tests', () => {
    test('should maintain PromptX functionality', async () => {
      // 确保重构不破坏现有功能
      const { server } = require('../../mcp/server.js');
      
      // 基本功能测试
      expect(server).toBeDefined();
      
      // 如果有现有的PromptX集成，确保它们仍然工作
      if (server.roleDiscoveryService) {
        const roles = await server.roleDiscoveryService.discoverRoles();
        expect(Array.isArray(roles)).toBe(true);
      }
    });
  });

}); 