---
"@promptx/core": minor
"@promptx/mcp-server": patch
---

创建CognitivePrompts模块统一管理认知循环提示词

**核心改进**：
- 创建`CognitivePrompts.js`作为单一数据源管理所有认知循环相关提示词
- recall.ts/remember.ts工具层添加认知循环概念说明
- CognitionArea.js在不同场景下强化认知循环驱动

**认知循环闭环**：
- recall找到记忆 → 提示"回答后remember强化/扩展"
- recall没找到 → 强调"必须remember填补空白"
- remember成功 → 显示"认知循环完成"

**架构优势**：
- 遵循DRY原则，避免提示词重复定义
- 确保全局用词和表达一致性
- 易于维护和扩展

Closes #413