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

// MCP 客户端模块
const mcp = require('./mcp')

// 工具扩展模块
const toolx = require('./toolx')

// Pouch CLI 框架
const pouch = require('./pouch')

// 项目管理模块
const project = require('./project')

// 工具模块
const utils = {
  version: require('./utils/version'),
  DirectoryService: require('./utils/DirectoryService'),
  // Project 相关已移动到 project 模块
  ProjectManager: project.ProjectManager,
  ProjectPathResolver: project.ProjectPathResolver,
  ProjectConfig: project.ProjectConfig
}

module.exports = {
  cognition,
  resource,
  mcp,
  toolx,
  pouch,
  project,
  utils,

  // 便捷导出
  ...utils,
  ...project
}