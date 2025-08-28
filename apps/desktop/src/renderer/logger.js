/**
 * Renderer Logger - 统一的日志工具
 * 同时输出到控制台和主进程
 */

class RendererLogger {
  constructor() {
    this.prefix = '[Renderer]'
  }

  _log(level, message, ...args) {
    // 输出到浏览器控制台
    const consoleMethods = {
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug,
      log: console.log
    }
    
    const consoleMethod = consoleMethods[level] || console.log
    consoleMethod(`${this.prefix} ${message}`, ...args)
    
    // 发送到主进程
    if (window.electronAPI && window.electronAPI.log) {
      window.electronAPI.log(level, message, args.length > 0 ? args : undefined)
    }
  }

  error(message, ...args) {
    this._log('error', message, ...args)
  }

  warn(message, ...args) {
    this._log('warn', message, ...args)
  }

  info(message, ...args) {
    this._log('info', message, ...args)
  }

  debug(message, ...args) {
    this._log('debug', message, ...args)
  }

  log(message, ...args) {
    this._log('log', message, ...args)
  }

  // 成功日志（显示绿色）
  success(message, ...args) {
    console.log(`%c${this.prefix} ✅ ${message}`, 'color: #10b981', ...args)
    if (window.electronAPI && window.electronAPI.log) {
      window.electronAPI.log('info', `✅ ${message}`, args.length > 0 ? args : undefined)
    }
  }

  // 步骤日志（显示蓝色）
  step(message, ...args) {
    console.log(`%c${this.prefix} ▶️ ${message}`, 'color: #3b82f6', ...args)
    if (window.electronAPI && window.electronAPI.log) {
      window.electronAPI.log('info', `▶️ ${message}`, args.length > 0 ? args : undefined)
    }
  }
}

// 导出单例
const logger = new RendererLogger()

// 兼容 CommonJS 和 ES6 模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = logger
}

// 全局暴露给其他脚本使用
window.rendererLogger = logger