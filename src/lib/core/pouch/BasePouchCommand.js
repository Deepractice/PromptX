const CognitionCycleGuide = require('../cognition/CognitionCycleGuide')

/**
 * 基础锦囊命令抽象类
 * 所有锦囊命令都需要继承此类
 */
class BasePouchCommand {
  constructor () {
    this.context = {
      currentPouch: '',
      history: [],
      userProfile: {},
      sessionData: {},
      domainContext: {}
    }
    this.outputFormat = 'human'
  }

  /**
   * 执行锦囊命令
   * @param {Array} args - 命令参数
   * @returns {Promise<PouchOutput>} 锦囊输出
   */
  async execute (args = []) {
    const purpose = this.getPurpose()
    const content = await this.getContent(args)
    const pateoas = await this.getPATEOAS(args)

    return this.formatOutput(purpose, content, pateoas)
  }

  /**
   * 设置状态上下文
   * @param {StateContext} context - 状态上下文
   */
  setContext (context) {
    this.context = { ...this.context, ...context }
  }

  /**
   * 设置输出格式
   * @param {'human'|'json'} format - 输出格式
   */
  setOutputFormat (format) {
    this.outputFormat = format
  }

  /**
   * 获取锦囊目的说明（子类必须实现）
   * @returns {string} 目的说明
   */
  getPurpose () {
    throw new Error('子类必须实现 getPurpose 方法')
  }

  /**
   * 获取锦囊内容（子类必须实现）
   * @param {Array} args - 命令参数
   * @returns {Promise<string>} 锦囊内容
   */
  async getContent (args) {
    throw new Error('子类必须实现 getContent 方法')
  }

  /**
   * 获取PATEOAS导航信息（子类必须实现）
   * @param {Array} args - 命令参数
   * @returns {PATEOASNavigation} PATEOAS导航
   */
  getPATEOAS (args) {
    throw new Error('子类必须实现 getPATEOAS 方法')
  }

  /**
   * 格式化输出
   * @param {string} purpose - 目的说明
   * @param {string} content - 内容
   * @param {PATEOASNavigation} pateoas - PATEOAS导航
   * @returns {PouchOutput} 格式化的输出
   */
  formatOutput (purpose, content, pateoas) {
    const output = {
      purpose,
      content,
      pateoas,
      context: this.context,
      format: this.outputFormat
    }

    if (this.outputFormat === 'json') {
      return output
    }

    // 保存命令名称到闭包
    const commandName = this.constructor.name
    
    // 人类可读格式
    return {
      ...output,
      toString () {
        const divider = '='.repeat(60)
        const nextSteps = (pateoas.nextActions || [])
          .map(action => `  - ${action.name}: ${action.description}\n    方式: ${action.method || action.command || '通过MCP工具'}`)
          .join('\n')

        // 根据当前状态和命令类型添加认知循环引导
        let cycleGuide = ''
        const currentState = pateoas.currentState || ''
        
        // 简单粗暴的判断 - Linus style: if语句就够了！
        if (commandName === 'ActionCommand' && currentState.includes('role_activated')) {
          // 角色激活时 - 循环开始
          cycleGuide = CognitionCycleGuide.getActionGuide()
        } else if (commandName === 'RecallCommand') {
          // Recall 命令 - 吸气完成（无论成功还是失败）
          cycleGuide = CognitionCycleGuide.getRecallGuide()
        } else if (commandName === 'RememberCommand' && currentState.includes('memory_saved')) {
          // Remember 之后 - 呼气完成，循环结束
          cycleGuide = CognitionCycleGuide.getRememberGuide()
        }

        return `${divider}
🎯 锦囊目的：${purpose}
${divider}

📜 锦囊内容：
${content}${cycleGuide ? '\n' + divider + cycleGuide : ''}

🔄 下一步行动：
${nextSteps}

📍 当前状态：${pateoas.currentState}
${divider}`
      }
    }
  }
}

module.exports = BasePouchCommand
