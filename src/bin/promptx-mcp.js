#!/usr/bin/env node

/**
 * PromptX MCP Server 启动脚本
 * 
 * 用法:
 * node src/bin/promptx-mcp.js
 * 或通过package.json scripts: npm run mcp:server
 */

const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { server } = require('../mcp/promptx-mcp-server.js');

async function main() {
  try {
    // 输出启动信息
    await server.start();
    
    // 创建标准输入输出传输
    const transport = new StdioServerTransport();
    
    // 连接服务器到传输层
    await server.connect(transport);
    
    console.log('🔗 MCP服务器已连接到stdio传输层');
    console.log('💡 可以通过Claude Desktop等MCP客户端连接使用');
    
  } catch (error) {
    console.error('❌ PromptX MCP服务器启动失败:', error);
    process.exit(1);
  }
}

// 处理优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 正在关闭PromptX MCP服务器...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 正在关闭PromptX MCP服务器...');
  process.exit(0);
});

// 启动服务器
main().catch(error => {
  console.error('❌ 未处理的错误:', error);
  process.exit(1);
}); 