const { open } = require('lmdb');
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
 * Q: 为什么用LMDB而不是LevelDB?
 * A: LMDB提供真正的多进程支持，解决"Database is not open"问题
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
   * @param {string} dbPath - LMDB数据库路径
   */
  constructor(dbPath) {
    // 改名：从 engrams.db 到 engrams
    this.dbPath = dbPath.replace('engrams.db', 'engrams');

    /**
     * LMDB数据库实例
     * @type {Object}
     */
    this.db = open(this.dbPath, {
      encoding: 'json',          // 自动JSON序列化
      compression: true,         // 启用压缩
      maxDbs: 3,                 // 支持多个子数据库
      mapSize: 100 * 1024 * 1024 // 100MB映射空间
    });

    // 子数据库用于多索引
    this.engramDb = this.db.openDB('engrams');      // 主engram存储
    this.cueIndexDb = this.db.openDB('cue_index');   // Cue -> Engram映射
    this.timeIndexDb = this.db.openDB('time_index'); // 时间索引

    logger.debug('[Memory] Initialized with LMDB', { dbPath: this.dbPath });
  }
  
  /**
   * 存储Engram对象
   *
   * @param {Engram} engram - 要存储的Engram对象
   * @returns {Promise<string>} Engram的id（作为存储key）
   */
  async store(engram) {
    const key = engram.id;
    const engramData = engram.toJSON();

    try {
      // 使用事务进行原子操作
      await this.db.transaction(() => {
        // 1. 存储主engram
        this.engramDb.put(key, engramData);

        // 2. 建立Cue索引
        if (engramData.schema) {
          for (const word of engramData.schema) {
            const existingIds = this.cueIndexDb.get(word) || [];
            if (!existingIds.includes(key)) {
              existingIds.push(key);
              this.cueIndexDb.put(word, existingIds);
            }
          }
        }

        // 3. 建立时间索引
        if (engramData.timestamp) {
          const timeKey = new Date(engramData.timestamp).toISOString().slice(0, 10);
          const dailyIds = this.timeIndexDb.get(timeKey) || [];
          if (!dailyIds.includes(key)) {
            dailyIds.push(key);
            this.timeIndexDb.put(timeKey, dailyIds);
          }
        }
      });

      logger.debug('[Memory] Stored engram with LMDB', {
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
      const data = this.engramDb.get(key);

      if (!data) {
        logger.debug('[Memory] Engram not found', { key });
        return null;
      }

      logger.debug('[Memory] Retrieved engram', {
        key,
        hasContent: !!data.content
      });

      return data;
    } catch (error) {
      logger.error('[Memory] Failed to retrieve engram', {
        key,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 根据词汇查询Engram对象
   *
   * @param {string} word - 查询词汇
   * @returns {Promise<Array>} Engram数据对象数组
   */
  async getByWord(word) {
    try {
      const engramIds = this.cueIndexDb.get(word) || [];
      const engrams = [];

      for (const id of engramIds) {
        const engram = this.engramDb.get(id);
        if (engram) {
          engrams.push(engram);
        }
      }

      logger.debug('[Memory] Retrieved engrams by word', {
        word,
        count: engrams.length
      });

      return engrams;
    } catch (error) {
      logger.error('[Memory] Failed to retrieve engrams by word', {
        word,
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
      this.db.close();
      logger.debug('[Memory] LMDB database closed');
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
      for (const _ of this.engramDb.getKeys()) {
        count++;
      }

      return {
        totalEngrams: count,
        dbPath: this.dbPath
      };
    } catch (error) {
      logger.error('[Memory] Failed to get statistics', {
        error: error.message
      });
      return {
        totalEngrams: 0,
        dbPath: this.dbPath,
        error: error.message
      };
    }
  }
}

module.exports = Memory;