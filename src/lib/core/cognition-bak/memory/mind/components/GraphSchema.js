// GraphSchema - 基于图结构的事件级实现
// 层次主导理论：作为中间层，既可包含WordCue，也可被Semantic包含

const { Schema } = require('../interfaces/Schema.js');
const Graph = require('graphology');

class GraphSchema extends Schema {
  /**
   * 构造Schema实例
   * @param {string} name - Schema名称
   */
  constructor(name) {
    super(name); // 调用Schema接口的构造函数
    
    // 内部图结构 - 真正的graphology图管理Cue之间的关系
    this.internalGraph = new Graph();
    
    // Cue映射 - 快速查找
    this.cueMap = new Map(); // word -> WordCue实例
    
    // 外部连接 - 与其他Schema的连接关系
    this.externalConnections = new Set();
  }


  /**
   * Schema的具体连接实现
   * 
   * **层次主导原则应用**：
   * - 与WordCue连接：包含WordCue，建立事件的内部结构
   * - 与Schema连接：建立事件间的关联关系
   * - 与Semantic连接：被包含到全局认知网络中
   * 
   * @param {Mind} other - 目标Mind节点
   * @returns {Schema} 返回自身
   * @protected
   */
  _doConnect(other) {
    const otherLayer = other.getLayer();
    
    if (otherLayer === 1) {
      // 包含WordCue：WordCue成为Schema的内部节点
      this.addCue(other);
      return this;
    } else if (otherLayer === 2) {
      // 同级Schema连接：合并内容
      if (other instanceof GraphSchema) {
        // 如果是同名 Schema，进行内容合并
        if (this.name === other.name) {
          // 合并所有 Cues
          other.getCues().forEach(cue => {
            if (!this.hasCue(cue)) {
              this.addCue(cue);
            }
          });
          
          // 合并内部连接关系
          other.getCueConnections().forEach(({ source, target }) => {
            const sourceCue = this.cueMap.get(source);
            const targetCue = this.cueMap.get(target);
            if (sourceCue && targetCue) {
              this.connectCues(sourceCue, targetCue);
            }
          });
          
          // 合并外部连接
          other.externalConnections.forEach(connection => {
            this.externalConnections.add(connection);
          });
        } else {
          // 不同名 Schema，只建立外部连接
          this.externalConnections.add(other.name);
          other.externalConnections.add(this.name);
        }
      }
      return this;
    } else if (otherLayer === 3) {
      // 被Semantic包含：Schema加入全局认知网络
      if (typeof other.addSchema === 'function') {
        other.addSchema(this);
      }
      return this;
    }
    
    return this;
  }

  /**
   * Schema的具体断联实现
   * 
   * **层次主导原则应用**：
   * - 与WordCue断联：从Schema中移除WordCue
   * - 与Schema断联：移除事件间的关联
   * - 与Semantic断联：从全局认知网络中移除
   * 
   * @param {Mind} other - 目标Mind节点
   * @returns {Schema} 返回自身
   * @protected
   */
  _doDisconnect(other) {
    const otherLayer = other.getLayer();
    
    if (otherLayer === 1) {
      // 移除WordCue：WordCue不再属于该Schema
      this.removeCue(other);
      return this;
    } else if (otherLayer === 2) {
      // 同级Schema断联：移除事件间的关联
      if (other instanceof GraphSchema) {
        this.externalConnections.delete(other.name);
        other.externalConnections.delete(this.name);
      }
      return this;
    } else if (otherLayer === 3) {
      // 从Semantic中移除：Schema脱离全局认知网络
      if (typeof other.removeSchema === 'function') {
        other.removeSchema(this);
      }
      return this;
    }
    
    return this;
  }

  /**
   * 添加Cue到Schema内部图结构
   * @param {WordCue} cue - 要添加的Cue
   * @returns {Schema} 返回自身，支持链式调用
   */
  addCue(cue) {
    if (!cue || !cue.word) {
      throw new Error('Invalid cue provided');
    }
    
    // 添加到graphology图中
    if (!this.internalGraph.hasNode(cue.word)) {
      this.internalGraph.addNode(cue.word, { cue: cue });
    }
    
    // 保存到映射表
    this.cueMap.set(cue.word, cue);
    
    return this;
  }

  /**
   * 检查Schema是否包含指定的Cue
   * @param {WordCue} cue - 要检查的Cue
   * @returns {boolean} 是否包含
   */
  hasCue(cue) {
    if (!cue || !cue.word) return false;
    return this.internalGraph.hasNode(cue.word);
  }

  /**
   * 连接Schema内部的两个Cue
   * @param {WordCue} cue1 - 源Cue
   * @param {WordCue} cue2 - 目标Cue
   * @returns {Schema} 返回自身，支持链式调用
   */
  connectCues(cue1, cue2) {
    if (!cue1 || !cue2 || !cue1.word || !cue2.word) {
      throw new Error('Invalid cues provided for connection');
    }
    
    // 确保两个Cue都已添加到Schema中
    this.addCue(cue1).addCue(cue2);
    
    // 在图中建立连接
    if (!this.internalGraph.hasEdge(cue1.word, cue2.word)) {
      this.internalGraph.addEdge(cue1.word, cue2.word);
    }
    
    return this;
  }

  /**
   * 从Schema中移除Cue
   * @param {WordCue} cue - 要移除的Cue
   * @returns {Schema} 返回自身，支持链式调用
   */
  removeCue(cue) {
    if (!cue || !cue.word) return this;
    
    // 从图中移除节点（会自动移除相关边）
    if (this.internalGraph.hasNode(cue.word)) {
      this.internalGraph.dropNode(cue.word);
    }
    
    // 从映射表中移除
    this.cueMap.delete(cue.word);
    
    return this;
  }

  /**
   * 获取Schema内的所有Cue
   * @returns {Array<WordCue>} Cue数组
   */
  getCues() {
    return Array.from(this.cueMap.values());
  }

  /**
   * 获取Schema内Cue的所有连接关系
   * @returns {Array<{source: string, target: string}>} 连接关系数组
   */
  getCueConnections() {
    return this.internalGraph.edges().map(edge => {
      const [source, target] = this.internalGraph.extremities(edge);
      return { source, target };
    });
  }

  /**
   * 获取指定Cue的度数（连接数）
   * @param {WordCue} cue - 要查询的Cue
   * @returns {number} 度数
   */
  getCueDegree(cue) {
    if (!cue || !cue.word || !this.internalGraph.hasNode(cue.word)) {
      return 0;
    }
    return this.internalGraph.degree(cue.word);
  }


  /**
   * 检查是否与另一个Schema连接
   * @param {Schema} other - 要检查的Schema
   * @returns {boolean} 是否连接
   */
  isConnectedTo(other) {
    if (!(other instanceof GraphSchema)) return false;
    return this.externalConnections.has(other.name);
  }

  /**
   * 获取所有外部连接的Schema名称
   * @returns {Array<string>} Schema名称数组
   */
  getExternalConnections() {
    // 注意：这里返回的是名称数组，实际应用中可能需要返回Schema实例
    // 但为了避免循环引用和保持简洁，暂时返回名称
    return Array.from(this.externalConnections);
  }

  /**
   * 检查是否与另一个Schema相等
   * @param {Schema} other - 对比的Schema
   * @returns {boolean} 是否相等
   */
  equals(other) {
    return other instanceof GraphSchema && this.name === other.name;
  }

  /**
   * 返回Schema的字符串表示
   * @returns {string} Schema名称
   */
  toString() {
    return this.name;
  }

  /**
   * 获取内部图的统计信息（调试用）
   * @returns {Object} 统计信息
   */
  getGraphStats() {
    return {
      name: this.name,
      nodeCount: this.internalGraph.order,
      edgeCount: this.internalGraph.size,
      externalConnectionCount: this.externalConnections.size,
      density: this.internalGraph.order > 1 ? 
        (2 * this.internalGraph.size) / (this.internalGraph.order * (this.internalGraph.order - 1)) : 0
    };
  }
}

module.exports = { GraphSchema };