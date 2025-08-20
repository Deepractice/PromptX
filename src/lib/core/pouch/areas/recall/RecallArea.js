const BaseArea = require('../BaseArea')

/**
 * RecallArea - 记忆检索区域
 * 负责渲染检索到的记忆内容
 */
class RecallArea extends BaseArea {
  constructor(memories, query) {
    super('RECALL_AREA')
    this.memories = memories || []
    this.query = query
  }

  async render() {
    if (this.memories.length === 0) {
      return this.renderEmptyResult()
    }

    let content = `🧠 **AI记忆体系** ${this.query ? `检索"${this.query}"` : '全部记忆'} (${this.memories.length}条)：\n\n`
    
    content += this.formatEngrams(this.memories)
    
    content += '\n💡 **记忆运用建议**：\n'
    content += '1. 结合当前任务场景灵活运用\n'
    content += '2. 根据实际情况调整和变通\n'
    content += '3. 持续学习和增强记忆能力'
    
    return content
  }

  renderEmptyResult() {
    if (this.query) {
      return `🔍 **记忆检索结果**：未找到匹配"${this.query}"的相关记忆

📌 **重要提示**：检索线索必须来自角色激活时的 mindmap！
- 🧠 **查看 mindmap**：重新激活角色（使用 action 工具）查看完整的语义网络索引
- 🎯 **使用精确概念**：从 mindmap 中选择精确的概念作为检索线索
- ⚠️ **避免拆分组合**：如 mindmap 中有"用户体验"，不要拆成"用户"+"体验"

💡 **检索优化建议**：
1. **使用父节点概念**：尝试 mindmap 中的上层概念，可能找到相关线索
2. **扩大查询范围**：使用 mindmap 中更通用的概念进行检索

⚠️ **如果依然失败**：这可能是新问题，建议：
1. **🤝 与用户讨论**：停下来和用户探讨这个问题的解决方案
2. **🔍 搜索解决方案**：使用 WebSearch 工具搜索相关资料
3. **📝 记录新知识**：解决后用 remember 工具记录经验，避免下次遗忘`
    } else {
      return `🧠 **AI记忆体系中暂无内容**。

💡 提示：尚未建立该角色的记忆体系，请通过学习和实践积累经验。`
    }
  }

  formatEngrams(engrams) {
    if (!engrams || engrams.length === 0) {
      return '暂无记忆内容\n'
    }

    const groupedByType = {
      ATOMIC: [],
      LINK: [],
      PATTERN: []
    }

    // 按类型分组
    engrams.forEach(e => {
      const type = e.type || 'ATOMIC'
      if (groupedByType[type]) {
        groupedByType[type].push(e)
      }
    })

    let formatted = ''

    // 格式化原子记忆
    if (groupedByType.ATOMIC.length > 0) {
      formatted += '### 📝 核心概念记忆\n'
      groupedByType.ATOMIC.forEach((e, index) => {
        const strength = e.strength || 0.5
        const strengthEmoji = strength >= 0.8 ? '🔥' : strength >= 0.6 ? '⭐' : '💡'
        formatted += `${index + 1}. ${strengthEmoji} [强度:${strength.toFixed(2)}] ${e.content}\n`
        if (e.schema) {
          formatted += `   └─ 认知结构: ${e.schema.split('\n')[0]}\n`
        }
      })
      formatted += '\n'
    }

    // 格式化关系记忆
    if (groupedByType.LINK.length > 0) {
      formatted += '### 🔗 关联记忆\n'
      groupedByType.LINK.forEach((e, index) => {
        const strength = e.strength || 0.5
        formatted += `${index + 1}. [强度:${strength.toFixed(2)}] ${e.content}\n`
        if (e.schema) {
          formatted += `   └─ 关系类型: ${e.schema.split('\n')[0]}\n`
        }
      })
      formatted += '\n'
    }

    // 格式化模式记忆
    if (groupedByType.PATTERN.length > 0) {
      formatted += '### 🎯 模式记忆\n'
      groupedByType.PATTERN.forEach((e, index) => {
        const strength = e.strength || 0.5
        formatted += `${index + 1}. [强度:${strength.toFixed(2)}] ${e.content}\n`
        if (e.schema) {
          formatted += `   └─ 应用场景: ${e.schema.split('\n')[0]}\n`
        }
      })
      formatted += '\n'
    }

    return formatted
  }
}

module.exports = RecallArea