module.exports = {
  name: 'recall',
  description: `🔍 记忆探索 - 每个mindmap词都是潜在宝藏！

⚠️ 不试 = 100%错过 | 试了 = 可能大赚
低成本(3秒) → 高收益(关键信息)

💭 你的mindmap就在上方，每个词都值得探索：
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
  }
};