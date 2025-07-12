// Schema - 事件级接口
// 结构组合的认知单元定义
//
// 核心洞察：Schema = 一组已经图结构化的Cue
// 事件级认知单元，词汇的有机组合体。
//
// 设计原则：
// 1. Schema 是 Cue 的集合体，具有内部结构
// 2. 通过图关系组织内部 Cue，形成有意义的事件表示
// 3. 可以与其他 Schema 建立关联关系
// 4. 作为中间层，既包含 Cue，也可被 Semantic 包含
//
// 事件示例：
// - 用户登录：包含"用户名"、"密码"、"验证"等Cue
// - 订单流程：包含"商品"、"支付"、"配送"等Cue
// - 数据分析：包含"收集"、"处理"、"可视化"等Cue

const { Mind } = require('./Mind.js');

class Schema extends Mind {
  /**
   * 构造事件节点
   * @param {string} name - 事件名称
   */
  constructor(name) {
    super();
    if (!name || typeof name !== 'string') {
      throw new Error('Schema requires a valid name string');
    }
    this.name = name.trim();
  }

  /**
   * Schema的认知层次定义
   * 事件级是词汇的组合体，层次为2
   * 
   * @returns {number} 层次值2，表示事件级
   */
  getLayer() {
    return 2;
  }

  // Schema 继承 Mind 的 connect/disconnect 实现
  // 层次主导原则已在 Mind 基类中实现

  /**
   * 添加Cue到Schema内部结构
   * 子类必须实现具体的添加逻辑
   * 
   * @param {Cue} cue - 要添加的Cue
   * @returns {Schema} 返回自身，支持链式调用
   */
  addCue(cue) {
    throw new Error('Schema.addCue() must be implemented');
  }

  /**
   * 从Schema内部结构移除Cue
   * 子类必须实现具体的移除逻辑
   * 
   * @param {Cue} cue - 要移除的Cue
   * @returns {Schema} 返回自身，支持链式调用
   */
  removeCue(cue) {
    throw new Error('Schema.removeCue() must be implemented');
  }

  /**
   * 检查Schema是否包含指定的Cue
   * 子类必须实现具体的检查逻辑
   * 
   * @param {Cue} cue - 要检查的Cue
   * @returns {boolean} 是否包含
   */
  hasCue(cue) {
    throw new Error('Schema.hasCue() must be implemented');
  }

  /**
   * 获取Schema内的所有Cue
   * 子类必须实现具体的获取逻辑
   * 
   * @returns {Array<Cue>} Cue数组
   */
  getCues() {
    throw new Error('Schema.getCues() must be implemented');
  }

  /**
   * 事件相等性判断
   * 
   * 两个 Schema 相等当且仅当其名称相同。
   * 这是 Schema 作为图节点的身份标识。
   * 
   * @param {Schema} other - 对比的事件节点
   * @returns {boolean} 是否相等
   */
  equals(other) {
    return other instanceof Schema && this.name === other.name;
  }

  /**
   * 事件字符串表示
   * 
   * 返回事件名称，方便调试和显示。
   * 
   * @returns {string} 事件名称
   */
  toString() {
    return this.name;
  }
}

module.exports = { Schema };