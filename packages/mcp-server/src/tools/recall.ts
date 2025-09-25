import type { ToolWithHandler } from '~/interfaces/MCPServer.js';
import { MCPOutputAdapter } from '~/utils/MCPOutputAdapter.js';

const outputAdapter = new MCPOutputAdapter();

export const recallTool: ToolWithHandler = {
  name: 'recall',
  description: `【认知习惯】基于记忆网络的语义场激活

⚡ 触发时机（形成条件反射）：
看到用户问题 → 扫描记忆网络图 → 选词激活 → 语义场扩散
这是真正的认知过程：从已有网络开始激活

🧠 网络激活策略（记忆网络的工作原理）：

第1步 - 网络图扫描：
• 必须先看记忆网络图中的所有词
• 这些词是你的"突触连接"
• 没有连接就没有激活通路

第2步 - 智能选词（优先级递减）：
• 精确匹配：问题直接包含网络图中的词
• 部分匹配：网络图的词是问题的一部分
• 语义相近：选最接近的概念（如"编程"→选"TypeScript"）
• 上位概念：选更抽象的词（如具体bug→选"记忆系统"）

第3步 - 语义场激活：
• 从选定的词开始激活
• 让激活自然扩散到相关记忆
• 多个入口点可并行激活

核心原则：
✅ 必须从网络图已有的词开始（有突触才能传导）
✅ 即使不完全匹配也要选最接近的词
✅ 从已知探索未知（自然的认知扩散）
❌ 绝不凭空猜测网络图之外的词
❌ 网络为空时才使用查询词本身

为什么这样做：
• 避免冷启动死循环（没词→无法激活→无法获词）
• 模拟真实记忆系统（必须从已有节点激活）
• 保证激活的连贯性（像涟漪从中心扩散）

记住：记忆网络是你的认知地图，必须从地图上的点开始探索！`,
  inputSchema: {
    type: 'object',
    properties: {
      role: {
        type: 'string',
        description: '要检索记忆的角色ID，如：java-developer, product-manager, copywriter'
      },
      query: {
        type: 'string',
        description: '必须从记忆网络图中选择最相关的词。选词优先级：精确匹配>部分匹配>语义相近>上位概念。只有网络为空时才用查询词本身'
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