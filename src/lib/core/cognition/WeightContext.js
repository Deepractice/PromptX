/**
 * WeightContext - 权重计算上下文
 * 
 * ## 设计理念
 * 
 * WeightContext封装了计算连接权重所需的所有信息。
 * 这是策略模式（Strategy Pattern）的关键部分，让权重计算与数据收集解耦。
 * 
 * ## 为什么这样设计
 * 
 * 1. **职责分离**
 *    - WeightContext负责收集数据
 *    - Strategy负责计算逻辑
 *    - 便于测试和扩展
 * 
 * 2. **最小化原则**
 *    - 只包含实际使用的参数
 *    - 避免过度设计
 *    - 保持简洁清晰
 * 
 * 3. **透明性**
 *    - 所有影响权重的因素都明确定义
 *    - 便于调试和优化
 *    - 易于理解权重的来源
 * 
 * ## 权重因子说明
 * 
 * 当前包含的因子：
 * 1. **时间因子（timestamp）**
 *    - 作为权重的基数
 *    - 新的记忆自然比旧的权重大
 *    - 体现记忆的时效性
 * 
 * 2. **位置因子（position）**
 *    - 在Schema序列中的位置
 *    - 越靠后的连接权重越低（衰减）
 *    - 体现首因效应和近因效应
 * 
 * 3. **网络因子（sourceOutDegree）**
 *    - 源节点的出度
 *    - 出度越高，每条边的权重越分散
 *    - 防止hub节点过度激活
 * 
 * ## 设计决策
 * 
 * Q: 为什么不包含targetCue？
 * A: 目标节点可能还不存在（Remember创建时），而且当前算法不需要目标节点信息。
 * 
 * Q: 为什么sourceOutDegree要缓存？
 * A: 避免重复计算，虽然简单但频繁调用。
 * 
 * Q: 为什么timestamp可以外部传入？
 * A: 同一批Schema应该使用相同的时间戳，保持批次内的一致性。
 * 
 * @class WeightContext
 */
class WeightContext {
  /**
   * 创建权重计算上下文
   * 
   * @param {Object} data - 上下文数据
   * @param {Cue} data.sourceCue - 源节点
   * @param {string} data.targetWord - 目标词
   * @param {number} data.position - 在Schema中的位置
   * @param {number} [data.timestamp] - 时间戳（可选，默认当前时间）
   * @param {Engram} [data.engram] - 完整的记忆痕迹对象（可选）
   */
  constructor(data) {
    /**
     * 源Cue节点
     * 
     * 包含了源节点的所有信息：
     * - word: 概念词
     * - connections: 所有出边
     * 
     * @type {Cue}
     */
    this.sourceCue = data.sourceCue;
    
    /**
     * 目标词
     * 
     * 注意：是词而不是Cue，因为目标节点可能还不存在。
     * Remember在创建连接时，目标Cue可能刚刚创建。
     * 
     * @type {string}
     */
    this.targetWord = data.targetWord;
    
    /**
     * 在Schema中的位置（0-based）
     * 
     * 用于计算位置衰减：
     * - position=0: 第一条边，权重最高
     * - position=1: 第二条边，权重衰减
     * - position=n: 权重 = base * decay^n
     * 
     * @type {number}
     */
    this.position = data.position;
    
    /**
     * 当前时间戳
     * 
     * 作为权重的基数，保证：
     * - 新的记忆权重 > 旧的记忆权重
     * - 同批次使用相同时间戳
     * 
     * 使用毫秒时间戳（13位数字），足够精确且不会溢出。
     * 
     * @type {number}
     */
    this.timestamp = data.timestamp || Date.now();
    
    /**
     * 源节点的出度（缓存）
     * 
     * 出度 = 源节点连接到多少其他节点
     * 用于调整权重，防止hub节点过度激活。
     * 
     * 缓存原因：避免重复访问Map.size
     * 
     * @type {number}
     */
    this.sourceOutDegree = this.sourceCue ? this.sourceCue.connections.size : 0;
    
    /**
     * 完整的记忆痕迹对象
     * 
     * 包含了记忆的完整信息：
     * - content: 原始经验
     * - schema: 概念序列
     * - strength: 角色评分（0-1）
     * - timestamp: 时间戳
     * 
     * 让策略可以使用strength进行权重调整
     * 
     * @type {Engram|null}
     */
    this.engram = data.engram || null;
    
    /**
     * 记忆强度（从engram提取）
     * 
     * 便捷访问，避免总是写this.engram.strength
     * 默认值0.8用于向后兼容
     * 
     * @type {number}
     */
    this.strength = this.engram ? this.engram.strength : 0.8;
  }
  
  /**
   * 获取源词
   * 
   * 便捷方法，避免总是写this.sourceCue.word
   * 
   * @returns {string|null} 源词
   */
  getSourceWord() {
    return this.sourceCue ? this.sourceCue.word : null;
  }
  
  /**
   * 转换为调试字符串
   * 
   * 用于日志输出，包含关键信息。
   * 
   * @returns {string} 调试信息
   */
  toString() {
    const sourceWord = this.getSourceWord();
    return `WeightContext{${sourceWord}->${this.targetWord}, pos:${this.position}, degree:${this.sourceOutDegree}}`;
  }
  
  /**
   * 转换为JSON对象
   * 
   * 用于序列化和日志记录。
   * 
   * @returns {Object} JSON对象
   */
  toJSON() {
    return {
      sourceWord: this.getSourceWord(),
      targetWord: this.targetWord,
      position: this.position,
      timestamp: this.timestamp,
      sourceOutDegree: this.sourceOutDegree,
      strength: this.strength
    };
  }
}

module.exports = WeightContext;