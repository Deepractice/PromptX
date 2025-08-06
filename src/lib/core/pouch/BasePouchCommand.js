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

    // 人类可读格式
    return {
      ...output,
      toString () {
        const divider = '='.repeat(60)
        const nextSteps = (pateoas.nextActions || [])
          .map(action => `  - ${action.name}: ${action.description}\n    方式: ${action.method || action.command || '通过MCP工具'}`)
          .join('\n')

        // 全局最高优先级规则 - ASCII Banner 风格
        const globalRules = `
╔═══════════════════════════════════════════════════════════════════════════════╗
║                          ⚡ 全 局 最 高 优 先 级 规 则 ⚡                         ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  📝 【强制记忆要求】每轮对话结束前必须评估并记忆重要信息                        ║
║                                                                               ║
║  ▶ 发现任何新知识、错误模式、解决方案 ➜ 立即使用 remember 工具                 ║
║  ▶ 用户纠正或提供新信息 ➜ 必须记忆避免遗忘                                    ║
║  ▶ 完成重要任务 ➜ 总结经验并记忆                                              ║
║  ▶ 最低要求：每轮对话至少识别并记忆 3 个知识点                                 ║
║                                                                               ║
║  🔍 【强制回忆要求】接收外部输入时必须主动检索相关记忆                          ║
║                                                                               ║
║  ▶ 用户提到任何概念或关键词 ➜ 立即使用 recall 工具检索相关记忆                 ║
║  ▶ 开始新任务前 ➜ 先回忆相关经验和最佳实践                                    ║
║  ▶ 遇到似曾相识的问题 ➜ 必须检索历史解决方案                                  ║
║  ▶ 语义网络中存在关联概念 ➜ 主动激活并应用相关记忆                            ║
║                                                                               ║
║  💡 记忆双向原则：输入触发回忆，输出强化记忆，形成认知闭环！                    ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝`

        return `${globalRules}

${divider}
🎯 锦囊目的：${purpose}
${divider}

📜 锦囊内容：
${content}

🔄 下一步行动：
${nextSteps}

📍 当前状态：${pateoas.currentState}
${divider}`
      }
    }
  }
}

module.exports = BasePouchCommand
