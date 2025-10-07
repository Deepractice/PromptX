/**
 * ToolStorage - 工具级持久化存储
 * 
 * 为每个工具提供独立的持久化存储能力
 * 完全兼容 localStorage API，使用单个 JSON 文件存储
 */

const fs = require('fs');
const path = require('path');
const logger = require('@promptx/logger');

class ToolStorage {
  constructor(toolId, sandboxPath) {
    this.toolId = toolId;
    this.sandboxPath = sandboxPath;
    this.storageFile = path.join(sandboxPath, 'storage.json');
    this._cache = null;
    this._maxSize = 10 * 1024 * 1024; // 10MB 限制
    
    // 初始化存储
    this._init();
  }

  /**
   * 初始化存储文件
   * @private
   */
  _init() {
    try {
      if (!fs.existsSync(this.storageFile)) {
        this._save({});
        logger.debug(`[ToolStorage:${this.toolId}] Created storage file`);
      }
    } catch (error) {
      logger.error(`[ToolStorage:${this.toolId}] Failed to init storage:`, error);
    }
  }

  /**
   * 读取存储数据
   * @private
   */
  _load() {
    if (this._cache !== null) {
      return this._cache;
    }
    
    try {
      const content = fs.readFileSync(this.storageFile, 'utf8');
      this._cache = JSON.parse(content || '{}');
      return this._cache;
    } catch (error) {
      logger.warn(`[ToolStorage:${this.toolId}] Failed to load storage, using empty:`, error);
      this._cache = {};
      return this._cache;
    }
  }

  /**
   * 保存存储数据
   * @private
   */
  _save(data) {
    try {
      const content = JSON.stringify(data, null, 2);
      
      // 检查大小限制
      const size = Buffer.byteLength(content, 'utf8');
      if (size > this._maxSize) {
        throw new Error(`Storage size ${size} exceeds limit ${this._maxSize}`);
      }
      
      fs.writeFileSync(this.storageFile, content, 'utf8');
      this._cache = data;
      
      logger.debug(`[ToolStorage:${this.toolId}] Saved storage (${size} bytes)`);
    } catch (error) {
      logger.error(`[ToolStorage:${this.toolId}] Failed to save storage:`, error);
      throw error;
    }
  }

  /**
   * 设置存储项
   * @param {string} key - 键名
   * @param {any} value - 值（自动序列化）
   */
  setItem(key, value) {
    try {
      const data = this._load();

      // 如果是 undefined，转为 null（JSON 不支持 undefined）
      if (value === undefined) {
        value = null;
      }

      data[key] = value;
      this._save(data);

      logger.debug(`[ToolStorage:${this.toolId}] Set item: ${key}`);
      return true;
    } catch (error) {
      logger.error(`[ToolStorage:${this.toolId}] Failed to set item:`, error);
      throw error;
    }
  }

  /**
   * 获取存储项
   * @param {string} key - 键名
   * @returns {any} 存储的值
   */
  getItem(key) {
    try {
      const data = this._load();
      const value = data[key];

      logger.debug(`[ToolStorage:${this.toolId}] Get item: ${key}`);
      return value !== undefined ? value : null;
    } catch (error) {
      logger.error(`[ToolStorage:${this.toolId}] Failed to get item:`, error);
      return null;
    }
  }

  /**
   * 移除存储项
   * @param {string} key - 键名
   */
  removeItem(key) {
    try {
      const data = this._load();
      const exists = key in data;

      if (exists) {
        delete data[key];
        this._save(data);
        logger.debug(`[ToolStorage:${this.toolId}] Removed item: ${key}`);
      }

      return exists;
    } catch (error) {
      logger.error(`[ToolStorage:${this.toolId}] Failed to remove item:`, error);
      throw error;
    }
  }

  /**
   * 清空所有存储
   */
  clear() {
    try {
      this._save({});
      logger.debug(`[ToolStorage:${this.toolId}] Cleared storage`);
      return true;
    } catch (error) {
      logger.error(`[ToolStorage:${this.toolId}] Failed to clear storage:`, error);
      throw error;
    }
  }

  /**
   * 获取指定索引的键名
   * @param {number} index - 索引
   * @returns {string|null} 键名
   */
  key(index) {
    try {
      const data = this._load();
      const keys = Object.keys(data);
      return keys[index] || null;
    } catch (error) {
      logger.error(`[ToolStorage:${this.toolId}] Failed to get key:`, error);
      return null;
    }
  }

  /**
   * 获取存储项数量
   * @returns {number} 项数
   */
  get length() {
    try {
      const data = this._load();
      return Object.keys(data).length;
    } catch (error) {
      logger.error(`[ToolStorage:${this.toolId}] Failed to get length:`, error);
      return 0;
    }
  }

  /**
   * 获取所有键名
   * @returns {string[]} 键名数组
   */
  keys() {
    try {
      const data = this._load();
      return Object.keys(data);
    } catch (error) {
      logger.error(`[ToolStorage:${this.toolId}] Failed to get keys:`, error);
      return [];
    }
  }

  /**
   * 获取所有键值对
   * @returns {Object} 所有存储的数据
   */
  getAll() {
    try {
      const data = this._load();
      logger.debug(`[ToolStorage:${this.toolId}] Get all items (${Object.keys(data).length} items)`);
      return { ...data }; // 返回副本，避免直接修改
    } catch (error) {
      logger.error(`[ToolStorage:${this.toolId}] Failed to get all:`, error);
      return {};
    }
  }

  /**
   * 检查键是否存在
   * @param {string} key - 键名
   * @returns {boolean} 是否存在
   */
  hasItem(key) {
    try {
      const data = this._load();
      return key in data;
    } catch (error) {
      logger.error(`[ToolStorage:${this.toolId}] Failed to check item:`, error);
      return false;
    }
  }

  /**
   * 获取存储文件大小
   * @returns {number} 字节数
   */
  getSize() {
    try {
      if (fs.existsSync(this.storageFile)) {
        const stats = fs.statSync(this.storageFile);
        return stats.size;
      }
      return 0;
    } catch (error) {
      logger.error(`[ToolStorage:${this.toolId}] Failed to get size:`, error);
      return 0;
    }
  }

  /**
   * 获取存储文件路径
   * @returns {string} 文件路径
   */
  getStoragePath() {
    return this.storageFile;
  }
}

module.exports = ToolStorage;