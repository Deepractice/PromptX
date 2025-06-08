/**
 * @fileoverview Resource Management Utilities
 * 🔵 REFACTOR Phase: Common utilities for resource management
 */

/**
 * 资源管理日志记录器
 */
class ResourceLogger {
  constructor(prefix = 'ResourceManager') {
    this.prefix = prefix;
    this.logLevel = process.env.NODE_ENV === 'development' ? 'debug' : 'info';
  }

  _formatMessage(level, message, meta = {}) {
    return {
      timestamp: new Date().toISOString(),
      level,
      prefix: this.prefix,
      message,
      meta,
      pid: process.pid
    };
  }

  debug(message, meta) {
    if (this.logLevel === 'debug') {
      console.log(JSON.stringify(this._formatMessage('DEBUG', message, meta)));
    }
  }

  info(message, meta) {
    console.log(JSON.stringify(this._formatMessage('INFO', message, meta)));
  }

  warn(message, meta) {
    console.warn(JSON.stringify(this._formatMessage('WARN', message, meta)));
  }

  error(message, meta) {
    console.error(JSON.stringify(this._formatMessage('ERROR', message, meta)));
  }
}

/**
 * 资源管理错误处理器
 */
class ResourceErrorHandler {
  static handle(error, context = '') {
    const errorInfo = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    };

    console.error('ResourceManager Error:', JSON.stringify(errorInfo, null, 2));
    
    return errorInfo;
  }

  static async safeExecute(operation, fallback = null, context = '') {
    try {
      return await operation();
    } catch (error) {
      this.handle(error, context);
      return fallback;
    }
  }
}

/**
 * 资源性能监控器
 */
class ResourcePerformanceMonitor {
  constructor() {
    this.metrics = new Map();
  }

  startTimer(name) {
    this.metrics.set(name, {
      startTime: process.hrtime.bigint(),
      startMemory: process.memoryUsage()
    });
  }

  endTimer(name) {
    const metric = this.metrics.get(name);
    if (!metric) return null;

    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage();
    
    const result = {
      name,
      duration: Number(endTime - metric.startTime) / 1_000_000, // ms
      memoryDelta: {
        rss: endMemory.rss - metric.startMemory.rss,
        heapUsed: endMemory.heapUsed - metric.startMemory.heapUsed,
        heapTotal: endMemory.heapTotal - metric.startMemory.heapTotal,
        external: endMemory.external - metric.startMemory.external
      }
    };

    this.metrics.delete(name);
    return result;
  }

  async measure(name, operation) {
    this.startTimer(name);
    try {
      const result = await operation();
      const metrics = this.endTimer(name);
      return { result, metrics };
    } catch (error) {
      this.endTimer(name);
      throw error;
    }
  }
}

/**
 * 资源验证器
 */
class ResourceValidator {
  static validateConfig(config, schema) {
    const errors = [];

    for (const [key, rules] of Object.entries(schema)) {
      const value = config[key];

      if (rules.required && (value === undefined || value === null)) {
        errors.push(`${key} is required`);
        continue;
      }

      if (value !== undefined) {
        if (rules.type && typeof value !== rules.type) {
          errors.push(`${key} must be of type ${rules.type}`);
        }

        if (rules.min !== undefined && value < rules.min) {
          errors.push(`${key} must be >= ${rules.min}`);
        }

        if (rules.max !== undefined && value > rules.max) {
          errors.push(`${key} must be <= ${rules.max}`);
        }

        if (rules.enum && !rules.enum.includes(value)) {
          errors.push(`${key} must be one of: ${rules.enum.join(', ')}`);
        }
      }
    }

    return errors;
  }

  static validateMemoryThreshold(thresholdMB, name = 'threshold') {
    if (typeof thresholdMB !== 'number' || thresholdMB <= 0) {
      throw new Error(`${name} must be a positive number`);
    }
    if (thresholdMB > 8192) { // 8GB limit
      throw new Error(`${name} must not exceed 8192MB`);
    }
  }

  static validatePoolSize(size, name = 'pool size') {
    if (!Number.isInteger(size) || size <= 0) {
      throw new Error(`${name} must be a positive integer`);
    }
    if (size > 1000) {
      throw new Error(`${name} must not exceed 1000`);
    }
  }
}

/**
 * 创建带有错误处理的异步延迟函数
 */
function createDelay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 创建带有超时的Promise
 */
function withTimeout(promise, timeoutMs, errorMessage = 'Operation timed out') {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ]);
}

/**
 * 格式化字节数为人类可读格式
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

module.exports = {
  ResourceLogger,
  ResourceErrorHandler,
  ResourcePerformanceMonitor,
  ResourceValidator,
  createDelay,
  withTimeout,
  formatBytes
}; 