/**
 * @fileoverview PromptX MCP Logger System
 * 统一日志记录系统
 */

/**
 * 统一日志记录器
 */
class Logger {
  /**
   * 记录日志
   * @param {string} level - 日志级别 (info, error, debug, warn)
   * @param {string} message - 日志消息
   * @param {Object} data - 附加数据
   */
  static log(level, message, data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...data
    };
    console.log(JSON.stringify(logEntry));
  }

  /**
   * 记录信息日志
   * @param {string} message - 日志消息
   * @param {Object} data - 附加数据
   */
  static info(message, data = {}) {
    this.log('info', message, data);
  }

  /**
   * 记录错误日志
   * @param {string} message - 日志消息
   * @param {Object} data - 附加数据
   */
  static error(message, data = {}) {
    this.log('error', message, data);
  }

  /**
   * 记录调试日志
   * @param {string} message - 日志消息
   * @param {Object} data - 附加数据
   */
  static debug(message, data = {}) {
    this.log('debug', message, data);
  }

  /**
   * 记录警告日志
   * @param {string} message - 日志消息
   * @param {Object} data - 附加数据
   */
  static warn(message, data = {}) {
    this.log('warn', message, data);
  }
}

module.exports = {
  Logger
}; 