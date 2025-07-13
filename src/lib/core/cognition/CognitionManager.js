// CognitionManager - 管理角色与认知的关系
// 每个角色拥有独立的认知实例，存储在 @user://.promptx/cognition/{role}

const { Cognition } = require('./Cognition');
const path = require('path');
const fs = require('fs-extra');
const logger = require('../../utils/logger');

class CognitionManager {
  constructor(resourceManager) {
    this.resourceManager = resourceManager;
    this.cognitions = new Map(); // role -> Cognition instance
    this.userProtocol = null; // 延迟初始化
  }

  /**
   * 确保资源管理器已初始化
   */
  async ensureInitialized() {
    if (!this.resourceManager.initialized) {
      logger.info('⚙️ [CognitionManager] ResourceManager未初始化，正在初始化...');
      await this.resourceManager.initializeWithNewArchitecture();
      logger.success('⚙️ [CognitionManager] ResourceManager初始化完成');
    }
    
    // 获取 user 协议
    if (!this.userProtocol) {
      this.userProtocol = this.resourceManager.protocols.get('user');
      if (!this.userProtocol) {
        throw new Error('UserProtocol not found in ResourceManager');
      }
    }
  }

  /**
   * 获取或创建角色的认知实例
   * @param {string} role - 角色ID
   * @returns {Promise<Cognition>} 角色的认知实例
   */
  async getCognition(role) {
    // 验证角色名
    if (!role || typeof role !== 'string' || role.trim() === '') {
      throw new Error('角色ID不能为空');
    }
    
    // 确保已初始化
    await this.ensureInitialized();
    
    // 如果已存在，直接返回
    if (this.cognitions.has(role)) {
      logger.debug(`🧠 [CognitionManager] 返回已存在的认知实例: ${role}`);
      return this.cognitions.get(role);
    }

    logger.info(`🧠 [CognitionManager] 创建新的认知实例: ${role}`);
    
    // 创建角色专属的认知目录
    const cognitionPath = `.promptx/cognition/${role}`;
    const cognitionDir = await this.userProtocol.resolvePath(cognitionPath);
    
    // 确保目录存在
    await fs.ensureDir(cognitionDir);
    logger.debug(`📁 [CognitionManager] 认知目录已创建: ${cognitionDir}`);
    
    // 配置认知实例
    const config = {
      longTermPath: path.join(cognitionDir, 'longterm.db'),
      semanticPath: path.join(cognitionDir, 'semantic')
    };
    
    // 创建认知实例
    const cognition = new Cognition(config);
    this.cognitions.set(role, cognition);
    
    logger.success(`✅ [CognitionManager] 认知实例创建完成: ${role}`);
    return cognition;
  }

  /**
   * 记住 - 为指定角色保存记忆
   * @param {string} role - 角色ID
   * @param {string} content - 记忆内容
   * @param {string} schema - 结构化认知（Mermaid mindmap 格式）
   * @param {number} strength - 记忆强度（0-1之间）
   */
  async remember(role, content, schema, strength) {
    const cognition = await this.getCognition(role);
    return cognition.remember(content, schema, strength);
  }

  /**
   * 回忆 - 从指定角色检索记忆
   * @param {string} role - 角色ID
   * @param {string} cue - 检索线索
   * @returns {Promise<Array>} 匹配的记忆列表
   */
  async recall(role, cue) {
    const cognition = await this.getCognition(role);
    return cognition.recall(cue);
  }

  /**
   * 启动效应 - 预激活角色的语义网络
   * @param {string} role - 角色ID
   * @returns {Promise<string>} Mermaid mindmap 格式的字符串
   */
  async prime(role) {
    const cognition = await this.getCognition(role);
    return cognition.prime();
  }

  /**
   * 获取所有活跃的认知实例
   * @returns {Map} role -> Cognition 映射
   */
  getActiveCognitions() {
    return new Map(this.cognitions);
  }

  /**
   * 清理指定角色的认知实例（释放内存）
   * @param {string} role - 角色ID
   */
  clearCognition(role) {
    if (this.cognitions.has(role)) {
      logger.info(`🧹 [CognitionManager] 清理认知实例: ${role}`);
      this.cognitions.delete(role);
    }
  }

  /**
   * 清理所有认知实例
   */
  clearAll() {
    logger.info(`🧹 [CognitionManager] 清理所有认知实例`);
    this.cognitions.clear();
  }

}

module.exports = { CognitionManager };