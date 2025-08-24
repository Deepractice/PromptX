/**
 * PromptX 核心库
 *
 * 提供AI prompt框架的核心功能，包括：
 * - 四大核心命令实现
 * - 资源管理和路径解析
 * - 格式化输出和用户交互
 * - 配置管理和错误处理
 */

// 核心命令模块 - 注释掉不存在的模块，但保留结构
const commands = {
  // hello: require('./commands/hello'),
  // learn: require('./commands/learn'),
  // recall: require('./commands/recall'),
  // remember: require('./commands/remember')
}

// 核心功能模块 - 注释掉不存在的模块，但保留结构
const core = {
  // ResourceManager: require('./core/resource-manager'),
  // PathResolver: require('./core/path-resolver'),
  // OutputFormatter: require('./core/output-formatter')
}

// 工具模块
const utils = {
  logger: require('./utils/logger'),
  banner: require('./utils/banner'),
  version: require('./utils/version'),
  DirectoryService: require('./utils/DirectoryService'),
  ServerEnvironment: require('./utils/ServerEnvironment')
}

// MCP 模块
const mcp = {
  definitions: require('./mcp/definitions')
  // FastMCPHttpServer 是 ES Module，不能在这里 require
}

module.exports = {
  commands,
  core,
  utils,
  mcp,

  // 便捷导出
  ...commands,
  ...core,
  ...utils
}
