/**
 * @fileoverview Resource Configuration Manager - 资源配置管理器
 * PromptX MCP Advanced Resource Management - Green Phase Implementation
 */

class ResourceConfigManager {
  constructor() {
    this.configs = new Map();
    this.configHistory = new Map();
  }

  async setConfig(category, config) {
    this._validateConfig(category, config);
    
    // 保存历史配置用于回滚
    if (this.configs.has(category)) {
      this._saveToHistory(category, this.configs.get(category));
    }

    this.configs.set(category, { ...config });
  }

  async getConfig(category) {
    return this.configs.has(category) ? { ...this.configs.get(category) } : null;
  }

  async updateConfig(category, updates) {
    const currentConfig = this.configs.get(category) || {};
    const newConfig = { ...currentConfig, ...updates };
    
    this._validateConfig(category, newConfig);
    
    // 保存当前配置到历史
    this._saveToHistory(category, currentConfig);
    
    this.configs.set(category, newConfig);
  }

  async rollbackConfig(category) {
    const history = this.configHistory.get(category);
    if (history && history.length > 0) {
      const previousConfig = history.pop();
      this.configs.set(category, previousConfig);
    }
  }

  _validateConfig(category, config) {
    // 基本配置验证
    if (!config || typeof config !== 'object') {
      throw new Error('Invalid configuration: must be an object');
    }

    // 特定类别的验证
    if (category === 'cache') {
      if (config.maxSize !== undefined && config.maxSize <= 0) {
        throw new Error('Invalid configuration: maxSize must be positive');
      }
    }

    if (category === 'memory') {
      if (config.warningThresholdMB !== undefined && config.warningThresholdMB <= 0) {
        throw new Error('Invalid configuration: warningThresholdMB must be positive');
      }
    }
  }

  _saveToHistory(category, config) {
    if (!this.configHistory.has(category)) {
      this.configHistory.set(category, []);
    }
    
    const history = this.configHistory.get(category);
    history.push({ ...config });
    
    // 保持最近10个历史配置
    if (history.length > 10) {
      history.shift();
    }
  }
}

module.exports = {
  ResourceConfigManager
}; 