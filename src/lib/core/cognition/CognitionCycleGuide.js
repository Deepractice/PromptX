/**
 * 认知循环引导管理器
 * 使用呼吸隐喻来引导AI自然地进行记忆循环
 * 强调每轮对话的记忆管理，而非任务级别
 */
class CognitionCycleGuide {
  /**
   * 获取角色激活后的引导提示
   * 在对话开始时提醒AI进行记忆循环
   */
  static getActionGuide() {
    return `
---
🧠 认知循环引导：
你已激活专业角色，获得了强大的能力。
记住认知三步循环，让记忆像呼吸一样自然：

1️⃣ **对话开始** → Recall 相关经验（吸气）
2️⃣ **对话进行** → 应用已有知识（呼吸）
3️⃣ **对话结束** → Remember 新学习（呼气）

💡 重要：每轮对话都是一个完整的呼吸循环。
现在就 recall 相关概念，激活你的记忆网络。`
  }

  /**
   * 获取Recall后的引导提示
   * 提醒AI在对话结束时记得Remember
   */
  static getRecallGuide() {
    return `
---
✨ 认知循环进行中...
你已完成 Recall（吸气），激活了相关记忆。
现在可以基于这些经验进行对话了。

💡 温馨提醒：对话结束前，记得 Remember 新学到的知识。
就像呼吸需要呼气，每轮对话都需要 Remember 来完成循环。`
  }

  /**
   * 获取Remember后的庆祝提示
   * 庆祝完成一个完整的认知循环
   */
  static getRememberGuide() {
    return `
---
🎉 认知循环完成！
你已完成 Remember（呼气），新知识已被内化。

这轮对话的循环让你：
✅ 激活了相关经验
✅ 积累了新的认知
✅ 为下轮对话做好准备

💡 下轮对话：记得开始时先 Recall，保持循环的连续性。`
  }

  /**
   * 获取对话开始的强制提醒
   * 用于系统级提示，确保每轮对话都执行
   */
  static getConversationStartReminder() {
    return `【对话开始】立即 Recall 激活记忆网络，这是每轮对话的第一步。`
  }

  /**
   * 获取对话结束的强制提醒
   * 用于系统级提示，确保每轮对话都执行
   */
  static getConversationEndReminder() {
    return `【对话即将结束】记得 Remember 本轮对话的新学习，完成呼吸循环。`
  }

  /**
   * 判断是否需要显示引导
   * @param {string} context - 当前上下文
   * @returns {boolean}
   */
  static shouldShowGuide(context) {
    // 可以根据上下文判断是否需要显示引导
    // 比如检查是否是新对话、是否已经recall过等
    return true
  }

  /**
   * 格式化引导信息
   * @param {string} guide - 引导文本
   * @param {Object} options - 格式化选项
   * @returns {string}
   */
  static formatGuide(guide, options = {}) {
    const { minimal = false, emphasize = false } = options
    
    if (minimal) {
      // 最简模式，只保留核心信息
      return guide.replace(/\n---\n/, '').replace(/✅ /g, '• ')
    }
    
    if (emphasize) {
      // 强调模式，添加更多视觉元素
      return `${'═'.repeat(60)}\n${guide}\n${'═'.repeat(60)}`
    }
    
    return guide
  }
}

module.exports = CognitionCycleGuide