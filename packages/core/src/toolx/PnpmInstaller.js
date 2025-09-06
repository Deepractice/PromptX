/**
 * PnpmInstaller - pnpm安装的统一封装
 * 
 * 自动检测环境（Electron vs CLI）并选择最优的安装策略
 * 用户无需关心底层实现细节
 */

const isElectron = require('is-electron');
const logger = require('@promptx/logger');
const PnpmUtils = require('./PnpmUtils');
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
    const depsList = PnpmUtils.buildDependenciesList(dependencies);
    
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
   * 构建依赖列表字符串 (委托给 PnpmUtils)
   */
  static buildDependenciesList(dependencies) {
    return PnpmUtils.buildDependenciesList(dependencies);
  }
  
  /**
   * 获取优化的pnpm参数 (委托给 PnpmUtils)
   */
  static getOptimizedPnpmArgs() {
    return PnpmUtils.getOptimizedPnpmArgs();
  }
  
  /**
   * 获取内置pnpm路径 (委托给 PnpmUtils)
   */
  static getPnpmBinaryPath() {
    return PnpmUtils.getPnpmBinaryPath();
  }
  
  /**
   * 规范化依赖格式为对象 (委托给 PnpmUtils)
   */
  static normalizeDependencies(dependencies) {
    return PnpmUtils.normalizeDependencies(dependencies);
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
      dependencies: PnpmUtils.normalizeDependencies(dependencies)
    };
    
    logger.debug(`[PnpmInstaller] Creating package.json: ${packageJsonPath}`);
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }
}

module.exports = PnpmInstaller;