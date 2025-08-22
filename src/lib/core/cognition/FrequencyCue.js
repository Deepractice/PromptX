const Cue = require('./Cue');
const logger = require('../../utils/logger');

/**
 * FrequencyCue - 带频率统计的认知线索
 * 
 * ## 设计理念
 * 
 * FrequencyCue继承自Cue，在保持Cue纯数据结构的基础上，
 * 添加了频率统计功能。这种设计遵循了开闭原则（OCP）：
 * - 对扩展开放：通过继承添加新功能
 * - 对修改关闭：不改变Cue的原有设计
 * 
 * ## 为什么需要FrequencyCue
 * 
 * 1. **使用强化原理**
 *    - 神经科学："neurons that fire together wire together"
 *    - 频繁被激活的神经通路会得到强化
 *    - 模拟人类记忆的"越用越强"特性
 * 
 * 2. **分离关注点**
 *    - Cue：纯粹的数据结构，表示概念和连接
 *    - FrequencyCue：添加统计信息，用于Network管理
 *    - 清晰的职责边界
 * 
 * 3. **向后兼容**
 *    - FrequencyCue IS-A Cue，可以无缝替换
 *    - 所有使用Cue的地方都可以使用FrequencyCue
 *    - 不影响现有代码
 * 
 * ## 频率的作用
 * 
 * 在Softmax归一化时，频率作为偏置项：
 * ```
 * adjustedLogWeight = log(weight) + log(1 + frequency * α)
 * ```
 * 
 * - 高频率的节点获得额外的激活概率
 * - 形成"优先激活常用路径"的模式
 * - 模拟工作记忆的激活模式
 * 
 * @class FrequencyCue
 * @extends Cue
 */
class FrequencyCue extends Cue {
  /**
   * 创建一个带频率统计的Cue
   * 
   * @param {string} word - 概念词
   */
  constructor(word) {
    super(word);
    
    /**
     * Recall频率 - 记录该节点被激活的次数
     * 
     * 含义：
     * - 每次被Recall激活时递增
     * - 反映了概念在思考中的活跃度
     * - 用于Softmax归一化时的频率偏置
     * 
     * @type {number}
     */
    this.recallFrequency = 0;
  }
  
  /**
   * 增加recall频率
   * 
   * 设计：
   * - 简单递增，不设上限
   * - 未来可以考虑添加衰减机制
   * - 可以扩展为更复杂的统计（如时间窗口内的频率）
   */
  incrementFrequency() {
    this.recallFrequency++;
    logger.debug('[FrequencyCue] Frequency incremented', {
      word: this.word,
      newFrequency: this.recallFrequency
    });
  }
  
  /**
   * 获取频率值
   * 
   * @returns {number} 当前频率
   */
  getFrequency() {
    return this.recallFrequency;
  }
  
  /**
   * 重置频率（用于测试或清理）
   */
  resetFrequency() {
    this.recallFrequency = 0;
    logger.debug('[FrequencyCue] Frequency reset', { word: this.word });
  }
  
  /**
   * 序列化为JSON（包含频率信息）
   * 
   * @returns {Object} 包含频率的序列化对象
   */
  toJSON() {
    return {
      ...super.toJSON(),
      recallFrequency: this.recallFrequency
    };
  }
  
  /**
   * 从JSON恢复（包含频率信息）
   * 
   * @param {Object} json - 序列化的对象
   * @returns {FrequencyCue} 恢复的FrequencyCue实例
   */
  static fromJSON(json) {
    const freqCue = new FrequencyCue(json.word);
    
    // 恢复连接
    if (json.connections) {
      for (const conn of json.connections) {
        freqCue.connections.set(conn.target, conn.weight);
      }
    }
    
    // 恢复频率
    freqCue.recallFrequency = json.recallFrequency || 0;
    
    return freqCue;
  }
  
  /**
   * 获取调试信息
   * 
   * @returns {Object} 调试信息
   */
  getDebugInfo() {
    return {
      word: this.word,
      outDegree: this.getOutDegree(),
      recallFrequency: this.recallFrequency,
      strongestConnection: this.getStrongestConnection()
    };
  }
}

module.exports = FrequencyCue;