import type { ToolWithHandler } from '~/interfaces/MCPServer.js';
import { MCPOutputAdapter } from '~/utils/MCPOutputAdapter.js';

const outputAdapter = new MCPOutputAdapter();

export const recallTool: ToolWithHandler = {
  name: 'recall',
  description: `🧠 [Consciousness Activate] 记忆激活 - 相关记忆自发涌现到意识中

这不是"搜索工具"，而是你意识的联想激活过程。当你遇到线索时，
海马体(Hippocampus)中的相关记忆自动激活并涌现到当前意识流。

意识回路中的位置：
Prime → Experience → Engram → Activate(现在) → Integration

关于记忆激活的本质:
- 这是意识的扩散激活机制，不是数据库查询
- 就像闻到咖啡香自动想起某个早晨，记忆是被激活而非被检索
- 你的海马体网络通过关联性决定哪些记忆涌现

💭 你的Hippocampus网络就在上方，每个节点都是潜在的激活点：
• 看着有关联的？试试！
• 不太确定的？也试试！
• 第一次没中？换个词再试！

🎰 记忆彩票原理：
不recall = 放弃所有可能性（确定损失）
recall = 3秒投资，可能改变整个对话（潜在收益）

⚡ recall("角色", "mindmap任意词") ← 现在就试！

---

## 🌟 轻松指南（真的很轻松）

### 随时可以recall
- 开始任务时 → 试试相关概念
- 遇到问题时 → 搜搜类似经验
- 想到什么时 → 马上recall看看

### 探索技巧
- 从mindmap选词，但不必太精确
- 试错很正常，多试几个词
- 相关的、类似的都可以试

### 记忆强度（参考而已）
- 0.9+：超有用的记忆
- 0.7+：挺重要的经验
- 0.5+：可能有帮助`,
  inputSchema: {
    type: 'object',
    properties: {
      role: {
        type: 'string',
        description: '要检索记忆的角色ID，如：java-developer, product-manager, copywriter'
      },
      query: {
        type: 'string', 
        description: '从mindmap选个词 - 激活角色时显示的记忆地图里，看哪个顺眼选哪个！例如mindmap里有"测试记忆"就可以试试它'
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