/**
 * Cue - 认知线索（记忆网络节点）
 * 
 * ## 设计理念
 * 
 * Cue是整个认知系统的原子单位，代表一个最小的认知概念。
 * 基于认知心理学的"线索依赖记忆"（Cue-dependent memory）理论：
 * - 记忆不是孤立存储的，而是通过线索（cue）相互连接
 * - 一个线索被激活时，会激活与其相连的其他线索
 * - 连接的强度（权重）决定了激活传播的概率和强度
 * 
 * ## 为什么这样设计
 * 
 * 1. **去中心化的连接管理**
 *    - 每个Cue管理自己的出边（connections），像神经元管理自己的突触
 *    - 避免了中央连接表的复杂性，符合生物神经网络的结构
 *    - 便于并行处理和局部更新
 * 
 * 2. **极简的数据结构**
 *    - 只存储word（概念）和connections（连接）
 *    - 不存储原始内容，因为：
 *      a) 大模型本身就能理解word的语义
 *      b) 记忆本身就是模糊的、重构性的
 *      c) 节省存储空间，提高检索效率
 * 
 * 3. **单向连接设计**
 *    - connections只记录出边，不记录入边
 *    - 原因：认知过程是有方向的（从A想到B，不一定从B想到A）
 *    - 简化了数据结构，避免了双向同步的复杂性
 * 
 * ## 数据结构说明
 * 
 * ```javascript
 * {
 *   word: "认知",                    // 概念本身
 *   connections: Map {               // 出边集合
 *     "模型" => 1234567890.5,       // 目标词 => 权重（时间戳*衰减因子）
 *     "理解" => 1234567880.3
 *   }
 * }
 * ```
 * 
 * ## 权重的含义
 * 
 * 权重不是简单的强度值，而是编码了多个维度的信息：
 * - 时间信息：通过时间戳基数体现新旧
 * - 位置信息：通过位置衰减体现序列中的重要性
 * - 网络信息：通过出度调整体现节点的hub特性
 * 
 * @class Cue
 */
class Cue {
  /**
   * 创建一个新的Cue节点
   * 
   * @param {string} word - 概念词，作为节点的唯一标识
   * 
   * @example
   * const cue = new Cue("认知");
   * cue.connections.set("模型", 1234567890);
   */
  constructor(word) {
    /**
     * 概念词 - Cue的核心标识
     * 
     * 设计考虑：
     * - 使用词而不是ID，便于理解和调试
     * - 词本身就携带语义信息，大模型可以直接理解
     * - 支持任何语言的词汇（中文、英文、混合）
     * 
     * @type {string}
     */
    this.word = word;
    
    /**
     * 连接映射表 - 管理所有出边
     * 
     * 数据结构：Map<targetWord, weight>
     * - key: 目标Cue的word
     * - value: 连接权重（number）
     * 
     * 为什么用Map而不是Object：
     * - Map的键可以是任何类型（虽然这里是string）
     * - Map保持插入顺序（便于按时间顺序遍历）
     * - Map有更好的性能（频繁增删改查）
     * - Map有size属性（便于计算出度）
     * 
     * @type {Map<string, number>}
     */
    this.connections = new Map();
  }
  
  /**
   * 获取节点的出度（连接到多少个其他节点）
   * 
   * 出度的意义：
   * - 高出度 = 枢纽节点（hub），概念发散性强
   * - 低出度 = 专门节点，概念专一性强
   * 
   * @returns {number} 出边数量
   */
  getOutDegree() {
    return this.connections.size;
  }
  
  /**
   * 获取最强连接（权重最高的出边）
   * 
   * 用途：
   * - Prime时选择默认激活路径
   * - Recall时决定主要扩散方向
   * 
   * @returns {{word: string, weight: number}|null} 最强连接信息
   */
  getStrongestConnection() {
    if (this.connections.size === 0) return null;
    
    let maxWeight = -Infinity;
    let strongestWord = null;
    
    for (const [word, weight] of this.connections) {
      if (weight > maxWeight) {
        maxWeight = weight;
        strongestWord = word;
      }
    }
    
    return { word: strongestWord, weight: maxWeight };
  }
  
  /**
   * 获取按权重排序的连接列表
   * 
   * @param {number} limit - 返回前N个连接
   * @returns {Array<{word: string, weight: number}>} 排序后的连接列表
   */
  getSortedConnections(limit = Infinity) {
    return Array.from(this.connections.entries())
      .map(([word, weight]) => ({ word, weight }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, limit);
  }
  
  /**
   * 序列化为JSON对象（用于持久化）
   * 
   * @returns {Object} 可序列化的对象
   */
  toJSON() {
    return {
      word: this.word,
      connections: Array.from(this.connections.entries()).map(([target, weight]) => ({
        target,
        weight
      }))
    };
  }
  
  /**
   * 从JSON对象恢复（用于加载）
   * 
   * @param {Object} json - 序列化的对象
   * @returns {Cue} 恢复的Cue实例
   */
  static fromJSON(json) {
    const cue = new Cue(json.word);
    if (json.connections) {
      for (const conn of json.connections) {
        cue.connections.set(conn.target, conn.weight);
      }
    }
    return cue;
  }
}

module.exports = Cue;