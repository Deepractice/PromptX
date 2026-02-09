import type { ToolWithHandler } from '~/interfaces/MCPServer.js';
import { MCPOutputAdapter } from '~/utils/MCPOutputAdapter.js';

const outputAdapter = new MCPOutputAdapter();

/**
 * Learn 工具 - 专业资源学习器
 * 
 * PromptX资源管理体系的统一学习入口
 */
export const learnTool: ToolWithHandler = {
  name: 'learn',
  description: `Load and learn PromptX resources by protocol URL

## What It Does

Unified entry point for loading professional resources: role definitions, thinking models, execution skills, knowledge bases, tool manuals, and more.

## When to Use

- Need to use a tool but don't know how → learn its \`@manual://\`
- Want domain expertise → learn \`@knowledge://\` or \`@thought://\`
- Need to understand a role → learn \`@role://\`

## Supported Protocols

| Protocol | Purpose | Example |
|---|---|---|
| @role:// | Full role definition | @role://luban |
| @thought:// | Thinking models | @thought://creativity |
| @execution:// | Execution skills | @execution://best-practice |
| @knowledge:// | Domain knowledge | @knowledge://scrum |
| @manual:// | Tool documentation | @manual://filesystem |
| @tool:// | Tool source code | @tool://pdf-reader |
| @project:// | Project resources | @project://config |
| @file:// | File system resources | @file://path |

## Rules

- Only real resources can be loaded — never fabricate
- Always learn \`@manual://\` before using a tool for the first time
- Follow the learn → understand → use workflow`,
  inputSchema: {
    type: 'object',
    properties: {
      resource: {
        type: 'string',
        description: 'Resource URL, e.g.: @thought://creativity, @execution://best-practice, @knowledge://scrum, @manual://filesystem'
      }
    },
    required: ['resource']
  },
  handler: async (args: { resource: string }) => {
    // 动态导入 @promptx/core
    const core = await import('@promptx/core');
    const coreExports = core.default || core;
    
    // 获取 cli 对象
    const cli = (coreExports as any).cli || (coreExports as any).pouch?.cli;
    
    if (!cli || !cli.execute) {
      throw new Error('CLI not available in @promptx/core');
    }
    
    // 执行 learn 命令
    const result = await cli.execute('learn', [args.resource]);
    
    // 使用 OutputAdapter 格式化输出
    return outputAdapter.convertToMCPFormat(result);
  }
};