const logger = require('@promptx/logger');

/**
 * Prime - 认知系统启动器
 * 
 * ## 设计理念
 * 
 * Prime是系统启动时的特殊操作，负责建立基础认知状态。
 * 类比人类的“晨起意识”：
 * - 睡醒后需要一个“启动”过程来恢复意识
 * - 基础认知状态影响整天的思维活动
 * - 不同的启动点会带来不同的认知偏向
 * 
 * ## 为什么这样设计
 * 
 * 1. **自动选择启动点**
 *    - 通过入度权重找到“最重要”的概念
 *    - 高入度权重 = 被多个概念强烈关联
 *    - 类似于PageRank算法的思想
 * 
 * 2. **继承Recall的逻辑**
 *    - Prime本质上是特殊的Recall
 *    - 复用扩散激活的所有逻辑
 *    - 只是增加了自动选择启动词的能力
 * 
 * 3. **多中心启动**
 *    - 支持从多个点同时启动
 *    - 模拟并行思维和多线索思考
 *    - 用于复杂任务的初始化
 * 
 * ## 启动词选择算法
 * 
 * ```
 * 对于每个节点n:
 *   inWeight(n) = Σ(weight of edges pointing to n)
 * 
 * primeWord = argmax(inWeight)
 * ```
 * 
 * 这个算法找到“汇聚中心”：
 * - 被多个概念指向
 * - 且连接权重高
 * - 通常是核心概念
 * 
 * ## 设计决策
 * 
 * Q: 为什么用入度权重而不是出度权重？
 * A: 
 * - 入度高 = 被多个概念依赖，是“基础概念”
 * - 出度高 = 发散性强，是“hub节点”
 * - 启动时需要稳定的基础，不是发散的中心
 * 
 * Q: 为什么支持多中心启动？
 * A: 
 * - 复杂任务需要多个视角
 * - 模拟人类的并行思维
 * - 避免单一视角的偏见
 * 
 * @class Prime
 * @extends Recall
 */
const Recall = require('./Recall');

class Prime extends Recall {
  /**
   * 获取默认的启动词
   * 
   * 策略优先级：
   * 1. 选择根节点（入度为0的节点）- 认知网络的起点
   * 2. 选择被指向最多的节点 - 重要概念
   * 3. 返回第一个节点 - 兜底策略
   * 
   * @returns {string|null} 启动词
   */
  getPrimeWord() {
    if (this.network.cues.size === 0) {
      logger.warn('[Prime] Network is empty, no word to prime');
      return null;
    }
    
    logger.debug('[Prime] Calculating prime word from network', {
      totalCues: this.network.cues.size
    });
    
    // 策略1: 寻找根节点（入度为0的节点）
    const rootNodes = this.findRootNodes();
    if (rootNodes.length > 0) {
      // 如果有多个根节点，选择出度最大的那个
      const selectedRoot = rootNodes.reduce((best, current) => {
        const currentOutDegree = this.network.cues.get(current)?.connections?.size || 0;
        const bestOutDegree = this.network.cues.get(best)?.connections?.size || 0;
        return currentOutDegree > bestOutDegree ? current : best;
      });
      
      logger.info('[Prime] Selected root node as prime word', {
        word: selectedRoot,
        allRoots: rootNodes,
        outDegree: this.network.cues.get(selectedRoot)?.connections?.size || 0
      });
      return selectedRoot;
    }
    
    // 策略2: 选择被指向最多的节点（原逻辑）
    const inWeights = this.network.calculateInWeights();
    if (inWeights.size > 0) {
      let maxWeight = 0;
      let primeWord = null;
      
      for (const [word, weight] of inWeights) {
        if (weight > maxWeight) {
          maxWeight = weight;
          primeWord = word;
        }
      }
      
      if (primeWord) {
        logger.info('[Prime] Selected high in-degree node as prime word', {
          word: primeWord,
          inWeight: maxWeight
        });
        return primeWord;
      }
    }
    
    // 策略3: 返回第一个节点
    const firstWord = this.network.cues.keys().next().value;
    logger.debug('[Prime] Using first cue as fallback', { 
      word: firstWord 
    });
    return firstWord;
  }
  
  /**
   * Get multiple prime words for DMN mode
   * Returns a comprehensive list of important nodes for network overview
   *
   * @param {Object} options - Configuration options
   * @param {number} options.maxRootNodes - Maximum root nodes to return (default: 15)
   * @param {number} options.childrenPerRoot - Children per root node (default: 3)
   * @param {number} options.maxTotalWords - Maximum total words (default: 50)
   * @returns {Array<string>} Array of prime words
   */
  getPrimeWords(options = {}) {
    const {
      maxRootNodes = 15,
      childrenPerRoot = 3,
      maxTotalWords = 50
    } = options;

    logger.debug('[Prime] Getting multiple prime words for DMN mode', {
      maxRootNodes,
      childrenPerRoot,
      maxTotalWords,
      networkSize: this.network.cues.size
    });

    const rootNodes = this.findRootNodes();

    // If no root nodes, fall back to hub nodes
    if (rootNodes.length === 0) {
      logger.info('[Prime] No root nodes found, using hub nodes strategy');
      return this.getTopHubNodes(maxTotalWords);
    }

    // Sort root nodes by out-degree (importance)
    const sortedRoots = rootNodes
      .map(word => ({
        word,
        outDegree: this.network.cues.get(word)?.connections?.size || 0
      }))
      .sort((a, b) => b.outDegree - a.outDegree)
      .slice(0, maxRootNodes)
      .map(item => item.word);

    logger.info('[Prime] Selected root nodes', {
      totalRoots: rootNodes.length,
      selectedRoots: sortedRoots.length,
      roots: sortedRoots
    });

    const result = [];

    // For each root, add it and its top children
    for (const root of sortedRoots) {
      result.push(root);

      // Get top N children by connection weight
      const cue = this.network.cues.get(root);
      if (cue && cue.connections.size > 0) {
        const children = Array.from(cue.connections.entries())
          .sort((a, b) => b[1] - a[1])  // Sort by weight
          .slice(0, childrenPerRoot)
          .map(([word]) => word);

        result.push(...children);

        logger.debug('[Prime] Added children for root', {
          root,
          childCount: children.length,
          children
        });
      }

      // Stop if we reached the limit
      if (result.length >= maxTotalWords) {
        break;
      }
    }

    const finalWords = result.slice(0, maxTotalWords);

    logger.info('[Prime] DMN prime words prepared', {
      totalWords: finalWords.length,
      roots: sortedRoots.length,
      sampleWords: finalWords.slice(0, 10)
    });

    return finalWords;
  }

  /**
   * 寻找根节点（入度为0的节点）
   * @returns {Array<string>} 根节点列表
   */
  findRootNodes() {
    const hasIncomingEdge = new Set();
    
    // 标记所有有入边的节点
    for (const [sourceWord, sourceCue] of this.network.cues) {
      for (const [targetWord] of sourceCue.connections) {
        hasIncomingEdge.add(targetWord);
      }
    }
    
    // 找出没有入边的节点（根节点）
    const rootNodes = [];
    for (const word of this.network.cues.keys()) {
      if (!hasIncomingEdge.has(word)) {
        rootNodes.push(word);
      }
    }
    
    logger.debug('[Prime] Found root nodes', {
      count: rootNodes.length,
      nodes: rootNodes
    });
    
    return rootNodes;
  }

  /**
   * Get top hub nodes by in-degree weight
   * Fallback strategy when no root nodes exist
   *
   * @param {number} limit - Maximum nodes to return
   * @returns {Array<string>} Array of hub node words
   */
  getTopHubNodes(limit) {
    const inWeights = this.network.calculateInWeights();

    if (inWeights.size === 0) {
      logger.warn('[Prime] No nodes with in-weights, returning first N nodes');
      return Array.from(this.network.cues.keys()).slice(0, limit);
    }

    const hubNodes = Array.from(inWeights.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word]) => word);

    logger.info('[Prime] Selected hub nodes', {
      totalHubs: inWeights.size,
      selectedCount: hubNodes.length,
      topHubs: hubNodes.slice(0, 10)
    });

    return hubNodes;
  }

  /**
   * Execute prime operation
   *
   * @param {string} word - Optional prime word, if not provided uses auto-selection
   * @returns {Mind|null} Activated cognitive state
   */
  execute(word = null) {
    logger.info('[Prime] Starting prime operation', {
      providedWord: word,
      autoSelect: !word,
      networkSize: this.network.cues.size
    });

    // DMN mode: multi-word activation for comprehensive network overview
    if (!word) {
      const primeWords = this.getPrimeWords({
        maxRootNodes: 15,
        childrenPerRoot: 3,
        maxTotalWords: 50
      });

      if (primeWords.length === 0) {
        logger.error('[Prime] No prime words available, network may be empty');
        return null;
      }

      logger.info('[Prime] DMN mode - using multiple prime words', {
        totalWords: primeWords.length,
        sampleWords: primeWords.slice(0, 10)
      });

      // Use executeMultiple to activate from all selected words
      return this.executeMultiple(primeWords);
    }

    // Single-word mode: validate and execute
    if (!this.network.hasCue(word)) {
      logger.warn('[Prime] Provided word not found in network', { word });
      return null;
    }

    logger.info('[Prime] Executing single-word prime', {
      word,
      cueConnections: this.network.cues.get(word)?.connections?.size || 0
    });

    // Call parent Recall.execute()
    const mind = super.execute(word);

    if (mind) {
      logger.info('[Prime] Prime completed successfully', {
        primeWord: word,
        activatedNodes: mind.activatedCues.size,
        connections: mind.connections.length
      });
    } else {
      logger.error('[Prime] Prime failed', { word });
    }

    return mind;
  }
  
  /**
   * 多词启动（实验性功能）
   * 
   * 同时从多个词开始激活，模拟并行思考。
   * 生成的Mind包含多个激活中心。
   * 
   * @param {Array<string>} words - 启动词数组
   * @returns {Mind} 合并的认知状态
   */
  executeMultiple(words) {
    logger.info('[Prime] Starting multi-center prime', {
      words,
      count: words.length
    });

    // Use parent Recall.execute() with multiple words
    // Recall.execute() already supports multi-word activation via array input
    const mind = super.execute(words);

    if (!mind) {
      logger.error('[Prime] Multi-center prime failed');
      return null;
    }

    logger.info('[Prime] Multi-center prime completed', {
      requestedWords: words.length,
      activatedNodes: mind.activatedCues.size,
      connections: mind.connections.length
    });

    return mind;
  }
}

module.exports = Prime;