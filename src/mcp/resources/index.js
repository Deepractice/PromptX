/**
 * @fileoverview PromptX MCP Advanced Resource Management - Main Entry Point
 * 🔵 REFACTOR Phase: Unified Resource Management API
 */

const { ResourcePoolManager } = require('./pool');
const { IntelligentCache } = require('./cache');
const { MemoryMonitor } = require('./memory');
const { ConnectionPoolManager } = require('./connections');
const { ResourceConfigManager } = require('./config');
const { ResourceAnalytics } = require('./analytics');

/**
 * 统一资源管理器 - 整合所有资源管理功能
 */
class AdvancedResourceManager {
  constructor(options = {}) {
    this._config = {
      pool: options.pool || {},
      cache: options.cache || {},
      memory: options.memory || {},
      connections: options.connections || {},
      analytics: options.analytics || {}
    };

    this.initialized = false;
    this.components = {};
  }

  /**
   * 初始化所有资源管理组件
   */
  async initialize() {
    try {
      // 初始化配置管理器
      this.components.config = new ResourceConfigManager();

      // 初始化资源池
      this.components.pool = new ResourcePoolManager();
      await this.components.pool.initialize(this._config.pool);

      // 初始化智能缓存
      this.components.cache = new IntelligentCache(this._config.cache);

      // 初始化内存监控
      this.components.memory = new MemoryMonitor(this._config.memory);
      await this.components.memory.start();

      // 初始化连接池
      this.components.connections = new ConnectionPoolManager(this._config.connections);
      await this.components.connections.initialize();

      // 初始化资源分析
      this.components.analytics = new ResourceAnalytics();
      await this.components.analytics.initialize();

      this.initialized = true;
      
      return {
        success: true,
        message: 'PromptX高级资源管理系统初始化成功',
        components: Object.keys(this.components)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: '资源管理系统初始化失败'
      };
    }
  }

  /**
   * 获取系统整体状态
   */
  async getSystemStatus() {
    if (!this.initialized) {
      throw new Error('资源管理系统未初始化');
    }

    return {
      initialized: this.initialized,
      timestamp: new Date().toISOString(),
      pool: this.components.pool.getPoolStats(),
      cache: this.components.cache.getStats(),
      memory: {
        running: this.components.memory.isRunning(),
        config: this.components.memory.getConfig()
      },
      connections: {
        poolSize: this.components.connections.getPoolSize(),
        activeConnections: this.components.connections.getActiveConnections()
      },
      analytics: await this.components.analytics.analyzeUsagePatterns()
    };
  }

  /**
   * 执行资源清理
   */
  async cleanup() {
    if (this.components.memory) {
      await this.components.memory.stop();
    }
    
    this.initialized = false;
    return { success: true, message: '资源清理完成' };
  }

  // 便捷访问器
  get pool() { return this.components.pool; }
  get cache() { return this.components.cache; }
  get memory() { return this.components.memory; }
  get connections() { return this.components.connections; }
  get config() { return this.components.config; }
  get analytics() { return this.components.analytics; }
}

/**
 * 创建默认的资源管理器实例
 */
function createAdvancedResourceManager(options = {}) {
  return new AdvancedResourceManager(options);
}

module.exports = {
  AdvancedResourceManager,
  createAdvancedResourceManager,
  
  // 导出所有组件类
  ResourcePoolManager,
  IntelligentCache,
  MemoryMonitor,
  ConnectionPoolManager,
  ResourceConfigManager,
  ResourceAnalytics
}; 