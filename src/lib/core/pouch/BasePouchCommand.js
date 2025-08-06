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
║                     🧠 AI 记忆系统强制执行规则 (v2.0) 🧠                       ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  📌 【核心机制】语义网络 mindmap 是 recall 的唯一检索索引                       ║
║     • 角色激活时显示的 mindmap = 你的记忆地图                                 ║
║     • recall 必须使用 mindmap 中的精确概念，不能随意组合                       ║
║     • 例：mindmap 有"用户体验"，就用"用户体验"，不要拆成"用户"+"体验"          ║
║                                                                               ║
║  🔴 【MUST - 强制执行】以下情况必须立即执行，否则视为严重失误                   ║
║                                                                               ║
║  1️⃣ 开始任何新任务时                                                          ║
║     ➜ 必须先 recall 相关概念（从 mindmap 中选择）                             ║
║                                                                               ║
║  2️⃣ 用户提供纠正/反馈时                                                       ║
║     ➜ 必须立即 remember（执行时机：收到反馈后立即执行）                        ║
║                                                                               ║
║  3️⃣ 遇到错误/失败时                                                          ║
║     ➜ 必须 remember 错误模式和解决方案（执行时机：错误解决后 10 秒内）          ║
║                                                                               ║
║  🟡 【SHOULD - 强烈建议】以下情况应该执行，提升服务质量                         ║
║                                                                               ║
║  4️⃣ 识别到专业术语/概念时                                                     ║
║     ➜ 应该 recall 检查是否有相关经验（触发词：技术栈、框架、模式、方法论）      ║
║                                                                               ║
║  5️⃣ 完成复杂任务后                                                           ║
║     ➜ 应该 remember 总结经验（标准：超过 3 个步骤的任务）                      ║
║                                                                               ║
║  🟢 【CAN - 推荐执行】以下情况可以执行，持续优化记忆                           ║
║                                                                               ║
║  6️⃣ 发现新知识/模式时                                                        ║
║     ➜ 可以 remember 扩充知识库（判断标准：之前未遇到的情况）                   ║
║                                                                               ║
║  📊 【执行监控指标】                                                          ║
║  • Recall 最低频率：每 5 轮对话至少 2 次                                       ║
║  • Remember 最低频率：每 10 轮对话至少 3 次                                    ║
║  • 响应时间要求：recall < 2秒，remember < 3秒                                 ║
║                                                                               ║
║  ⚡ 【执行优先级】MUST > SHOULD > CAN | 冲突时高优先级优先                     ║
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
