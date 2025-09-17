/**
 * ToolAPI - 工具运行时统一API接口
 * 
 * 为工具提供所有运行时功能的单一入口点
 * 遵循依赖倒置原则，工具只依赖这个抽象接口
 */

const ToolEnvironment = require('./ToolEnvironment');
const ToolLogger = require('./ToolLogger');

class ToolAPI {
  constructor(toolId, sandboxPath, resourceManager = null) {
    this.toolId = toolId;
    this.sandboxPath = sandboxPath;
    this.resourceManager = resourceManager;
    
    // 延迟初始化的服务实例
    this._environment = null;
    this._logger = null;
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
   * 获取工具元信息
   * @returns {Object} 工具基本信息
   */
  getInfo() {
    return {
      id: this.toolId,
      sandbox: this.sandboxPath,
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