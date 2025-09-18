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

const logger = require('@promptx/logger');
const path = require('path');
const { pathToFileURL } = require('url');

class ToolModuleImport {
  constructor(toolId, sandboxPath) {
    this.toolId = toolId;
    this.sandboxPath = sandboxPath;
    this.moduleCache = new Map(); // 缓存已加载的模块
    this.importxFn = null; // 延迟加载的importx函数
    this.preinstalledManager = null; // 预装依赖管理器
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
        const normalized = this.normalizeModule(preinstalledModule, moduleName);
        this.moduleCache.set(moduleName, normalized);
        return normalized;
      }

      // 3. 从沙箱加载用户安装的包
      logger.debug(`[ToolModuleImport] Loading user-installed module: ${moduleName}`);
      const sandboxModule = await this.loadFromSandbox(moduleName);
      const normalized = this.normalizeModule(sandboxModule, moduleName);
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
   * 智能模块规范化 - 核心降级策略链
   * @private
   */
  normalizeModule(module, moduleName) {
    // 记录原始模块结构（调试用）
    if (logger.level === 'debug') {
      const keys = module ? Object.keys(module) : [];
      logger.debug(`[ToolModuleImport] ${moduleName} structure: ${JSON.stringify(keys)}`);
    }

    // 策略1: 有实质内容的default属性
    if (module && module.default !== undefined) {
      if (this.isSubstantialExport(module.default)) {
        logger.debug(`[ToolModuleImport] ${moduleName} resolved via substantial default`);
        return module.default;
      }
    }

    // 策略2: 模块本身是函数
    if (typeof module === 'function') {
      logger.debug(`[ToolModuleImport] ${moduleName} is a function`);
      return module;
    }

    // 策略3: 只有一个非元数据的导出
    if (module && typeof module === 'object') {
      const realKeys = Object.keys(module).filter(k => 
        k !== '__esModule' && k !== 'default'
      );
      
      if (realKeys.length === 1) {
        const singleExport = module[realKeys[0]];
        logger.debug(`[ToolModuleImport] ${moduleName} has single export: ${realKeys[0]}`);
        return singleExport;
      }
    }

    // 策略4: 有default就用default，否则返回整个模块
    const result = module && module.default !== undefined ? module.default : module;
    logger.debug(`[ToolModuleImport] ${moduleName} fallback to ${module && module.default !== undefined ? 'default' : 'whole module'}`);
    return result;
  }

  /**
   * 判断是否是实质性导出
   * @private
   */
  isSubstantialExport(exp) {
    // null 和 undefined 不是实质性导出
    if (exp === null || exp === undefined) {
      return false;
    }

    const type = typeof exp;
    
    // 函数总是实质性的
    if (type === 'function') {
      return true;
    }
    
    // 非空对象是实质性的
    if (type === 'object') {
      // 数组或有属性的对象
      if (Array.isArray(exp) || Object.keys(exp).length > 0) {
        return true;
      }
    }
    
    // 字符串、数字、布尔值如果不是空值也算实质性
    if (type === 'string' || type === 'number' || type === 'boolean') {
      return exp !== '' && exp !== 0 && exp !== false;
    }
    
    return false;
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