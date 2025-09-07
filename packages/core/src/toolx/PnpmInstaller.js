/**
 * PnpmInstaller - 基于 @pnpm/core API 的统一封装
 * 
 * 使用官方 pnpm API，环境无关，简化实现
 * 消除进程管理复杂性，提供结构化错误处理
 */

const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const logger = require('@promptx/logger');
const { addDependenciesToPackage } = require('@pnpm/core');
const { createOrConnectStoreController } = require('@pnpm/store-connection-manager');

class PnpmInstaller {
  /**
   * 统一的pnpm安装入口
   * @param {Object} options - 安装选项
   * @param {string} options.workingDir - 工作目录
   * @param {Object|Array} options.dependencies - 依赖列表
   * @param {number} options.timeout - 超时时间（毫秒），用于兼容，但API调用无需此参数
   * @returns {Promise<Object>} 安装结果
   */
  static async install({ workingDir, dependencies, timeout = 30000 }) {
    // Note: timeout parameter kept for API compatibility, but not used in API-based implementation
    const startTime = Date.now();
    
    // 构建依赖列表字符串用于日志
    const depsList = this.buildDependenciesList(dependencies);
    
    logger.info(`[PnpmInstaller] Starting installation via @pnpm/core API: [${depsList}]`);
    logger.debug(`[PnpmInstaller] Working directory: ${workingDir}`);
    
    let storeController;
    
    try {
      // 使用 ~/.promptx 作为全局共享存储目录
      const promptxHome = path.join(os.homedir(), '.promptx');
      const globalStoreDir = path.join(promptxHome, 'pnpm-store');
      const globalCacheDir = path.join(promptxHome, 'pnpm-cache');
      
      // 创建 store controller
      const { ctrl: storeCtrl, dir: storeDir } = await createOrConnectStoreController({
        storeDir: globalStoreDir,
        cacheDir: globalCacheDir,
        dir: workingDir,
        rawConfig: {},
        registries: {
          default: 'https://registry.npmjs.org/',
        },
      });
      
      storeController = storeCtrl;
      
      // 读取 package.json
      const packageJsonPath = path.join(workingDir, 'package.json');
      const manifest = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      // 规范化依赖格式
      const normalizedDeps = this.normalizeDependencies(dependencies);
      const dependencySelectors = Object.entries(normalizedDeps).map(
        ([name, version]) => `${name}@${version}`
      );
      
      logger.debug(`[PnpmInstaller] Installing dependencies: ${JSON.stringify(dependencySelectors)}`);
      
      // 使用 @pnpm/core API 安装依赖
      const result = await addDependenciesToPackage(manifest, dependencySelectors, {
        dir: workingDir,
        allowNew: true,
        storeDir,
        storeController,
      });
      
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      logger.info(`[PnpmInstaller] Installation completed successfully in ${elapsed}s`);
      
      return {
        success: true,
        elapsed: elapsed,
        manifest: result.updatedManifest,
        environment: 'pnpm-api'
      };
      
    } catch (error) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      logger.error(`[PnpmInstaller] Installation failed after ${elapsed}s: ${error.message}`);
      
      throw new Error(`pnpm installation failed: ${error.message}`);
    } finally {
      // 清理资源 - 标准的 pnpm API 清理方式
      if (storeController) {
        try {
          await storeController.close();
          logger.debug(`[PnpmInstaller] Store controller closed successfully`);
        } catch (closeError) {
          logger.warn(`[PnpmInstaller] Warning: Failed to close store controller: ${closeError.message}`);
        }
      }
      
      // 注意：@pnpm/core 会保持 HTTP 连接池活跃，这在长期运行的进程中是正常的
      // 在沙箱环境中，进程生命周期由外部管理，不需要强制退出
    }
  }
  
  /**
   * 构建依赖列表字符串用于日志
   * @param {Object|Array} dependencies - 依赖
   * @returns {string} 格式化的依赖列表
   */
  static buildDependenciesList(dependencies) {
    if (!dependencies) return '';
    
    if (typeof dependencies === 'object' && !Array.isArray(dependencies)) {
      // 对象格式：{"package": "version"}
      return Object.keys(dependencies)
        .map(name => `${name}@${dependencies[name]}`)
        .join(', ');
    } else if (Array.isArray(dependencies)) {
      // 数组格式：["package@version"]
      return dependencies.join(', ');
    }
    
    return String(dependencies);
  }
  
  /**
   * 规范化依赖格式为对象
   * @param {Object|Array} dependencies - 原始依赖
   * @returns {Object} 规范化的依赖对象
   */
  static normalizeDependencies(dependencies) {
    if (!dependencies) return {};
    
    if (typeof dependencies === 'object' && !Array.isArray(dependencies)) {
      // 已经是对象格式
      return dependencies;
    }
    
    if (Array.isArray(dependencies)) {
      // 数组格式转对象
      const normalized = {};
      for (const dep of dependencies) {
        if (dep.includes('@')) {
          const lastAtIndex = dep.lastIndexOf('@');
          if (lastAtIndex > 0) {
            const name = dep.substring(0, lastAtIndex);
            const version = dep.substring(lastAtIndex + 1);
            normalized[name] = version;
          } else {
            normalized[dep] = 'latest';
          }
        } else {
          normalized[dep] = 'latest';
        }
      }
      return normalized;
    }
    
    return {};
  }
  
  /**
   * 创建package.json文件
   * @param {string} workingDir - 工作目录
   * @param {string} toolId - 工具ID
   * @param {Object|Array} dependencies - 依赖列表
   */
  static async createPackageJson(workingDir, toolId, dependencies) {
    const fs = require('fs').promises;
    const path = require('path');
    
    const packageJsonPath = path.join(workingDir, 'package.json');
    
    const packageJson = {
      name: `toolbox-${toolId}`,
      version: '1.0.0',
      description: `Sandbox for tool: ${toolId}`,
      private: true,
      dependencies: this.normalizeDependencies(dependencies)
    };
    
    logger.debug(`[PnpmInstaller] Creating package.json: ${packageJsonPath}`);
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }
}

module.exports = PnpmInstaller;