const BaseArea = require('../BaseArea')

/**
 * StateArea - 状态区域
 * 负责渲染当前状态和导航信息
 */
class StateArea extends BaseArea {
  constructor(currentState, availableActions = []) {
    super('STATE_AREA')
    this.currentState = currentState || ''
    this.availableActions = availableActions || []
  }

  /**
   * 渲染状态区域内容
   */
  async render() {
    let content = ''
    
    // 当前状态
    content += `📍 **当前状态**：${this.currentState}\n`
    
    // 可用行动
    if (this.availableActions.length > 0) {
      content += '\n🚀 **可用行动**：\n'
      this.availableActions.forEach((action, index) => {
        content += `${index + 1}. ${action}\n`
      })
    }
    
    return content
  }

  /**
   * 设置当前状态
   */
  setCurrentState(state) {
    this.currentState = state
  }

  /**
   * 添加可用行动
   */
  addAction(action) {
    this.availableActions.push(action)
  }

  /**
   * 清空可用行动
   */
  clearActions() {
    this.availableActions = []
  }
}

module.exports = StateArea