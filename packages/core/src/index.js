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

// MCP 模块
const mcp = require('./mcp')

// 工具扩展模块
const toolx = require('./toolx')

// 工具模块
const utils = {
  logger: require('./utils/logger'),
  banner: require('./utils/banner'),
  version: require('./utils/version'),
  DirectoryService: require('./utils/DirectoryService'),
  ServerEnvironment: require('./utils/ServerEnvironment')
}

module.exports = {
  cognition,
  resource,
  mcp,
  toolx,
  utils,
  
  // 便捷导出
  ...utils
}