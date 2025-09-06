/**
 * PnpmInstaller - pnpm安装的统一封装
 * 
 * 自动检测环境（Electron vs CLI）并选择最优的安装策略
 * 用户无需关心底层实现细节
 */

const isElectron = require('is-electron');
const logger = require('@promptx/logger');
const ElectronPnpmWorker = require('./ElectronPnpmWorker');
const SystemPnpmRunner = require('./SystemPnpmRunner');

class PnpmInstaller {
  /**
   * 统一的pnpm安装入口
   * @param {Object} options - 安装选项
   * @param {string} options.workingDir - 工作目录
   * @param {Object|Array} options.dependencies - 依赖列表
   * @param {number} options.timeout - 超时时间（毫秒），默认30秒
   * @returns {Promise<Object>} 安装结果
   */
  static async install({ workingDir, dependencies, timeout = 30000 }) {
    const startTime = Date.now();
    
    // 构建依赖列表字符串用于日志
    const depsList = this.buildDependenciesList(dependencies);
    
    logger.info(`[PnpmInstaller] Starting installation: [${depsList}]`);
    logger.debug(`[PnpmInstaller] Working directory: ${workingDir}`);
    
    try {
      // 自动检测环境并选择合适的安装器
      const isInElectron = isElectron();
      logger.debug(`[PnpmInstaller] Environment detected: ${isInElectron ? 'Electron' : 'System Node.js'}`);
      
      let result;
      if (isInElectron) {
        // Electron环境：使用utilityProcess隔离
        result = await ElectronPnpmWorker.install({ workingDir, dependencies, timeout });
      } else {
        // CLI环境：直接使用系统Node.js
        result = await SystemPnpmRunner.install({ workingDir, dependencies, timeout });
      }
      
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      logger.info(`[PnpmInstaller] Installation completed successfully in ${elapsed}s`);
      
      return {
        success: true,
        elapsed: elapsed,
        stdout: result.stdout || '',
        stderr: result.stderr || '',
        environment: isInElectron ? 'electron' : 'system'
      };
      
    } catch (error) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      logger.error(`[PnpmInstaller] Installation failed after ${elapsed}s: ${error.message}`);
      
      throw new Error(`pnpm installation failed: ${error.message}`);
    }
  }
  
  /**
   * 构建依赖列表字符串
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
   * 获取优化的pnpm参数
   * @returns {string[]} pnpm参数数组
   */
  static getOptimizedPnpmArgs() {
    return [
      'install',
      '--frozen-lockfile',              // CI模式，不修改lockfile
      '--ignore-scripts',               // 跳过scripts提高安全性和速度
      '--config.confirmModulesPurge=false',  // 非交互模式
      '--reporter=append-only',         // 简洁输出格式
      '--no-optional'                   // 跳过可选依赖加速安装
    ];
  }
  
  /**
   * 获取内置pnpm路径
   * @returns {string} pnpm.cjs的绝对路径
   */
  static getPnpmBinaryPath() {
    const path = require('path');
    const pnpmModulePath = require.resolve('pnpm');
    return path.join(path.dirname(pnpmModulePath), 'bin', 'pnpm.cjs');
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
}

module.exports = PnpmInstaller;