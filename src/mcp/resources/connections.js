/**
 * @fileoverview Connection Pool Manager - 连接池管理器
 * PromptX MCP Advanced Resource Management - Green Phase Implementation
 */

const { v4: uuidv4 } = require('uuid');

class ConnectionPoolManager {
  constructor(options = {}) {
    this.config = {
      maxPoolSize: options.maxPoolSize || 5,
      minPoolSize: options.minPoolSize || 2,
      idleTimeoutMs: options.idleTimeoutMs || 30000,
      loadBalancing: options.loadBalancing || 'round-robin',
      healthCheckIntervalMs: options.healthCheckIntervalMs || 60000,
      healthCheckTimeoutMs: options.healthCheckTimeoutMs || 5000
    };

    this.connections = [];
    this.activeConnections = 0;
    this.roundRobinIndex = 0;
    this.healthCheckInterval = null;
    this.healthStats = {
      lastCheckTime: 0,
      healthyConnections: 0,
      totalChecks: 0
    };
  }

  async initialize() {
    // 创建最小连接数
    for (let i = 0; i < this.config.minPoolSize; i++) {
      this.connections.push(this._createConnection(i));
    }
  }

  getPoolSize() {
    return this.connections.length;
  }

  getActiveConnections() {
    return this.activeConnections;
  }

  async getConnection(type) {
    let connection;

    if (this.config.loadBalancing === 'round-robin') {
      connection = this._getConnectionRoundRobin();
    } else if (this.config.loadBalancing === 'least-connections') {
      connection = this._getConnectionLeastConnections();
    } else {
      connection = this.connections[0]; // 默认第一个
    }

    if (connection) {
      this.activeConnections++;
    }

    return connection;
  }

  async startHealthChecks() {
    this.healthCheckInterval = setInterval(() => {
      this._performHealthCheck();
    }, this.config.healthCheckIntervalMs);
  }

  getHealthStats() {
    return { ...this.healthStats };
  }

  _createConnection(index) {
    return {
      id: uuidv4(),
      poolIndex: index,
      type: 'role-execution',
      status: 'active',
      createdAt: Date.now(),
      lastUsed: Date.now(),
      connectionCount: 0
    };
  }

  _getConnectionRoundRobin() {
    if (this.connections.length === 0) return null;

    const connection = this.connections[this.roundRobinIndex];
    this.roundRobinIndex = (this.roundRobinIndex + 1) % this.connections.length;
    
    if (connection) {
      connection.lastUsed = Date.now();
      connection.connectionCount++;
    }

    return connection;
  }

  _getConnectionLeastConnections() {
    if (this.connections.length === 0) return null;

    // 找到连接数最少的连接
    let leastUsed = this.connections[0];
    for (const conn of this.connections) {
      if (conn.connectionCount < leastUsed.connectionCount) {
        leastUsed = conn;
      }
    }

    if (leastUsed) {
      leastUsed.lastUsed = Date.now();
      leastUsed.connectionCount++;
    }

    return leastUsed;
  }

  _performHealthCheck() {
    this.healthStats.lastCheckTime = Date.now();
    this.healthStats.totalChecks++;
    
    // 简单的健康检查 - 检查连接是否在超时时间内被使用过
    let healthyCount = 0;
    const now = Date.now();
    
    for (const conn of this.connections) {
      if (now - conn.lastUsed < this.config.idleTimeoutMs) {
        conn.status = 'healthy';
        healthyCount++;
      } else {
        conn.status = 'idle';
      }
    }

    this.healthStats.healthyConnections = healthyCount;
  }
}

module.exports = {
  ConnectionPoolManager
}; 