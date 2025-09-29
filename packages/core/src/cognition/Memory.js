const Database = require('better-sqlite3');
const logger = require('@promptx/logger');
const path = require('path');
const fs = require('fs-extra');

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
 * Q: 为什么用better-sqlite3而不是LMDB?
 * A: better-sqlite3与Electron高版本兼容，避免V8沙箱问题，且性能优秀
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
   * @param {string} dbPath - 数据库路径
   */
  constructor(dbPath) {
    // 兼容旧路径：如果是 engrams 结尾，改为 engrams.db
    if (dbPath.endsWith('engrams')) {
      this.dbPath = dbPath + '.db';
    } else if (!dbPath.endsWith('.db')) {
      this.dbPath = dbPath.replace('engrams.db', 'engrams') + '.db';
    } else {
      this.dbPath = dbPath;
    }

    // 确保目录存在
    fs.ensureDirSync(path.dirname(this.dbPath));

    /**
     * SQLite数据库实例
     * @type {Object}
     */
    try {
      // 尝试打开数据库
      this.db = new Database(this.dbPath);
      this.db.pragma('journal_mode = WAL'); // 启用WAL模式，支持并发读
      this.db.pragma('synchronous = NORMAL'); // 平衡性能和安全

      // 创建表和索引
      this._initializeSchema();

      logger.debug('[Memory] Initialized with SQLite', { dbPath: this.dbPath });
    } catch (error) {
      // 如果打开失败（可能是旧的 lmdb 文件），删除并重建
      logger.warn('[Memory] Database open failed, recreating...', {
        dbPath: this.dbPath,
        error: error.message
      });

      try {
        // 删除旧文件
        if (fs.existsSync(this.dbPath)) {
          fs.removeSync(this.dbPath);
          logger.info('[Memory] Removed incompatible database file');
        }

        // 重新创建数据库
        this.db = new Database(this.dbPath);
        this.db.pragma('journal_mode = WAL');
        this.db.pragma('synchronous = NORMAL');
        this._initializeSchema();
        logger.info('[Memory] Successfully recreated SQLite database');
      } catch (recreateError) {
        logger.error('[Memory] Failed to recreate database', {
          error: recreateError.message
        });
        throw recreateError;
      }
    }
  }

  /**
   * 初始化数据库schema
   * @private
   */
  _initializeSchema() {
    // 主engram表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS engrams (
        id TEXT PRIMARY KEY,
        content TEXT,
        schema TEXT,
        type TEXT,
        timestamp INTEGER,
        strength REAL,
        metadata TEXT
      )
    `);

    // cue索引表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS cue_index (
        word TEXT,
        engram_id TEXT,
        PRIMARY KEY (word, engram_id),
        FOREIGN KEY (engram_id) REFERENCES engrams(id) ON DELETE CASCADE
      )
    `);

    // 创建索引以提高查询性能
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_engrams_type ON engrams(type);
      CREATE INDEX IF NOT EXISTS idx_engrams_timestamp ON engrams(timestamp);
      CREATE INDEX IF NOT EXISTS idx_cue_word ON cue_index(word);
    `);

    // 准备常用语句
    this._prepareStatements();
  }

  /**
   * 准备常用SQL语句
   * @private
   */
  _prepareStatements() {
    this.stmts = {
      insertEngram: this.db.prepare(`
        INSERT OR REPLACE INTO engrams (id, content, schema, type, timestamp, strength, metadata)
        VALUES (@id, @content, @schema, @type, @timestamp, @strength, @metadata)
      `),
      deleteCues: this.db.prepare('DELETE FROM cue_index WHERE engram_id = ?'),
      insertCue: this.db.prepare(`
        INSERT OR IGNORE INTO cue_index (word, engram_id)
        VALUES (@word, @engram_id)
      `),
      getEngram: this.db.prepare('SELECT * FROM engrams WHERE id = ?'),
      getEngramsByWord: this.db.prepare(`
        SELECT DISTINCT e.* FROM engrams e
        JOIN cue_index c ON e.id = c.engram_id
        WHERE c.word = ?
      `),
      getEngramsByType: this.db.prepare('SELECT * FROM engrams WHERE type = ?'),
      getEngramsByTypeAndWord: this.db.prepare(`
        SELECT DISTINCT e.* FROM engrams e
        JOIN cue_index c ON e.id = c.engram_id
        WHERE e.type = ? AND c.word = ?
      `),
      countEngrams: this.db.prepare('SELECT COUNT(*) as count FROM engrams')
    };
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
      const transaction = this.db.transaction(() => {
        // 1. 存储主engram
        this.stmts.insertEngram.run({
          id: key,
          content: engramData.content,
          schema: JSON.stringify(engramData.schema || []),
          type: engramData.type || 'ATOMIC',
          timestamp: engramData.timestamp || Date.now(),
          strength: engramData.strength || 0.5,
          metadata: JSON.stringify({
            metadata: engramData.metadata,
            role: engramData.role
          })
        });

        // 2. 先删除旧的cue索引
        this.stmts.deleteCues.run(key);

        // 3. 建立新的Cue索引
        if (engramData.schema && Array.isArray(engramData.schema)) {
          for (const word of engramData.schema) {
            this.stmts.insertCue.run({ word, engram_id: key });
          }
        }
      });

      transaction();

      logger.debug('[Memory] Stored engram with SQLite', {
        key,
        type: engramData.type || 'ATOMIC',
        preview: engramData.content ? engramData.content.substring(0, 50) + '...' : '',
        strength: engramData.strength || 0.5
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
      const row = this.stmts.getEngram.get(key);

      if (!row) {
        logger.debug('[Memory] Engram not found', { key });
        return null;
      }

      // 转换回原始格式
      const data = this._rowToEngram(row);

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
      const rows = this.stmts.getEngramsByWord.all(word);
      const engrams = rows.map(row => {
        const engram = this._rowToEngram(row);
        // 兼容旧数据：如果没有type字段，默认为ATOMIC
        if (!engram.type) {
          engram.type = 'ATOMIC';
        }
        return engram;
      });

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
   * 根据类型查询Engram对象
   *
   * @param {string} type - Engram类型 (ATOMIC/LINK/PATTERN)
   * @param {string} [word] - 可选词汇过滤
   * @returns {Promise<Array>} Engram数据对象数组
   */
  async getByType(type, word = null) {
    try {
      let rows;
      if (word) {
        rows = this.stmts.getEngramsByTypeAndWord.all(type, word);
      } else {
        rows = this.stmts.getEngramsByType.all(type);
      }

      const engrams = rows.map(row => this._rowToEngram(row));

      logger.debug('[Memory] Retrieved engrams by type', {
        type,
        word,
        count: engrams.length
      });

      return engrams;
    } catch (error) {
      logger.error('[Memory] Failed to retrieve engrams by type', {
        type,
        word,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 根据词汇分类型查询Engram
   *
   * @param {string} word - 查询词汇
   * @returns {Promise<Object>} 分类型的Engram结果
   */
  async getByWordWithType(word) {
    try {
      const patterns = await this.getByType('PATTERN', word);
      const links = await this.getByType('LINK', word);
      const atomics = await this.getByType('ATOMIC', word);

      logger.debug('[Memory] Retrieved typed engrams', {
        word,
        patterns: patterns.length,
        links: links.length,
        atomics: atomics.length
      });

      return {
        patterns: patterns.sort((a, b) => b.strength - a.strength).slice(0, 5),   // 最多5个
        links: links.sort((a, b) => b.strength - a.strength).slice(0, 10),       // 最多10个
        atomics: atomics.sort((a, b) => b.timestamp - a.timestamp).slice(0, 15) // 最多15个，按时间排序
      };
    } catch (error) {
      logger.error('[Memory] Failed to retrieve typed engrams', {
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
      logger.debug('[Memory] SQLite database closed');
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
      const result = this.stmts.countEngrams.get();

      return {
        totalEngrams: result.count,
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

  /**
   * 将数据库行转换为Engram格式
   * @private
   */
  _rowToEngram(row) {
    const metadata = JSON.parse(row.metadata || '{}');
    const schema = JSON.parse(row.schema || '[]');

    return {
      id: row.id,
      content: row.content,
      schema: schema,
      type: row.type || 'ATOMIC',
      timestamp: row.timestamp,
      strength: row.strength,
      ...metadata
    };
  }
}

module.exports = Memory;