// ThoughtEntity - Thought接口的具体实现
// 一个可以从普通对象构造的Thought实体类

const { Thought } = require('../interfaces/Thought');

class ThoughtEntity extends Thought {
  /**
   * 构造函数
   * @param {Object} data - Thought数据对象
   * @param {Object} data.goalEngram - 目标记忆（必需）
   * @param {string} data.thinkingPattern - 思维模式（必需）
   * @param {Array<string>} data.spreadActivationCues - 激活线索（必需）
   * @param {Array<Object>} data.insightEngrams - 洞察记忆（可选）
   * @param {Object} data.conclusionEngram - 结论记忆（可选）
   * @param {number} data.confidence - 置信度（可选）
   * @param {Array<Object>} data.recalledEngrams - 回忆的记忆（系统自动填充）
   * @param {Thought} data.previousThought - 前序思想（系统自动填充）
   * @param {number} data.iteration - 迭代次数（系统自动填充）
   * @param {number} data.timestamp - 时间戳（系统自动填充）
   * @param {string} data.thinkingState - 思考状态（系统自动填充）
   */
  constructor(data = {}) {
    super();
    
    // === AI创建的字段（受控加工） ===
    this.goalEngram = data.goalEngram || null;
    this.thinkingPattern = data.thinkingPattern || null;
    this.spreadActivationCues = data.spreadActivationCues || [];
    this.insightEngrams = data.insightEngrams || [];
    this.conclusionEngram = data.conclusionEngram || null;
    this.confidence = data.confidence !== undefined ? data.confidence : null;
    
    // === 系统自动的字段（自动加工） ===
    this.recalledEngrams = data.recalledEngrams || [];
    this.previousThought = data.previousThought || null;
    this.iteration = data.iteration || 1;
    this.timestamp = data.timestamp || Date.now();
    this.thinkingState = data.thinkingState || 'initial';
  }

  // === 目标导向字段 ===
  
  getGoalEngram() {
    return this.goalEngram;
  }

  // === 系统自动加工字段 ===
  
  getPreviousThought() {
    return this.previousThought;
  }

  getRecalledEngrams() {
    return this.recalledEngrams;
  }

  getIteration() {
    return this.iteration;
  }

  getTimestamp() {
    return this.timestamp;
  }

  getThinkingState() {
    return this.thinkingState;
  }

  // === AI受控加工字段 ===
  
  getThinkingPattern() {
    return this.thinkingPattern;
  }

  getSpreadActivationCues() {
    return this.spreadActivationCues;
  }

  getConclusionEngram() {
    return this.conclusionEngram;
  }

  getInsightEngrams() {
    return this.insightEngrams;
  }

  // === 元认知信息 ===
  
  getConfidence() {
    return this.confidence;
  }

  // === 辅助方法 ===

  /**
   * 设置系统自动字段
   * @param {Object} systemFields - 系统字段
   */
  setSystemFields(systemFields) {
    if (systemFields.recalledEngrams !== undefined) {
      this.recalledEngrams = systemFields.recalledEngrams;
    }
    if (systemFields.previousThought !== undefined) {
      this.previousThought = systemFields.previousThought;
    }
    if (systemFields.iteration !== undefined) {
      this.iteration = systemFields.iteration;
    }
    if (systemFields.timestamp !== undefined) {
      this.timestamp = systemFields.timestamp;
    }
    if (systemFields.thinkingState !== undefined) {
      this.thinkingState = systemFields.thinkingState;
    }
  }

  /**
   * 判断是否有洞察
   */
  hasInsights() {
    return this.insightEngrams && this.insightEngrams.length > 0;
  }

  /**
   * 判断是否有结论
   */
  hasConclusion() {
    return this.conclusionEngram !== null;
  }

  /**
   * 判断是否有置信度评估
   */
  hasConfidence() {
    return this.confidence !== null;
  }

  /**
   * 获取思考深度级别
   */
  getDepthLevel() {
    if (this.hasConfidence()) return 'complete';
    if (this.hasConclusion()) return 'conclusion';
    if (this.hasInsights()) return 'insights';
    return 'initial';
  }

  /**
   * 转换为普通对象
   */
  toObject() {
    return {
      goalEngram: this.goalEngram,
      thinkingPattern: this.thinkingPattern,
      spreadActivationCues: this.spreadActivationCues,
      insightEngrams: this.insightEngrams,
      conclusionEngram: this.conclusionEngram,
      confidence: this.confidence,
      recalledEngrams: this.recalledEngrams,
      previousThought: this.previousThought,
      iteration: this.iteration,
      timestamp: this.timestamp,
      thinkingState: this.thinkingState
    };
  }

  /**
   * 从普通对象创建ThoughtEntity
   * @param {Object} data - 普通对象
   * @returns {ThoughtEntity}
   */
  static fromObject(data) {
    return new ThoughtEntity(data);
  }

  /**
   * 验证必需字段
   * @returns {Object} 验证结果
   */
  validate() {
    const errors = [];
    
    if (!this.goalEngram) {
      errors.push('goalEngram is required');
    }
    if (!this.thinkingPattern) {
      errors.push('thinkingPattern is required');
    }
    if (!this.spreadActivationCues || this.spreadActivationCues.length === 0) {
      errors.push('spreadActivationCues is required and must not be empty');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = { ThoughtEntity };