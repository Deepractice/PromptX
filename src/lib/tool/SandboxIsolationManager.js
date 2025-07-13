const path = require('path');
const Module = require('module');

/**
 * SandboxIsolationManager - 统一管理所有沙箱隔离逻辑
 * 
 * 职责：
 * - 创建完全隔离的VM沙箱环境
 * - 统一管理模块系统、进程环境、全局对象的隔离
 * - 提供安全、一致的沙箱执行上下文
 */
class SandboxIsolationManager {
  constructor(sandboxPath, options = {}) {
    this.sandboxPath = sandboxPath;
    this.options = {
      enableDependencyLoading: true,
      enableBuiltinModules: true,
      enableFileSystemAccess: false,
      ...options
    };
    this.isolatedContext = null;
  }

  /**
   * 创建完全隔离的沙箱环境
   * @returns {Object} 隔离的沙箱上下文
   */
  createIsolatedContext() {
    if (this.isolatedContext) {
      return this.isolatedContext;
    }

    this.isolatedContext = {
      // 1. 模块系统隔离 - 核心功能
      require: this.createIsolatedRequire(),
      module: { exports: {} },
      exports: {},
      
      // 2. 进程环境隔离
      process: this.createIsolatedProcess(),
      
      // 3. 全局对象隔离
      ...this.createIsolatedGlobals(),
      
      // 4. 路径相关隔离
      __dirname: this.sandboxPath,
      __filename: path.join(this.sandboxPath, 'sandbox.js')
    };

    return this.isolatedContext;
  }

  /**
   * 创建隔离的require函数 - 解决核心依赖加载问题
   * @returns {Function} 隔离的require函数
   */
  createIsolatedRequire() {
    // 关键：使用Module.createRequire创建绑定到沙箱路径的require
    const contextFile = path.join(this.sandboxPath, 'package.json');
    let sandboxRequire;
    
    try {
      // 创建绑定到沙箱上下文的require
      sandboxRequire = Module.createRequire(contextFile);
    } catch (error) {
      // fallback: 如果package.json不存在，使用虚拟路径
      const virtualContextFile = path.join(this.sandboxPath, 'virtual-context.js');
      sandboxRequire = Module.createRequire(virtualContextFile);
    }

    // 返回增强的require函数
    return (moduleName) => {
      try {
        // 优先使用沙箱require（自动处理符号链接）
        return sandboxRequire(moduleName);
      } catch (error) {
        // 智能fallback处理
        return this.handleRequireFallback(moduleName, error);
      }
    };
  }

  /**
   * 处理require失败的智能fallback
   * @param {string} moduleName - 模块名
   * @param {Error} error - 原始错误
   * @returns {*} 模块对象或抛出错误
   */
  handleRequireFallback(moduleName, error) {
    // 1. 尝试加载Node.js内置模块
    if (this.options.enableBuiltinModules && this.isBuiltinModule(moduleName)) {
      try {
        return require(moduleName);
      } catch (builtinError) {
        // 内置模块加载失败，继续下一步
      }
    }

    // 2. 如果是分析阶段且模块不存在，返回mock对象
    if (this.options.analysisMode && error.code === 'MODULE_NOT_FOUND') {
      console.log(`[SandboxIsolation] 分析模式：mock模块 ${moduleName}`);
      return this.createMockModule(moduleName);
    }

    // 3. 其他情况直接抛出原始错误
    throw error;
  }

  /**
   * 检查是否为Node.js内置模块
   * @param {string} moduleName - 模块名
   * @returns {boolean} 是否为内置模块
   */
  isBuiltinModule(moduleName) {
    const builtinModules = [
      'path', 'fs', 'url', 'crypto', 'util', 'os', 'events', 'stream',
      'http', 'https', 'querystring', 'zlib', 'buffer', 'child_process'
    ];
    
    return builtinModules.includes(moduleName) || moduleName.startsWith('node:');
  }

  /**
   * 创建mock模块对象
   * @param {string} moduleName - 模块名
   * @returns {Object} mock对象
   */
  createMockModule(moduleName) {
    return new Proxy({}, {
      get: () => () => ({}),  // 所有属性和方法都返回空函数/对象
      apply: () => ({}),      // 如果被当作函数调用
      construct: () => ({})   // 如果被当作构造函数
    });
  }

  /**
   * 创建隔离的process对象
   * @returns {Object} 隔离的process对象
   */
  createIsolatedProcess() {
    return {
      // 环境变量（浅拷贝，避免污染）
      env: { ...process.env },
      
      // 工作目录隔离
      cwd: () => this.sandboxPath,
      
      // 安全的只读属性
      version: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      
      // 时间相关
      hrtime: process.hrtime,
      uptime: process.uptime,
      
      // 禁用危险方法
      exit: () => { throw new Error('process.exit() is not allowed in sandbox'); },
      abort: () => { throw new Error('process.abort() is not allowed in sandbox'); }
    };
  }

  /**
   * 创建隔离的全局对象
   * @returns {Object} 安全的全局对象集合
   */
  createIsolatedGlobals() {
    return {
      // 基础类型
      Object: Object,
      Array: Array,
      String: String,
      Number: Number,
      Boolean: Boolean,
      Date: Date,
      RegExp: RegExp,
      Error: Error,
      
      // JSON处理
      JSON: JSON,
      
      // 数学对象
      Math: Math,
      
      // URL处理
      URL: URL,
      URLSearchParams: URLSearchParams,
      
      // 缓冲区
      Buffer: Buffer,
      
      // 定时器
      setTimeout: setTimeout,
      clearTimeout: clearTimeout,
      setInterval: setInterval,
      clearInterval: clearInterval,
      setImmediate: setImmediate,
      clearImmediate: clearImmediate,
      
      // 输出
      console: console,
      
      // Promise相关
      Promise: Promise
    };
  }

  /**
   * 启用分析模式 - 用于工具分析阶段
   */
  enableAnalysisMode() {
    this.options.analysisMode = true;
    // 重置上下文以应用新选项
    this.isolatedContext = null;
  }

  /**
   * 启用执行模式 - 用于工具执行阶段
   */
  enableExecutionMode() {
    this.options.analysisMode = false;
    // 重置上下文以应用新选项
    this.isolatedContext = null;
  }

  /**
   * 清理隔离管理器
   */
  cleanup() {
    this.isolatedContext = null;
  }

  /**
   * 获取隔离状态信息
   * @returns {Object} 状态信息
   */
  getIsolationStatus() {
    return {
      sandboxPath: this.sandboxPath,
      options: this.options,
      contextCreated: !!this.isolatedContext,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = SandboxIsolationManager;