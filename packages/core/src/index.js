/**
 * PromptX 核心库
 *
 * 提供AI prompt框架的核心功能，包括：
 * - 认知系统和记忆管理
 * - 资源管理和协议解析
 * - MCP协议支持
 * - 工具扩展系统
 */

// 认知模块
const cognition = require('./cognition')

// 资源管理模块
const resource = require('./resource')

// 工具扩展模块
const toolx = require('./toolx')

// Pouch CLI 框架
const pouch = require('./pouch')

// 工具模块
const utils = {
  version: require('./utils/version'),
  DirectoryService: require('./utils/DirectoryService'),
  ProjectManager: require('./utils/ProjectManager'),
  ProjectPathResolver: require('./utils/ProjectPathResolver'),
  ProjectConfig: require('./utils/ProjectConfig')
}

module.exports = {
  cognition,
  resource,
  toolx,
  pouch,
  utils,
  
  // 便捷导出
  ...utils
}