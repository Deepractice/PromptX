// Memory体系全局导出
// 提供统一的记忆服务入口

const { MemoryService } = require('./MemoryService');

// 创建全局单例
const memoryService = new MemoryService();

// CommonJS 导出
module.exports = {
  // 全局单例服务
  memoryService,
  
  // 服务类
  MemoryService,
  
  // 组件类
  ShortTerm: require('./components/ShortTerm').ShortTerm,
  LongTerm: require('./components/LongTerm').LongTerm,
  Semantic: require('./components/Semantic'),
  
  // Formation组件  
  SimpleEvaluator: require('./formation/components/SimpleEvaluator'),
  SimpleConsolidator: require('./formation/components/SimpleConsolidator')
};