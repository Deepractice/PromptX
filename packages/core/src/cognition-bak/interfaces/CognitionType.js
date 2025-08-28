// CognitionType - 认知类型定义
// 基于认知类型序列理论（Cognitive Type Sequence Theory, CTST）
//
// 核心发现：不同的思维模式本质上是认知类型的不同序列
// - 推理模式: ATOMIC → LINK → PATTERN (从事实到因果到规律)
// - 创造模式: ATOMIC → PATTERN → LINK (从概念到模式到新连接)
// - 批判模式: PATTERN → ATOMIC → LINK (从假设到反例到修正)

/**
 * 认知类型枚举
 * @enum {string}
 */
const CognitionType = {
  ATOMIC: 'ATOMIC',     // 具体概念、事实、实体
  LINK: 'LINK',         // 关系、连接、因果
  PATTERN: 'PATTERN'    // 模式、规律、框架
};

module.exports = { CognitionType };