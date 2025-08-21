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
1️⃣ 类型随便选：
   • 是个东西 → ATOMIC
   • 是个关系 → LINK  
   • 是个过程 → PATTERN

2️⃣ 层级大概写：
   大类别
     小类别（缩进就行）

3️⃣ 重要度看角色（从你的角色视角评分）：
   • 核心职责相关 → 0.9（这是我的专业领域）
   • 工作中会用到 → 0.7（可能需要这个）
   • 扩展知识储备 → 0.5（了解一下也好）
   
   💡 评分原则：站在当前角色立场！
   例：用户习惯 → 秘书给0.9，程序员给0.5
   例：代码技巧 → 程序员给0.9，秘书给0.5

📝 偷懒模板（复制就用）：
{
  role: "当前角色",
  engrams: [{
    content: "刚学到的",
    schema: "分类\\n  子分类", 
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
"刚发现bug修复方法" → 
{
  content: "用X方法修复Y问题",
  schema: "bug修复\\n  具体方案",
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
              description: '知识关系图，用缩进文本格式表达这个知识在整个知识体系中的位置'
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
              description: 'Engram类型，基于词性选择：ATOMIC（实体词性：名词、形容词、专有名词），LINK（关系词性：动词、介词、关系词），PATTERN（复合结构：短语、流程、模式）。ATOMIC和LINK的Cue必须是原子的单一词性',
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