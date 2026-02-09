import type { ToolWithHandler } from '~/interfaces/MCPServer.js';
import { MCPOutputAdapter } from '~/utils/MCPOutputAdapter.js';

const outputAdapter = new MCPOutputAdapter();

/**
 * Discover 工具 - 展示所有可用的AI专业角色和工具
 * 
 * 为AI提供完整的专业服务选项清单，包括可激活的角色和可调用的工具。
 */
export const discoverTool: ToolWithHandler = {
  name: 'discover',
  description: `Discover available AI roles and tools

## What It Does

Lists all activatable roles and callable tools, grouped by source:
- **📦 System**: Built-in PromptX roles/tools
- **🏗️ Project**: Project-specific (requires \`project\` tool to bind first)
- **👤 User**: User-created custom resources
- **🎭 RoleX V2**: Lifecycle-managed roles

## When to Use

- First time in a project — see what's available
- Need a specialist but unsure which role to activate
- Looking for the right tool for a task
- After creating new roles/tools — discover freshly registered resources

## Tips

- In a project context, run \`project\` first to bind the directory, then \`discover\`
- Use the returned role IDs with \`action\` to activate
- Tools include manual links — learn before using

## Focus Parameter

- \`all\` (default): Show everything
- \`roles\`: Only activatable roles
- \`tools\`: Only available tools`,
  inputSchema: {
    type: 'object',
    properties: {
      focus: {
        type: 'string',
        description: "Focus scope: 'all' (everything), 'roles' (roles only), or 'tools' (tools only)",
        enum: ['all', 'roles', 'tools'],
        default: 'all'
      }
    }
  },
  handler: async () => {
    // 动态导入 @promptx/core
    const core = await import('@promptx/core');
    const coreExports = core.default || core;
    
    // 获取 cli 对象
    const cli = (coreExports as any).cli || (coreExports as any).pouch?.cli;
    
    if (!cli || !cli.execute) {
      throw new Error('CLI not available in @promptx/core');
    }
    
    // 执行 discover 命令
    const result = await cli.execute('discover', []);
    
    // 使用 OutputAdapter 格式化输出
    return outputAdapter.convertToMCPFormat(result);
  }
};