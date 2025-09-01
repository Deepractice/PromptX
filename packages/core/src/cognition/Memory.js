const { Level } = require('level');
const logger = require('@promptx/logger');

/**
 * Memory - 记忆内容存储
 * 
 * ## 设计理念
 * 
 * Memory是纯粹的KV存储，负责持久化Engram对象的完整内容。
 * 它不知道角色(role)概念，只提供简单的存储和检索功能。
 * 
 * ## 存储格式
 * 
 * - Key: `${timestamp}_${randomId}` (确保唯一性)
 * - Value: Engram.toJSON() 的完整对象
 * 
 * ## 设计决策
 * 
 * Q: 为什么用LevelDB而不是文件?
 * A: LevelDB提供事务、压缩、并发访问，更适合频繁读写
 * 
 * Q: 为什么不在Memory中管理role?
 * A: 职责分离，Memory只管存储，role由上层管理
 * 
 * @class Memory
 */
class Memory {
  /**
   * 创建Memory实例
   * 
   * @param {string} dbPath - LevelDB数据库路径
   */
  constructor(dbPath) {
    /**
     * LevelDB数据库实例
     * @type {Level}
     */
    this.db = new Level(dbPath, { 
      valueEncoding: 'json'  // 自动JSON序列化/反序列化
    });
    
    logger.debug('[Memory] Initialized', { dbPath });
  }
  
  /**
   * 存储Engram对象
   * 
   * @param {Engram} engram - 要存储的Engram对象
   * @returns {Promise<string>} Engram的id（作为存储key）
   */
  async store(engram) {
    // 使用engram的id作为key
    const key = engram.id;
    
    try {
      await this.db.put(key, engram.toJSON());
      
      logger.debug('[Memory] Stored engram', { 
        key,
        preview: engram.getPreview(),
        strength: engram.strength
      });
      
      return key;
    } catch (error) {
      logger.error('[Memory] Failed to store engram', { 
        key, 
        error: error.message 
      });
      throw error;
    }
  }
  
  /**
   * 获取Engram对象
   * 
   * @param {string} key - 存储key
   * @returns {Promise<Object|null>} Engram数据对象，不存在时返回null
   */
  async get(key) {
    try {
      const data = await this.db.get(key);
      
      logger.debug('[Memory] Retrieved engram', { 
        key,
        hasContent: !!data.content
      });
      
      return data;
    } catch (error) {
      if (error.notFound) {
        logger.debug('[Memory] Engram not found', { key });
        return null;
      }
      
      logger.error('[Memory] Failed to retrieve engram', { 
        key, 
        error: error.message 
      });
      throw error;
    }
  }
  
  /**
   * 关闭数据库连接
   * 
   * @returns {Promise<void>}
   */
  async close() {
    try {
      await this.db.close();
      logger.debug('[Memory] Database closed');
    } catch (error) {
      logger.error('[Memory] Failed to close database', { 
        error: error.message 
      });
      throw error;
    }
  }
  
  /**
   * 获取存储统计信息
   * 
   * @returns {Promise<Object>} 统计信息
   */
  async getStatistics() {
    try {
      let count = 0;
      for await (const [key] of this.db.iterator()) {
        count++;
      }
      
      return {
        totalEngrams: count,
        dbPath: this.db.location
      };
    } catch (error) {
      logger.error('[Memory] Failed to get statistics', { 
        error: error.message 
      });
      return {
        totalEngrams: 0,
        dbPath: this.db.location,
        error: error.message
      };
    }
  }
}

module.exports = Memory;