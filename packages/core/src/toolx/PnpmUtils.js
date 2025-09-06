/**
 * PnpmUtils - pnpm相关的工具函数
 * 
 * 独立的工具类，避免循环依赖
 */

class PnpmUtils {
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
      // '--frozen-lockfile',              // CI模式，不修改lockfile（测试时去掉）
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

module.exports = PnpmUtils;