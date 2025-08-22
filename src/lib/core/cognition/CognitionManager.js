const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const CognitionSystem = require('./CognitionSystem');
const logger = require('../../utils/logger');

/**
 * CognitionManager - 认知系统管理器
 * 
 * 负责管理多个角色的认知系统实例
 * 每个角色都有独立的 CognitionSystem 实例和存储路径
 * 
 * 存储结构：
 * ~/.promptx/cognition/
 *   ├── java-developer/
 *   │   └── mind.json
 *   ├── product-manager/
 *   │   └── mind.json
 *   └── copywriter/
 *       └── mind.json
 */
class CognitionManager {
  constructor(resourceManager = null) {
    this.resourceManager = resourceManager;
    this.systems = new Map(); // roleId -> CognitionSystem
    this.basePath = path.join(os.homedir(), '.promptx', 'cognition');
  }

  /**
   * 获取角色的存储路径
   * @param {string} roleId - 角色ID
   * @returns {string} 存储路径
   */
  getRolePath(roleId) {
    return path.join(this.basePath, roleId);
  }

  /**
   * 获取角色的 network.json 文件路径
   * @param {string} roleId - 角色ID
   * @returns {string} network.json 文件路径
   */
  getNetworkFilePath(roleId) {
    return path.join(this.getRolePath(roleId), 'network.json');
  }

  /**
   * 确保角色的存储目录存在
   * @param {string} roleId - 角色ID
   */
  async ensureRoleDirectory(roleId) {
    const rolePath = this.getRolePath(roleId);
    try {
      await fs.mkdir(rolePath, { recursive: true });
      logger.debug(`[CognitionManager] Ensured directory for role: ${roleId}`);
    } catch (error) {
      logger.error(`[CognitionManager] Failed to create directory for role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * 获取或创建角色的认知系统实例
   * @param {string} roleId - 角色ID
   * @returns {CognitionSystem} 认知系统实例
   */
  async getSystem(roleId) {
    if (!this.systems.has(roleId)) {
      logger.info(`[CognitionManager] Creating new CognitionSystem for role: ${roleId}`);
      
      // 确保目录存在
      await this.ensureRoleDirectory(roleId);
      
      // 创建新的认知系统实例
      const system = new CognitionSystem();
      
      // 尝试加载已有的认知数据
      const networkFilePath = this.getNetworkFilePath(roleId);
      try {
        await system.network.load(networkFilePath);
        logger.info(`[CognitionManager] Loaded existing network data for role: ${roleId}`);
      } catch (error) {
        // 文件不存在或解析失败，使用空的认知系统
        if (error.code !== 'ENOENT') {
          logger.warn(`[CognitionManager] Failed to load network data for role ${roleId}:`, error.message);
        } else {
          logger.debug(`[CognitionManager] No existing network data for role: ${roleId}`);
        }
      }
      
      this.systems.set(roleId, system);
    }
    
    return this.systems.get(roleId);
  }

  /**
   * 保存角色的认知数据
   * @param {string} roleId - 角色ID
   */
  async saveSystem(roleId) {
    const system = this.systems.get(roleId);
    if (!system) {
      logger.warn(`[CognitionManager] No system to save for role: ${roleId}`);
      return;
    }

    try {
      // 确保目录存在
      await this.ensureRoleDirectory(roleId);
      
      // 使用 Network 的 persist 方法直接保存
      const networkFilePath = this.getNetworkFilePath(roleId);
      await system.network.persist(networkFilePath);
      
      logger.info(`[CognitionManager] Saved network data for role: ${roleId}`);
    } catch (error) {
      logger.error(`[CognitionManager] Failed to save network data for role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * Prime - 获取角色的认知概览
   * @param {string} roleId - 角色ID
   * @returns {Mind} Mind 对象
   */
  async prime(roleId) {
    logger.info(`[CognitionManager] Prime for role: ${roleId}`);
    
    const system = await this.getSystem(roleId);
    const mind = system.prime();
    
    if (!mind) {
      logger.warn(`[CognitionManager] Prime returned null for role: ${roleId}`);
      return null;
    }
    
    return mind;
  }

  /**
   * Recall - 从角色的认知中检索相关记忆
   * @param {string} roleId - 角色ID
   * @param {string} query - 查询词
   * @returns {Mind} Mind 对象
   */
  async recall(roleId, query) {
    logger.info(`[CognitionManager] Recall for role: ${roleId}, query: "${query}"`);
    
    const system = await this.getSystem(roleId);
    
    // 执行recall
    const mind = system.recall(query);
    
    if (!mind) {
      logger.warn(`[CognitionManager] Recall returned null for role: ${roleId}, query: ${query}`);
      return null;
    }
    
    return mind;
  }

  /**
   * Remember - 保存新的记忆到角色的认知系统
   * @param {string} roleId - 角色ID
   * @param {Array} engrams - 记忆数组
   */
  async remember(roleId, engrams) {
    logger.info(`[CognitionManager] Remember for role: ${roleId}, ${engrams.length} engrams`);
    
    const system = await this.getSystem(roleId);
    
    for (const engram of engrams) {
      try {
        // 解析 schema 为层级结构
        const concepts = this.parseSchema(engram.schema);
        
        if (concepts.length === 0) {
          logger.warn(`[CognitionManager] Empty schema for engram:`, engram);
          continue;
        }
        
        // 直接使用 system.remember 传递 concepts 数组
        // CognitionSystem.remember 会调用 Remember.execute
        system.remember(concepts);
        
        logger.debug(`[CognitionManager] Processed engram:`, {
          type: engram.type,
          concepts: concepts.length,
          strength: engram.strength
        });
        
      } catch (error) {
        logger.error(`[CognitionManager] Failed to process engram:`, error);
      }
    }
    
    // 保存更新后的认知数据
    await this.saveSystem(roleId);
    
    logger.success(`[CognitionManager] Successfully saved ${engrams.length} engrams for role: ${roleId}`);
  }

  /**
   * 解析 schema 字符串为概念列表
   * @param {string} schema - 结构化的知识表示
   * @returns {Array<string>} 概念列表
   */
  parseSchema(schema) {
    if (!schema) return [];
    
    // 按行分割，处理缩进层级
    const lines = schema.split('\n').filter(line => line.trim());
    const concepts = [];
    
    for (const line of lines) {
      // 移除缩进和特殊符号，提取概念
      const concept = line.trim().replace(/^[-*>#\s]+/, '').trim();
      if (concept) {
        concepts.push(concept);
      }
    }
    
    return concepts;
  }

  /**
   * 清理角色的认知数据
   * @param {string} roleId - 角色ID
   */
  async clearRole(roleId) {
    logger.warn(`[CognitionManager] Clearing cognition data for role: ${roleId}`);
    
    // 从内存中移除
    this.systems.delete(roleId);
    
    // 删除文件
    try {
      const networkFilePath = this.getNetworkFilePath(roleId);
      await fs.unlink(networkFilePath);
      logger.info(`[CognitionManager] Deleted network file for role: ${roleId}`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        logger.error(`[CognitionManager] Failed to delete network file for role ${roleId}:`, error);
      }
    }
  }

  /**
   * 获取所有已存储的角色列表
   */
  async listRoles() {
    try {
      await fs.mkdir(this.basePath, { recursive: true });
      const entries = await fs.readdir(this.basePath, { withFileTypes: true });
      
      const roles = [];
      for (const entry of entries) {
        if (entry.isDirectory()) {
          // 检查是否有 network.json 文件
          const networkFilePath = this.getNetworkFilePath(entry.name);
          try {
            await fs.access(networkFilePath);
            roles.push(entry.name);
          } catch {
            // 没有 network.json 文件，跳过
          }
        }
      }
      
      return roles;
    } catch (error) {
      logger.error('[CognitionManager] Failed to list roles:', error);
      return [];
    }
  }
}

module.exports = CognitionManager;