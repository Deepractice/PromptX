const logger = require('../../utils/logger');

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
   * 执行启动
   * 
   * @param {string} word - 可选的启动词，如果不提供则自动选择
   * @returns {Mind|null} 基础认知状态
   */
  execute(word = null) {
    logger.info('[Prime] Starting prime operation', { 
      providedWord: word,
      autoSelect: !word,
      networkSize: this.network.cues.size
    });
    
    // 如果没有提供启动词，自动选择
    if (!word) {
      word = this.getPrimeWord();
      if (!word) {
        logger.error('[Prime] Failed to find prime word, network empty or no suitable node');
        return null;
      }
      logger.info('[Prime] Auto-selected prime word', { word });
    } else {
      // 验证提供的词是否存在
      if (!this.network.hasCue(word)) {
        logger.warn('[Prime] Provided word not found in network', { word });
        return null;
      }
    }
    
    logger.info('[Prime] Executing recall with prime word', { 
      word,
      cueExists: this.network.hasCue(word),
      cueConnections: this.network.cues.get(word)?.connections?.size || 0
    });
    
    // 调用父类的recall逻辑
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
    
    const Mind = require('./Mind');
    
    // 创建一个合并的Mind
    const mergedMind = new Mind(null);  // 没有单一中心
    mergedMind.centers = [];  // 多个中心
    
    const validCenters = [];
    const missingWords = [];
    
    // 对每个词分别执行recall
    for (const word of words) {
      const cue = this.network.cues.get(word);
      if (!cue) {
        missingWords.push(word);
        logger.warn('[Prime] Word not found in network', { word });
        continue;
      }
      
      validCenters.push(word);
      mergedMind.centers.push(cue);
      
      logger.debug('[Prime] Spreading from center', {
        word,
        outDegree: cue.connections.size
      });
      
      // 扩散激活（重用spread方法）
      this.spread(cue, mergedMind, [], 0);
    }
    
    logger.info('[Prime] Multi-center prime completed', {
      requestedWords: words.length,
      validCenters: validCenters.length,
      missingWords,
      activatedNodes: mergedMind.activatedCues.size,
      connections: mergedMind.connections.length
    });
    
    return mergedMind;
  }
}

module.exports = Prime;