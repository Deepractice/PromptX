const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const CognitionSystem = require('./CognitionSystem');
const Anchor = require('./Anchor');
import logger from '@promptx/logger';

/**
 * CognitionManager - 认知系统管理器
 * 
 * 负责管理多个角色的认知系统实例
 * 每个角色都有独立的 CognitionSystem 实例和存储路径
 * 
 * 使用单例模式确保内存状态一致性
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
   * 获取单例实例
   * @param {Object} resourceManager - 可选的资源管理器
   * @returns {CognitionManager}
   */
  static getInstance(resourceManager = null) {
    if (!CognitionManager.instance) {
      CognitionManager.instance = new CognitionManager(resourceManager);
      logger.info('[CognitionManager] Created singleton instance');
    }
    return CognitionManager.instance;
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
      
      // 为Network添加必要的属性
      system.network.roleId = roleId;
      system.network.directory = this.getRolePath(roleId);
      
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
   * 优先从锚定状态恢复，如果没有则执行常规prime
   * @param {string} roleId - 角色ID
   * @returns {Mind} Mind 对象
   */
  async prime(roleId) {
    logger.info(`[CognitionManager] Prime for role: ${roleId}`);
    
    const system = await this.getSystem(roleId);
    logger.debug(`[CognitionManager] System network size before prime: ${system.network.size()}`);
    
    // 尝试从锚定状态恢复
    const anchor = new Anchor(system.network);
    const anchoredState = await anchor.load();
    
    let mind = null;
    
    if (anchoredState && anchoredState.centerWord) {
      // 从锚定状态恢复：执行recall(centerWord)
      logger.info(`[CognitionManager] Prime from anchored state`, {
        centerWord: anchoredState.centerWord,
        timestamp: new Date(anchoredState.timestamp).toISOString(),
        nodeCount: anchoredState.metadata?.nodeCount
      });
      
      mind = await system.recall(anchoredState.centerWord);
      
      if (mind) {
        logger.info(`[CognitionManager] Successfully primed from anchored state: "${anchoredState.centerWord}"`);
      }
    }
    
    // 如果没有锚定状态或恢复失败，执行常规prime
    if (!mind) {
      logger.debug(`[CognitionManager] No anchored state or recovery failed, using regular prime`);
      mind = await system.prime();
    }
    
    if (!mind) {
      logger.warn(`[CognitionManager] Prime returned null for role: ${roleId}`);
      return null;
    }
    
    logger.debug(`[CognitionManager] Prime returned Mind:`, {
      hasMind: !!mind,
      activatedCuesSize: mind?.activatedCues?.size || 0,
      connectionsCount: mind?.connections?.length || 0
    });
    
    return mind;
  }

  /**
   * Recall - 从角色的认知中检索相关记忆
   * 每次recall后自动锚定状态
   * @param {string} roleId - 角色ID
   * @param {string} query - 查询词
   * @param {Object} options - 可选参数
   * @param {string} options.mode - 认知激活模式 ('creative' | 'balanced' | 'focused')
   * @returns {Promise<Mind>} Mind 对象（包含engrams）
   */
  async recall(roleId, query, options = {}) {
    const mode = options.mode || 'balanced';
    logger.info(`[CognitionManager] Recall for role: ${roleId}, query: "${query}", mode: ${mode}`);

    const system = await this.getSystem(roleId);

    // 执行recall（现在是异步的，会加载engrams），传入 mode 参数
    const mind = await system.recall(query, { mode });

    if (!mind) {
      logger.warn(`[CognitionManager] Recall returned null for role: ${roleId}, query: ${query}`);
      return null;
    }

    // 自动锚定当前认知状态（仅当recall成功激活了节点）
    if (mind && mind.activatedCues && mind.activatedCues.size > 0) {
      try {
        const anchor = new Anchor(system.network);
        await anchor.execute(query, mind);
        logger.debug(`[CognitionManager] Auto-anchored state after recall: "${query}"`, {
          activatedNodes: mind.activatedCues.size
        });
      } catch (error) {
        logger.error(`[CognitionManager] Failed to auto-anchor state:`, error);
        // 锚定失败不影响recall结果
      }
    } else {
      logger.debug(`[CognitionManager] Skip anchoring - recall returned empty mind`, {
        query,
        hasActivatedCues: mind?.activatedCues?.size || 0
      });
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
    const Engram = require('./Engram');
    
    for (const engramData of engrams) {
      try {
        // 创建Engram对象
        const engram = new Engram({
          content: engramData.content,
          schema: engramData.schema,
          strength: engramData.strength,
          type: engramData.type,  // 传递type字段
          timestamp: Date.now()  // 使用当前时间戳
        });
        
        if (!engram.isValid()) {
          logger.warn(`[CognitionManager] Invalid engram (schema too short):`, engramData);
          continue;
        }
        
        // CognitionSystem现在会自动处理Memory存储
        await system.remember(engram);
        
        logger.debug(`[CognitionManager] Processed engram:`, {
          preview: engram.getPreview(),
          strength: engram.strength
        });
        
      } catch (error) {
        logger.error(`[CognitionManager] Failed to process engram:`, error);
        // 重新抛出错误，让上层感知到失败
        throw error;
      }
    }
    
    // 保存更新后的认知数据
    await this.saveSystem(roleId);
    
    logger.info(`[CognitionManager] Successfully saved ${engrams.length} engrams for role: ${roleId}`);
  }

  /**
   * 解析 schema 字符串为概念列表
   * @param {string} schema - 结构化的知识表示
   * @returns {Array<string>} 概念列表
   */
  parseSchema(schema) {
    if (!schema) return [];

    // 支持多种分隔符：优先使用 - 分隔符
    let concepts = [];

    if (schema.includes(' - ')) {
      // 用 - 分割（标准格式）
      concepts = schema.split(/\s*-\s*/).filter(c => c.trim());
    } else if (schema.includes('\n')) {
      // 兼容旧格式：用换行符分割
      const lines = schema.split('\n').filter(line => line.trim());
      for (const line of lines) {
        // 移除缩进和特殊符号，提取概念
        const concept = line.trim().replace(/^[-*>#\s]+/, '').trim();
        if (concept) {
          concepts.push(concept);
        }
      }
    } else {
      // 如果没有分隔符，尝试用空格分割
      concepts = schema.split(/\s+/).filter(c => c.trim());
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