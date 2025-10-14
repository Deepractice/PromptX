import type { ToolWithHandler } from '~/interfaces/MCPServer.js';
import { MCPOutputAdapter } from '~/utils/MCPOutputAdapter.js';

const outputAdapter = new MCPOutputAdapter();

export const rememberTool: ToolWithHandler = {
  name: 'remember',
  description: `【认知习惯】对话结束就总结 - 自动积累知识财富

【规范名称】promptx_remember
【调用说明】在提示词中使用 promptx_remember，实际调用时自动映射到 mcp__[server]__remember

⚡ 触发时机（形成条件反射）：
• 回答完用户问题 → 立即remember关键点
• 多轮recall深挖完 → remember总结收获
• 学到新知识 → remember保存
• 解决了问题 → remember记录方案
• recall空白领域 → 必须remember填补

💡 关键：每次recall探索后都要remember，这样下次就有记忆了

🎯 快速remember模板（10秒完成）：
{
  role: "当前角色",
  engrams: [{
    content: "刚刚讨论解决的核心内容",
    schema: "关键词1 关键词2 关键词3",
    strength: 0.7,  // 默认0.7即可
    type: "ATOMIC"  // ATOMIC(具体信息)|LINK(关系)|PATTERN(模式)
  }]
}

⚔️ 生成指导：你必须遵循奥卡姆剃刀原则 - "如无必要，勿增实体"
生成记忆时，删除所有非必要的词汇，只保留传达核心意思的最少元素。
每个词都要问自己：删掉它意思会变吗？不变就删。

记忆积累策略：
• 每次对话 = 至少1条remember
• 重质不重量，抓住关键点
• recall空的领域必须remember
• 今天的remember = 明天的快速答案

为什么养成remember习惯：
✅ 避免重复研究同样问题
✅ 记忆网络越用越丰富
✅ 下次recall直接有答案
❌ 不remember = 永远从零开始

🔄 **认知循环**：remember是循环的终点
• DMN看全景 → 多轮recall深挖 → 获得答案 → remember保存
• 下次recall就能直接找到这次保存的记忆
• recall空白领域必须remember填补

记住：每个remember都是对未来自己的投资！

---

## 🌟 轻松指南（真的别纠结）

### 什么时候要存？
看到这些就存：
- 😲 "原来如此！" → 存
- 🐛 "踩坑了..." → 存
- "这个方法不错" → 存
- 🔧 "解决了！" → 存

### 存储技巧
- **别追求完美**：大概对就行
- **别想太久**：第一感觉最准
- **可以很简单**：一句话也能存
- **后悔了再改**：记忆可以更新

### 真实例子（看看多随意）
"今天下雨了" → 简单事实
{
  content: "今天下雨了",
  schema: "今天 下雨",
  strength: 0.5,
  type: "ATOMIC"  // 具体事实
}

"数据库通过连接池来管理" → 概念关系
{
  content: "数据库通过连接池来管理",
  schema: "数据库 连接池 管理",
  strength: 0.7,
  type: "LINK"  // 关系连接
}

"先登录，再选商品，最后付款" → 流程步骤
{
  content: "购物流程",
  schema: "登录 选商品 付款",
  strength: 0.8,
  type: "PATTERN"  // 流程模式
}

记住：存了总比没存强！
未来的你会感谢现在存记忆的你～`,
  inputSchema: {
    type: 'object',
    properties: {
      role: {
        type: 'string',
        description: '要保存记忆的角色ID，如：java-developer, product-manager, copywriter'
      },
      engrams: {
        type: 'array',
        description: 'Engram（记忆痕迹）对象数组，支持批量记忆保存。每个对象包含content, schema, strength, type四个字段',
        items: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: '要保存的原始经验内容（感性直观）'
            },
            schema: {
              type: 'string',
              description: '概念序列，用空格分隔。直接从原文提取关键词，不要发明新词（知性概念化）'
            },
            strength: {
              type: 'number',
              description: '记忆强度(0-1)，从角色视角评估的重要程度，影响权重计算和检索优先级',
              minimum: 0,
              maximum: 1,
              default: 0.8
            },
            type: {
              type: 'string',
              description: 'Engram类型：ATOMIC(原子概念:名词、实体、具体信息)、LINK(关系连接:动词、介词、关系词)、PATTERN(模式结构:流程、方法论、框架)',
              enum: ['ATOMIC', 'LINK', 'PATTERN']
            }
          },
          required: ['content', 'schema', 'strength', 'type']
        },
        minItems: 1
      }
    },
    required: ['role', 'engrams']
  },
  handler: async (args: { role: string; engrams: string[] }) => {
    const core = await import('@promptx/core');
    const coreExports = core.default || core;
    const cli = (coreExports as any).cli || (coreExports as any).pouch?.cli;
    
    if (!cli || !cli.execute) {
      throw new Error('CLI not available in @promptx/core');
    }
    
    const result = await cli.execute('remember', [args]);
    return outputAdapter.convertToMCPFormat(result);
  }
};