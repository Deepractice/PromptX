/**
 * @fileoverview PromptX MCP Configuration Management
 * 统一配置管理模块
 */

const packageJson = require('../../../package.json');

/**
 * MCP配置管理器
 */
class MCPConfig {
  /**
   * 获取服务器配置
   * @returns {Object} 服务器配置对象
   */
  static getServerConfig() {
    return {
      name: "promptx",
      version: packageJson.version,
      debug: process.env.NODE_ENV === 'development'
    };
  }

  /**
   * 获取客户端配置
   * @returns {Object} 客户端配置对象
   */
  static getClientConfig() {
    return {
      timeout: 30000,
      retries: 3,
      debug: process.env.NODE_ENV === 'development'
    };
  }

  /**
   * 获取角色配置
   * @returns {Object} 角色配置对象
   */
  static getRoleConfig() {
    return {
      supportedRoles: [
        'assistant',
        'role-designer', 
        'product-manager',
        'java-backend-developer',
        'promptx-fullstack-developer',
        'xiaohongshu-marketer',
        'frontend-developer'
      ],
      defaultRole: 'assistant',
      cacheTimeout: 60000 // 1分钟
    };
  }

  /**
   * 获取完整配置
   * @returns {Object} 完整配置对象
   */
  static getFullConfig() {
    return {
      server: this.getServerConfig(),
      client: this.getClientConfig(),
      roles: this.getRoleConfig()
    };
  }
}

module.exports = {
  MCPConfig
}; 