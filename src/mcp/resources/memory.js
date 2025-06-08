/**
 * @fileoverview Memory Monitor & Leak Detection - 内存监控和泄漏检测
 * PromptX MCP Advanced Resource Management - Green Phase Implementation
 */

class MemoryMonitor {
  constructor(options = {}) {
    this.config = {
      warningThresholdMB: options.warningThresholdMB || 200,
      criticalThresholdMB: options.criticalThresholdMB || 400,
      checkIntervalMs: options.checkIntervalMs || 5000,
      leakDetectionEnabled: options.leakDetectionEnabled || false,
      leakThresholdMB: options.leakThresholdMB || 50,
      autoGCEnabled: options.autoGCEnabled || false
    };

    this.running = false;
    this.executions = [];
    this.gcHistory = [];
    this.intervalId = null;

    // 转换阈值为字节
    this.config.warningThreshold = this.config.warningThresholdMB * 1024 * 1024;
    this.config.criticalThreshold = this.config.criticalThresholdMB * 1024 * 1024;
  }

  async start() {
    this.running = true;
    
    if (this.config.checkIntervalMs > 0) {
      this.intervalId = setInterval(() => {
        this._checkMemory();
      }, this.config.checkIntervalMs);
    }
  }

  async stop() {
    this.running = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  isRunning() {
    return this.running;
  }

  getConfig() {
    return { ...this.config };
  }

  async trackExecution(executionId, memoryInfo) {
    if (this.config.leakDetectionEnabled) {
      this.executions.push({
        id: executionId,
        timestamp: Date.now(),
        memoryBefore: memoryInfo.memoryBefore,
        memoryAfter: memoryInfo.memoryAfter,
        delta: memoryInfo.memoryAfter - memoryInfo.memoryBefore
      });

      // 保持最近1000个执行记录
      if (this.executions.length > 1000) {
        this.executions = this.executions.slice(-1000);
      }
    }
  }

  async detectLeaks() {
    if (!this.config.leakDetectionEnabled || this.executions.length < 10) {
      return [];
    }

    const leaks = [];
    
    // 检测渐进式内存增长
    const recentExecutions = this.executions.slice(-50);
    const totalDelta = recentExecutions.reduce((sum, exec) => sum + exec.delta, 0);
    const avgDelta = totalDelta / recentExecutions.length;

    if (avgDelta > 1024 * 1024) { // 平均每次执行增长超过1MB
      leaks.push({
        type: 'gradual-increase',
        severity: 'medium',
        description: `检测到渐进式内存增长，平均每次执行增长 ${(avgDelta / 1024 / 1024).toFixed(2)}MB`,
        avgDelta: avgDelta
      });
    }

    return leaks;
  }

  async checkMemoryPressure(currentMemory) {
    if (currentMemory > this.config.criticalThreshold && this.config.autoGCEnabled) {
      await this._triggerGC(currentMemory);
    }
  }

  getGCHistory() {
    return [...this.gcHistory];
  }

  async _triggerGC(memoryBefore) {
    const gcEvent = {
      timestamp: Date.now(),
      trigger: 'memory-pressure',
      memoryBefore: memoryBefore,
      memoryAfter: memoryBefore - 1024 * 1024 * 10 // 模拟释放10MB
    };

    this.gcHistory.push(gcEvent);

    // 保持最近100个GC记录
    if (this.gcHistory.length > 100) {
      this.gcHistory = this.gcHistory.slice(-100);
    }

    // 实际环境中这里会调用 global.gc()
    if (global.gc) {
      global.gc();
    }
  }

  _checkMemory() {
    const memUsage = process.memoryUsage();
    
    if (memUsage.heapUsed > this.config.criticalThreshold) {
      this.checkMemoryPressure(memUsage.heapUsed);
    }
  }
}

module.exports = {
  MemoryMonitor
}; 