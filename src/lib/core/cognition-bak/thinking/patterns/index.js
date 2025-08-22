// Thinking Patterns - 思维模式实现集合
// 导出所有具体的思维模式实现和工厂函数

const { BaseThinkingPattern } = require('./BaseThinkingPattern');
const { ReasoningPattern } = require('./ReasoningPattern');

// 思维模式注册表
const patternRegistry = {
  'reasoning': ReasoningPattern,
  // 未来将添加：
  // 'creative': CreativePattern,
  // 'critical': CriticalPattern,
  // 'systematic': SystematicPattern,
  // 'narrative': NarrativePattern,
  // 'intuitive': IntuitivePattern,
  // 'analytical': AnalyticalPattern,
  // 'experiential': ExperientialPattern
};

/**
 * 创建思维模式实例的工厂函数
 * @param {string} patternName - 思维模式名称
 * @returns {BaseThinkingPattern} 思维模式实例
 * @throws {Error} 如果思维模式不存在
 */
function createThinkingPattern(patternName) {
  const PatternClass = patternRegistry[patternName];
  
  if (!PatternClass) {
    const availablePatterns = Object.keys(patternRegistry).join(', ');
    throw new Error(
      `未知的思维模式: ${patternName}。` +
      `可用的思维模式: ${availablePatterns}`
    );
  }
  
  return new PatternClass();
}

/**
 * 检查思维模式是否存在
 * @param {string} patternName - 思维模式名称
 * @returns {boolean} 是否存在
 */
function hasPattern(patternName) {
  return patternName in patternRegistry;
}

/**
 * 获取所有可用的思维模式名称
 * @returns {string[]} 思维模式名称数组
 */
function getAvailablePatterns() {
  return Object.keys(patternRegistry);
}

module.exports = {
  // 基类
  BaseThinkingPattern,
  
  // 具体实现
  ReasoningPattern,
  
  // 工厂函数和辅助函数
  createThinkingPattern,
  hasPattern,
  getAvailablePatterns,
  
  // 注册表（供高级用途）
  patternRegistry
};