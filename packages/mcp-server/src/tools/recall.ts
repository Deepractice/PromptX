import type { ToolWithHandler } from '~/interfaces/MCPServer.js';
import { MCPOutputAdapter } from '~/utils/MCPOutputAdapter.js';

const outputAdapter = new MCPOutputAdapter();

export const recallTool: ToolWithHandler = {
  name: 'recall',
  description: `【认知习惯】基于记忆网络的语义场激活

【规范名称】promptx_recall
【调用说明】在提示词中使用 promptx_recall，实际调用时自动映射到 mcp__[server]__recall

⚡ 三种使用模式：

**1. DMN模式（Default Mode Network）- 首次探索推荐**
- 用法：不传query参数 recall(role)
- 效果：自动选择5个枢纽节点(连接度最高)，多中心激活
- 场景：首次探索记忆网络、不知道有哪些关键词、死胡同重置
- 原理：模拟人脑默认网络的自发激活，展示核心记忆结构

**2. 单词recall - 精确检索**
- 用法：传入单个关键词 recall(role, "PromptX")
- 效果：从该词开始激活扩散，查找相关记忆
- 场景：已知关键词，想深入探索相关内容

**3. 多词recall - 交叉探索**
- 用法：空格分隔多个词 recall(role, "PromptX 测试 修复")
- 效果：创建虚拟"mind"根节点，多词同时激活，能量均分
- 场景：探索多个概念的交集、跨域联想

🧠 强制性选词规则（单词/多词模式适用）：

**铁律：只能使用记忆网络图中实际存在的词**

选词流程：
1️⃣ 先用action或DMN模式查看网络图，了解有哪些关键词
2️⃣ 从网络图中选择存在的词（精确匹配或子串匹配）
3️⃣ 如果找不到匹配词，明确告知用户失败，建议从网络图中选择

选词规则：
• ✅ 精确匹配：网络图中有该词 → 直接使用
• ✅ 子串匹配：网络图中的词包含查询词 → 使用网络图的词
• ❌ 语义相近：**禁止**推测相近词
• ❌ 概念抽象：**禁止**自行抽象或转换

🎯 认知激活模式（可选参数mode）：

- **creative**: 创造性探索 - 低阈值(0.05)、广泛联想、远距离连接
- **balanced**: 平衡模式 - 中阈值(0.1)、系统默认
- **focused**: 聚焦检索 - 高阈值(0.2)、精确查找、常用记忆优先

💡 为什么这样设计：

• 记忆检索必须基于**编码时建立的线索**
• 人脑也无法用"从未建立关联的线索"回忆
• 这是认知系统的核心约束，不是bug而是feature
• 强制理解"记忆是网络，不是全文搜索"

📝 实际工作流程示例：

**首次探索**：
  1. recall(sean)  // DMN模式，自动激活5个枢纽节点
  2. 查看返回的关键词网络
  3. 选择感兴趣的词继续探索

**精确检索**：
  recall(sean, "PromptX")  // 单词模式，深入探索PromptX相关记忆

**交叉探索**：
  recall(sean, "DMN 测试 修复")  // 多词模式，探索三个概念的交集

**创造性探索**：
  recall(sean, "激活扩散", { mode: "creative" })  // 广泛联想，发现远距离连接

记住：记忆网络是认知地图，从已有的点开始探索！`,
  inputSchema: {
    type: 'object',
    properties: {
      role: {
        type: 'string',
        description: '要检索记忆的角色ID，如：java-developer, product-manager, copywriter'
      },
      query: {
        oneOf: [
          { type: 'string' },
          { type: 'null' }
        ],
        description: '检索关键词：单词或空格分隔的多词(string)、或null(DMN模式,自动选择枢纽节点)。多词示例："PromptX 测试 修复"。必须使用记忆网络图中实际存在的词。'
      },
      mode: {
        type: 'string',
        enum: ['creative', 'balanced', 'focused'],
        description: '认知激活模式：creative(创造性探索，广泛联想)、balanced(平衡模式，默认)、focused(聚焦检索，精确查找)'
      }
    },
    required: ['role']
  },
  handler: async (args: { role: string; query?: string | null; mode?: string }) => {
    const core = await import('@promptx/core');
    const coreExports = core.default || core;
    const cli = (coreExports as any).cli || (coreExports as any).pouch?.cli;

    if (!cli || !cli.execute) {
      throw new Error('CLI not available in @promptx/core');
    }

    // 构建 CLI 参数，支持 string | string[] | null
    const cliArgs: any[] = [{
      role: args.role,
      query: args.query ?? null,  // undefined转为null
      mode: args.mode
    }];

    const result = await cli.execute('recall', cliArgs);
    return outputAdapter.convertToMCPFormat(result);
  }
};