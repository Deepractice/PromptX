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
<<<<<<< HEAD
  description: `📁 [项目管理] 发现并激活项目专属资源

为什么需要：
✅ 加载项目专属的角色、工具等资源
✅ 访问项目级的记忆和知识
✅ 获得针对此项目优化的能力

何时调用：
当你知道项目根目录时，建议立即调用以获得项目的完整能力。

不调用会怎样：
- 只能使用系统级和用户级资源
- 无法访问项目专属资源
- 可能错过重要的项目能力`,
  inputSchema: {
    type: 'object',
    properties: {
      workingDirectory: {
        type: 'string',
        description: '项目的工作目录路径（可选）。仅在需要项目级配置时提供。'
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