const BaseArea = require('../BaseArea')

/**
 * RememberArea - 记忆保存区域
 * 负责渲染记忆保存的结果信息
 */
class RememberArea extends BaseArea {
  constructor(savedEngrams, role) {
    super('REMEMBER_AREA')
    this.savedEngrams = savedEngrams || []
    this.role = role
  }

  async render() {
    let content = `✅ **记忆保存成功！**\n\n`
    
    content += `📝 **已保存到角色 \`${this.role}\` 的记忆体系**\n`
    content += `📊 **保存数量**：${this.savedEngrams.length} 条记忆\n\n`
    
    if (this.savedEngrams.length > 0) {
      content += '### 📋 保存详情\n'
      
      const groupedByType = this.groupByType(this.savedEngrams)
      
      if (groupedByType.ATOMIC.length > 0) {
        content += `- 📝 核心概念：${groupedByType.ATOMIC.length} 条\n`
      }
      if (groupedByType.LINK.length > 0) {
        content += `- 🔗 关联记忆：${groupedByType.LINK.length} 条\n`
      }
      if (groupedByType.PATTERN.length > 0) {
        content += `- 🎯 模式记忆：${groupedByType.PATTERN.length} 条\n`
      }
      
      content += '\n### 🎯 保存的记忆内容\n'
      
      this.savedEngrams.forEach((engram, index) => {
        const typeEmoji = {
          ATOMIC: '📝',
          LINK: '🔗',
          PATTERN: '🎯'
        }[engram.type] || '💡'
        
        content += `${index + 1}. ${typeEmoji} ${engram.content}\n`
        content += `   └─ 强度: ${(engram.strength || 0.5).toFixed(2)}\n`
        if (engram.schema) {
          const firstLine = engram.schema.split('\n')[0]
          content += `   └─ 结构: ${firstLine}\n`
        }
      })
    }
    
    content += '\n💡 **后续建议**：\n'
    content += '1. 🔍 使用 recall 工具验证记忆是否正确保存\n'
    content += '2. 📊 定期整理和优化记忆体系\n'
    content += '3. 🎯 在实践中不断强化重要记忆'
    
    return content
  }

  groupByType(engrams) {
    const grouped = {
      ATOMIC: [],
      LINK: [],
      PATTERN: []
    }
    
    engrams.forEach(e => {
      const type = e.type || 'ATOMIC'
      if (grouped[type]) {
        grouped[type].push(e)
      }
    })
    
    return grouped
  }
}

module.exports = RememberArea