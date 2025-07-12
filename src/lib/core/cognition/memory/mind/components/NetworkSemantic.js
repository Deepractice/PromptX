// NetworkSemantic - 基于网络的全局级实现
// 层次主导理论：作为最高层认知容器，永远主导所有连接

const { Semantic } = require('../interfaces/Semantic.js');
const Graph = require('graphology');

class NetworkSemantic extends Semantic {
  /**
   * 构造Semantic实例
   * @param {string} name - Semantic名称，默认为'GlobalSemantic'
   */
  constructor(name = 'GlobalSemantic') {
    super(name); // 调用Semantic接口的构造函数
    
    // 全局认知网络图 - 统一管理所有Mind节点和连接
    this.globalGraph = new Graph();
    
    // 分层映射 - 快速查找不同类型的Mind
    this.cueLayer = new Map();     // word -> WordCue，词汇层
    this.schemaLayer = new Map();  // name -> Schema，事件层
    
    // 外部连接：与其他Semantic的连接关系（认知网络的合并）
    this.externalConnections = new Set();
  }


  /**
   * Semantic的具体连接实现
   * 
   * **层次主导原则应用**：
   * - 作为最高层，永远主导所有连接
   * - 包含WordCue：直接加入全局词汇层
   * - 包含Schema：加入全局事件层
   * - 与Semantic连接：合并两个认知网络
   * 
   * @param {Mind} other - 目标Mind节点
   * @returns {Semantic} 永远返回自身（最高层主导）
   * @protected
   */
  _doConnect(other) {
    const otherLayer = other.getLayer();
    
    if (otherLayer === 1) {
      // 包含WordCue：加入全局词汇层
      this.addCue(other);
    } else if (otherLayer === 2) {
      // 包含Schema：加入全局事件层
      this.addSchema(other);
    } else if (otherLayer === 3) {
      // 合并Semantic：认知网络的融合
      if (other instanceof NetworkSemantic) {
        this.externalConnections.add(other.name);
        other.externalConnections.add(this.name);
      }
    }
    
    return this; // 永远返回自身，体现最高层主导
  }

  /**
   * Semantic的具体断联实现
   * 
   * **层次主导原则应用**：
   * - 作为最高层，主导所有断联决策
   * - 移除WordCue：从全局词汇层移除
   * - 移除Schema：从全局事件层移除
   * - 与Semantic断联：分离认知网络
   * 
   * @param {Mind} other - 目标Mind节点
   * @returns {Semantic} 永远返回自身（最高层主导）
   * @protected
   */
  _doDisconnect(other) {
    const otherLayer = other.getLayer();
    
    if (otherLayer === 1) {
      // 移除WordCue：从全局词汇层移除
      this.removeCue(other);
    } else if (otherLayer === 2) {
      // 移除Schema：从全局事件层移除
      this.removeSchema(other);
    } else if (otherLayer === 3) {
      // 分离Semantic：认知网络的分离
      if (other instanceof NetworkSemantic) {
        this.externalConnections.delete(other.name);
        other.externalConnections.delete(this.name);
      }
    }
    
    return this; // 永远返回自身，体现最高层主导
  }

  /**
   * 添加WordCue到全局认知网络
   * @param {WordCue} cue - 要添加的WordCue
   * @returns {Semantic} 返回自身，支持链式调用
   */
  addCue(cue) {
    if (!cue || !cue.word) {
      throw new Error('Invalid cue provided');
    }
    
    // 添加到全局图中
    const nodeId = `cue:${cue.word}`;
    if (!this.globalGraph.hasNode(nodeId)) {
      this.globalGraph.addNode(nodeId, { 
        type: 'cue', 
        mind: cue,
        layer: 1
      });
    }
    
    // 添加到快速查找映射
    this.cueLayer.set(cue.word, cue);
    return this;
  }

  /**
   * 从全局认知网络移除WordCue
   * @param {WordCue} cue - 要移除的WordCue
   * @returns {Semantic} 返回自身，支持链式调用
   */
  removeCue(cue) {
    if (!cue || !cue.word) return this;
    
    this.cueLayer.delete(cue.word);
    return this;
  }

  /**
   * 检查是否包含指定的WordCue
   * @param {WordCue} cue - 要检查的WordCue
   * @returns {boolean} 是否包含
   */
  hasCue(cue) {
    if (!cue || !cue.word) return false;
    return this.cueLayer.has(cue.word);
  }

  /**
   * 添加Schema到全局认知网络
   * @param {Schema} schema - 要添加的Schema
   * @returns {Semantic} 返回自身，支持链式调用
   */
  addSchema(schema) {
    if (!schema || !schema.name) {
      throw new Error('Invalid schema provided');
    }
    
    this.schemaLayer.set(schema.name, schema);
    return this;
  }

  /**
   * 从全局认知网络移除Schema
   * @param {Schema} schema - 要移除的Schema
   * @returns {Semantic} 返回自身，支持链式调用
   */
  removeSchema(schema) {
    if (!schema || !schema.name) return this;
    
    this.schemaLayer.delete(schema.name);
    return this;
  }

  /**
   * 检查是否包含指定的Schema
   * @param {Schema} schema - 要检查的Schema
   * @returns {boolean} 是否包含
   */
  hasSchema(schema) {
    if (!schema || !schema.name) return false;
    return this.schemaLayer.has(schema.name);
  }

  /**
   * 获取全局认知网络中的所有WordCue
   * @returns {Array<WordCue>} WordCue数组
   */
  getAllCues() {
    return Array.from(this.cueLayer.values());
  }

  /**
   * 获取全局认知网络中的所有Schema
   * @returns {Array<Schema>} Schema数组
   */
  getAllSchemas() {
    return Array.from(this.schemaLayer.values());
  }

  /**
   * 检查是否与另一个Semantic连接
   * @param {Semantic} other - 要检查的Semantic
   * @returns {boolean} 是否连接
   */
  isConnectedTo(other) {
    if (!(other instanceof NetworkSemantic)) return false;
    return this.externalConnections.has(other.name);
  }

  /**
   * 获取所有外部连接的Semantic名称
   * @returns {Array<string>} Semantic名称数组
   */
  getExternalConnections() {
    return Array.from(this.externalConnections);
  }

  /**
   * 检查是否与另一个Semantic相等
   * @param {Semantic} other - 对比的Semantic
   * @returns {boolean} 是否相等
   */
  equals(other) {
    return other instanceof NetworkSemantic && this.name === other.name;
  }

  /**
   * 返回Semantic的字符串表示
   * @returns {string} Semantic名称
   */
  toString() {
    return this.name;
  }

  /**
   * 获取全局认知网络的统计信息（调试用）
   * @returns {Object} 统计信息
   */
  getNetworkStats() {
    return {
      name: this.name,
      cueCount: this.cueLayer.size,
      schemaCount: this.schemaLayer.size,
      externalConnectionCount: this.externalConnections.size,
      totalMinds: this.cueLayer.size + this.schemaLayer.size
    };
  }

  /**
   * 全局搜索WordCue（根据词汇）
   * @param {string} word - 要搜索的词汇
   * @returns {WordCue|null} 找到的WordCue或null
   */
  findCue(word) {
    return this.cueLayer.get(word) || null;
  }

  /**
   * 全局搜索Schema（根据名称）
   * @param {string} name - 要搜索的Schema名称
   * @returns {Schema|null} 找到的Schema或null
   */
  findSchema(name) {
    return this.schemaLayer.get(name) || null;
  }
}

module.exports = { NetworkSemantic };