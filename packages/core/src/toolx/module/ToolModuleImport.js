/**
 * ToolModuleImport - 智能模块导入管理器
 * 
 * 负责处理工具沙箱中的所有模块导入需求
 * 实现智能降级策略，自动适配各种模块格式
 * 
 * 核心功能：
 * 1. 预装包优先加载
 * 2. 智能模块格式识别
 * 3. 降级策略链处理
 * 4. 模块缓存管理
 */

import logger from '@promptx/logger';
const path = require('path');
const { pathToFileURL } = require('url');
const { createDefaultNormalizer } = require('./normalize');

class ToolModuleImport {
  constructor(toolId, sandboxPath) {
    this.toolId = toolId;
    this.sandboxPath = sandboxPath;
    this.moduleCache = new Map(); // 缓存已加载的模块
    this.importxFn = null; // 延迟加载的importx函数
    this.preinstalledManager = null; // 预装依赖管理器
    this.normalizer = createDefaultNormalizer(); // 使用责任链规范化器
  }

  /**
   * 主入口 - 智能导入模块
   * @param {string} moduleName - 模块名称
   * @returns {Promise<any>} 规范化后的模块
   */
  async import(moduleName) {
    try {
      // 1. 缓存检查
      if (this.moduleCache.has(moduleName)) {
        logger.debug(`[ToolModuleImport] Using cached module: ${moduleName}`);
        return this.moduleCache.get(moduleName);
      }

      logger.debug(`[ToolModuleImport] Loading module: ${moduleName}`);

      // 2. 尝试预装包
      const preinstalledModule = await this.tryPreinstalled(moduleName);
      if (preinstalledModule) {
        logger.debug(`[ToolModuleImport] Using preinstalled module: ${moduleName}`);
        const normalized = await this.normalizer.normalize(preinstalledModule, moduleName, {
          toolId: this.toolId,
          source: 'preinstalled'
        });
        this.moduleCache.set(moduleName, normalized);
        return normalized;
      }

      // 3. 从沙箱加载用户安装的包
      logger.debug(`[ToolModuleImport] Loading user-installed module: ${moduleName}`);
      const sandboxModule = await this.loadFromSandbox(moduleName);
      const normalized = await this.normalizer.normalize(sandboxModule, moduleName, {
          toolId: this.toolId,
          source: 'sandbox',
          sandboxPath: this.sandboxPath
        });
      this.moduleCache.set(moduleName, normalized);
      return normalized;

    } catch (error) {
      logger.error(`[ToolModuleImport] Failed to import ${moduleName}: ${error.message}`);
      
      // 提供更友好的错误信息
      const enhancedError = new Error(
        `Cannot load module '${moduleName}': ${error.message}`
      );
      enhancedError.code = 'MODULE_IMPORT_FAILED';
      enhancedError.module = moduleName;
      enhancedError.toolId = this.toolId;
      throw enhancedError;
    }
  }

  /**
   * 尝试从预装包加载
   * @private
   */
  async tryPreinstalled(moduleName) {
    try {
      // 延迟加载预装管理器
      if (!this.preinstalledManager) {
        const { getPreinstalledDependenciesManager } = require('@promptx/resource');
        this.preinstalledManager = getPreinstalledDependenciesManager();
      }

      // 使用 getPreinstalledModule 方法直接获取模块
      const module = await this.preinstalledManager.getPreinstalledModule(moduleName);
      if (module) {
        logger.debug(`[ToolModuleImport] Found preinstalled: ${moduleName}`);
        return module;
      }
    } catch (error) {
      // 预装包加载失败不是错误，继续尝试其他方式
      logger.debug(`[ToolModuleImport] Preinstalled not available: ${moduleName}`);
    }
    return null;
  }

  /**
   * 从沙箱加载模块
   * @private
   */
  async loadFromSandbox(moduleName) {
    // 延迟加载importx
    if (!this.importxFn) {
      const { import: importFn } = await import('importx');
      this.importxFn = importFn;
    }

    // 构建沙箱的parentURL
    const packageJsonPath = path.join(this.sandboxPath, 'package.json');
    const parentURL = pathToFileURL(packageJsonPath).href;

    // 使用importx加载
    return await this.importxFn(moduleName, {
      parentURL: parentURL,
      cache: true,
      loader: 'auto'
    });
  }


  /**
   * 清理缓存
   */
  clearCache() {
    this.moduleCache.clear();
    logger.debug(`[ToolModuleImport] Module cache cleared for tool: ${this.toolId}`);
  }

  /**
   * 获取缓存统计
   */
  getCacheStats() {
    return {
      toolId: this.toolId,
      cachedModules: Array.from(this.moduleCache.keys()),
      cacheSize: this.moduleCache.size
    };
  }
}

module.exports = ToolModuleImport;