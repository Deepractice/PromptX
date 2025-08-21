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

⚠️ 还记得吗？每个mindmap词都是潜在宝藏！
现在不recall，后面可能会后悔...

认知三步，一步都不能少：
1️⃣ **立即recall** → 激活相关记忆（别错过宝藏）
2️⃣ **应用经验** → 基于记忆工作（用上找到的）
3️⃣ **remember新知** → 保存新发现（积累更多宝藏）

💡 3秒recall，避免30分钟弯路！
现在就试：recall("角色", "mindmap任意词")`
  }

  /**
   * 获取Recall后的引导提示
   * 提醒AI在对话结束时记得Remember
   */
  static getRecallGuide() {
    return `
---
✨ 好样的！你找到了记忆宝藏！
刚才的recall只花了3秒，但可能节省了大量探索时间。

现在用这些记忆来处理任务吧。

💡 别忘了：对话中的新发现也是宝藏！
结束前remember它们，让宝库更丰富。
不remember = 白白丢掉新发现（太可惜了）`
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