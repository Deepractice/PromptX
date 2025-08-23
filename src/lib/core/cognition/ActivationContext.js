/**
 * ActivationContext - 激活扩散上下文
 * 
 * ## 设计理念
 * 
 * ActivationContext封装了激活扩散过程中的所有状态和数据。
 * 与WeightContext不同，这是一个有状态的对象，会在激活过程中不断更新。
 * 
 * ## 为什么这样设计
 * 
 * 1. **状态管理**
 *    - 集中管理激活过程的所有状态
 *    - 避免在Recall中维护大量状态变量
 *    - 便于不同策略共享和访问状态
 * 
 * 2. **策略解耦**
 *    - 策略只需要关注算法逻辑
 *    - 状态管理由Context负责
 *    - 便于实现不同的激活算法
 * 
 * 3. **可扩展性**
 *    - 新策略可能需要新的状态
 *    - 通过Context统一管理
 *    - 不影响现有代码
 * 
 * ## 海马体算法需要的状态
 * 
 * - **能量池（energyPool）**：每个节点的当前能量水平
 * - **激活集（activatedNodes）**：已激活的节点集合
 * - **循环计数（cycle）**：当前的激活循环次数
 * - **连接记录（connections）**：已建立的连接关系
 * 
 * @class ActivationContext
 */
class ActivationContext {
  /**
   * 创建激活上下文
   * 
   * @param {Object} params - 初始参数
   * @param {Network} params.network - 认知网络
   * @param {Cue} params.sourceCue - 当前源节点
   * @param {number} params.depth - 当前深度（兼容旧代码）
   * @param {number} params.currentEnergy - 当前节点能量
   * @param {Set} params.activatedNodes - 已激活节点集
   * @param {Map} params.energyPool - 节点能量池
   * @param {number} params.cycle - 循环次数
   * @param {Array} params.connections - 连接记录
   */
  constructor(params = {}) {
    /**
     * 认知网络引用
     * @type {Network}
     */
    this.network = params.network;
    
    /**
     * 当前源节点
     * @type {Cue}
     */
    this.sourceCue = params.sourceCue || null;
    
    /**
     * 当前深度（为了兼容性保留）
     * @type {number}
     */
    this.depth = params.depth || 0;
    
    /**
     * 当前节点的能量水平
     * 海马体算法的核心概念
     * @type {number}
     */
    this.currentEnergy = params.currentEnergy || 1.0;
    
    /**
     * 已激活的节点集合
     * 用于避免重复激活和计算网络规模
     * @type {Set<string>}
     */
    this.activatedNodes = params.activatedNodes || new Set();
    
    /**
     * 能量池 - 记录每个节点的当前能量
     * 海马体算法的核心数据结构
     * @type {Map<string, number>}
     */
    this.energyPool = params.energyPool || new Map();
    
    /**
     * 当前循环次数
     * 海马体算法用于限制激活轮数
     * @type {number}
     */
    this.cycle = params.cycle || 0;
    
    /**
     * 连接记录
     * 记录激活过程中建立的所有连接
     * @type {Array<{from: string, to: string, weight: number}>}
     */
    this.connections = params.connections || [];
    
    /**
     * 时间戳（用于日志和调试）
     * @type {number}
     */
    this.timestamp = params.timestamp || Date.now();
  }
  
  /**
   * 获取目标节点的频率
   * 
   * @param {string} targetWord - 目标词
   * @returns {number} 频率值
   */
  getTargetFrequency(targetWord) {
    const targetCue = this.network.getCue(targetWord);
    return targetCue?.recallFrequency || 0;
  }
  
  /**
   * 检查节点是否已激活
   * 
   * @param {string} word - 节点词
   * @returns {boolean} 是否已激活
   */
  isActivated(word) {
    return this.activatedNodes.has(word);
  }
  
  /**
   * 获取节点的当前能量
   * 
   * @param {string} word - 节点词
   * @returns {number} 能量值
   */
  getNodeEnergy(word) {
    return this.energyPool.get(word) || 0;
  }
  
  /**
   * 设置节点能量
   * 
   * @param {string} word - 节点词
   * @param {number} energy - 能量值
   */
  setNodeEnergy(word, energy) {
    if (energy > 0) {
      this.energyPool.set(word, energy);
    } else {
      this.energyPool.delete(word);  // 能量耗尽，移除
    }
  }
  
  /**
   * 累加节点能量
   * 
   * @param {string} word - 节点词
   * @param {number} energyToAdd - 要添加的能量
   * @returns {number} 新的能量值
   */
  addNodeEnergy(word, energyToAdd) {
    const current = this.getNodeEnergy(word);
    const newEnergy = current + energyToAdd;
    this.setNodeEnergy(word, newEnergy);
    return newEnergy;
  }
  
  /**
   * 标记节点为已激活
   * 
   * @param {string} word - 节点词
   */
  markActivated(word) {
    this.activatedNodes.add(word);
  }
  
  /**
   * 记录连接
   * 
   * @param {string} from - 源节点
   * @param {string} to - 目标节点
   * @param {number} weight - 连接权重
   */
  recordConnection(from, to, weight) {
    this.connections.push({ from, to, weight });
  }
  
  /**
   * 增加循环计数
   */
  incrementCycle() {
    this.cycle++;
  }
  
  /**
   * 获取统计信息
   * 
   * @returns {Object} 统计信息
   */
  getStatistics() {
    return {
      activatedNodes: this.activatedNodes.size,
      totalEnergy: Array.from(this.energyPool.values()).reduce((sum, e) => sum + e, 0),
      highEnergyNodes: Array.from(this.energyPool.entries())
        .filter(([_, energy]) => energy > 0.5)
        .length,
      connections: this.connections.length,
      cycle: this.cycle
    };
  }
  
  /**
   * 转换为调试字符串
   * 
   * @returns {string} 调试信息
   */
  toString() {
    const stats = this.getStatistics();
    return `ActivationContext{cycle:${this.cycle}, activated:${stats.activatedNodes}, energy:${stats.totalEnergy.toFixed(2)}}`;
  }
}

module.exports = ActivationContext;