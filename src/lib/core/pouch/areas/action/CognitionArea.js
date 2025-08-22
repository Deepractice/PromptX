const BaseArea = require('../BaseArea')
const CognitionCycleGuide = require('../../../cognition-bak/CognitionCycleGuide')

/**
 * CognitionArea - 认知区域
 * 负责渲染 Mind 对象（认知网络）和认知循环引导
 */
class CognitionArea extends BaseArea {
  constructor(mind, roleId, cognitionGuideType = 'action') {
    super('COGNITION_AREA')
    this.mind = mind
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
    
    // 2. 认知循环引导
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
    if (!this.mind || this.mind.activatedCues.size === 0) {
      return ''
    }
    
    let content = '## 🧠 语义网络激活（记忆检索索引）\n'
    
    // 构建mindmap
    content += '```mermaid\n'
    content += this.mind.toMermaid()
    content += '\n```\n'
    
    // 添加使用说明
    content += '📌 **重要说明**：上述 mindmap 是你的记忆检索索引！\n'
    content += '- 🔍 **用途**：使用 recall 工具时，必须从这个 mindmap 中选择精确概念作为检索线索\n'
    content += '- 💡 **示例**：如果 mindmap 中有"用户体验"，recall 时直接使用"用户体验"，不要拆分成"用户"+"体验"\n'
    content += '- ⚡ **技巧**：概念越精确，检索效果越好。优先使用 mindmap 中的叶子节点概念\n'
    
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