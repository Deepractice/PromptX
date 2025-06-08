/**
 * @fileoverview Intelligent Cache System - 智能缓存系统
 * PromptX MCP Advanced Resource Management - Green Phase Implementation
 */

class IntelligentCache {
  constructor(options = {}) {
    this.config = {
      maxSize: options.maxSize || 100,
      maxMemoryMB: options.maxMemoryMB || 50,
      strategy: options.strategy || 'LRU',
      ttlMs: options.ttlMs || 300000 // 5 minutes
    };

    this.cache = new Map();
    this.accessOrder = [];
    this.stats = {
      strategy: this.config.strategy,
      maxSize: this.config.maxSize,
      currentSize: 0,
      hits: 0,
      misses: 0,
      preloadedItems: 0,
      evictions: 0
    };

    this.predictiveEnabled = false;
    this.usagePatterns = [];
  }

  getStats() {
    this.stats.currentSize = this.cache.size;
    this.stats.hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) || 0;
    return { ...this.stats };
  }

  async set(key, value, options = {}) {
    // LRU 清理逻辑
    if (this.cache.size >= this.config.maxSize) {
      this._evictLRU();
    }

    this.cache.set(key, {
      value,
      options,
      timestamp: Date.now(),
      accessCount: 0
    });

    this._updateAccessOrder(key);
  }

  async get(key) {
    if (this.cache.has(key)) {
      const item = this.cache.get(key);
      item.accessCount++;
      this._updateAccessOrder(key);
      this.stats.hits++;
      return item.value;
    }

    this.stats.misses++;
    return null;
  }

  async warmUp(keys) {
    for (const key of keys) {
      // 模拟预热数据
      await this.set(key, {
        preloaded: true,
        data: `预热数据: ${key}`,
        timestamp: Date.now()
      });
    }
    this.stats.preloadedItems = keys.length;
  }

  async enablePredictiveLoading() {
    this.predictiveEnabled = true;
  }

  async trackUsagePattern(key) {
    if (this.predictiveEnabled) {
      this.usagePatterns.push({
        key,
        timestamp: Date.now()
      });
    }
  }

  async getPredictions() {
    if (!this.predictiveEnabled) return [];
    
    // 简单的预测逻辑 - 返回最近使用的模式
    return this.usagePatterns.slice(-5).map(pattern => ({
      key: pattern.key,
      confidence: 0.8,
      reason: 'recent-usage'
    }));
  }

  _updateAccessOrder(key) {
    // 移除旧位置
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    // 添加到末尾（最新使用）
    this.accessOrder.push(key);
  }

  _evictLRU() {
    if (this.accessOrder.length > 0) {
      const lruKey = this.accessOrder.shift();
      this.cache.delete(lruKey);
      this.stats.evictions++;
    }
  }
}

module.exports = {
  IntelligentCache
}; 