/**
 * @fileoverview Resource Usage Analytics - 资源使用分析器
 * PromptX MCP Advanced Resource Management - Green Phase Implementation
 */

class ResourceAnalytics {
  constructor() {
    this.initialized = false;
    this.usageData = [];
    this.analysisCache = null;
  }

  async initialize() {
    this.initialized = true;
    this.usageData = [];
    this.analysisCache = null;
  }

  async recordUsage(category, usage) {
    if (!this.initialized) {
      await this.initialize();
    }

    const record = {
      category,
      timestamp: usage.timestamp || Date.now(),
      roleName: usage.roleName,
      executionTime: usage.executionTime,
      memoryUsed: usage.memoryUsed,
      cpuUsed: usage.cpuUsed,
      ...usage
    };

    this.usageData.push(record);

    // 保持最近10000条记录
    if (this.usageData.length > 10000) {
      this.usageData = this.usageData.slice(-10000);
    }

    // 清空缓存，强制重新分析
    this.analysisCache = null;
  }

  async analyzeUsagePatterns() {
    if (this.analysisCache) {
      return this.analysisCache;
    }

    const roleExecutionData = this.usageData.filter(d => d.category === 'role-execution');
    
    const analysis = {
      totalExecutions: roleExecutionData.length,
      averageExecutionTime: 0,
      peakMemoryUsage: 0,
      mostUsedRole: null,
      timeRange: {
        start: Math.min(...this.usageData.map(d => d.timestamp)),
        end: Math.max(...this.usageData.map(d => d.timestamp))
      }
    };

    if (roleExecutionData.length > 0) {
      // 计算平均执行时间
      const totalTime = roleExecutionData.reduce((sum, d) => sum + (d.executionTime || 0), 0);
      analysis.averageExecutionTime = totalTime / roleExecutionData.length;

      // 计算峰值内存使用
      analysis.peakMemoryUsage = Math.max(...roleExecutionData.map(d => d.memoryUsed || 0));

      // 统计最常用角色
      const roleCounts = {};
      roleExecutionData.forEach(d => {
        if (d.roleName) {
          roleCounts[d.roleName] = (roleCounts[d.roleName] || 0) + 1;
        }
      });

      if (Object.keys(roleCounts).length > 0) {
        analysis.mostUsedRole = Object.entries(roleCounts)
          .sort(([,a], [,b]) => b - a)[0][0];
      }
    }

    this.analysisCache = analysis;
    return analysis;
  }

  async predictResourceNeeds(hoursAhead) {
    const systemData = this.usageData.filter(d => d.category === 'system');
    
    if (systemData.length < 2) {
      // 如果没有足够的历史数据，返回基础预测
      return Array.from({ length: hoursAhead }, (_, i) => ({
        hour: i + 1,
        predictedMemory: 50 + Math.random() * 100, // 50-150MB
        predictedCpu: 5 + Math.random() * 15, // 5-20%
        confidence: 0.5 // 低置信度
      }));
    }

    const predictions = [];
    
    // 计算历史趋势
    const memoryTrend = this._calculateTrend(systemData.map(d => d.memoryUsed));
    const cpuTrend = this._calculateTrend(systemData.map(d => d.cpuUsed));
    
    for (let i = 0; i < hoursAhead; i++) {
      const prediction = {
        hour: i + 1,
        predictedMemory: Math.max(10, memoryTrend.base + memoryTrend.slope * i),
        predictedCpu: Math.max(1, cpuTrend.base + cpuTrend.slope * i),
        confidence: Math.max(0.1, Math.min(0.9, systemData.length / 100))
      };
      
      predictions.push(prediction);
    }

    return predictions;
  }

  _calculateTrend(values) {
    if (values.length < 2) {
      return { base: values[0] || 0, slope: 0 };
    }

    // 简单线性回归
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const base = (sumY - slope * sumX) / n;

    return { base, slope };
  }
}

module.exports = {
  ResourceAnalytics
}; 