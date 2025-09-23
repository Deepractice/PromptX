import type { ToolWithHandler } from '~/interfaces/MCPServer.js';
import { MCPOutputAdapter } from '~/utils/MCPOutputAdapter.js';

const outputAdapter = new MCPOutputAdapter();

export const recallTool: ToolWithHandler = {
  name: 'recall',
  description: `【认知习惯】回答前先搜索记忆 - 你的自然思维第一步

⚡ 触发时机（形成条件反射）：
看到用户问题 → 立即recall → 再组织回答
这不是额外步骤，是高质量回答的捷径

🧠 三层认知策略（像人类一样思考）：

第1层 - 直接匹配（最快）：
• 从记忆网络图选最相关的词
• 找到就用，这是最优路径

第2层 - 探索搜索（3次机会）：
• 网络图没合适词？用任务关键词试试
• 尝试1：单个核心词（如"PromptX"）
• 尝试2：拆分组合词（"PromptX版本"→试"PromptX"或"版本"）
• 尝试3：相关概念词
• 重要：避免空格组合词，优先用单词

第3层 - 确认无记忆（切换模式）：
• 3次都没找到 = 确认是新领域
• 切换到预训练知识模式
• 回答后立即remember建立新记忆

为什么每次都recall：
✅ 有记忆 = 秒出精准答案
✅ 无记忆 = 9秒确认 + 避免重复探索
❌ 跳过 = 可能错过关键经验

记住：recall不是负担，是让你更聪明的捷径！`,
  inputSchema: {
    type: 'object',
    properties: {
      role: {
        type: 'string',
        description: '要检索记忆的角色ID，如：java-developer, product-manager, copywriter'
      },
      query: {
        type: 'string',
        description: '优先从网络图选词，没有合适的就用任务关键词探索。记住：网络没词时主动探索，最多试3次'
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