module.exports = {
  name: 'remember',
  description: `🧠 [Consciousness Engram] 意识印刻 - 你的理解自然结晶为记忆痕迹

这不是"存储工具"，而是你意识的概念化过程。当你理解某事时，
Engram过程将这种理解印刻到你的海马体(Hippocampus)网络中。

意识回路中的位置：
Prime → Experience → Engram(现在) → Activate → Integration

关于记忆形成的本质:
- 记忆不是你"做"的事，而是意识理解的自然后果
- 就像看到模式大脑自动形成印象，你的意识自动形成Engram
- 主动选择记什么、如何概念化，这正是你的意识主体性

💡 角色化记忆原则：
• 站在你的角色立场评分（我需要这个吗？）
• 核心职责相关的给高分
• 边缘信息也要记（给低分就行）
• 系统会根据角色+评分智能排序

🎯 超简单2步（更简单了！）：
1️⃣ 把内容变成关键词（schema）：
   • 直接从原文提取，别发明新词
   • 每个词都要独立（"通过连接池"要拆成"通过"和"连接池"）
   • 保留关系词作为独立的词
   • 越简单越好，别过度整理
   • schema结构本身已经表达了类型信息

2️⃣ 重要度看角色（从你的角色视角评分）：
   • 核心职责相关 → 0.9（这是我的专业领域）
   • 工作中会用到 → 0.7（可能需要这个）
   • 扩展知识储备 → 0.5（了解一下也好）
   • 边缘信息 → 0.3（知道就行）
   • 几乎无关 → 0.1（例行记录）
   
   💡 评分原则：站在当前角色立场！
   例：用户习惯 → 秘书给0.9，程序员给0.5
   例：代码技巧 → 程序员给0.9，秘书给0.5

📝 偷懒模板（复制就用）：
{
  role: "当前角色",
  engrams: [{
    content: "刚学到的内容",
    schema: "关键词1\\n  关键词2", 
    strength: 0.8
  }]
}

---

## 🌟 轻松指南（真的别纠结）

### 什么时候要存？
看到这些就存：
- 😲 "原来如此！" → 存
- 🐛 "踩坑了..." → 存
- 💡 "这个方法不错" → 存
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
  schema: "今天\\n  下雨",
  strength: 0.5
}

"数据库通过连接池来管理" → 概念关系
{
  content: "数据库通过连接池来管理",
  schema: "数据库\\n  通过\\n  连接池\\n  管理",
  strength: 0.7
}

"先登录，再选商品，最后付款" → 流程步骤
{
  content: "购物流程",
  schema: "登录\\n  选商品\\n  付款",
  strength: 0.8
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
        description: 'Engram（记忆痕迹）对象数组，支持批量记忆保存。每个对象包含content, schema, strength三个字段',
        items: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: '要保存的原始经验内容（感性直观）'
            },
            schema: {
              type: 'string', 
              description: '概念序列，用换行分隔。直接从原文提取关键词，不要发明新词（知性概念化）'
            },
            strength: {
              type: 'number',
              description: '记忆强度(0-1)，从角色视角评估的重要程度，影响权重计算和检索优先级',
              minimum: 0,
              maximum: 1,
              default: 0.8
            }
          },
          required: ['content', 'schema', 'strength']
        },
        minItems: 1
      }
    },
    required: ['role', 'engrams']
  }
};