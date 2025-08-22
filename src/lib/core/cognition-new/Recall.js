const logger = require('../../utils/logger');

/**
 * Recall - 记忆检索执行器
 * 
 * ## 设计理念
 * 
 * Recall是记忆系统的读取端，负责从Network中检索相关记忆。
 * 基于激活扩散理论（Spreading Activation Theory）设计：
 * - 从一个概念开始，激活会沿着连接扩散到相关概念
 * - 权重越高的连接，激活越容易传递
 * - 使用断崖检测算法识别Schema的边界
 * 
 * ## 为什么这样设计
 * 
 * 1. **有向无环图（DAG）**
 *    - 避免循环激活导致的无限递归
 *    - 保持思维的方向性和层次性
 *    - 符合人类思维的线性特征
 * 
 * 2. **断崖检测算法**
 *    - Schema内部连接紧密，权重相近
 *    - Schema之间连接稀疏，权重差异大
 *    - 通过检测权重的突然下降识别边界
 * 
 * 3. **深度和宽度限制**
 *    - maxDepth防止过深的递归
 *    - maxNodes防止激活过多节点
 *    - 模拟工作记忆的容量限制（7±2原则）
 * 
 * ## 断崖检测原理
 * 
 * ```
 * 权重序列: [100, 95, 90, 30, 25, 20]
 *                      ^
 *                   断崖位置
 * 
 * 前3个的平均下降率: ~5%
 * 位置3->4的下降率: 67%
 * 67% > 5% * 3 (cliffFactor)
 * => 检测到断崖
 * ```
 * 
 * ## 设计决策
 * 
 * Q: 为什么要检测断崖？
 * A: Schema是自然形成的记忆单元，断崖表示从一个Schema跳到另一个，应该停止扩散。
 * 
 * Q: 为什么用自适应阈值而不是固定阈值？
 * A: 不同的记忆片段权重范围不同，固定阈值会导致误判。自适应阈值根据局部特征判断。
 * 
 * Q: 为什么要限制深度和节点数？
 * A: 
 * - 模拟人类工作记忆的限制
 * - 防止激活整个网络（计算爆炸）
 * - 保持返回结果的可理解性
 * 
 * @class Recall
 */
class Recall {
  /**
   * @param {Network} network - 全局认知网络
   * @param {Object} options - 可选配置
   * @param {number} options.maxDepth - 最大深度（默认5）
   * @param {number} options.maxNodes - 最大节点数（默认20）
   * @param {WeightStrategy} options.strategy - 权重策略（用于激活归一化）
   */
  constructor(network, options = {}) {
    /**
     * 认知网络引用
     * @type {Network}
     */
    this.network = network;
    
    /**
     * 最大递归深度
     * 默认5层，足够覆盖大部分关联
     * @type {number}
     */
    this.maxDepth = options.maxDepth || 5;
    
    /**
     * 最大激活节点数
     * 默认20个，模拟工作记忆容量
     * @type {number}
     */
    this.maxNodes = options.maxNodes || 20;
    
    /**
     * 权重策略（用于激活归一化）
     * @type {WeightStrategy}
     */
    this.strategy = options.strategy || null;
    
    logger.debug('[Recall] Initialized', {
      maxDepth: this.maxDepth,
      maxNodes: this.maxNodes,
      cliffFactor: this.cliffFactor
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
      outDegree: centerCue.connections.size
    });
    
    const Mind = require('./Mind');
    const mind = new Mind(centerCue);
    
    // 开始扩散激活
    const startTime = Date.now();
    this.spread(centerCue, mind, [], 0);
    const duration = Date.now() - startTime;
    
    logger.info('[Recall] Recall completed', {
      center: word,
      activatedNodes: mind.activatedCues.size,
      connections: mind.connections.length,
      duration: `${duration}ms`
    });
    
    return mind;
  }
  
  /**
   * 扩散激活（递归）
   * 
   * 使用Softmax归一化来决定激活强度
   * 
   * @param {Cue} currentCue - 当前节点
   * @param {Mind} mind - 正在构建的Mind
   * @param {Array<number>} weightPath - 到达当前节点的权重路径
   * @param {number} depth - 当前深度
   */
  spread(currentCue, mind, weightPath, depth) {
    // 深度限制
    if (depth >= this.maxDepth) {
      logger.debug('[Recall] Max depth reached', {
        depth,
        maxDepth: this.maxDepth,
        currentWord: currentCue.word
      });
      return;
    }
    
    // 节点数限制
    if (mind.activatedCues.size >= this.maxNodes) {
      logger.debug('[Recall] Max nodes reached', {
        nodes: mind.activatedCues.size,
        maxNodes: this.maxNodes
      });
      return;
    }
    
    // 添加当前节点到激活集合
    mind.addActivatedCue(currentCue.word, depth);
    
    // 获取所有出边
    const edges = Array.from(currentCue.connections.entries())
      .map(([targetWord, weight]) => ({ targetWord, weight }));
    
    if (edges.length === 0) {
      logger.debug('[Recall] No outgoing edges', {
        word: currentCue.word,
        depth
      });
      return;
    }
    
    // 使用策略进行激活归一化
    const normalizedEdges = this.strategy 
      ? this.strategy.normalizeForActivation(edges)
      : edges.map(e => ({ ...e, probability: 1.0 }));  // 没有策略时不归一化
    
    logger.debug('[Recall] Processing edges with normalization', {
      from: currentCue.word,
      depth,
      edgeCount: edges.length,
      topEdges: normalizedEdges.slice(0, 3).map(e => 
        `${e.targetWord}(${(e.probability * 100).toFixed(1)}%)`
      )
    });
    
    // 根据归一化概率决定激活
    for (const edge of normalizedEdges) {
      // 如果有概率字段且概率太低，跳过
      if (edge.probability !== undefined && edge.probability < 0.01) {
        logger.debug('[Recall] Edge below threshold, skipping', {
          from: currentCue.word,
          to: edge.targetWord,
          probability: (edge.probability * 100).toFixed(1) + '%'
        });
        continue;
      }
      
      const targetCue = this.network.cues.get(edge.targetWord);
      if (!targetCue) continue;
      
      // 检查是否已经激活（避免环）
      if (mind.activatedCues.has(edge.targetWord)) {
        logger.debug('[Recall] Skipping already activated node', {
          word: edge.targetWord,
          from: currentCue.word
        });
        continue;
      }
      
      // 记录连接（存储原始权重）
      mind.addConnection(currentCue.word, edge.targetWord, edge.weight);
      
      logger.debug('[Recall] Activating connection', {
        from: currentCue.word,
        to: edge.targetWord,
        probability: (edge.probability * 100).toFixed(1) + '%',
        weight: edge.weight,
        depth
      });
      
      // 递归扩散
      const newPath = [...weightPath, edge.weight];
      this.spread(targetCue, mind, newPath, depth + 1);
    }
  }
  
  // softmaxNormalize 方法已移到 WeightStrategy 中
  
  /**
   * 检测权重是否出现断崖（自适应阈值）
   * [已废弃：改用Softmax概率阈值]
   * 
   * @param {Array<number>} weights - 权重数组（已排序）
   * @param {number} index - 当前检查的索引
   * @returns {boolean} 是否检测到断崖
   */
  isCliff(weights, index) {
    // 至少需要3个点才能计算趋势
    if (index < 2) return false;
    
    // 计算前面的平均下降率
    let totalDrop = 0;
    let dropCount = 0;
    
    for (let i = 1; i <= index; i++) {
      const drop = weights[i-1] - weights[i];
      const dropRate = drop / weights[i-1];
      totalDrop += dropRate;
      dropCount++;
    }
    
    const avgDropRate = totalDrop / dropCount;
    
    // 计算当前下降率
    const currentDrop = weights[index-1] - weights[index];
    const currentDropRate = currentDrop / weights[index-1];
    
    // 如果当前下降率远超平均值，视为断崖
    const isCliff = currentDropRate > avgDropRate * this.cliffFactor;
    
    if (isCliff) {
      logger.debug('[Recall] Cliff analysis', {
        index,
        currentDropRate: `${(currentDropRate * 100).toFixed(1)}%`,
        avgDropRate: `${(avgDropRate * 100).toFixed(1)}%`,
        threshold: `${(avgDropRate * this.cliffFactor * 100).toFixed(1)}%`,
        weights: weights.slice(Math.max(0, index-2), index+2)
      });
    }
    
    return isCliff;
  }
}

module.exports = Recall;