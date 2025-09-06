/**
 * PromptX Tool Framework
 * 统一的工具框架入口文件 - ToolSandbox版本
 */

// ToolSandbox 框架内部使用常规模块导入

// 异步模块加载
let ToolSandbox, ToolValidator, ToolUtils, PnpmInstaller, ToolInterface;

async function initializeModules() {
  if (!ToolSandbox) {
    // ToolSandbox 框架内部使用常规 require()
    ToolSandbox = require('./ToolSandbox');
    ToolValidator = require('./ToolValidator');
    ToolUtils = require('./ToolUtils');
    PnpmInstaller = require('./PnpmInstaller');
    ToolInterface = require('./ToolInterface');
  }
}

// 创建全局工具实例
let globalSandbox = null;

/**
 * 获取全局工具沙箱
 * @param {string} toolResource - 工具资源引用
 * @returns {Promise<ToolSandbox>} 工具沙箱实例
 */
async function getGlobalToolSandbox(toolResource) {
  await initializeModules();
  // ToolSandbox是工具特定的，不使用单例
  return await ToolSandbox.create(toolResource);
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
  
  const sandbox = await getGlobalToolSandbox(toolResource);
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
  // 异步模块初始化
  initializeModules,
  
  // 动态获取核心类（需要先调用initializeModules）
  get ToolSandbox() { return ToolSandbox; },
  get ToolValidator() { return ToolValidator; },
  get ToolUtils() { return ToolUtils; },
  get PnpmInstaller() { return PnpmInstaller; },
  
  // 动态获取接口规范
  get TOOL_INTERFACE() { return ToolInterface?.TOOL_INTERFACE; },
  get TOOL_ERROR_CODES() { return ToolInterface?.TOOL_ERROR_CODES; },
  get TOOL_RESULT_FORMAT() { return ToolInterface?.TOOL_RESULT_FORMAT; },
  get EXAMPLE_TOOL() { return ToolInterface?.EXAMPLE_TOOL; },
  
  // 全局实例获取器
  getGlobalToolSandbox,
  
  // 便捷方法
  initialize,
  executeTool,
  reset,
  getStats
};