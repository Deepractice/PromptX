/**
 * @fileoverview PromptX MCP Performance Monitor
 * 性能监控系统
 */

/**
 * 性能监控器
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.startTimes = new Map();
  }

  /**
   * 开始性能计时
   * @param {string} operation - 操作名称
   */
  start(operation) {
    this.startTimes.set(operation, Date.now());
  }

  /**
   * 结束性能计时
   * @param {string} operation - 操作名称
   * @returns {number} 执行时间(毫秒)
   */
  end(operation) {
    const startTime = this.startTimes.get(operation);
    if (!startTime) {
      throw new Error(`Performance monitoring not started for operation: ${operation}`);
    }

    const duration = Date.now() - startTime;
    this.startTimes.delete(operation);

    // 记录指标
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    this.metrics.get(operation).push(duration);

    return duration;
  }

  /**
   * 获取操作的性能统计
   * @param {string} operation - 操作名称
   * @returns {Object} 性能统计
   */
  getStats(operation) {
    const durations = this.metrics.get(operation) || [];
    if (durations.length === 0) {
      return null;
    }

    const sum = durations.reduce((a, b) => a + b, 0);
    const avg = sum / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);

    return {
      count: durations.length,
      average: avg,
      min,
      max,
      total: sum
    };
  }

  /**
   * 获取所有性能统计
   * @returns {Object} 所有操作的性能统计
   */
  getAllStats() {
    const stats = {};
    for (const [operation] of this.metrics) {
      stats[operation] = this.getStats(operation);
    }
    return stats;
  }

  /**
   * 清除性能数据
   */
  clear() {
    this.metrics.clear();
    this.startTimes.clear();
  }
}

module.exports = {
  PerformanceMonitor
}; 