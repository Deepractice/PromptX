const logger = require('../../utils/logger');

/**
 * Recall - 记忆检索执行器
 * 
 * ## 设计理念
 * 
 * Recall是记忆系统的读取端，负责从Network中检索相关记忆。
 * 现在使用可插拔的激活策略，支持不同的激活扩散算法。
 * 
 * ## 为什么这样设计
 * 
 * 1. **策略模式**
 *    - 激活算法通过ActivationStrategy实现
 *    - 可以灵活切换不同的算法
 *    - Recall只负责流程控制
 * 
 * 2. **关注点分离**
 *    - Recall：流程控制和Mind构建
 *    - ActivationStrategy：激活决策
 *    - ActivationContext：状态管理
 * 
 * 3. **可扩展性**
 *    - 轻松添加新的激活算法
 *    - 不影响现有代码
 *    - 便于A/B测试不同算法
 * 
 * @class Recall
 */
class Recall {
  /**
   * @param {Network} network - 全局认知网络
   * @param {Object} options - 可选配置
   * @param {ActivationStrategy} options.activationStrategy - 激活策略
   * @param {WeightStrategy} options.weightStrategy - 权重策略（用于归一化）
   */
  constructor(network, options = {}) {
    /**
     * 认知网络引用
     * @type {Network}
     */
    this.network = network;
    
    /**
     * 权重策略（用于Softmax归一化等）
     * @type {WeightStrategy|null}
     */
    this.weightStrategy = options.weightStrategy || null;
    
    /**
     * 激活策略
     * 默认使用海马体策略
     * @type {ActivationStrategy}
     */
    if (options.activationStrategy) {
      this.activationStrategy = options.activationStrategy;
      // 如果激活策略需要权重策略，注入它
      if (this.weightStrategy && typeof this.activationStrategy.setWeightStrategy === 'function') {
        this.activationStrategy.setWeightStrategy(this.weightStrategy);
      }
    } else {
      // 默认使用海马体策略
      const { HippocampalActivationStrategy } = require('./ActivationStrategy');
      this.activationStrategy = new HippocampalActivationStrategy({
        weightStrategy: this.weightStrategy
      });
    }
    
    logger.debug('[Recall] Initialized', {
      strategy: this.activationStrategy.name,
      hasWeightStrategy: !!this.weightStrategy
    });
  }

  /**
   * 执行记忆检索
   * 
   * @param {string} word - 起始词
   * @returns {Mind|null} 激活的认知网络
   */
  execute(word) {
    logger.debug('[Recall] Starting recall', { word });
    
    // 找到起始Cue
    const centerCue = this.network.cues.get(word);
    if (!centerCue) {
      logger.warn('[Recall] Cue not found', { word });
      return null;
    }
    
    logger.debug('[Recall] Found center Cue', {
      word: centerCue.word,
      outDegree: centerCue.connections.size,
      frequency: centerCue.recallFrequency || 0
    });
    
    const Mind = require('./Mind');
    const mind = new Mind(centerCue);
    
    // 创建激活上下文
    const ActivationContext = require('./ActivationContext');
    const context = new ActivationContext({
      network: this.network,
      sourceCue: centerCue,
      energyPool: new Map([[centerCue.word, 1.0]]),  // 初始能量
      activatedNodes: new Set([centerCue.word]),
      connections: []
    });
    
    const startTime = Date.now();
    
    // 激活循环
    while (this.activationStrategy.shouldContinue(context)) {
      const newActivations = new Map();
      
      // 处理当前能量池中的所有节点
      for (const [word, energy] of context.energyPool) {
        const sourceCue = this.network.getCue(word);
        if (!sourceCue) continue;
        
        // 更新上下文
        context.sourceCue = sourceCue;
        context.currentEnergy = energy;
        
        // 获取激活决策
        const { shouldActivate, edges } = this.activationStrategy.activate(context);
        
        if (shouldActivate && edges.length > 0) {
          logger.debug('[Recall] Activating from node', {
            source: word,
            energy: energy.toFixed(3),
            edgeCount: edges.length,
            cycle: context.cycle
          });
          
          // 处理每条激活的边
          for (const edge of edges) {
            // 累积能量（可能从多个源获得）
            const currentEnergy = newActivations.get(edge.targetWord) || 0;
            const totalEnergy = currentEnergy + edge.energy;
            newActivations.set(edge.targetWord, totalEnergy);
            
            // 记录连接
            mind.addConnection(word, edge.targetWord, edge.weight);
            context.recordConnection(word, edge.targetWord, edge.weight);
            
            logger.debug('[Recall] Edge activated', {
              from: word,
              to: edge.targetWord,
              transmittedEnergy: edge.energy.toFixed(3),
              totalEnergy: totalEnergy.toFixed(3)
            });
          }
        }
      }
      
      // 清空旧能量池，使用新的
      context.energyPool.clear();
      
      // 更新能量池和激活集
      for (const [word, energy] of newActivations) {
        context.setNodeEnergy(word, energy);
        
        // 能量足够高的节点标记为激活
        if (energy >= (this.activationStrategy.firingThreshold || 0.01)) {
          if (!context.isActivated(word)) {
            context.markActivated(word);
            mind.addActivatedCue(word, context.cycle + 1);  // 记录激活深度
          }
        }
      }
      
      // 应用衰减
      this.activationStrategy.applyDecay(context);
      
      // 增加循环计数
      context.incrementCycle();
      
      // 如果没有新的激活，提前结束
      if (newActivations.size === 0) {
        logger.debug('[Recall] No new activations, stopping', {
          cycle: context.cycle
        });
        break;
      }
    }
    
    const duration = Date.now() - startTime;
    
    // 更新节点的recall频率
    this.network.updateRecallFrequency(context.activatedNodes);
    
    logger.info('[Recall] Recall completed', {
      center: word,
      strategy: this.activationStrategy.name,
      cycles: context.cycle,
      activatedNodes: context.activatedNodes.size,
      connections: context.connections.length,
      duration: `${duration}ms`
    });
    
    return mind;
  }
}

module.exports = Recall;