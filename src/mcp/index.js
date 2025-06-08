/**
 * PromptX MCP Module Entry Point
 * 
 * This module provides the main interface for PromptX's Model Context Protocol
 * implementation, exposing configuration and server instances for integration
 * with external MCP clients.
 */

const config = require('./config');
const server = require('./server');

/**
 * 启动MCP服务器
 * @param {Object} options - 启动选项
 * @param {string} options.transport - 传输方式 ('stdio' | 'http')
 * @param {number} options.port - HTTP端口 (仅当transport为'http'时使用)
 * @param {boolean} options.debug - 是否启用调试模式
 */
async function startMCPServer(options = {}) {
  const {
    transport = 'stdio',
    port = 3000,
    debug = false
  } = options;

  if (debug) {
    console.log('🔍 MCP服务器配置:');
    console.log(`  传输方式: ${transport}`);
    console.log(`  端口: ${port}`);
    console.log(`  调试模式: ${debug}`);
  }

  try {
    if (transport === 'stdio') {
      // MCP标准stdio传输 (用于AI IDE集成)
      const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
      const transport = new StdioServerTransport();
      
      await server.connect(transport);
      
      if (debug) {
        console.log('✅ MCP服务器已启动 (stdio传输)');
      }
    } else if (transport === 'http') {
      // HTTP传输 (用于开发和调试)
      console.log(`🌐 启动HTTP服务器，端口: ${port}`);
      // 这里可以添加HTTP传输实现
      throw new Error('HTTP传输暂未实现，请使用stdio传输');
    } else {
      throw new Error(`不支持的传输方式: ${transport}`);
    }
  } catch (error) {
    console.error('❌ MCP服务器启动失败:', error.message);
    throw error;
  }
}

module.exports = {
  config,
  server,
  
  // Version and metadata
  version: config.server.version,
  name: config.server.name,
  
  // Enhanced start methods
  startMCPServer,
  start: () => server.start(),
  stop: () => server.stop()
}; 