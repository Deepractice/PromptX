// Mind模块统一导出 - 提供全局单例MindService
const { MindService } = require('./MindService.js');
const { WordCue } = require('./components/WordCue.js');
const { GraphSchema } = require('./components/GraphSchema.js');
const { NetworkSemantic } = require('./components/NetworkSemantic.js');
const { PeggyMindmap } = require('./mindmap/PeggyMindmap.js');

// 创建全局单例MindService实例
const mindService = new MindService();

// 初始化配置（如果需要的话）
// mindService.setStoragePath(defaultPath); // 可在应用启动时设置

module.exports = {
  // 全局单例实例
  mindService,
  
  // 类导出（用于测试或特殊场景）
  MindService,
  
  // 组件类导出
  WordCue,
  GraphSchema,
  NetworkSemantic,
  PeggyMindmap
};