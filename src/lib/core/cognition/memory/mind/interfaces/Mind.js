// Mind Interface - 心智接口
// 认知体系的图节点抽象
//
// === 核心设计原则：层次主导理论 ===
// 
// **小的融入大的，永远是大的主导**
// 
// 认知层次（从小到大）：
// 1. WordCue（词汇级）- 认知原子，最小单元
// 2. Schema（事件级）- 结构组合，词汇的集合体  
// 3. Semantic（全局级）- 知识网络，所有认知的容器
//
// === 连接规则：大的主导 ===
// 
// 任何两个Mind连接，永远返回层次更高（更大）的那个：
// - WordCue.connect(WordCue)   → WordCue   (同级，返回调用者)
// - WordCue.connect(Schema)    → Schema    (小→大，Schema主导)
// - WordCue.connect(Semantic)  → Semantic  (小→大，Semantic主导)
// - Schema.connect(Semantic)   → Semantic  (小→大，Semantic主导)
// - Semantic.connect(任何)      → Semantic  (最大，永远主导)
//
// === 断联规则：大的主导 ===
//
// 谁大谁负责断联决策，小的被动接受：
// - Semantic.disconnect(任何)   → Semantic  (大的主导断联)
// - Schema.disconnect(WordCue) → Schema    (大的主导断联)
// - 小的断联大的也技术可行，但仍返回大的（保持主导权）
//
// === 包含关系的自然体现 ===
//
// connect操作本质就是包含关系的建立：
// - Schema.connect(WordCue)   → Schema包含了WordCue
// - Semantic.connect(Schema)  → Semantic包含了Schema  
// - Semantic.connect(WordCue) → Semantic直接包含WordCue（跨层包含）
//
// === 设计哲学 ===
//
// 1. **层次统一**：所有Mind都可以相互连接，打破同类限制
// 2. **主导明确**：永远是大的（高层）主导小的（低层）
// 3. **接口一致**：connect/disconnect语义在所有层次保持一致
// 4. **组合自然**：连接即包含，符合认知直觉
// 5. **返回规律**：永远返回主导者，支持链式调用

class Mind {
  /**
   * 获取Mind的认知层次
   * 用于确定连接时的主导关系
   * 
   * @returns {number} 层次值：1=WordCue, 2=Schema, 3=Semantic
   */
  getLayer() {
    throw new Error('Mind.getLayer() must be implemented');
  }

  /**
   * 连接到另一个Mind - 层次主导的统一连接
   * 
   * **核心原则：小的融入大的，大的主导连接**
   * 
   * 连接语义：
   * - 同层连接：建立平等的关联关系
   * - 跨层连接：小的被大的包含，大的获得主导权
   * 
   * 返回值规律：
   * - 永远返回层次更高（更大）的Mind
   * - 同层时返回调用者（this）
   * 
   * @param {Mind} other - 目标Mind节点
   * @returns {Mind} 返回主导者（层次更高的Mind）
   */
  connect(other) {
    if (!other || typeof other.getLayer !== 'function') {
      throw new Error('Can only connect to another Mind');
    }

    const thisLayer = this.getLayer();
    const otherLayer = other.getLayer();

    if (thisLayer >= otherLayer) {
      // 自己大于等于对方，自己主导连接
      return this._doConnect(other);
    } else {
      // 对方更大，让对方主导连接
      return other.connect(this);
    }
  }

  /**
   * 断开与另一个Mind的连接 - 层次主导的统一断联
   * 
   * **核心原则：大的主导断联决策**
   * 
   * 断联语义：
   * - 移除包含关系或关联关系
   * - 大的决定是否断开与小的的连接
   * 
   * @param {Mind} other - 目标Mind节点  
   * @returns {Mind} 返回主导者（层次更高的Mind）
   */
  disconnect(other) {
    if (!other || typeof other.getLayer !== 'function') {
      return this; // 忽略无效目标
    }

    const thisLayer = this.getLayer();
    const otherLayer = other.getLayer();

    if (thisLayer >= otherLayer) {
      // 自己大于等于对方，自己主导断联
      return this._doDisconnect(other);
    } else {
      // 对方更大，让对方主导断联
      return other.disconnect(this);
    }
  }

  /**
   * 具体执行连接的内部方法
   * 子类必须实现，定义具体的连接逻辑
   * 
   * @param {Mind} other - 目标Mind节点
   * @returns {Mind} 返回自身
   * @protected
   */
  _doConnect(other) {
    throw new Error('Mind._doConnect() must be implemented');
  }

  /**
   * 具体执行断联的内部方法
   * 子类必须实现，定义具体的断联逻辑
   * 
   * @param {Mind} other - 目标Mind节点
   * @returns {Mind} 返回自身
   * @protected
   */
  _doDisconnect(other) {
    throw new Error('Mind._doDisconnect() must be implemented');
  }
}

module.exports = { Mind };