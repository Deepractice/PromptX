const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');

/**
 * ESModuleRequireSupport - ES Module 加载支持器
 * 
 * 专门处理 ES Module 和 CommonJS 模块的统一加载
 * 提供智能的模块类型检测和加载策略
 */
class ESModuleRequireSupport {
  constructor(toolboxPath) {
    this.toolboxPath = toolboxPath;
    this.moduleTypeCache = new Map(); // 缓存模块类型，避免重复检测
  }

  /**
   * 创建统一的 require 函数
   * 所有模块都返回 Promise，实现统一的使用体验
   * 
   * @param {Function} sandboxRequire - 沙箱环境的 require 函数
   * @returns {Function} 增强的 require 函数
   */
  createUnifiedRequire(sandboxRequire) {
    return async (moduleName) => {
      try {
        // 检测模块类型
        const moduleType = await this.detectModuleType(moduleName);
        
        logger.debug(`[ESModuleSupport] Loading ${moduleName} as ${moduleType}`);
        
        if (moduleType === 'esm') {
          // ES Module - 使用动态 import
          return await this.loadESModule(moduleName);
        } else {
          // CommonJS - 包装成 Promise 返回，统一体验
          try {
            const module = sandboxRequire(moduleName);
            return Promise.resolve(module);
          } catch (error) {
            // 如果 require 失败且错误是 ERR_REQUIRE_ESM，说明是 ES Module
            if (error.code === 'ERR_REQUIRE_ESM') {
              logger.debug(`[ESModuleSupport] Fallback to ES Module for ${moduleName}`);
              return await this.loadESModule(moduleName);
            }
            throw error;
          }
        }
      } catch (error) {
        logger.error(`[ESModuleSupport] Failed to load module ${moduleName}: ${error.message}`);
        throw new Error(`Cannot load module '${moduleName}': ${error.message}`);
      }
    };
  }

  /**
   * 检测模块类型
   * @param {string} moduleName - 模块名
   * @returns {Promise<string>} 'esm' | 'commonjs' | 'unknown'
   */
  async detectModuleType(moduleName) {
    // 检查缓存
    if (this.moduleTypeCache.has(moduleName)) {
      return this.moduleTypeCache.get(moduleName);
    }

    try {
      const packagePath = this.resolvePackagePath(moduleName);
      const packageJsonPath = path.join(packagePath, 'package.json');
      
      // 读取 package.json
      const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(packageJsonContent);
      
      let moduleType = 'commonjs'; // 默认为 CommonJS
      
      // 1. 检查 type 字段（最标准的方式）
      if (packageJson.type === 'module') {
        moduleType = 'esm';
      }
      // 2. 检查 exports 字段中的 import 条件
      else if (packageJson.exports && typeof packageJson.exports === 'object') {
        // 检查是否有 import 条件导出
        if (packageJson.exports.import || 
            (packageJson.exports['.'] && packageJson.exports['.'].import)) {
          moduleType = 'esm';
        }
      }
      // 3. 检查 module 字段（一些包用来指向 ES Module 版本）
      else if (packageJson.module) {
        // 如果有 module 字段但没有 main 字段，可能是纯 ES Module
        if (!packageJson.main) {
          moduleType = 'esm';
        }
      }
      
      // 缓存结果
      this.moduleTypeCache.set(moduleName, moduleType);
      
      logger.debug(`[ESModuleSupport] Module ${moduleName} detected as ${moduleType}`);
      return moduleType;
      
    } catch (error) {
      logger.debug(`[ESModuleSupport] Cannot detect module type for ${moduleName}: ${error.message}`);
      // 缓存为 unknown
      this.moduleTypeCache.set(moduleName, 'unknown');
      return 'unknown';
    }
  }

  /**
   * 解析包路径（支持 scoped 包）
   * @param {string} moduleName - 模块名
   * @returns {string} 包的实际路径
   */
  resolvePackagePath(moduleName) {
    const parts = moduleName.split('/');
    
    if (moduleName.startsWith('@') && parts.length >= 2) {
      // Scoped package: @scope/package 或 @scope/package/subpath
      const scopedPackageName = parts.slice(0, 2).join('/');
      return path.join(this.toolboxPath, 'node_modules', scopedPackageName);
    } else {
      // Normal package: package 或 package/subpath
      return path.join(this.toolboxPath, 'node_modules', parts[0]);
    }
  }

  /**
   * 加载 ES Module
   * @param {string} moduleName - 模块名
   * @returns {Promise<Object>} 模块对象
   */
  async loadESModule(moduleName) {
    try {
      // 获取模块的完整路径
      const modulePath = this.resolveModuleEntryPoint(moduleName);
      
      logger.debug(`[ESModuleSupport] Importing ES Module from ${modulePath}`);
      
      // 使用动态 import 加载 ES Module
      const module = await import(modulePath);
      
      // 返回模块（处理 default export）
      return module.default || module;
      
    } catch (error) {
      logger.error(`[ESModuleSupport] Failed to load ES Module ${moduleName}: ${error.message}`);
      throw new Error(`Failed to import ES Module '${moduleName}': ${error.message}`);
    }
  }

  /**
   * 解析模块入口点
   * @param {string} moduleName - 模块名
   * @returns {string} 模块入口文件的完整路径
   */
  resolveModuleEntryPoint(moduleName) {
    try {
      const packagePath = this.resolvePackagePath(moduleName);
      const packageJsonPath = path.join(packagePath, 'package.json');
      
      // 同步读取 package.json（因为这个方法可能在同步上下文中调用）
      const packageJson = require(packageJsonPath);
      
      // 解析入口点
      let entryPoint = 'index.js'; // 默认入口
      
      // 检查 exports 字段
      if (packageJson.exports) {
        if (typeof packageJson.exports === 'string') {
          entryPoint = packageJson.exports;
        } else if (packageJson.exports['.']) {
          if (typeof packageJson.exports['.'] === 'string') {
            entryPoint = packageJson.exports['.'];
          } else if (packageJson.exports['.'].import) {
            entryPoint = packageJson.exports['.'].import;
          } else if (packageJson.exports['.'].default) {
            entryPoint = packageJson.exports['.'].default;
          }
        }
      }
      // 检查 module 字段（ES Module 入口）
      else if (packageJson.module) {
        entryPoint = packageJson.module;
      }
      // 检查 main 字段（CommonJS 入口，但可能也是 ES Module）
      else if (packageJson.main) {
        entryPoint = packageJson.main;
      }
      
      // 构建完整路径
      const fullPath = path.join(packagePath, entryPoint);
      
      // 处理子路径导入（如 'lodash/chunk'）
      const parts = moduleName.split('/');
      if (moduleName.startsWith('@') && parts.length > 2) {
        // @scope/package/subpath
        const subpath = parts.slice(2).join('/');
        return path.join(packagePath, subpath);
      } else if (!moduleName.startsWith('@') && parts.length > 1) {
        // package/subpath
        const subpath = parts.slice(1).join('/');
        return path.join(packagePath, subpath);
      }
      
      return fullPath;
      
    } catch (error) {
      // 如果解析失败，返回默认路径
      return this.resolvePackagePath(moduleName);
    }
  }

  /**
   * 批量检测依赖的模块类型
   * @param {Object} dependencies - 依赖对象 { packageName: version }
   * @returns {Promise<Object>} { commonjs: [], esmodule: [], unknown: [] }
   */
  async detectDependenciesTypes(dependencies) {
    const result = {
      commonjs: [],
      esmodule: [],
      unknown: []
    };

    for (const [packageName, version] of Object.entries(dependencies)) {
      const moduleType = await this.detectModuleType(packageName);
      
      if (moduleType === 'esm') {
        result.esmodule.push({ name: packageName, version });
      } else if (moduleType === 'commonjs') {
        result.commonjs.push({ name: packageName, version });
      } else {
        result.unknown.push({ name: packageName, version });
      }
    }

    logger.debug(`[ESModuleSupport] Dependencies analysis:`, {
      commonjs: result.commonjs.length,
      esmodule: result.esmodule.length,
      unknown: result.unknown.length
    });

    return result;
  }

  /**
   * 检查是否有 ES Module 依赖
   * @param {Object} dependencies - 依赖对象
   * @returns {Promise<boolean>}
   */
  async hasESModuleDependencies(dependencies) {
    const types = await this.detectDependenciesTypes(dependencies);
    return types.esmodule.length > 0;
  }

  /**
   * 清理缓存
   */
  clearCache() {
    this.moduleTypeCache.clear();
  }

  /**
   * 获取缓存统计
   */
  getCacheStats() {
    return {
      size: this.moduleTypeCache.size,
      modules: Array.from(this.moduleTypeCache.entries())
    };
  }
}

module.exports = ESModuleRequireSupport;