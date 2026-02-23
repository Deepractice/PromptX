import type { ToolWithHandler } from '~/interfaces/MCPServer.js';
import { MCPOutputAdapter } from '~/utils/MCPOutputAdapter.js';

const outputAdapter = new MCPOutputAdapter();

export function createDiscoverTool(enableV2: boolean): ToolWithHandler {
  return {
    name: 'discover',
    description: `Discover available AI roles and tools

## What It Does

Lists all activatable roles and callable tools, grouped by source:
- **📦 System**: Built-in PromptX roles/tools
- **🏗️ Project**: Project-specific (requires \`project\` tool to bind first)
- **👤 User**: User-created custom resources${enableV2 ? '\n- **🎭 RoleX V2**: Lifecycle-managed roles' : ''}

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
      const core = await import('@promptx/core');
      const coreExports = core.default || core;
      const cli = (coreExports as any).cli || (coreExports as any).pouch?.cli;

      if (!cli || !cli.execute) {
        throw new Error('CLI not available in @promptx/core');
      }

      const result = await cli.execute('discover', []);
      return outputAdapter.convertToMCPFormat(result);
    }
  };
}

// 向后兼容导出（默认启用 V2）
export const discoverTool: ToolWithHandler = createDiscoverTool(true);
