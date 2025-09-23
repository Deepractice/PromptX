import type { ToolWithHandler } from '~/interfaces/MCPServer.js';
import { MCPOutputAdapter } from '~/utils/MCPOutputAdapter.js';

const outputAdapter = new MCPOutputAdapter();

export const recallTool: ToolWithHandler = {
  name: 'recall',
  description: `搜索并激活相关记忆 - 从记忆网络中找到相关内容

使用方法：
1. 先用action工具激活角色，会显示该角色的记忆网络图
2. 从网络图中选择一个关键词作为query参数
3. 系统会激活该关键词相关的所有记忆内容

重要提示：
⚡ query参数必须从当前显示的记忆网络图中选择
⚡ 网络图中的每个词都是可用的关键词
⚡ 选择与当前任务最相关的关键词效果最好

示例：
- 如果网络图显示"优化"、"算法"、"性能"等词
- 可以用 recall("角色名", "优化") 激活相关记忆
- 系统会返回所有与"优化"相关的记忆内容

快速使用：
- 开始新任务时：选择任务相关的关键词进行recall
- 遇到问题时：选择问题相关的关键词搜索经验
- 需要背景知识时：选择领域关键词获取相关记忆`,
  inputSchema: {
    type: 'object',
    properties: {
      role: {
        type: 'string',
        description: '要检索记忆的角色ID，如：java-developer, product-manager, copywriter'
      },
      query: {
        type: 'string',
        description: '从记忆网络图中选择的关键词。必须是激活角色后显示的网络图中的词汇。例如：网络图中有"优化"就可以用"优化"作为查询词'
      }
    },
    required: ['role', 'query']
  },
  handler: async (args: { role: string; query?: string }) => {
    const core = await import('@promptx/core');
    const coreExports = core.default || core;
    const cli = (coreExports as any).cli || (coreExports as any).pouch?.cli;
    
    if (!cli || !cli.execute) {
      throw new Error('CLI not available in @promptx/core');
    }
    
    const cliArgs = [args.role];
    if (args.query) cliArgs.push(args.query);
    
    const result = await cli.execute('recall', cliArgs);
    return outputAdapter.convertToMCPFormat(result);
  }
};