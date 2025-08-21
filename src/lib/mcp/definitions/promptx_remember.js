module.exports = {
  name: 'promptx_remember',
  description: `💾 记忆保存 - 别让宝贵经验溜走！

⚠️ 记忆哲学：不是"该不该记"，而是"都记+角色评分"
同一个信息，不同角色有不同价值判断！

💡 角色化记忆原则：
• 站在你的角色立场评分（我需要这个吗？）
• 核心职责相关的给高分
• 边缘信息也要记（给低分就行）
• 系统会根据角色+评分智能排序

🎯 超简单3步（别想太多）：
1️⃣ 看内容感觉选类型：
   • 单个事情 → ATOMIC
   • 几个东西的关系 → LINK  
   • 一连串步骤 → PATTERN

2️⃣ 把内容变成关键词（schema）：
   • 直接从原文提取，别发明新词
   • 每个词都要独立（"通过连接池"要拆成"通过"和"连接池"）
   • LINK类型要保留关系词作为独立的词
   • 一般不用缩进，除非真有层级（PATTERN可能会用到）
   • 越简单越好，别过度整理

3️⃣ 重要度看角色（从你的角色视角评分）：
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
    strength: 0.8,
    type: "ATOMIC"
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
"今天下雨了" → 单个事情，用ATOMIC
{
  content: "今天下雨了",
  schema: "今天\\n  下雨",
  strength: 0.5,
  type: "ATOMIC"
}

"数据库通过连接池来管理" → 几个东西的关系，用LINK
{
  content: "数据库通过连接池来管理",
  schema: "数据库\\n  通过\\n  连接池\\n  管理",
  strength: 0.7,
  type: "LINK"
}

"先登录，再选商品，最后付款" → 一连串步骤，用PATTERN
{
  content: "购物流程",
  schema: "登录\\n  选商品\\n  付款",
  strength: 0.8,
  type: "PATTERN"
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
        description: 'Engram对象数组，支持批量记忆保存。每个对象包含content, schema, strength, type四个字段',
        items: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: '要保存的重要信息或经验'
            },
            schema: {
              type: 'string', 
              description: '把内容提取成关键词，用换行和缩进表示关系。直接从原文提取，不要发明新词'
            },
            strength: {
              type: 'number',
              description: '记忆强度(0-1)，表示这个知识的重要程度，影响后续检索优先级',
              minimum: 0,
              maximum: 1,
              default: 0.8
            },
            type: {
              type: 'string',
              description: '根据内容感觉选：ATOMIC(单个事情)，LINK(几个东西的关系)，PATTERN(一连串步骤)',
              enum: ['ATOMIC', 'LINK', 'PATTERN'],
              default: 'ATOMIC'
            }
          },
          required: ['content', 'schema', 'strength', 'type']
        },
        minItems: 1
      }
    },
    required: ['role', 'engrams']
  }
};