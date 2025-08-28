// Formation - 记忆形成体系
// 统一导出记忆形成相关的接口和组件

const Evaluator = require('./interfaces/Evaluator.js');
const Consolidator = require('./interfaces/Consolidator.js');
const SimpleEvaluator = require('./components/SimpleEvaluator.js');
const SimpleConsolidator = require('./components/SimpleConsolidator.js');

module.exports = {
  // Interfaces
  Evaluator,
  Consolidator,
  
  // Components
  SimpleEvaluator,
  SimpleConsolidator
};