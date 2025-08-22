// Semantic - 全局级接口
// 知识网络的认知容器定义
//
// 核心洞察：Semantic = 智能体的所有Mind的集合
// 全局级认知容器，所有认知的统一管理器。
//
// 设计原则：
// 1. Semantic 是最高层的认知容器
// 2. 统一管理所有的 Cue 和 Schema
// 3. 作为认知网络的全局视图和操作入口
// 4. 层次主导原则中永远是最高主导者
//
// 全局网络示例：
// - 用户认知网络：包含所有用户相关的Schema和Cue
// - 业务认知网络：包含所有业务流程的Schema和Cue  
// - 系统认知网络：包含所有系统概念的Schema和Cue

const { Mind } = require('./Mind.js');

class Semantic extends Mind {
  /**
   * 构造全局认知网络
   * @param {string} name - 网络名称，默认为'GlobalSemantic'
   */
  constructor(name = 'GlobalSemantic') {
    super();
    if (name && typeof name !== 'string') {
      throw new Error('Semantic requires a valid name string');
    }
    this.name = name ? name.trim() : 'GlobalSemantic';
  }

  /**
   * Semantic的认知层次定义
   * 全局级是最高层认知容器，层次为3
   * 
   * @returns {number} 层次值3，表示全局级
   */
  getLayer() {
    return 3;
  }

  // Semantic 继承 Mind 的 connect/disconnect 实现
  // 层次主导原则已在 Mind 基类中实现

  /**
   * 添加Cue到全局认知网络
   * 子类必须实现具体的添加逻辑
   * 
   * @param {Cue} cue - 要添加的Cue
   * @returns {Semantic} 返回自身，支持链式调用
   */
  addCue(cue) {
    throw new Error('Semantic.addCue() must be implemented');
  }

  /**
   * 从全局认知网络移除Cue
   * 子类必须实现具体的移除逻辑
   * 
   * @param {Cue} cue - 要移除的Cue
   * @returns {Semantic} 返回自身，支持链式调用
   */
  removeCue(cue) {
    throw new Error('Semantic.removeCue() must be implemented');
  }

  /**
   * 检查是否包含指定的Cue
   * 子类必须实现具体的检查逻辑
   * 
   * @param {Cue} cue - 要检查的Cue
   * @returns {boolean} 是否包含
   */
  hasCue(cue) {
    throw new Error('Semantic.hasCue() must be implemented');
  }

  /**
   * 添加Schema到全局认知网络
   * 子类必须实现具体的添加逻辑
   * 
   * @param {Schema} schema - 要添加的Schema
   * @returns {Semantic} 返回自身，支持链式调用
   */
  addSchema(schema) {
    throw new Error('Semantic.addSchema() must be implemented');
  }

  /**
   * 从全局认知网络移除Schema
   * 子类必须实现具体的移除逻辑
   * 
   * @param {Schema} schema - 要移除的Schema
   * @returns {Semantic} 返回自身，支持链式调用
   */
  removeSchema(schema) {
    throw new Error('Semantic.removeSchema() must be implemented');
  }

  /**
   * 检查是否包含指定的Schema
   * 子类必须实现具体的检查逻辑
   * 
   * @param {Schema} schema - 要检查的Schema
   * @returns {boolean} 是否包含
   */
  hasSchema(schema) {
    throw new Error('Semantic.hasSchema() must be implemented');
  }

  /**
   * 获取全局认知网络中的所有Cue
   * 子类必须实现具体的获取逻辑
   * 
   * @returns {Array<Cue>} Cue数组
   */
  getAllCues() {
    throw new Error('Semantic.getAllCues() must be implemented');
  }

  /**
   * 获取全局认知网络中的所有Schema
   * 子类必须实现具体的获取逻辑
   * 
   * @returns {Array<Schema>} Schema数组
   */
  getAllSchemas() {
    throw new Error('Semantic.getAllSchemas() must be implemented');
  }

  /**
   * 全局网络相等性判断
   * 
   * 两个 Semantic 相等当且仅当其名称相同。
   * 这是 Semantic 作为图节点的身份标识。
   * 
   * @param {Semantic} other - 对比的全局网络
   * @returns {boolean} 是否相等
   */
  equals(other) {
    return other instanceof Semantic && this.name === other.name;
  }

  /**
   * 全局网络字符串表示
   * 
   * 返回网络名称，方便调试和显示。
   * 
   * @returns {string} 网络名称
   */
  toString() {
    return this.name;
  }
}

module.exports = { Semantic };