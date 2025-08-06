// WordCue - 词汇级图节点的具体实现
// 层次主导理论：作为最小的认知单元，当与更大的Mind连接时被包含

const { Cue } = require('../interfaces/Cue.js');
// 注意：暂时先不引入 graphology，先实现基础功能
// const Graph = require('graphology');

class WordCue extends Cue {
  constructor(word, initialStrength) {
    super(word, initialStrength);
    // 临时使用简单的 Set 来存储连接关系
    // 待集成 graphology 后替换
    this.connections = new Set();
  }


  /**
   * WordCue的具体连接实现
   * 
   * **层次主导原则应用**：
   * - 同级WordCue：建立词汇间的语义关联（同义词、相关词）
   * - 与Schema/Semantic连接：被包含到更大的认知结构中
   * 
   * @param {Mind} other - 目标Mind节点
   * @returns {WordCue} 返回自身（同级连接时）
   * @protected
   */
  _doConnect(other) {
    const otherLayer = other.getLayer();
    
    if (otherLayer === 1) {
      // 同级WordCue连接：建立词汇语义关联
      if (other instanceof WordCue) {
        this.connections.add(other.word);
        other.connections.add(this.word);
      }
      return this;
    } else if (otherLayer === 2) {
      // 被Schema包含：WordCue成为Schema的内部节点
      if (typeof other.addCue === 'function') {
        other.addCue(this);
      }
      return this;
    } else if (otherLayer === 3) {
      // 被Semantic包含：WordCue直接加入全局认知网络
      if (typeof other.addCue === 'function') {
        other.addCue(this);
      }
      return this;
    }
    
    return this;
  }

  /**
   * WordCue的具体断联实现
   * 
   * **层次主导原则应用**：
   * - 同级WordCue：移除语义关联
   * - 与Schema/Semantic断联：从更大结构中移除
   * 
   * @param {Mind} other - 目标Mind节点
   * @returns {WordCue} 返回自身
   * @protected
   */
  _doDisconnect(other) {
    const otherLayer = other.getLayer();
    
    if (otherLayer === 1) {
      // 同级WordCue断联：移除词汇语义关联
      if (other instanceof WordCue) {
        this.connections.delete(other.word);
        other.connections.delete(this.word);
      }
      return this;
    } else if (otherLayer === 2) {
      // 从Schema中移除：WordCue不再属于该Schema
      if (typeof other.removeCue === 'function') {
        other.removeCue(this);
      }
      return this;
    } else if (otherLayer === 3) {
      // 从Semantic中移除：WordCue脱离全局认知网络
      if (typeof other.removeCue === 'function') {
        other.removeCue(this);
      }
      return this;
    }
    
    return this;
  }

  /**
   * 检查是否与另一个 WordCue 相等
   * @param {WordCue} other - 对比的词汇节点
   * @returns {boolean} 是否相等
   */
  equals(other) {
    return other instanceof WordCue && this.word === other.word;
  }

  /**
   * 返回词汇的字符串表示
   * @returns {string} 词汇字符串
   */
  toString() {
    return this.word;
  }

  /**
   * 获取所有连接的词汇（调试用）
   * @returns {Array<string>} 连接的词汇列表
   */
  getConnections() {
    return Array.from(this.connections);
  }
}

module.exports = { WordCue };