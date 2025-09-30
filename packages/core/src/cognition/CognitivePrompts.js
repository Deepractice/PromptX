/**
 * CognitivePrompts - 认知系统提示词管理
 *
 * 统一管理认知循环相关的提示词，确保全局一致性
 * 遵循DRY原则，避免提示词重复定义
 *
 * 设计原则：
 * - 单一数据源：所有认知循环提示词集中管理
 * - 上下文感知：提供不同场景的专用提示
 * - 概念一致：确保全局用词和表达统一
 */
class CognitivePrompts {
  /**
   * 认知循环核心概念
   *
   * 用于：文档、教程等需要完整解释的场景
   */
  static getCognitiveCycle() {
    return `🔄 **认知循环**（核心工作流）：
看到任务 → recall(尝试回忆) → 回答 → remember(保存) → 循环完成

**关键点**：
• recall找到记忆 → 使用记忆回答 → remember强化/扩展
• recall没找到 → 说明是新知识 → remember必须保存`
  }

  /**
   * Recall工具的循环提示
   *
   * 用于：recall.ts工具描述
   */
  static getRecallCycleHint() {
    return `🔄 **认知循环**：recall是循环的起点
• 找到记忆 → 用记忆回答 → remember强化
• 没找到 → 用预训练知识回答 → remember保存新知`
  }

  /**
   * Remember工具的循环提示
   *
   * 用于：remember.ts工具描述
   */
  static getRememberCycleHint() {
    return `🔄 **认知循环**：remember是循环的终点
• 每次recall后都应该remember
• recall空的领域必须remember填补`
  }

  /**
   * Area层：recall找到记忆后的提示
   *
   * 用于：CognitionArea.renderRecallGuide()
   */
  static getRecallFoundHint() {
    return `🔄 **认知循环提醒**：
• 基于上述记忆回答用户问题
• 回答完成后 → 使用remember保存本次对话的新发现
• 每次对话都是强化/扩展记忆网络的机会`
  }

  /**
   * Area层：recall没找到记忆的提示
   *
   * 用于：CognitionArea.renderEmptyMind() case 'recall'
   *
   * @param {string} roleId - 当前角色ID，用于DMN模式提示
   */
  static getRecallEmptyHint(roleId) {
    return `⚠️ **认知循环驱动**：
→ 这说明当前任务涉及的知识是新的
→ 回答用户后**必须使用remember保存**，填补记忆网络空白
→ 这是认知循环的关键环节：recall空 = 新知识 = 必须remember

🎯 **可选操作**（如果怀疑有相关记忆）：
• 尝试用其他相关词recall
• 或使用DMN模式重新探索：recall(${roleId})`
  }

  /**
   * Area层：remember成功后的提示
   *
   * 用于：CognitionArea.renderRememberGuide()
   */
  static getRememberSuccessHint() {
    return `🎯 **认知循环完成**：
recall(搜索) → 回答 → remember(保存) ✓

继续保持这个习惯，让记忆网络越来越丰富！`
  }

  /**
   * Prime模式的认知循环提示
   *
   * 用于：CognitionArea.renderPrimeGuide()
   */
  static getPrimeGuideHint() {
    return `🧠 **认知习惯提醒**：
• 看到任务 → 先recall搜索经验
• 网络有词就选词，没词就用任务关键词探索
• 最多探索3次，确认无记忆就用预训练知识
• 回答完成 → remember保存要点

下一步：接收任务时先recall相关经验`
  }
}

module.exports = CognitivePrompts