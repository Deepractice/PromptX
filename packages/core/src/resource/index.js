/**
 * PromptX Resource Module
 * 基于DPML资源协议的统一资源管理模块
 *
 * 提供完整的资源协议解析、注册表管理、资源加载功能
 */

// 核心管理器
const ResourceManager = require('./resourceManager')

// 核心组件
const ResourceProtocolParser = require('./resourceProtocolParser')

// 数据类型
const {
  LoadingSemantics,
  ParsedReference,
  QueryParams,
  NestedReference,
  ResourceContent,
  LazyResource,
  ProcessedResult,
  ResourceResult,
  ProtocolInfo
} = require('./types')

// 全局单例 ResourceManager 实例
let globalResourceManager = null

/**
 * 获取全局单例 ResourceManager 实例
 * 确保整个应用程序使用同一个 ResourceManager 实例
 */
function getGlobalResourceManager() {
  if (!globalResourceManager) {
    globalResourceManager = new ResourceManager()
  }
  return globalResourceManager
}

/**
 * 重置全局 ResourceManager 实例
 * 主要用于测试或需要完全重新初始化的场景
 */
function resetGlobalResourceManager() {
  globalResourceManager = null
}

// 导出主接口
module.exports = {
  // 主管理器类
  ResourceManager,

  // 全局单例实例
  getGlobalResourceManager,
  resetGlobalResourceManager,

  // 核心组件
  ResourceProtocolParser,

  // 数据类型
  LoadingSemantics,
  ParsedReference,
  QueryParams,
  NestedReference,
  ResourceContent,
  LazyResource,
  ProcessedResult,
  ResourceResult,
  ProtocolInfo,

  // 便捷方法 - 创建默认实例（保持向后兼容）
  createManager: (options) => new ResourceManager(options),

  // 便捷方法 - 快速解析
  parse: (resourceRef) => {
    const parser = new ResourceProtocolParser()
    return parser.parse(resourceRef)
  },

  // 便捷方法 - 快速验证
  validate: (resourceRef) => {
    try {
      const parser = new ResourceProtocolParser()
      parser.parse(resourceRef)
      return true
    } catch (error) {
      return false
    }
  }
}
