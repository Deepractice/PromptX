// Engram Interface - 认知痕迹接口
// Engram 不仅是记忆痕迹，更是所有认知活动的痕迹
//
// 包括但不限于：
// - 记忆（Memory）：持久化的认知痕迹
// - 目标（Goal）：意图性的认知痕迹
// - 洞察（Insight）：发现性的认知痕迹
// - 结论（Conclusion）：总结性的认知痕迹

const { CognitionType } = require('./CognitionType');

/**
 * 认知痕迹接口
 * 表示任何认知活动留下的痕迹
 */
class Engram {
  /**
   * @param {string} content - 认知内容
   * @param {string} schema - 认知结构（Mermaid mindmap 格式）
   * @param {string} type - 认知类型
   */
  constructor(content, schema, type = CognitionType.ATOMIC) {
    throw new Error('Engram is an interface, use concrete implementation');
  }

  getId() {
    throw new Error('Engram.getId() must be implemented');
  }

  getContent() {
    throw new Error('Engram.getContent() must be implemented');
  }

  getCognitionType() {
    throw new Error('Engram.getCognitionType() must be implemented');
  }

  getStrength() {
    throw new Error('Engram.getStrength() must be implemented');
  }

  getSchema() {
    throw new Error('Engram.getSchema() must be implemented');
  }
}

module.exports = { Engram };