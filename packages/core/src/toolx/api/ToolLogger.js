/**
 * ToolLogger - 工具执行日志记录器
 * 
 * 简单的日志记录，写入到 sandbox/logs/execute.log
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const logger = require('@promptx/logger');

class ToolLogger {
  constructor(toolId, sandboxPath) {
    this.toolId = toolId;
    this.sandboxPath = sandboxPath;
    this.logPath = path.join(sandboxPath, 'logs');
    this.logFile = path.join(this.logPath, 'execute.log');
    
    // 确保日志目录存在
    this._ensureLogDir();
  }

  /**
   * 确保日志目录存在
   * @private
   */
  _ensureLogDir() {
    try {
      if (!fs.existsSync(this.logPath)) {
        fs.mkdirSync(this.logPath, { recursive: true });
      }
    } catch (error) {
      logger.error(`[ToolLogger] Failed to create log directory: ${error.message}`);
    }
  }

  /**
   * 格式化日志消息
   * @private
   */
  _format(level, message, data) {
    const timestamp = new Date().toISOString();
    const toolTag = `[${this.toolId}]`;
    const levelTag = `[${level}]`;
    
    let logLine = `${timestamp} ${levelTag} ${toolTag} ${message}`;
    
    // 如果有额外数据，追加为 JSON
    if (data && Object.keys(data).length > 0) {
      logLine += ` ${util.inspect(data, { compact: true, breakLength: Infinity })}`;
    }
    
    return logLine + '\n';
  }

  /**
   * 写入日志
   * @private
   */
  _write(content) {
    try {
      fs.appendFileSync(this.logFile, content, 'utf8');
    } catch (error) {
      logger.error(`[ToolLogger] Failed to write log: ${error.message}`);
    }
  }

  /**
   * 记录 debug 日志
   */
  debug(message, data = {}) {
    const content = this._format('DEBUG', message, data);
    this._write(content);
    
    // Debug 总是输出到 promptx logger，方便鲁班调试
    logger.debug(`[ToolLogger:${this.toolId}] ${message}`, data);
  }

  /**
   * 记录 info 日志
   */
  info(message, data = {}) {
    const content = this._format('INFO', message, data);
    this._write(content);
    
    // 同时输出到 promptx logger（开发时方便调试）
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`[ToolLogger:${this.toolId}] ${message}`, data);
    }
  }

  /**
   * 记录 warn 日志
   */
  warn(message, data = {}) {
    const content = this._format('WARN', message, data);
    this._write(content);
    
    // 警告输出到 promptx logger
    logger.warn(`[ToolLogger:${this.toolId}] ${message}`, data);
  }

  /**
   * 记录 error 日志
   */
  error(message, error = null) {
    const data = {};
    
    // 如果传入的是 Error 对象，提取信息
    if (error instanceof Error) {
      data.error = {
        message: error.message,
        stack: error.stack,
        code: error.code
      };
    } else if (error) {
      data.error = error;
    }
    
    const content = this._format('ERROR', message, data);
    this._write(content);
    
    // 错误总是输出到 promptx logger
    logger.error(`[ToolLogger:${this.toolId}] ${message}`, data);
  }

  /**
   * 记录任意级别的日志（通用方法）
   */
  log(level, message, data = {}) {
    // 标准化级别名称
    const normalizedLevel = level.toUpperCase();
    const content = this._format(normalizedLevel, message, data);
    this._write(content);
    
    // 输出到 promptx logger
    const loggerMethod = logger[level.toLowerCase()] || logger.debug;
    loggerMethod(`[ToolLogger:${this.toolId}] ${message}`, data);
  }

  /**
   * 记录 trace 日志（最详细的调试信息）
   */
  trace(message, data = {}) {
    const content = this._format('TRACE', message, data);
    this._write(content);
    
    // Trace 输出到 debug 级别
    logger.debug(`[ToolLogger:${this.toolId}] [TRACE] ${message}`, data);
  }

  /**
   * 记录 fatal 日志（致命错误）
   */
  fatal(message, data = {}) {
    const content = this._format('FATAL', message, data);
    this._write(content);
    
    // Fatal 输出到 error 级别
    logger.error(`[ToolLogger:${this.toolId}] [FATAL] ${message}`, data);
  }

  /**
   * 获取日志文件路径
   */
  getLogPath() {
    return this.logFile;
  }
}

module.exports = ToolLogger;