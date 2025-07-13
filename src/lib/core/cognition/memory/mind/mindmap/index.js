// mindmap模块导出
// 提供Mermaid Mindmap格式的解析和序列化功能

// 使用 Peggy 实现（更轻量级）
const { PeggyMindmap, peggyMindmap } = require('./PeggyMindmap');

module.exports = {
  // 主要接口实现
  MermaidMindmap: PeggyMindmap,
  mermaidMindmap: peggyMindmap,
  
  // 为了兼容性也导出 Peggy 版本的名称
  PeggyMindmap,
  peggyMindmap
};