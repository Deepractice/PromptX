/**
 * PromptX Tool Framework
 * 统一的工具框架入口文件 - ToolSandbox版本
 */

const ToolSandbox = require('./ToolSandbox');
const ToolValidator = require('./ToolValidator');
const ToolUtils = require('./ToolUtils');
const { TOOL_INTERFACE, TOOL_ERROR_CODES, TOOL_RESULT_FORMAT, EXAMPLE_TOOL } = require('./ToolInterface');

// 创建全局工具实例
let globalSandbox = null;

/**
 * 获取全局工具沙箱
 * @param {string} toolResource - 工具资源引用
 * @returns {ToolSandbox} 工具沙箱实例
 */
function getGlobalToolSandbox(toolResource) {
  // ToolSandbox是工具特定的，不使用单例
  return new ToolSandbox(toolResource);
}

/**
 * 初始化工具框架 - ToolSandbox版本
 * @param {Object} options - 配置选项
 * @returns {Object} 初始化结果
 */
function initialize(options = {}) {
  try {
    return {
      success: true,
      message: 'ToolSandbox工具框架初始化成功',
      framework: {
        executor: 'ToolSandbox',
        version: '2.0.0',
        features: [
          '自动依赖管理',
          '沙箱隔离执行', 
          '三阶段执行流程',
          'pnpm集成'
        ]
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `工具框架初始化失败: ${error.message}`,
      error: error
    };
  }
}

/**
 * 执行工具的便捷方法 - ToolSandbox版本
 * @param {string} toolResource - 工具资源引用 (@tool://tool-name)
 * @param {Object} parameters - 工具参数
 * @param {Object} resourceManager - ResourceManager实例
 * @returns {Promise<Object>} 执行结果
 */
async function executeTool(toolResource, parameters = {}, resourceManager = null) {
  if (!resourceManager) {
    throw new Error('ResourceManager is required for ToolSandbox execution');
  }
  
  const sandbox = getGlobalToolSandbox(toolResource);
  sandbox.setResourceManager(resourceManager);
  
  try {
    await sandbox.analyze();
    await sandbox.prepareDependencies();
    return await sandbox.execute(parameters);
  } finally {
    await sandbox.cleanup();
  }
}

/**
 * 重置工具框架 - ToolSandbox版本
 */
function reset() {
  // ToolSandbox不使用全局单例，无需重置
  globalSandbox = null;
}

/**
 * 获取工具框架统计信息 - ToolSandbox版本
 * @returns {Object} 统计信息
 */
function getStats() {
  return {
    framework: {
      name: 'PromptX ToolSandbox Framework',
      version: '2.0.0',
      executor: 'ToolSandbox',
      features: [
        '自动依赖管理',
        '沙箱隔离执行',
        '三阶段执行流程',
        'pnpm集成',
        '@tool://协议支持'
      ]
    }
  };
}

module.exports = {
  // 核心类
  ToolSandbox,
  ToolValidator,
  ToolUtils,
  
  // 接口规范
  TOOL_INTERFACE,
  TOOL_ERROR_CODES,
  TOOL_RESULT_FORMAT,
  EXAMPLE_TOOL,
  
  // 全局实例获取器
  getGlobalToolSandbox,
  
  // 便捷方法
  initialize,
  executeTool,
  reset,
  getStats
};