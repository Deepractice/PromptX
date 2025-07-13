// Cognition System - 认知体系
// 认知 = 记忆(Memory)系统 + 配置管理

const { Cognition } = require('./Cognition');
const { CognitionManager } = require('./CognitionManager');
const { memoryService } = require('./memory');

// 创建默认的认知实例
const cognition = new Cognition();

module.exports = {
  // 认知类（用于创建自定义配置的实例）
  Cognition,
  
  // 认知管理器（管理角色与认知的关系）
  CognitionManager,
  
  // 默认认知实例
  cognition,
  
  // 直接访问内部服务（向后兼容）
  memoryService,
  
  // 导出记忆系统组件
  ...require('./memory'),
  
  // Engram
  Engram: require('./engram/Engram')
};