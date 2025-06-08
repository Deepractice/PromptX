/**
 * PromptX MCP Server - 五大锦囊版本
 * 
 * 将PromptX的五个核心锦囊命令直接暴露为MCP工具
 * 基于官方@modelcontextprotocol/sdk标准实现
 */

const { McpServer, ResourceTemplate } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { z } = require('zod');

// 导入PromptX核心锦囊命令
const InitCommand = require('../lib/core/pouch/commands/InitCommand');
const HelloCommand = require('../lib/core/pouch/commands/HelloCommand');
const ActionCommand = require('../lib/core/pouch/commands/ActionCommand');
const LearnCommand = require('../lib/core/pouch/commands/LearnCommand');
const RecallCommand = require('../lib/core/pouch/commands/RecallCommand');
const RememberCommand = require('../lib/core/pouch/commands/RememberCommand');

// 创建标准MCP服务器
const server = new McpServer({
  name: 'PromptX-Jinang-Server',
  version: '1.0.0'
});

// 初始化锦囊命令实例
const jinang = {
  init: new InitCommand(),
  hello: new HelloCommand(),
  action: new ActionCommand(),
  learn: new LearnCommand(),
  recall: new RecallCommand(),
  remember: new RememberCommand()
};

// ===== 五大锦囊MCP工具 =====

// 1. 👋 hello锦囊 - 角色发现
server.tool(
  'hello',
  {
    action: z.enum(['list', 'discover']).optional().describe('操作类型: list-列出角色, discover-发现详情')
  },
  async ({ action = 'list' }) => {
    try {
      const result = await jinang.hello.getContent([]);
      return {
        content: [{
          type: 'text',
          text: result
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `❌ hello锦囊执行失败: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

// 2. ⚡ action锦囊 - 角色激活
server.tool(
  'action',
  {
    role: z.string().describe('角色名称 (如: assistant, product-manager, frontend-developer)')
  },
  async ({ role }) => {
    try {
      const result = await jinang.action.getContent([role]);
      return {
        content: [{
          type: 'text',
          text: result
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `❌ action锦囊执行失败: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

// 3. 📚 learn锦囊 - 知识学习
server.tool(
  'learn',
  {
    resource: z.string().optional().describe('学习资源URL (如: thought://role-name, execution://role-name)')
  },
  async ({ resource }) => {
    try {
      const args = resource ? [resource] : [];
      const result = await jinang.learn.getContent(args);
      return {
        content: [{
          type: 'text',
          text: result
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `❌ learn锦囊执行失败: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

// 4. 🔍 recall锦囊 - 记忆检索
server.tool(
  'recall',
  {
    query: z.string().optional().describe('搜索关键词或问题')
  },
  async ({ query }) => {
    try {
      const args = query ? [query] : [];
      const result = await jinang.recall.getContent(args);
      return {
        content: [{
          type: 'text',
          text: result
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `❌ recall锦囊执行失败: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

// 5. 🧠 remember锦囊 - 知识记忆
server.tool(
  'remember',
  {
    content: z.string().describe('要记忆的知识内容')
  },
  async ({ content }) => {
    try {
      const result = await jinang.remember.getContent([content]);
      return {
        content: [{
          type: 'text',
          text: result
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `❌ remember锦囊执行失败: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

// 6. 🏗️ init锦囊 - 项目初始化（可选）
server.tool(
  'init',
  {
    workspace_path: z.string().optional().describe('工作目录路径（默认为当前目录）')
  },
  async ({ workspace_path = '.' }) => {
    try {
      const result = await jinang.init.getContent([workspace_path]);
      return {
        content: [{
          type: 'text',
          text: `🏗️ 项目初始化完成！\n\n${result}\n\n⚠️ 注意：此命令会在指定目录创建PromptX项目结构。`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `❌ init锦囊执行失败: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

// ===== 资源定义 =====

// 检查是否已经注册过资源，避免重复注册
global.promptxResourcesRegistered = global.promptxResourcesRegistered || false;

if (!global.promptxResourcesRegistered) {
  try {
    // 角色清单资源
    server.resource(
      new ResourceTemplate(
        'role://list',
        'PromptX角色清单',
        'text/plain',
        'PromptX系统中所有可用的AI专家角色列表'
      ),
      async () => {
        try {
          const roles = await jinang.hello.getAllRoles();
          const roleList = roles.map(role => `${role.id}: ${role.description || '专业AI角色'}`).join('\n');
          return roleList;
        } catch (error) {
          return `Error: ${error.message}`;
        }
      }
    );

    // 锦囊使用指南资源
    server.resource(
      new ResourceTemplate(
        'guide://jinang',
        'PromptX锦囊使用指南',
        'text/markdown',
        'PromptX五大锦囊命令的完整使用指南'
      ),
      async () => {
        return `# PromptX五大锦囊MCP工具指南

## 🎯 核心理念
**AI use CLI get prompt for AI** - AI通过锦囊获取专业能力

## 🎒 五大锦囊工具

### 1. 👋 \`hello\` - 角色发现锦囊
**作用**: 发现并展示所有可用的AI角色和领域专家
**用法**: \`hello()\` 或 \`hello({action: "discover"})\`

### 2. ⚡ \`action\` - 角色激活锦囊  
**作用**: 激活特定AI角色，获取专业提示词
**用法**: \`action({role: "frontend-developer"})\`
**角色**: assistant, product-manager, frontend-developer, java-backend-developer, promptx-fullstack-developer, xiaohongshu-marketer, role-designer

### 3. 📚 \`learn\` - 知识学习锦囊
**作用**: 学习指定协议的资源内容
**用法**: \`learn({resource: "thought://role-name"})\` 或 \`learn()\`

### 4. 🔍 \`recall\` - 记忆检索锦囊
**作用**: AI主动从记忆中检索相关的专业知识  
**用法**: \`recall({query: "前端开发"})\` 或 \`recall()\`

### 5. 🧠 \`remember\` - 知识记忆锦囊
**作用**: AI主动内化知识和经验到记忆体系
**用法**: \`remember({content: "React Hook使用规则"})\`

## 🔄 PATEOAS状态机
\`\`\`
👋hello → ⚡action → 📚learn → 🔍recall → 🧠remember → 循环
\`\`\`

每个锦囊输出都包含下一步操作指引，实现AI无痛状态转换。

## 💡 使用建议
1. 从 \`hello\` 开始发现角色
2. 用 \`action\` 激活专业角色  
3. 通过 \`learn\` 深化专业能力
4. 用 \`recall\` 检索相关经验
5. 用 \`remember\` 固化重要知识

这样就实现了AI从通用→专业→应用的完整转换！`;
      }
    );
    
    global.promptxResourcesRegistered = true;
  } catch (error) {
    // 忽略重复注册错误
    if (!error.message.includes('already registered')) {
      throw error;
    }
  }
}

// ===== 轻量级初始化函数 =====

/**
 * 轻量级系统初始化 - 只加载必要状态，不创建文件
 */
async function performLightweightInit() {
  try {
    // 1. 加载协议体系（内存中）
    const protocolContent = await jinang.init.loadProtocolSystem();
    
    // 2. 验证核心组件
    await jinang.hello.getAllRoles();
    
    // 3. 设置内存状态（不写入文件）
    global.promptxSystemState = {
      initialized: true,
      timestamp: new Date().toISOString(),
      protocols: protocolContent,
      mode: 'mcp-server',
      version: '1.0.0'
    };
    
    console.log('   📋 协议体系已加载');
    console.log('   🎭 角色系统已验证');
    console.log('   💾 内存状态已设置');
    
  } catch (error) {
    console.warn('⚠️ 轻量级初始化部分失败，继续启动:', error.message);
    // 设置最小状态
    global.promptxSystemState = {
      initialized: true,
      timestamp: new Date().toISOString(),
      mode: 'mcp-server-minimal',
      version: '1.0.0'
    };
  }
}

// ===== 服务器启动 =====

// 错误处理
server.onerror = (error) => {
  console.error('[PromptX MCP Server Error]:', error);
};

// 启动服务器
async function main() {
  try {
    console.log('🎒 启动PromptX五大锦囊MCP服务器...');
    
    // 🏗️ 轻量级系统初始化（不创建文件）
    console.log('🏗️ 初始化PromptX系统状态...');
    await performLightweightInit();
    console.log('✅ 系统初始化完成！');
    
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
process.on('SIGINT', async () => {
  console.log('\n🛑 正在关闭PromptX锦囊MCP服务器...');
  await server.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 正在关闭PromptX锦囊MCP服务器...');
  await server.close();
  process.exit(0);
});

if (require.main === module) {
  main();
}

module.exports = { server, jinang }; 