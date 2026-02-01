import logger from '@promptx/logger';

/**
 * ActivationStrategy - 激活策略基类
 * 
 * ## 设计理念
 * 
 * 定义激活扩散的策略接口，让不同的激活算法可以灵活切换。
 * 这是策略模式在激活扩散中的应用。
 * 
 * ## 为什么这样设计
 * 
 * 1. **算法独立**
 *    - 激活算法独立于Recall的流程控制
 *    - 便于实现和测试不同的算法
 *    - 可以根据场景选择不同策略
 * 
 * 2. **职责清晰**
 *    - Strategy负责决策（是否激活、如何激活）
 *    - Recall负责执行（管理流程、构建Mind）
 *    - Context负责状态（数据和状态管理）
 * 
 * 3. **易于扩展**
 *    - 新算法只需继承基类
 *    - 不影响现有代码
 *    - 可以组合不同的策略
 * 
 * @class ActivationStrategy
 */
class ActivationStrategy {
  constructor(options = {}) {
    /**
     * 策略名称
     * @type {string}
     */
    this.name = 'base';
    
    /**
     * 策略配置
     * @type {Object}
     */
    this.options = options;
  }
  
  /**
   * 决定如何激活节点
   * 
   * 子类必须实现此方法
   * 
   * @param {ActivationContext} context - 激活上下文
   * @returns {Object} 激活决策
   * @returns {boolean} returns.shouldActivate - 是否应该激活
   * @returns {Array} returns.edges - 要激活的边列表
   */
  activate(context) {
    throw new Error('ActivationStrategy.activate() must be implemented');
  }
  
  /**
   * 判断是否继续激活
   * 
   * @param {ActivationContext} context - 激活上下文
   * @returns {boolean} true继续，false停止
   */
  shouldContinue(context) {
    return true;
  }
  
  /**
   * 应用衰减或其他周期性操作
   * 
   * @param {ActivationContext} context - 激活上下文
   */
  applyDecay(context) {
    // 默认不做任何事
  }
}

/**
 * HippocampalActivationStrategy - 海马体激活策略
 * 
 * ## 设计理念
 * 
 * 模拟海马体的激活扩散机制：
 * - 能量在网络中流动和衰减
 * - 只有能量足够的节点才会激活
 * - 侧抑制防止过度激活
 * - 频率增强经常使用的连接
 * 
 * ## 算法特点
 * 
 * 1. **能量模型**
 *    - 初始节点满能量（1.0）
 *    - 能量通过连接传递，有损耗
 *    - 能量低于阈值的节点不再传播
 * 
 * 2. **频率增强**
 *    - 经常被recall的节点更容易激活
 *    - 模拟长时程增强（LTP）效应
 * 
 * 3. **侧抑制**
 *    - 激活节点越多，每个节点获得的能量越少
 *    - 保持稀疏表征
 * 
 * 4. **自然终止**
 *    - 能量耗散后自然停止
 *    - 不需要硬性深度限制
 * 
 * @class HippocampalActivationStrategy
 * @extends ActivationStrategy
 */
class HippocampalActivationStrategy extends ActivationStrategy {
  constructor(options = {}) {
    super(options);
    
    /**
     * 策略名称
     * @type {string}
     */
    this.name = 'hippocampal';
    
    /**
     * 神经元激活阈值
     * 只有能量超过此值的节点才会激活
     * @type {number}
     */
    this.firingThreshold = options.firingThreshold || 0.1;  // 降低阈值，让更多节点能激活
    
    /**
     * 突触传递效率
     * 能量传递时的损耗率
     * @type {number}
     */
    this.synapticDecay = options.synapticDecay || 0.9;  // 提高传递效率，减少能量损失
    
    /**
     * 侧抑制因子
     * 控制网络激活的稀疏性
     * @type {number}
     */
    this.inhibitionFactor = options.inhibitionFactor || 0.1;
    
    /**
     * 最大循环次数
     * 防止无限循环的保护机制
     * @type {number}
     */
    this.maxCycles = options.maxCycles || 10;
    
    /**
     * 每周期能量衰减率
     * 模拟时间流逝的能量损耗
     * @type {number}
     */
    this.cycleDecay = options.cycleDecay || 0.9;
    
    /**
     * 频率增强因子
     * 控制频率对激活的影响程度
     * @type {number}
     */
    this.frequencyBoost = options.frequencyBoost || 0.1;
    
    /**
     * 权重策略（用于归一化和批次感知）
     * @type {WeightStrategy|null}
     */
    this.weightStrategy = options.weightStrategy || null;
    
    logger.debug('[HippocampalActivationStrategy] Initialized', {
      firingThreshold: this.firingThreshold,
      synapticDecay: this.synapticDecay,
      maxCycles: this.maxCycles
    });
  }
  
  /**
   * 决定如何激活节点
   * 
   * @param {ActivationContext} context - 激活上下文
   * @returns {Object} 激活决策
   */
  activate(context) {
    // 能量不足，不激活
    if (context.currentEnergy < this.firingThreshold) {
      logger.debug('[HippocampalActivationStrategy] Energy below threshold', {
        word: context.sourceCue?.word,
        energy: context.currentEnergy,
        threshold: this.firingThreshold
      });
      return { shouldActivate: false, edges: [] };
    }
    
    if (!context.sourceCue || !context.sourceCue.connections) {
      return { shouldActivate: false, edges: [] };
    }
    
    // 准备边数据
    let edges = Array.from(context.sourceCue.connections.entries())
      .map(([targetWord, weight]) => ({
        targetWord,
        weight,
        frequency: context.getTargetFrequency(targetWord)
      }));

    const degree = edges.length;

    // GraphSAGE核心改进：固定采样K个邻居解决Hub节点问题
    // 根据度数动态调整，但有上限
    const SAMPLE_SIZE = Math.min(
      8,  // 最多采样8个（提高到8以增加扩散范围）
      Math.max(3, Math.ceil(Math.log2(degree + 1)))  // 至少3个，对数增长
    );

    // 按权重排序，选择Top-K
    const sampledEdges = edges
      .sort((a, b) => b.weight - a.weight)
      .slice(0, SAMPLE_SIZE);

    // Hub节点能量补偿：度数越大，总能量越多
    // 但不是线性增长，而是对数增长，避免能量爆炸
    const hubCompensation = 1 + Math.log(1 + degree) * 0.3;
    const availableEnergy = context.currentEnergy * hubCompensation;

    // 能量均分给采样的邻居（GraphSAGE-Mean策略）
    const energyPerEdge = (availableEnergy * this.synapticDecay) / Math.max(1, sampledEdges.length);

    // 处理采样的边
    const processedEdges = sampledEdges.map(edge => {
      // 频率加成（保留原有的频率奖励机制）
      const freqBonus = 1 + Math.log(1 + edge.frequency) * this.frequencyBoost;

      // 每条边获得均等能量（GraphSAGE的核心）
      const transmittedEnergy = energyPerEdge * freqBonus;

      // 降低侧抑制的影响（因为我们已经限制了激活数量）
      const inhibition = 1 - (this.inhibitionFactor * context.activatedNodes.size / 200);  // 从100改为200
      const finalEnergy = transmittedEnergy * Math.max(0.5, inhibition);  // 确保抑制不会过强

      return {
        targetWord: edge.targetWord,
        weight: edge.weight,
        energy: finalEnergy,
        frequency: edge.frequency,
        shouldFire: finalEnergy >= this.firingThreshold
      };
    });

    // 只返回能量足够且未激活的边
    const activeEdges = processedEdges.filter(e =>
      e.shouldFire && !context.isActivated(e.targetWord)
    );
    
    logger.debug('[HippocampalActivationStrategy] GraphSAGE activation', {
      source: context.sourceCue.word,
      sourceEnergy: context.currentEnergy,
      degree: degree,
      sampleSize: SAMPLE_SIZE,
      hubCompensation: hubCompensation.toFixed(2),
      energyPerEdge: energyPerEdge.toFixed(3),
      totalEdges: edges.length,
      sampledEdges: sampledEdges.length,
      activeEdges: activeEdges.length,
      cycle: context.cycle
    });
    
    return { shouldActivate: true, edges: activeEdges };
  }
  
  /**
   * 判断是否继续激活
   * 
   * @param {ActivationContext} context - 激活上下文
   * @returns {boolean} true继续，false停止
   */
  shouldContinue(context) {
    // 超过最大循环次数
    if (context.cycle >= this.maxCycles) {
      logger.debug('[HippocampalActivationStrategy] Max cycles reached', {
        cycle: context.cycle,
        maxCycles: this.maxCycles
      });
      return false;
    }
    
    // 检查是否还有高能量节点
    let hasHighEnergyNode = false;
    for (const [word, energy] of context.energyPool) {
      if (energy >= this.firingThreshold) {
        hasHighEnergyNode = true;
        break;
      }
    }
    
    if (!hasHighEnergyNode) {
      logger.debug('[HippocampalActivationStrategy] No high energy nodes', {
        cycle: context.cycle,
        poolSize: context.energyPool.size
      });
    }
    
    return hasHighEnergyNode;
  }
  
  /**
   * 应用能量衰减
   * 
   * @param {ActivationContext} context - 激活上下文
   */
  applyDecay(context) {
    // 对所有节点应用时间衰减
    for (const [word, energy] of context.energyPool) {
      const decayedEnergy = energy * this.cycleDecay;
      
      // 能量太低的节点移除
      if (decayedEnergy < 0.01) {
        context.energyPool.delete(word);
      } else {
        context.energyPool.set(word, decayedEnergy);
      }
    }
    
    logger.debug('[HippocampalActivationStrategy] Applied decay', {
      cycle: context.cycle,
      remainingNodes: context.energyPool.size,
      totalEnergy: Array.from(context.energyPool.values()).reduce((sum, e) => sum + e, 0).toFixed(2)
    });
  }
}

module.exports = {
  ActivationStrategy,
  HippocampalActivationStrategy
};