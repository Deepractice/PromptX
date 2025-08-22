// Elaboration - 精细加工
// 认知心理学基础：Elaborative Processing（精细加工）
//
// === 认知心理学概念 ===
//
// 精细加工（Elaboration）是认知心理学的核心概念之一：
// 1. 将新信息与已有知识结合
// 2. 添加细节、例子和关联
// 3. 深化理解和记忆
// 4. 从简单输入产生丰富输出
//
// 在我们的系统中，Elaboration表示：
// - AI接收prompt（简单输入）
// - 结合记忆、知识和推理
// - 产生elaborated output（丰富输出）
//
// === 设计原则 ===
//
// 1. 绑定性：prompt和output永远绑定在一起
// 2. 可追溯：知道每个output的来源prompt
// 3. 类型明确：清晰标识这是AI产生的内容
// 4. 认知对齐：体现精细加工的认知过程

/**
 * Elaboration Class - 精细加工类
 * 
 * 表示一次完整的认知精细加工过程。
 * 将prompt（输入）和AI生成的内容（输出）绑定在一起。
 * 
 * 核心理念：
 * - 每个AI输出都有其对应的输入
 * - 体现了从简单到复杂的认知过程
 * - 便于管理和追踪AI的认知活动
 */
class Elaboration {
  /**
   * 构造函数
   * 
   * @param {string} prompt - 输入的提示词
   * @param {*} output - AI精细加工后的输出
   * @param {string} type - 精细加工的类型
   * @param {Object} metadata - 可选的元数据
   */
  constructor(prompt, output, type, metadata = {}) {
    this._prompt = prompt;
    this._output = output;
    this._type = type;
    this._timestamp = Date.now();
    this._metadata = metadata;
  }

  /**
   * 获取提示词
   * 
   * @returns {string} 原始的输入提示词
   */
  getPrompt() {
    return this._prompt;
  }

  /**
   * 获取AI输出
   * 
   * 这是精细加工的结果，包含了：
   * - 基于prompt的理解
   * - 结合记忆的扩展
   * - 知识的整合
   * - 推理的结果
   * 
   * @returns {*} AI生成的内容
   */
  getOutput() {
    return this._output;
  }

  /**
   * 获取精细加工类型
   * 
   * 标识这是哪种类型的精细加工：
   * - 'schema_recognition' - 模式识别
   * - 'insight_generation' - 洞察生成
   * - 'cue_generation' - 线索生成
   * - 'content_synthesis' - 内容综合
   * - 'confidence_assessment' - 置信度评估
   * 
   * @returns {string} 类型标识
   */
  getType() {
    return this._type;
  }

  /**
   * 获取时间戳
   * 
   * @returns {number} 创建时间戳
   */
  getTimestamp() {
    return this._timestamp;
  }

  /**
   * 获取元数据
   * 
   * 可能包含：
   * - 使用的模型
   * - 处理时长
   * - 相关的记忆数量
   * - 其他上下文信息
   * 
   * @returns {Object} 元数据对象
   */
  getMetadata() {
    return this._metadata;
  }

  /**
   * 检查输出是否为空
   * 
   * @returns {boolean} 是否为空
   */
  isEmpty() {
    if (this._output === null || this._output === undefined) {
      return true;
    }
    if (Array.isArray(this._output)) {
      return this._output.length === 0;
    }
    if (typeof this._output === 'string') {
      return this._output.trim() === '';
    }
    if (typeof this._output === 'object') {
      return Object.keys(this._output).length === 0;
    }
    return false;
  }

  /**
   * 获取输出摘要
   * 
   * 用于调试和日志，提供输出的简短描述
   * 
   * @returns {string} 摘要信息
   */
  getSummary() {
    if (this.isEmpty()) {
      return `Empty ${this._type} elaboration`;
    }
    
    if (Array.isArray(this._output)) {
      return `${this._type}: ${this._output.length} items`;
    }
    
    if (typeof this._output === 'string') {
      const preview = this._output.substring(0, 50);
      return `${this._type}: "${preview}${this._output.length > 50 ? '...' : ''}"`;
    }
    
    return `${this._type}: ${typeof this._output}`;
  }

  /**
   * 转换为JSON
   * 
   * @returns {Object} JSON表示
   */
  toJSON() {
    return {
      prompt: this._prompt,
      output: this._output,
      type: this._type,
      timestamp: this._timestamp,
      metadata: this._metadata
    };
  }
}

/**
 * 精细加工类型常量
 */
Elaboration.Types = {
  SCHEMA_RECOGNITION: 'schema_recognition',
  INSIGHT_GENERATION: 'insight_generation',
  CUE_GENERATION: 'cue_generation',
  CONTENT_SYNTHESIS: 'content_synthesis',
  CONFIDENCE_ASSESSMENT: 'confidence_assessment'
};

module.exports = { Elaboration };