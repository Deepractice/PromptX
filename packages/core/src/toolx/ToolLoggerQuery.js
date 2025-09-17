/**
 * ToolLoggerQuery - 工具日志查询器
 * 
 * 提供日志查询功能，供系统使用
 * 与 ToolLogger 分离，专注于读取和分析日志
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const logger = require('@promptx/logger');

class ToolLoggerQuery {
  constructor(toolId, sandboxPath) {
    this.toolId = toolId;
    this.sandboxPath = sandboxPath;
    this.logPath = path.join(sandboxPath, 'logs');
    this.logFile = path.join(this.logPath, 'execute.log');
  }

  /**
   * 检查日志文件是否存在
   * @private
   */
  _fileExists() {
    return fs.existsSync(this.logFile);
  }

  /**
   * 解析日志行
   * @private
   */
  _parseLine(line) {
    try {
      // 格式：2025-01-17T12:30:45.123Z [INFO] [tool-id] message {data}
      const match = line.match(/^(\S+)\s+\[(\w+)\]\s+\[([^\]]+)\]\s+(.+)$/);
      if (!match) return null;

      const [, timestamp, level, toolId, rest] = match;
      
      // 尝试分离消息和数据
      const dataMatch = rest.match(/^(.+?)\s+(\{.+\})$/);
      let message = rest;
      let data = {};
      
      if (dataMatch) {
        message = dataMatch[1];
        try {
          // 使用 eval 解析 util.inspect 格式的对象
          data = eval(`(${dataMatch[2]})`);
        } catch (e) {
          // 解析失败，保持原样
        }
      }

      return {
        timestamp,
        level,
        toolId,
        message,
        data,
        raw: line
      };
    } catch (error) {
      return { raw: line };
    }
  }

  /**
   * 获取最近的日志行
   * @param {number} lines - 要获取的行数
   * @returns {Promise<Array>} 日志条目数组
   */
  async tail(lines = 50) {
    if (!this._fileExists()) {
      return [];
    }

    try {
      const content = await fs.promises.readFile(this.logFile, 'utf8');
      const allLines = content.trim().split('\n').filter(Boolean);
      const selectedLines = allLines.slice(-lines);
      
      return selectedLines.map(line => this._parseLine(line)).filter(Boolean);
    } catch (error) {
      logger.error(`[ToolLoggerQuery] Failed to tail log: ${error.message}`);
      return [];
    }
  }

  /**
   * 搜索日志
   * @param {string} keyword - 搜索关键词
   * @param {Object} options - 搜索选项
   * @returns {Promise<Array>} 匹配的日志条目
   */
  async search(keyword, options = {}) {
    if (!this._fileExists()) {
      return [];
    }

    const {
      level = null,      // 筛选日志级别
      limit = 100,       // 最大返回数量
      regex = false      // 是否使用正则表达式
    } = options;

    const results = [];
    const searchPattern = regex ? new RegExp(keyword, 'i') : null;

    return new Promise((resolve, reject) => {
      const rl = readline.createInterface({
        input: fs.createReadStream(this.logFile),
        crlfDelay: Infinity
      });

      rl.on('line', (line) => {
        if (results.length >= limit) {
          rl.close();
          return;
        }

        const parsed = this._parseLine(line);
        if (!parsed) return;

        // 级别筛选
        if (level && parsed.level !== level) return;

        // 关键词匹配
        const matches = searchPattern
          ? searchPattern.test(line)
          : line.toLowerCase().includes(keyword.toLowerCase());

        if (matches) {
          results.push(parsed);
        }
      });

      rl.on('close', () => {
        resolve(results);
      });

      rl.on('error', (error) => {
        logger.error(`[ToolLoggerQuery] Search error: ${error.message}`);
        reject(error);
      });
    });
  }

  /**
   * 按时间范围查询
   * @param {Date|string} startTime - 开始时间
   * @param {Date|string} endTime - 结束时间
   * @returns {Promise<Array>} 时间范围内的日志
   */
  async getByTimeRange(startTime, endTime) {
    if (!this._fileExists()) {
      return [];
    }

    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const results = [];

    return new Promise((resolve, reject) => {
      const rl = readline.createInterface({
        input: fs.createReadStream(this.logFile),
        crlfDelay: Infinity
      });

      rl.on('line', (line) => {
        const parsed = this._parseLine(line);
        if (!parsed || !parsed.timestamp) return;

        const logTime = new Date(parsed.timestamp).getTime();
        if (logTime >= start && logTime <= end) {
          results.push(parsed);
        }
      });

      rl.on('close', () => {
        resolve(results);
      });

      rl.on('error', (error) => {
        logger.error(`[ToolLoggerQuery] Time range query error: ${error.message}`);
        reject(error);
      });
    });
  }

  /**
   * 获取日志统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async getStats() {
    if (!this._fileExists()) {
      return {
        exists: false,
        size: 0,
        lines: 0,
        levels: {},
        firstLog: null,
        lastLog: null
      };
    }

    try {
      const stats = await fs.promises.stat(this.logFile);
      const content = await fs.promises.readFile(this.logFile, 'utf8');
      const lines = content.trim().split('\n').filter(Boolean);
      
      const levels = { TRACE: 0, DEBUG: 0, INFO: 0, WARN: 0, ERROR: 0, FATAL: 0 };
      let firstLog = null;
      let lastLog = null;

      lines.forEach((line, index) => {
        const parsed = this._parseLine(line);
        if (parsed && parsed.level) {
          levels[parsed.level] = (levels[parsed.level] || 0) + 1;
          
          if (index === 0) firstLog = parsed;
          if (index === lines.length - 1) lastLog = parsed;
        }
      });

      return {
        exists: true,
        size: stats.size,
        sizeHuman: this._formatSize(stats.size),
        lines: lines.length,
        levels,
        firstLog: firstLog ? {
          timestamp: firstLog.timestamp,
          message: firstLog.message
        } : null,
        lastLog: lastLog ? {
          timestamp: lastLog.timestamp,
          message: lastLog.message
        } : null,
        logFile: this.logFile
      };
    } catch (error) {
      logger.error(`[ToolLoggerQuery] Failed to get stats: ${error.message}`);
      return {
        exists: false,
        error: error.message
      };
    }
  }

  /**
   * 清空日志文件
   * @returns {Promise<boolean>} 是否成功
   */
  async clear() {
    try {
      await fs.promises.writeFile(this.logFile, '', 'utf8');
      logger.info(`[ToolLoggerQuery] Cleared log file for ${this.toolId}`);
      return true;
    } catch (error) {
      logger.error(`[ToolLoggerQuery] Failed to clear log: ${error.message}`);
      return false;
    }
  }

  /**
   * 获取错误日志
   * @param {number} limit - 最大数量
   * @returns {Promise<Array>} 错误日志列表
   */
  async getErrors(limit = 50) {
    return this.search('', { level: 'ERROR', limit });
  }

  /**
   * 获取警告日志
   * @param {number} limit - 最大数量
   * @returns {Promise<Array>} 警告日志列表
   */
  async getWarnings(limit = 50) {
    return this.search('', { level: 'WARN', limit });
  }

  /**
   * 获取调试日志
   * @param {number} limit - 最大数量
   * @returns {Promise<Array>} 调试日志列表
   */
  async getDebugLogs(limit = 50) {
    return this.search('', { level: 'DEBUG', limit });
  }

  /**
   * 格式化文件大小
   * @private
   */
  _formatSize(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  }
}

module.exports = ToolLoggerQuery;