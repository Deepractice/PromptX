/**
 * WeightStrategy - 权重计算策略接口
 * 
 * ## 设计理念
 * 
 * 采用策略模式（Strategy Pattern）来封装权重计算算法，让算法可以独立变化。
 * 这样设计的好处是：
 * - 算法与使用者（Remember）解耦
 * - 便于测试不同的权重算法
 * - 支持运行时切换策略
 * 
 * ## 为什么这样设计
 * 
 * 1. **可扩展性**
 *    - 未来可能需要不同的权重算法（如基于频率、基于重要性等）
 *    - 不同场景可能需要不同的策略（学习模式 vs 复习模式）
 *    - 避免在Remember类中写死算法
 * 
 * 2. **测试友好**
 *    - 可以独立测试每个策略
 *    - 可以使用mock策略进行单元测试
 *    - 便于对比不同策略的效果
 * 
 * 3. **关注点分离**
 *    - Remember只负责构建网络结构
 *    - Strategy只负责计算权重
 *    - WeightContext负责传递数据
 * 
 * ## 策略接口约定
 * 
 * 所有策略必须实现calculate方法：
 * - 输入：WeightContext对象（包含所有计算所需信息）
 * - 输出：number类型的权重值
 * - 约束：权重应该是正数，且有合理的数值范围
 * 
 * @class WeightStrategy
 */
class WeightStrategy {
  /**
   * 计算权重
   * 
   * 子类必须实现此方法。
   * 
   * @param {WeightContext} context - 计算上下文
   * @param {Cue} context.sourceCue - 源节点
   * @param {string} context.targetWord - 目标词
   * @param {number} context.position - 在Schema中的位置
   * @param {number} context.timestamp - 时间戳
   * @param {number} context.sourceOutDegree - 源节点出度
   * @returns {number} 计算得出的权重（应为正数）
   */
  calculate(context) {
    throw new Error('WeightStrategy.calculate() must be implemented');
  }
  
  /**
   * 激活时归一化（用于Recall）
   * 
   * 将一组边的权重转换为激活概率
   * 默认实现：简单归一化
   * 
   * @param {Array} edges - 边数组 [{targetWord, weight}, ...]
   * @returns {Array} 归一化后的边数组，添加了probability字段
   */
  normalizeForActivation(edges) {
    if (edges.length === 0) return edges;
    
    // 默认：简单归一化
    const totalWeight = edges.reduce((sum, e) => sum + e.weight, 0);
    return edges.map(edge => ({
      ...edge,
      probability: edge.weight / totalWeight
    }));
  }
}

/**
 * SimpleWeightStrategy - 简单权重策略
 * 
 * ## 设计理念
 * 
 * 最简单的权重策略，只考虑位置因素。
 * 适用于测试或者不需要复杂权重计算的场景。
 * 
 * ## 算法说明
 * 
 * weight = baseWeight * decay^position
 * 
 * - baseWeight: 基础权重（默认1.0）
 * - decay: 衰减率（默认0.9）
 * - position: 在Schema中的位置（0-based）
 * 
 * 例子：
 * - position=0: weight = 1.0 * 0.9^0 = 1.0
 * - position=1: weight = 1.0 * 0.9^1 = 0.9
 * - position=2: weight = 1.0 * 0.9^2 = 0.81
 * 
 * @class SimpleWeightStrategy
 * @extends WeightStrategy
 */
class SimpleWeightStrategy extends WeightStrategy {
  constructor(options = {}) {
    super();
    
    /**
     * 基础权重
     * @type {number}
     */
    this.baseWeight = options.baseWeight || 1.0;
    
    /**
     * 位置衰减率
     * @type {number}
     */
    this.decay = options.decay || 0.9;
  }
  
  /**
   * 计算权重
   * 
   * @param {WeightContext} context - 计算上下文
   * @returns {number} 权重值
   */
  calculate(context) {
    // 简单的位置衰减
    const weight = this.baseWeight * Math.pow(this.decay, context.position);
    return weight;
  }
}

/**
 * TimeBasedWeightStrategy - 基于时间戳的权重策略（核心策略）
 * 
 * ## 设计理念
 * 
 * 这是我们的核心权重策略，基于认知心理学和神经网络原理设计。
 * 
 * ### 存储阶段（Remember）
 * 权重编码了两个维度的信息：
 * 1. **时间维度**：新的记忆自然比旧的权重大
 * 2. **序列维度**：序列中越靠后的连接权重越低
 * 
 * ### 激活阶段（Recall）
 * 使用Softmax归一化模拟神经网络激活：
 * - 将权重转换为概率分布
 * - 高权重连接有更高的激活概率
 * - 自然实现了选择性激活
 * 
 * ## 算法公式
 * 
 * ### 存储权重
 * ```
 * weight = timestamp × decay^position
 * ```
 * 
 * ### 激活概率（Softmax）
 * ```
 * probability_i = exp(log(weight_i)) / Σexp(log(weight))
 * ```
 * 
 * 参数说明：
 * - **timestamp**: 时间戳基数（毫秒），保证新记忆 > 旧记忆
 * - **decay**: 位置衰减率（默认0.9），体现序列中的重要性递减
 * - **position**: 在Schema中的位置（0-based）
 * 
 * ## 设计决策
 * 
 * Q: 为什么不在存储时考虑出度？
 * A: 
 * - 存储时保持完整权重，激活时通过Softmax自然调节
 * - Softmax自动实现了"能量守恒"：概率总和为1
 * - 更像真实神经网络的激活模式
 * 
 * Q: 为什么用Softmax而不是简单归一化？
 * A:
 * - Softmax放大差异，强者更强
 * - 符合神经网络的winner-take-all机制
 * - 自然形成选择性激活
 * 
 * ## 计算示例
 * 
 * 假设：
 * - timestamp = 1700000000000
 * - position = 2
 * - decay = 0.9
 * 
 * 存储权重：
 * - weight = 1700000000000 * 0.9^2 = 1377000000000
 * 
 * 激活时（假设有3条边）：
 * - 边1: 1700000000000 → 概率 35%
 * - 边2: 1530000000000 → 概率 33%
 * - 边3: 1377000000000 → 概率 32%
 * 
 * @class TimeBasedWeightStrategy
 * @extends WeightStrategy
 */
class TimeBasedWeightStrategy extends WeightStrategy {
  constructor(options = {}) {
    super();
    
    /**
     * 位置衰减率
     * 控制序列中权重的递减速度
     * @type {number}
     */
    this.decay = options.decay || 0.9;
    
    /**
     * 激活阈值
     * 低于此概率的边不激活
     * @type {number}
     */
    this.activationThreshold = options.activationThreshold || 0.05;  // 5%
    
    /**
     * 频率因子
     * 控制频率对激活概率的影响程度
     * @type {number}
     */
    this.frequencyFactor = options.frequencyFactor || 0.1;
    
    /**
     * Network引用（用于获取频率）
     * 由CognitionSystem注入
     * @type {Network|null}
     */
    this.network = null;
  }
  
  /**
   * 计算存储权重
   * 
   * @param {WeightContext} context - 计算上下文
   * @returns {number} 权重值
   */
  calculate(context) {
    // 时间戳作为基数
    const timestamp = context.timestamp;
    
    // 位置衰减因子
    const positionFactor = Math.pow(this.decay, context.position);
    
    // 角色强度因子（从engram获取）
    const strengthFactor = context.strength || 0.8;
    
    // 最终权重：时间 * 位置衰减 * 角色强度
    const weight = timestamp * positionFactor * strengthFactor;
    
    return weight;
  }
  
  /**
   * Softmax归一化（用于激活）
   * 
   * 加入频率偏置，实现"越用越强"的效果
   * 
   * @param {Array} edges - 边数组
   * @returns {Array} 归一化后的边数组
   */
  normalizeForActivation(edges) {
    if (edges.length === 0) return edges;
    
    // 计算带频率偏置的对数权重
    const enhancedEdges = edges.map(edge => {
      // 获取目标节点的频率
      let frequency = 0;
      if (this.network) {
        const targetCue = this.network.cues.get(edge.targetWord);
        frequency = targetCue ? (targetCue.recallFrequency || 0) : 0;
      }
      
      // 在对数空间添加频率偏置
      const logWeight = Math.log(edge.weight);
      const frequencyBias = Math.log(1 + frequency * this.frequencyFactor);
      
      return {
        ...edge,
        adjustedLogWeight: logWeight + frequencyBias,
        frequency
      };
    });
    
    // 找出最大值（避免数值溢出）
    const maxLogWeight = Math.max(...enhancedEdges.map(e => e.adjustedLogWeight));
    
    // 计算exp(adjustedLogWeight - max)
    const expWeights = enhancedEdges.map(e => 
      Math.exp(e.adjustedLogWeight - maxLogWeight)
    );
    const sumExp = expWeights.reduce((a, b) => a + b, 0);
    
    // 计算概率并排序
    const normalizedEdges = edges.map((edge, i) => ({
      ...edge,
      probability: expWeights[i] / sumExp,
      frequency: enhancedEdges[i].frequency
    })).sort((a, b) => b.probability - a.probability);
    
    // 过滤掉概率太低的边
    return normalizedEdges.filter(edge => edge.probability >= this.activationThreshold);
  }
}

/**
 * TemperatureWeightStrategy - 温度控制的权重策略
 * 
 * ## 设计理念
 * 
 * 基于深度学习中的temperature-controlled softmax，解决hub节点语义污染问题。
 * 通过温度参数控制概率分布的"锐度"，实现批次隔离和创造性平衡。
 * 
 * ### 核心创新
 * 1. **批次感知**：利用timestamp作为天然的批次指纹
 * 2. **温度控制**：动态调节激活的集中度
 * 3. **对比度调节**：保留归一化的同时维持批次差异
 * 
 * ## 温度参数效果
 * 
 * - **低温（0.1-0.5）**：锐化差异，强化同批次连接
 * - **常温（0.8-1.2）**：平衡模式，适度扩散
 * - **高温（1.5-2.0）**：平滑差异，鼓励跨批次探索
 * 
 * ## 算法公式
 * 
 * ### 带温度的Softmax
 * ```
 * probability_i = exp((weight_i + batch_bonus_i) / T) / Σexp((weight_j + batch_bonus_j) / T)
 * ```
 * 
 * 其中：
 * - T: 温度参数
 * - batch_bonus: 批次奖励（同批次获得额外权重）
 * 
 * @class TemperatureWeightStrategy
 * @extends TimeBasedWeightStrategy
 */
class TemperatureWeightStrategy extends TimeBasedWeightStrategy {
  constructor(options = {}) {
    super(options);
    
    /**
     * 温度参数
     * 控制概率分布的锐度
     * @type {number}
     */
    this.temperature = options.temperature || 0.5;
    
    /**
     * 对比度模式
     * 'auto' | 'low' | 'medium' | 'high'
     * @type {string}
     */
    this.contrastMode = options.contrastMode || 'auto';
  }
  
  /**
   * 设置对比度级别
   * 
   * @param {'low'|'medium'|'high'} level - 对比度级别
   */
  setContrastLevel(level) {
    const contrastMap = {
      'low': 2.0,    // 高温，低对比度（~20%差异）
      'medium': 1.0,  // 常温，中等对比度（~50%差异）
      'high': 0.3     // 低温，高对比度（~80%差异）
    };
    
    this.temperature = contrastMap[level] || 1.0;
    this.contrastMode = level;
  }
  
  /**
   * 设置对比度百分比
   * 
   * @param {number} percentage - 对比度百分比（0-100）
   */
  setContrastPercentage(percentage) {
    // 0% = 完全平均（高温），100% = 极度锐化（低温）
    const clampedPercentage = Math.max(0, Math.min(100, percentage));
    this.temperature = 2.0 - (clampedPercentage / 100) * 1.8;
    this.contrastMode = 'custom';
  }
  
  
  /**
   * 自动调节温度（基于网络状态）
   * 
   * @param {Array} edges - 边数组
   * @returns {number} 调节后的温度
   */
  autoAdjustTemperature(edges) {
    if (this.contrastMode !== 'auto') {
      return this.temperature;
    }
    
    // 计算hub密度（高连接数节点的比例）
    const avgConnections = edges.length;
    const hubThreshold = 5;
    
    if (avgConnections > hubThreshold * 2) {
      // 超级hub节点：降低温度，增强选择性
      return 0.3;
    } else if (avgConnections > hubThreshold) {
      // 普通hub节点：中低温度
      return 0.5;
    } else {
      // 普通节点：常温
      return 1.0;
    }
  }
  
  /**
   * 带温度控制的Softmax归一化
   * 
   * 核心思想：
   * - 权重本身已包含timestamp信息（weight = timestamp * decay^position）
   * - 同批次的权重数量级相近，不同批次差异巨大
   * - 温度控制这种差异的影响程度
   * 
   * @param {Array} edges - 边数组
   * @returns {Array} 归一化后的边数组
   */
  normalizeForActivation(edges) {
    if (edges.length === 0) return edges;
    
    // 自动调节温度
    const effectiveTemperature = this.autoAdjustTemperature(edges);
    
    // 计算带频率偏置的对数权重
    const enhancedEdges = edges.map(edge => {
      // 获取频率（继承自父类）
      let frequency = 0;
      if (this.network) {
        const targetCue = this.network.cues.get(edge.targetWord);
        frequency = targetCue ? (targetCue.recallFrequency || 0) : 0;
      }
      
      // 在对数空间处理（权重已包含timestamp信息）
      const logWeight = Math.log(edge.weight);
      const frequencyBias = Math.log(1 + frequency * this.frequencyFactor);
      
      return {
        ...edge,
        adjustedLogWeight: logWeight + frequencyBias,
        frequency
      };
    });
    
    // 找出最大值（数值稳定性）
    const maxLogWeight = Math.max(...enhancedEdges.map(e => e.adjustedLogWeight));
    
    // 带温度的softmax计算
    // 低温：放大权重差异（同批次权重相近，会一起被选中）
    // 高温：平滑权重差异（允许跨批次激活）
    const expWeights = enhancedEdges.map(e => 
      Math.exp((e.adjustedLogWeight - maxLogWeight) / effectiveTemperature)
    );
    const sumExp = expWeights.reduce((a, b) => a + b, 0);
    
    // 计算概率并排序
    const normalizedEdges = enhancedEdges.map((edge, i) => ({
      ...edges[i],
      probability: expWeights[i] / sumExp,
      frequency: edge.frequency,
      temperature: effectiveTemperature
    })).sort((a, b) => b.probability - a.probability);
    
    // 过滤掉概率太低的边
    return normalizedEdges.filter(edge => edge.probability >= this.activationThreshold);
  }
  
}

module.exports = {
  WeightStrategy,
  SimpleWeightStrategy,
  TimeBasedWeightStrategy,
  TemperatureWeightStrategy
};