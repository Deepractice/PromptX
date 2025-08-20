const BaseArea = require('../BaseArea')
const CognitionCycleGuide = require('../../../cognition/CognitionCycleGuide')

/**
 * CognitionArea - 认知区域
 * 负责渲染认知相关内容：语义网络、行为模式、认知循环引导
 */
class CognitionArea extends BaseArea {
  constructor(memories, roleId, cognitionGuideType = 'action') {
    super('COGNITION_AREA')
    this.memories = memories || {}
    this.roleId = roleId
    this.cognitionGuideType = cognitionGuideType
  }

  /**
   * 渲染认知区域内容
   */
  async render() {
    let content = ''
    
    // 1. 语义网络激活
    const semanticContent = await this.renderSemanticNetwork()
    if (semanticContent) {
      content += semanticContent + '\n'
    }
    
    // 2. 行为模式激活
    const behaviorContent = await this.renderBehaviorPatterns()
    if (behaviorContent) {
      content += behaviorContent + '\n'
    }
    
    // 3. 认知循环引导
    const cycleGuide = this.getCognitionCycleGuide()
    if (cycleGuide) {
      content += '---\n' + cycleGuide + '\n'
    }
    
    return content
  }

  /**
   * 渲染语义网络
   */
  async renderSemanticNetwork() {
    const { semanticNetwork } = this.memories
    
    if (!semanticNetwork || !semanticNetwork.concepts) {
      return ''
    }
    
    let content = '## 🧠 语义网络激活（记忆检索索引）\n'
    
    // 构建mindmap
    content += '```mermaid\nmindmap\n  ((mind))\n'
    
    // 递归渲染概念树
    const renderConcepts = (concepts, indent = '    ') => {
      let result = ''
      for (const [concept, data] of Object.entries(concepts)) {
        if (data && typeof data === 'object') {
          const strength = data.strength || 0.5
          result += `${indent}${concept} [${strength.toFixed(2)}]\n`
          
          // 递归渲染子概念
          if (data.children) {
            result += renderConcepts(data.children, indent + '  ')
          }
        }
      }
      return result
    }
    
    content += renderConcepts(semanticNetwork.concepts)
    content += '```\n'
    
    // 添加使用说明
    content += '📌 **重要说明**：上述 mindmap 是你的记忆检索索引！\n'
    content += '- 🔍 **用途**：使用 recall 工具时，必须从这个 mindmap 中选择精确概念作为检索线索\n'
    content += '- 💡 **示例**：如果 mindmap 中有"用户体验"，recall 时直接使用"用户体验"，不要拆分成"用户"+"体验"\n'
    content += '- ⚡ **技巧**：概念越精确，检索效果越好。优先使用 mindmap 中的叶子节点概念\n'
    
    return content
  }

  /**
   * 渲染行为模式
   */
  async renderBehaviorPatterns() {
    const { proceduralPatterns } = this.memories
    
    if (!proceduralPatterns || proceduralPatterns.length === 0) {
      return ''
    }
    
    let content = '## 🎯 行为模式激活\n'
    content += `📊 **激活模式**: ${proceduralPatterns.length}个\n`
    content += '🔗 **当前行为准则**:\n'
    
    proceduralPatterns.forEach((pattern, index) => {
      const strength = pattern.strength || 0.5
      content += `${index + 1}. ${pattern.pattern} [强度: ${strength.toFixed(2)}]\n`
    })
    
    content += '💡 **行为模式已激活**：这些模式将自动影响AI的决策和执行方式'
    
    return content
  }

  /**
   * 获取认知循环引导
   */
  getCognitionCycleGuide() {
    switch (this.cognitionGuideType) {
      case 'action':
        return CognitionCycleGuide.getActionGuide()
      case 'recall':
        return CognitionCycleGuide.getRecallGuide()
      case 'remember':
        return CognitionCycleGuide.getRememberGuide()
      default:
        return ''
    }
  }
}

module.exports = CognitionArea