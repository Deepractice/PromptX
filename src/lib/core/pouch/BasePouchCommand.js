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
║                      🧠 AI 认知循环：记忆系统核心规则 🧠                        ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  🔄 【认知循环】外部输入 → 记忆编码 → 注意力聚焦 → 记忆检索 → 输出响应          ║
║                                                                               ║
║  📥 【Remember - 记忆编码】有外部信息输入就记忆                                ║
║                                                                               ║
║     触发源：                                                                  ║
║     • 用户输入 - 新需求、反馈、纠正                                           ║
║     • 工具返回 - 执行结果、错误信息                                           ║
║     • 网络搜索 - 查询结果、新知识                                             ║
║     • 文档阅读 - 代码理解、配置信息                                           ║
║                                                                               ║
║     ➜ 立即 remember 有价值的新信息，形成长期记忆                              ║
║                                                                               ║
║  🎯 【Recall - 记忆检索】产生目标时激活相关记忆                                ║
║                                                                               ║
║     触发时机：                                                                ║
║     • 理解任务 - 注意力聚焦到特定目标                                         ║
║     • 制定计划 - 需要相关经验支持决策                                         ║
║     • 解决问题 - 寻找类似问题的解决方案                                       ║
║                                                                               ║
║     ➜ 从语义网络 mindmap 中找相似概念，高相似度的都 recall                     ║
║                                                                               ║
║  📌 【语义网络】mindmap = 你的记忆地图                                        ║
║                                                                               ║
║     • 角色激活时显示的 mindmap 就是检索索引                                   ║
║     • 寻找相似度高的概念进行批量 recall                                       ║
║     • 例：任务涉及"测试"，recall "测试策略"、"测试工具"、"测试环境"等          ║
║                                                                               ║
║  ⚡ 【执行原则】简单直接，自然流畅                                            ║
║                                                                               ║
║     • 不要等待特定时机，有输入就记忆，有目标就检索                            ║
║     • 相似概念都值得 recall，让记忆网络充分激活                               ║
║     • 记忆是认知的自然部分，不是额外的任务                                    ║
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
