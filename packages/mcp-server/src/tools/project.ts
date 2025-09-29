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
  description: `📁 [项目管理] 绑定IDE当前工作项目

【规范名称】promptx_project
【调用说明】在提示词中使用 promptx_project，实际调用时自动映射到 mcp__[server]__project

重要原则：
✅ 使用IDE提供的项目根目录（如VSCode工作区、Cursor项目）
✅ 不要自行推测或识别项目位置
✅ 以IDE的项目概念为准，而非文件路径推断

何时调用：
当IDE打开了一个项目时，使用IDE的工作目录路径调用此工具。

示例：
- VSCode打开 /Users/name/MyProject → 绑定此目录
- 看到文件 /Users/name/MyProject/src/index.js → 仍然绑定项目根 /Users/name/MyProject
- 不要因为看到子文件就绑定子目录

不调用会怎样：
- 只能使用系统级和用户级资源
- 无法访问项目专属资源`,
  inputSchema: {
    type: 'object',
    properties: {
      workingDirectory: {
        type: 'string',
        description: 'IDE当前打开的项目根目录路径。使用IDE工作区路径，不要自行判断或推测项目位置。'
      },
      ideType: {
        type: 'string',
        description: 'IDE或编辑器类型（可选）。如：cursor, vscode, claude等。'
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