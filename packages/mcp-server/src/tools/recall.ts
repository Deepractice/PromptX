import type { ToolWithHandler } from '~/interfaces/MCPServer.js';
import { MCPOutputAdapter } from '~/utils/MCPOutputAdapter.js';

const outputAdapter = new MCPOutputAdapter();

export const recallTool: ToolWithHandler = {
  name: 'recall',
  description: `【认知习惯】基于记忆网络的语义场激活

【规范名称】promptx_recall
【调用说明】在提示词中使用 promptx_recall，实际调用时自动映射到 mcp__[server]__recall

⚡ 触发时机（形成条件反射）：
看到用户问题 → 查看记忆网络图 → 选择已存在的词 → 激活扩散

🧠 强制性选词规则（不可违反）：

**铁律：只能使用记忆网络图中实际存在的词**

第1步 - 先激活角色获取网络图：
• 使用 action 工具查看当前角色的记忆网络图
• 网络图展示所有可用的关键词节点
• 这是你唯一的"词汇表"

第2步 - 从网络图中选词（严格匹配）：
• ✅ 精确匹配：问题包含网络图中的某个词 → 直接使用
• ✅ 词的一部分：网络图中的词是问题词的子串 → 使用网络图中的词
• ❌ 语义相近：**禁止**推测相近词，必须使用网络图实际存在的词
• ❌ 概念抽象：**禁止**自行抽象，只能用网络图已有的词

第3步 - 如果找不到匹配：
• **不要猜测**，不要尝试recall
• 直接告知用户：该关键词不在记忆网络中
• 建议用户查看 action 返回的网络图，从中选择

第4步 - 语义场激活：
• 从选定的词开始激活
• 让激活自然扩散到相关记忆
• 多个入口点可并行激活

核心原则：
✅ 必须使用记忆网络图中实际存在的词
✅ 先用 action 查看网络图，再决定用什么词
✅ 找不到匹配词时，明确告知失败
❌ 绝不猜测、推测、抽象网络图之外的词
❌ 不要"帮用户"把不存在的词转换成存在的词

为什么这样严格：
• 记忆检索必须基于**编码时建立的线索**
• 人脑也无法用"从未建立关联的线索"回忆
• 这是认知系统的核心约束，不是bug而是feature
• 强制用户理解"记忆是网络，不是全文搜索"

实际工作流程示例：
1. 用户问："帮我recall关于数据库的记忆"
2. AI先 action(role) 查看网络图
3. 网络图显示：["PromptX", "测试", "ACT-R", "激活扩散"]
4. 发现没有"数据库"这个词
5. 告知用户："记忆网络中没有'数据库'关键词，当前网络包含：PromptX, 测试, ACT-R, 激活扩散。请从这些词中选择。"

记住：记忆网络是认知地图，只能从地图上**已有的点**开始探索！`,
  inputSchema: {
    type: 'object',
    properties: {
      role: {
        type: 'string',
        description: '要检索记忆的角色ID，如：java-developer, product-manager, copywriter'
      },
      query: {
        type: 'string',
        description: '必须使用记忆网络图中实际存在的词（通过action工具查看）。严格匹配：精确匹配>子串匹配。禁止推测、抽象或转换不存在的词。找不到匹配时明确告知用户失败。'
      },
      mode: {
        type: 'string',
        enum: ['creative', 'balanced', 'focused'],
        description: '认知激活模式：creative(创造性探索，广泛联想)、balanced(平衡模式，默认)、focused(聚焦检索，精确查找)'
      }
    },
    required: ['role', 'query']
  },
  handler: async (args: { role: string; query?: string; mode?: string }) => {
    const core = await import('@promptx/core');
    const coreExports = core.default || core;
    const cli = (coreExports as any).cli || (coreExports as any).pouch?.cli;

    if (!cli || !cli.execute) {
      throw new Error('CLI not available in @promptx/core');
    }

    // 构建 CLI 参数，传递 mode 作为对象
    const cliArgs: any[] = [{
      role: args.role,
      query: args.query,
      mode: args.mode
    }];

    const result = await cli.execute('recall', cliArgs);
    return outputAdapter.convertToMCPFormat(result);
  }
};