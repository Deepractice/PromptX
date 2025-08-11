const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');

/**
 * ToolDirectoryManager - 基于协议的工具目录管理器
 * 
 * 负责管理工具相关的所有目录：
 * - 工作目录：工具执行时的 process.cwd()
 * - 工具箱目录：依赖安装和隔离
 * - 缓存目录：工具缓存（可选）
 * - 临时目录：临时文件（可选）
 * 
 * 基于 ResourceManager 的协议系统，支持跨平台路径解析
 */
class ToolDirectoryManager {
  constructor(toolId, resourceManager) {
    this.toolId = toolId;
    this.resourceManager = resourceManager;
    
    // 使用协议定义目录
    this.directories = {
      working: '@user://.promptx',                           // 工作目录
      toolbox: `@user://.promptx/toolbox/${toolId}`,        // 工具隔离目录
      dependencies: `@user://.promptx/toolbox/${toolId}/node_modules`, // 依赖目录
      cache: `@user://.promptx/cache/${toolId}`,            // 缓存目录
      temp: `@user://.promptx/temp/${toolId}`,              // 临时文件目录
    };
    
    // 解析后的实际路径
    this.resolvedPaths = {};
  }

  /**
   * 初始化所有路径（通过协议解析）
   */
  async initialize() {
    for (const [key, protocolPath] of Object.entries(this.directories)) {
      this.resolvedPaths[key] = await this.resolveProtocolPath(protocolPath);
    }
    logger.debug('[ToolDirectoryManager] Initialized paths:', this.resolvedPaths);
  }

  /**
   * 通过协议解析路径
   * @param {string} protocolPath - 协议路径，如 @user://.promptx
   * @returns {Promise<string>} 解析后的绝对路径
   */
  async resolveProtocolPath(protocolPath) {
    // 使用 ResourceManager 的协议解析能力
    const result = await this.resourceManager.resolveProtocolReference(protocolPath);
    
    if (!result.success) {
      throw new Error(`Failed to resolve protocol path ${protocolPath}: ${result.error}`);
    }
    
    // 获取对应的协议处理器
    const protocol = this.resourceManager.protocols.get(result.protocol);
    if (!protocol) {
      throw new Error(`Protocol ${result.protocol} not supported`);
    }
    
    // 使用协议处理器解析实际路径
    if (typeof protocol.resolvePath === 'function') {
      return await protocol.resolvePath(result.path, result.queryParams || new Map());
    } else {
      throw new Error(`Protocol ${result.protocol} does not support path resolution`);
    }
  }

  /**
   * 获取工作目录路径
   * @returns {string} 工作目录路径
   */
  getWorkingPath() {
    return this.resolvedPaths.working;
  }

  /**
   * 获取工具箱目录路径
   * @returns {string} 工具箱目录路径
   */
  getToolboxPath() {
    return this.resolvedPaths.toolbox;
  }

  /**
   * 获取依赖目录路径
   * @returns {string} node_modules 路径
   */
  getDependenciesPath() {
    return this.resolvedPaths.dependencies;
  }

  /**
   * 获取缓存目录路径
   * @returns {string} 缓存目录路径
   */
  getCachePath() {
    return this.resolvedPaths.cache;
  }

  /**
   * 获取临时目录路径
   * @returns {string} 临时目录路径
   */
  getTempPath() {
    return this.resolvedPaths.temp;
  }

  /**
   * 获取 package.json 路径
   * @returns {string} package.json 路径
   */
  getPackageJsonPath() {
    return path.join(this.resolvedPaths.toolbox, 'package.json');
  }

  /**
   * 确保必要的目录存在
   */
  async ensureDirectories() {
    // 工作目录通常已存在，但还是检查一下
    await this.ensureDirectory(this.resolvedPaths.working);
    
    // 工具箱目录必须创建
    await this.ensureDirectory(this.resolvedPaths.toolbox);
    
    // 可选：创建缓存和临时目录
    // await this.ensureDirectory(this.resolvedPaths.cache);
    // await this.ensureDirectory(this.resolvedPaths.temp);
  }

  /**
   * 确保单个目录存在
   * @param {string} dirPath - 目录路径
   */
  async ensureDirectory(dirPath) {
    try {
      await fs.access(dirPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await fs.mkdir(dirPath, { recursive: true });
        logger.debug(`[ToolDirectoryManager] Created directory: ${dirPath}`);
      } else {
        throw error;
      }
    }
  }

  /**
   * 检查目录是否存在
   * @param {string} dirPath - 目录路径
   * @returns {Promise<boolean>} 是否存在
   */
  async directoryExists(dirPath) {
    try {
      await fs.access(dirPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 检查工具箱目录是否存在
   * @returns {Promise<boolean>}
   */
  async toolboxExists() {
    return await this.directoryExists(this.resolvedPaths.toolbox);
  }

  /**
   * 清理临时文件
   */
  async cleanupTemp() {
    if (this.resolvedPaths.temp && await this.directoryExists(this.resolvedPaths.temp)) {
      const { rmdir } = require('fs').promises;
      await rmdir(this.resolvedPaths.temp, { recursive: true });
      logger.debug(`[ToolDirectoryManager] Cleaned up temp directory: ${this.resolvedPaths.temp}`);
    }
  }

  /**
   * 删除工具箱目录（用于强制重建）
   */
  async deleteToolbox() {
    if (this.resolvedPaths.toolbox && await this.toolboxExists()) {
      const { rmdir } = require('fs').promises;
      await rmdir(this.resolvedPaths.toolbox, { recursive: true });
      logger.debug(`[ToolDirectoryManager] Deleted toolbox directory: ${this.resolvedPaths.toolbox}`);
    }
  }

  /**
   * 获取协议路径（用于日志或调试）
   * @param {string} key - 目录键名
   * @returns {string} 协议路径
   */
  getProtocolPath(key) {
    return this.directories[key];
  }

  /**
   * 支持自定义协议路径（未来扩展）
   * 比如支持 @project:// 或 @s3:// 等
   */
  async setCustomDirectory(key, protocolPath) {
    this.directories[key] = protocolPath;
    this.resolvedPaths[key] = await this.resolveProtocolPath(protocolPath);
  }
}

module.exports = ToolDirectoryManager;