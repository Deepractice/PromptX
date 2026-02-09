import type { ToolWithHandler } from '~/interfaces/MCPServer.js';
import { MCPOutputAdapter } from '~/utils/MCPOutputAdapter.js';

const outputAdapter = new MCPOutputAdapter();

/**
 * Project 工具 - 项目配置管理
 *
 * 管理项目配置、环境准备和状态
 */
export const projectTool: ToolWithHandler = {
  name: 'project',
  description: `Bind the current IDE project directory

## What It Does

Registers the IDE workspace root so PromptX can discover project-level roles and tools.

## When to Use

Call this when the IDE has a project open, **before** running \`discover\`.

## Important

- Use the IDE's workspace root path, not a subdirectory
- Do not guess or infer the project path from file paths
- Without binding: only system-level and user-level resources are available

## Example

\`\`\`
IDE opens /Users/name/MyProject
→ bind /Users/name/MyProject (correct)
→ bind /Users/name/MyProject/src (wrong — don't use subdirectories)
\`\`\``,
  inputSchema: {
    type: 'object',
    properties: {
      workingDirectory: {
        type: 'string',
        description: 'IDE workspace root directory path. Use the IDE-provided path, do not guess.'
      },
      ideType: {
        type: 'string',
        description: 'IDE or editor type (optional), e.g.: cursor, vscode, claude'
      }
    },
    required: []
  },
  handler: async (args: { workingDirectory?: string; ideType?: string }) => {
    // 动态导入 @promptx/core
    const core = await import('@promptx/core');
    const coreExports = core.default || core;
    
    // 获取 cli 对象
    const cli = (coreExports as any).cli || (coreExports as any).pouch?.cli;
    
    if (!cli || !cli.execute) {
      throw new Error('CLI not available in @promptx/core');
    }
    
    // 构建 project 命令参数
    const cliArgs = [];
    if (args.workingDirectory || args.ideType) {
      cliArgs.push({ workingDirectory: args.workingDirectory, ideType: args.ideType });
    }
    
    // 执行 project 命令
    const result = await cli.execute('project', cliArgs);
    
    // 使用 OutputAdapter 格式化输出
    return outputAdapter.convertToMCPFormat(result);
  }
};