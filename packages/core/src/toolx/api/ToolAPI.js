/**
 * ToolAPI - 工具运行时统一API接口
 * 
 * 为工具提供所有运行时功能的单一入口点
 * 遵循依赖倒置原则，工具只依赖这个抽象接口
 */

const ToolEnvironment = require('./ToolEnvironment');
const ToolLogger = require('./ToolLogger');
const ToolModuleImport = require('../module/ToolModuleImport');
const ToolStorage = require('./ToolStorage');
const ToolBridge = require('./ToolBridge');

class ToolAPI {
  constructor(toolId, sandboxPath, resourceManager = null) {
    this.toolId = toolId;
    this.sandboxPath = sandboxPath;
    this.resourceManager = resourceManager;

    // 延迟初始化的服务实例
    this._environment = null;
    this._logger = null;
    this._moduleImport = null;
    this._storage = null;
    this._bridge = null;

    // 工具实例引用（由ToolSandbox设置）
    this.toolInstance = null;
  }

  /**
   * 环境变量管理
   * @returns {ToolEnvironment} 环境变量管理器实例
   */
  get environment() {
    if (!this._environment) {
      this._environment = new ToolEnvironment(this.toolId, this.sandboxPath);
    }
    return this._environment;
  }

  /**
   * 日志记录器
   * @returns {ToolLogger} 日志记录器实例
   */
  get logger() {
    if (!this._logger) {
      this._logger = new ToolLogger(this.toolId, this.sandboxPath);
    }
    return this._logger;
  }

  /**
   * 模块导入器 - 提供智能的模块加载功能
   * @returns {ToolModuleImport} 模块导入器实例
   */
  get moduleImport() {
    if (!this._moduleImport) {
      this._moduleImport = new ToolModuleImport(this.toolId, this.sandboxPath);
    }
    return this._moduleImport;
  }

  /**
   * 持久化存储 - 完全兼容 localStorage API
   * @returns {ToolStorage} 存储管理器实例
   */
  get storage() {
    if (!this._storage) {
      this._storage = new ToolStorage(this.toolId, this.sandboxPath);
    }
    return this._storage;
  }

  /**
   * 桥接器 - 管理工具的外部依赖
   * @returns {ToolBridge} 桥接器实例
   */
  get bridge() {
    if (!this._bridge) {
      if (!this.toolInstance) {
        throw new Error('Tool instance not set. Bridge requires tool instance.');
      }
      this._bridge = new ToolBridge(this.toolInstance, this);
    }
    return this._bridge;
  }

  /**
   * 设置工具实例（由ToolSandbox在加载工具后调用）
   * @param {Object} instance - 工具实例
   */
  setToolInstance(instance) {
    this.toolInstance = instance;
  }

  /**
   * 智能导入模块 - 工具使用的统一接口
   * 自动处理CommonJS/ESM差异，提供一致的导入体验
   * @param {string} moduleName - 要导入的模块名称
   * @returns {Promise<any>} 规范化后的模块
   */
  async importx(moduleName) {
    return await this.moduleImport.import(moduleName);
  }

  /**
   * 获取工具元信息
   * @returns {Object} 工具基本信息
   */
  getInfo() {
    return {
      id: this.toolId,
      sandboxPath: this.sandboxPath,
      runtime: {
        node: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };
  }

  /**
   * 调用其他工具（工具间通信）
   * @param {string} toolId - 目标工具ID
   * @param {Object} params - 调用参数
   * @returns {Promise<Object>} 调用结果
   */
  async callTool(toolId, params = {}) {
    if (!this.resourceManager) {
      throw new Error('Tool communication requires ResourceManager');
    }
    
    return await this.resourceManager.executeTool(`@tool://${toolId}`, params);
  }

  /**
   * 获取API版本
   * @returns {string} API版本号
   */
  getVersion() {
    return '2.0.0';
  }
}

module.exports = ToolAPI;