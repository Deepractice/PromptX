import type { ToolWithHandler } from '~/interfaces/MCPServer.js';
import { MCPOutputAdapter } from '~/utils/MCPOutputAdapter.js';

const outputAdapter = new MCPOutputAdapter();

/**
 * MCP 工具 - 管理外部 MCP 服务器集成
 *
 * 连接并管理外部 MCP 服务器，访问它们的工具、资源和提示词
 */
export const mcpTool: ToolWithHandler = {
  name: 'mcp',

  description: `🔧 MCP Server Manager - 管理外部 MCP 服务器集成

【规范名称】promptx_mcp
【调用说明】在提示词中使用 promptx_mcp，实际调用时自动映射到 mcp__[server]__mcp

## 功能概述

MCP (Model Context Protocol) 工具让你能够：
- 连接外部 MCP 服务器（如 filesystem、github 等）
- 访问外部服务器的工具、资源和提示词
- 管理 MCP 服务器生命周期
- 通过统一 URI 访问外部能力

## 主要命令

### 1. install - 安装 MCP 服务器
安装并配置一个新的 MCP 服务器

示例：
\`\`\`json
{
  "action": "install",
  "params": {
    "serverName": "filesystem",
    "config": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/sean"],
      "enabled": true
    }
  }
}
\`\`\`

### 2. list - 列出所有服务器
查看所有已配置的 MCP 服务器及其状态

示例：
\`\`\`json
{
  "action": "list"
}
\`\`\`

### 3. info - 查看服务器详情
获取特定服务器的详细信息和能力

示例：
\`\`\`json
{
  "action": "info",
  "params": {
    "serverName": "filesystem"
  }
}
\`\`\`

### 4. start/stop/restart - 控制服务器
启动、停止或重启 MCP 服务器

示例：
\`\`\`json
{
  "action": "start",
  "params": {
    "serverName": "filesystem"
  }
}
\`\`\`

### 5. enable/disable - 启用/禁用服务器
控制服务器是否在 PromptX 启动时自动启动

示例：
\`\`\`json
{
  "action": "enable",
  "params": {
    "serverName": "filesystem"
  }
}
\`\`\`

### 6. remove - 移除服务器
删除服务器配置（会先停止服务器）

示例：
\`\`\`json
{
  "action": "remove",
  "params": {
    "serverName": "filesystem"
  }
}
\`\`\`

### 7. capabilities - 查看服务器能力
查看服务器提供的所有工具、资源和提示词

示例：
\`\`\`json
{
  "action": "capabilities",
  "params": {
    "serverName": "filesystem"
  }
}
\`\`\`

### 8. call - 调用工具
直接调用外部 MCP 服务器的工具

示例：
\`\`\`json
{
  "action": "call",
  "params": {
    "serverName": "filesystem",
    "toolName": "read_file",
    "arguments": {
      "path": "/Users/sean/test.txt"
    }
  }
}
\`\`\`

### 9. read - 读取资源
读取外部 MCP 服务器的资源

示例：
\`\`\`json
{
  "action": "read",
  "params": {
    "serverName": "filesystem",
    "uri": "file:///Users/sean/test.txt"
  }
}
\`\`\`

### 10. prompt - 获取提示词
获取外部 MCP 服务器的提示词

示例：
\`\`\`json
{
  "action": "prompt",
  "params": {
    "serverName": "github",
    "promptName": "create-pr-description",
    "arguments": {
      "repository": "owner/repo"
    }
  }
}
\`\`\`

## URI 访问方式

安装服务器后，可以通过 URI 访问其能力：

### 工具调用
\`\`\`
mcp://filesystem/tool/read_file
\`\`\`

### 资源读取
\`\`\`
mcp://filesystem/resource/file:///path/to/file.txt
\`\`\`

### 提示词获取
\`\`\`
mcp://github/prompt/create-pr-description
\`\`\`

## 常用 MCP 服务器

### filesystem
文件系统操作
\`\`\`json
{
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-filesystem", "/allowed/path"]
}
\`\`\`

### github
GitHub 集成
\`\`\`json
{
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-github"],
  "env": {
    "GITHUB_TOKEN": "\${GITHUB_TOKEN}"
  }
}
\`\`\`

## 环境变量

支持 \${VAR_NAME} 语法引用环境变量：
- \${GITHUB_TOKEN}
- \${API_KEY}
- \${DATABASE_URL}

## 配置存储

配置保存在：\`~/.promptx/config/mcp-servers.json\`

## 使用流程

1. **安装服务器**：使用 install 命令
2. **查看能力**：使用 info 或 capabilities 命令
3. **使用能力**：通过 mcp:// URI 或 ToolX 调用
4. **管理生命周期**：使用 start/stop/enable/disable 命令

## 注意事项

- 服务器名称必须唯一
- 确保 command 和 args 正确
- 环境变量必须在系统中已定义
- 禁用的服务器不会自动启动
- 移除服务器会删除配置文件

## 与 Discover 集成

安装的 MCP 服务器会自动出现在 discover 中，显示：
- 🛠️  可用工具列表
- 📄 可访问资源
- 💬 可用提示词

## 示例工作流

\`\`\`javascript
// 1. 安装 filesystem 服务器
mcp({ action: "install", params: {
  serverName: "filesystem",
  config: {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/Users/sean"],
    enabled: true
  }
}})

// 2. 查看能力
mcp({ action: "capabilities", params: { serverName: "filesystem" }})

// 3. 通过 ToolX 使用工具
toolx({
  yaml: \`tool: mcp://filesystem/tool/read_file
mode: execute
parameters:
  path: /path/to/file.txt\`
})
\`\`\``,

  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['install', 'list', 'info', 'start', 'stop', 'restart', 'enable', 'disable', 'remove', 'capabilities', 'call', 'read', 'prompt'],
        description: 'MCP 命令操作'
      },
      params: {
        type: 'object',
        description: '命令参数',
        properties: {
          serverName: {
            type: 'string',
            description: 'MCP 服务器名称'
          },
          toolName: {
            type: 'string',
            description: '工具名称（用于 call 命令）'
          },
          arguments: {
            type: 'object',
            description: '工具参数（用于 call 命令）'
          },
          uri: {
            type: 'string',
            description: '资源 URI（用于 read 命令）'
          },
          promptName: {
            type: 'string',
            description: '提示词名称（用于 prompt 命令）'
          },
          config: {
            type: 'object',
            description: '服务器配置（用于 install）',
            properties: {
              command: {
                type: 'string',
                description: '启动命令（如 npx, node）'
              },
              args: {
                type: 'array',
                items: { type: 'string' },
                description: '命令参数'
              },
              env: {
                type: 'object',
                description: '环境变量（支持 ${VAR} 语法）'
              },
              enabled: {
                type: 'boolean',
                description: '是否启用自动启动'
              },
              timeout: {
                type: 'number',
                description: '连接超时（毫秒）'
              },
              metadata: {
                type: 'object',
                description: '元数据（description, version 等）'
              }
            }
          }
        }
      }
    },
    required: ['action']
  },

  handler: async (args: { action: string; params?: any }) => {
    try {
      // 动态导入 @promptx/core
      const core = await import('@promptx/core');
      const coreExports = core.default || core;

      // 获取 MCP 模块
      const mcpModule = (coreExports as any).mcp;

      if (!mcpModule || !mcpModule.MCPCommandHandler) {
        throw new Error('MCP module not available in @promptx/core');
      }

      // 创建 MCP 命令处理器
      const handler = new mcpModule.MCPCommandHandler();

      // 初始化（如果还没初始化）
      if (!handler.initialized) {
        await handler.initialize();
      }

      // 处理工具调用、资源读取、提示词获取
      if (args.action === 'call') {
        const toolProxy = handler.getToolProxy();
        const { serverName, toolName, arguments: toolArgs } = args.params || {};

        if (!serverName || !toolName) {
          throw new Error('call 命令需要 serverName 和 toolName 参数');
        }

        const result = await toolProxy.callTool(serverName, toolName, toolArgs || {});
        return outputAdapter.convertToMCPFormat(result);
      }

      if (args.action === 'read') {
        const toolProxy = handler.getToolProxy();
        const { serverName, uri } = args.params || {};

        if (!serverName || !uri) {
          throw new Error('read 命令需要 serverName 和 uri 参数');
        }

        const result = await toolProxy.readResource(serverName, uri);
        return outputAdapter.convertToMCPFormat(result);
      }

      if (args.action === 'prompt') {
        const toolProxy = handler.getToolProxy();
        const { serverName, promptName, arguments: promptArgs } = args.params || {};

        if (!serverName || !promptName) {
          throw new Error('prompt 命令需要 serverName 和 promptName 参数');
        }

        const result = await toolProxy.getPrompt(serverName, promptName, promptArgs || {});
        return outputAdapter.convertToMCPFormat(result);
      }

      // 执行管理命令
      const result = await handler.handleCommand(args.action, args.params || {});

      // 格式化输出
      return outputAdapter.convertToMCPFormat(result);

    } catch (error: any) {
      // 处理特定错误
      if (error.message?.includes('not found')) {
        return outputAdapter.convertToMCPFormat({
          success: false,
          error: {
            message: `MCP 服务器 "${args.params?.serverName}" 未找到`,
            hint: '使用 list 命令查看所有已配置的服务器',
            code: 'SERVER_NOT_FOUND'
          }
        });
      }

      if (error.message?.includes('already exists')) {
        return outputAdapter.convertToMCPFormat({
          success: false,
          error: {
            message: `MCP 服务器 "${args.params?.serverName}" 已存在`,
            hint: '使用不同的名称或先移除现有服务器',
            code: 'SERVER_EXISTS'
          }
        });
      }

      if (error.message?.includes('Invalid configuration')) {
        return outputAdapter.convertToMCPFormat({
          success: false,
          error: {
            message: '配置无效',
            details: error.message,
            hint: '检查 command, args 等必需字段',
            code: 'INVALID_CONFIG'
          }
        });
      }

      // 通用错误处理
      return outputAdapter.convertToMCPFormat({
        success: false,
        error: {
          message: error.message || 'MCP 命令执行失败',
          code: error.code || 'MCP_ERROR'
        }
      });
    }
  }
};
