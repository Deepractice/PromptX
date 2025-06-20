/**
 * PromptX DPML Module
 * DPML协议解析和内容处理模块
 * 
 * 提供DPML语法解析、标签处理、语义结构构建功能
 */

const DPMLContentParser = require('./DPMLContentParser')

module.exports = {
  // 核心解析器
  DPMLContentParser,
  
  // 便捷方法 - 创建解析器实例
  createParser: () => new DPMLContentParser(),
  
  // 便捷方法 - 快速解析标签内容
  parseTagContent: (content, tagName) => {
    const parser = new DPMLContentParser()
    return parser.parseTagContent(content, tagName)
  },
  
  // 便捷方法 - 快速解析角色文档
  parseRoleDocument: (roleContent) => {
    const parser = new DPMLContentParser()
    return parser.parseRoleDocument(roleContent)
  },
  
  // 便捷方法 - 提取引用
  extractReferences: (content) => {
    const parser = new DPMLContentParser()
    return parser.extractReferences(content)
  }
} 