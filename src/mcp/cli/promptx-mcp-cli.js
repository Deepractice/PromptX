#!/usr/bin/env node

/**
 * PromptX五大锦囊MCP服务器CLI启动器
 * 
 * 使用方式:
 * npx promptx-mcp-server           # 启动MCP服务器
 * node promptx-mcp-cli.js          # 直接启动
 */

const path = require('path');

// 启动MCP服务器
async function startMCPServer() {
  try {
    console.log('🎒 启动PromptX五大锦囊MCP服务器...');
    
    // 引入服务器
    const { server, jinang } = require('../promptx-mcp-server.js');
    
    // 🏗️ 自动初始化环境
    console.log('🏗️ 自动初始化PromptX环境...');
    await jinang.init.getContent([]);
    console.log('✅ 环境初始化完成！');
    
    // 🔥 预热锦囊系统
    console.log('🔥 预热锦囊系统...');
    await jinang.hello.getAllRoles();
    
    console.log('✅ PromptX锦囊MCP服务器已就绪!');
    console.log('🎭 可用锦囊工具:');
    console.log('   👋 hello   - 角色发现锦囊');
    console.log('   ⚡ action  - 角色激活锦囊');
    console.log('   📚 learn   - 知识学习锦囊');
    console.log('   🔍 recall  - 记忆检索锦囊');
    console.log('   🧠 remember - 知识记忆锦囊');
    console.log('');
    console.log('🛠️  init锦囊已自动执行，环境就绪');
    console.log('');
    console.log('📡 等待MCP客户端连接...');
    
    // 连接stdio传输层
    await server.connect({
      transport: {
        type: 'stdio'
      }
    });
    
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 正在关闭PromptX锦囊MCP服务器...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 正在关闭PromptX锦囊MCP服务器...');
  process.exit(0);
});

// 启动服务器
if (require.main === module) {
  startMCPServer();
}

module.exports = { startMCPServer }; 