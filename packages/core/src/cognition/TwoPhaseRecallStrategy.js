/**
 * TwoPhaseRecallStrategy - 两阶段召回策略
 *
 * ## 设计理念
 * 统一管理召回的两个阶段，提供灵活的配置和扩展能力
 * - 第一阶段（Coarse Recall）：粗召回，快速获取候选集
 * - 第二阶段（Fine Ranking）：精排序，综合权重精确排序
 *
 * ## 设计优势
 * 1. 统一管理：两阶段逻辑集中，便于维护
 * 2. 灵活配置：每个阶段都可以替换策略
 * 3. 性能优化：分阶段处理，逐步精细化
 * 4. 可观测性：每个阶段都有明确的输入输出
 */

const Mind = require('./Mind');
const ActivationContext = require('./ActivationContext');
const HippocampalActivationStrategy = require('./ActivationStrategy').HippocampalActivationStrategy;
const ActivationMode = require('./ActivationMode');
const logger = require('@promptx/logger');

class TwoPhaseRecallStrategy {
  constructor(options = {}) {
    // 如果指定了 mode，使用 ActivationMode 配置
    if (options.mode) {
      const modeConfig = ActivationMode.createRecallConfig(options.mode);
      // modeConfig 提供默认值，options 可以覆盖
      options = { ...modeConfig, ...options };

      logger.info('[TwoPhaseRecallStrategy] Using ActivationMode', {
        mode: options.mode,
        modeConfig
      });
    }

    // 第一阶段配置
    this.coarseRecall = {
      // 激活策略（可替换）
      activationStrategy: options.activationStrategy || new HippocampalActivationStrategy(),
      // 最大激活数量
      maxActivations: options.maxActivations || 100,
      // 是否加载所有相关Engrams
      loadAllEngrams: options.loadAllEngrams !== false
    };

    // 第二阶段配置
    this.fineRanking = {
      // 类型权重
      typeWeights: options.typeWeights || {
        'PATTERN': 2.0,
        'LINK': 1.5,
        'ATOMIC': 1.0
      },
      // 权重组合系数
      weightFactors: options.weightFactors || {
        type: 0.3,
        relevance: 0.4,
        strength: 0.2,
        temporal: 0.1
      },
      // 类型配额
      typeQuotas: options.typeQuotas || {
        'PATTERN': 10,
        'LINK': 15,
        'ATOMIC': 25
      },
      // 总数限制
      totalLimit: options.totalLimit || 50,
      // 时间衰减参数
      temporalDecay: options.temporalDecay || 30
    };

    // 依赖注入
    this.network = null;
    this.memory = null;

    logger.info('[TwoPhaseRecallStrategy] Initialized', {
      mode: options.mode,
      coarseRecall: this.coarseRecall,
      fineRanking: this.fineRanking
    });
  }

  /**
   * 设置依赖
   */
  setDependencies(network, memory) {
    this.network = network;
    this.memory = memory;
  }

  /**
   * 执行完整的两阶段召回
   */
  async recall(query) {
    logger.info('[TwoPhaseRecallStrategy] Starting two-phase recall', { query });

    // 第一阶段：粗召回
    const coarseResult = await this.performCoarseRecall(query);

    // 第二阶段：精排序
    const finalResult = await this.performFineRanking(coarseResult, query);

    logger.info('[TwoPhaseRecallStrategy] Recall completed', {
      query,
      phase1Count: coarseResult.activatedCues.size,
      phase1Engrams: coarseResult.engrams?.length || 0,
      phase2Engrams: finalResult.engrams?.length || 0
    });

    return finalResult;
  }

  /**
   * 第一阶段：粗召回
   * 负责激活扩散和初步候选集生成
   */
  async performCoarseRecall(query) {
    logger.debug('[Phase1] Starting coarse recall', { query, queryType: typeof query });

    // 1. 处理不同类型的query输入
    let centerWords;

    if (query === null || query === undefined || query === 'null') {
      // DMN模式：自动选择枢纽节点(包括字符串"null"的兼容处理)
      centerWords = await this.selectHubNodes();
      logger.info('[Phase1] DMN mode: selected hub nodes', {
        hubs: centerWords,
        count: centerWords.length
      });
    } else if (Array.isArray(query)) {
      // 多词模式：直接使用
      centerWords = query;
      logger.info('[Phase1] Multi-word mode', {
        words: centerWords,
        count: centerWords.length
      });
    } else {
      // 单词模式：分词后选择最佳
      const words = this.tokenize(query);
      logger.debug('[Phase1] Tokenized words', { words, networkSize: this.network?.size() });

      const centerCue = await this.findBestCue(words);

      if (!centerCue) {
        logger.warn('[Phase1] No center cue found', { query, words, networkSize: this.network?.size() });
        return new Mind(null);
      }

      centerWords = [centerCue.word];
      logger.info('[Phase1] Single-word mode: found center cue', {
        word: centerCue.word,
        connections: centerCue.connections.size
      });
    }

    // 验证至少有一个有效词
    if (!centerWords || centerWords.length === 0) {
      logger.warn('[Phase1] No valid center words', { query });
      return new Mind(null);
    }

    // 2. 使用Recall进行激活扩散（现在支持多词）
    const Recall = require('./Recall');
    const recall = new Recall(this.network, {
      activationStrategy: this.coarseRecall.activationStrategy
    });

    const mind = recall.execute(centerWords);

    if (!mind) {
      logger.warn('[Phase1] Recall failed', { query, centerWords });
      return new Mind(null);
    }

    // 3. 加载所有激活节点的Engrams
    if (this.coarseRecall.loadAllEngrams) {
      mind.engrams = await this.loadEngrams(mind.activatedCues, query);
    }

    logger.debug('[Phase1] Coarse recall completed', {
      activatedCount: mind.activatedCues.size,
      engramCount: mind.engrams?.length || 0
    });

    return mind;
  }

  /**
   * 第二阶段：精排序
   * 负责综合权重计算和最终筛选
   */
  async performFineRanking(mind, query) {
    logger.debug('[Phase2] Starting fine ranking', {
      engramCount: mind.engrams?.length || 0
    });

    if (!mind.engrams || mind.engrams.length === 0) {
      return mind;
    }

    // 1. 构建排序上下文
    const rankingContext = {
      query,
      activatedCues: mind.activatedCues,
      depths: mind.depths,
      connections: mind.connections
    };

    // 2. 计算综合权重
    const weightedEngrams = mind.engrams.map(engram =>
      this.calculateCompositeWeight(engram, rankingContext)
    );

    // 3. 排序
    weightedEngrams.sort((a, b) => b.weight - a.weight);

    // 4. 应用筛选策略
    const filtered = this.applyFilterStrategy(weightedEngrams);

    // 5. 更新mind的engrams
    mind.engrams = filtered.map(item => ({
      ...item.engram,
      _weight: item.weight,
      _scores: item.scores
    }));

    logger.debug('[Phase2] Fine ranking completed', {
      originalCount: weightedEngrams.length,
      finalCount: mind.engrams.length,
      typeDistribution: this.getTypeDistribution(mind.engrams)
    });

    return mind;
  }

  /**
   * 计算综合权重
   */
  calculateCompositeWeight(engram, context) {
    const factors = this.fineRanking.weightFactors;

    // 1. 类型权重
    const typeScore = this.fineRanking.typeWeights[engram.type] || 1.0;

    // 2. 相关性权重
    const relevanceScore = this.calculateRelevance(engram, context);

    // 3. 记忆强度
    const strengthScore = engram.strength || 0.5;

    // 4. 时间权重
    const ageInDays = (Date.now() - engram.timestamp) / (1000*60*60*24);
    const temporalScore = Math.exp(-ageInDays / this.fineRanking.temporalDecay);

    // 综合权重
    const weight =
      factors.type * typeScore +
      factors.relevance * relevanceScore +
      factors.strength * strengthScore +
      factors.temporal * temporalScore;

    return {
      engram,
      weight,
      scores: { typeScore, relevanceScore, strengthScore, temporalScore }
    };
  }

  /**
   * 计算相关性分数
   */
  calculateRelevance(engram, context) {
    // 基于激活深度
    const activatedBy = engram.activatedBy || '';
    if (context.depths && context.depths.has(activatedBy)) {
      const depth = context.depths.get(activatedBy);
      return 1.0 / (1 + depth * 0.2);
    }

    // 基于query匹配度（简化版）
    const queryWords = context.query.toLowerCase().split(/\s+/);
    const schemaWords = (engram.schema || '').toLowerCase().split(/[\s\n]+/);
    const overlap = schemaWords.filter(w =>
      queryWords.some(q => w.includes(q))
    ).length;

    return Math.min(1.0, overlap / Math.max(1, queryWords.length));
  }

  /**
   * 应用筛选策略
   */
  applyFilterStrategy(weightedEngrams) {
    const quotas = this.fineRanking.typeQuotas;
    const limit = this.fineRanking.totalLimit;

    const result = [];
    const counts = { 'PATTERN': 0, 'LINK': 0, 'ATOMIC': 0 };

    // 按配额筛选
    for (const item of weightedEngrams) {
      const type = item.engram.type;
      if (counts[type] < quotas[type]) {
        result.push(item);
        counts[type]++;
        if (result.length >= limit) break;
      }
    }

    // 如果没有达到限制，补充剩余的
    if (result.length < limit) {
      for (const item of weightedEngrams) {
        if (!result.includes(item)) {
          result.push(item);
          if (result.length >= limit) break;
        }
      }
    }

    return result;
  }

  /**
   * 辅助方法：分词
   */
  tokenize(query) {
    // 简单分词，后续可以接入更复杂的分词器
    return query.split(/\s+/).filter(w => w.length > 0);
  }

  /**
   * 辅助方法：查找最佳中心Cue
   */
  async findBestCue(words) {
    if (!this.network) {
      logger.error('[TwoPhaseRecallStrategy] Network not set');
      return null;
    }

    // 从network中查找权重最高的Cue
    let bestCue = null;
    let maxConnections = 0;

    for (const word of words) {
      const cue = this.network.getCue(word);
      if (cue && cue.connections.size > maxConnections) {
        bestCue = cue;
        maxConnections = cue.connections.size;
      }
    }

    return bestCue;
  }

  /**
   * 辅助方法：选择枢纽节点（DMN模式）
   * Enhanced to return comprehensive network overview with hierarchical structure
   *
   * Default 15 nodes balances cognitive load with network visibility
   * Inspired by human working memory capacity (4-7 chunks) and expanded for AI context
   *
   * @param {number} count - 返回的枢纽节点数量 (default: 15 for optimal cognitive load)
   * @returns {string[]} 枢纽节点的word数组
   */
  async selectHubNodes(count = 15) {
    if (!this.network) {
      logger.error('[TwoPhaseRecallStrategy] Network not set for hub selection');
      return [];
    }

    // 获取所有Cue并按连接度排序
    const allCues = Array.from(this.network.cues.values())
      .map(cue => ({
        word: cue.word,
        degree: cue.connections.size,
        frequency: cue.recallFrequency || 0
      }))
      .filter(cue => cue.degree > 0);  // 过滤孤立节点

    if (allCues.length === 0) {
      logger.warn('[TwoPhaseRecallStrategy] No connected nodes in network');
      return [];
    }

    // 按连接度降序排序，取Top-N
    const hubs = allCues
      .sort((a, b) => b.degree - a.degree)
      .slice(0, count)
      .map(cue => cue.word);

    logger.info('[TwoPhaseRecallStrategy] Selected hub nodes for DMN overview', {
      totalNodes: allCues.length,
      selectedCount: hubs.length,
      topHubs: hubs.slice(0, 10).map((word, i) => ({
        word,
        degree: allCues.find(c => c.word === word)?.degree
      }))
    });

    return hubs;
  }

  /**
   * 辅助方法：激活扩散
   */
  async spread(mind, context) {
    const strategy = this.coarseRecall.activationStrategy;
    const maxActivations = this.coarseRecall.maxActivations;

    // 添加中心节点
    if (mind.center) {
      mind.addActivatedCue(mind.center.word, 0);
    }

    // 执行激活循环
    while (strategy.shouldContinue(context)) {
      // 检查激活数量限制
      if (mind.activatedCues.size >= maxActivations) {
        logger.debug('[TwoPhaseRecallStrategy] Max activations reached', {
          count: mind.activatedCues.size
        });
        break;
      }

      const decision = strategy.activate(context);
      if (!decision.shouldActivate) break;

      // 处理激活的边
      for (const edge of decision.edges) {
        if (!mind.activatedCues.has(edge.targetWord)) {
          // 获取目标Cue
          const targetCue = this.network.getCue(edge.targetWord);
          if (targetCue) {
            mind.addActivatedCue(edge.targetWord, context.cycle + 1);
            mind.addConnection(
              context.sourceCue.word,
              edge.targetWord,
              edge.weight
            );

            // 准备下一轮激活
            context.sourceCue = targetCue;
            context.currentEnergy = edge.energy;
          }
        }
      }

      context.nextCycle();
    }
  }

  /**
   * 辅助方法：加载Engrams
   */
  async loadEngrams(activatedCues, query) {
    if (!this.memory) {
      logger.error('[TwoPhaseRecallStrategy] Memory not set');
      return [];
    }

    const engrams = [];
    const engramSet = new Set(); // 去重

    for (const word of activatedCues) {
      const engramList = await this.memory.getByWord(word);
      if (engramList) {
        for (const engramData of engramList) {
          const engramId = engramData.id;
          if (!engramSet.has(engramId)) {
            engramSet.add(engramId);
            engrams.push({
              ...engramData,
              activatedBy: word
            });
          }
        }
      }
    }

    logger.debug('[TwoPhaseRecallStrategy] Loaded engrams', {
      activatedCues: activatedCues.size,
      totalEngrams: engrams.length
    });

    return engrams;
  }

  /**
   * 辅助方法：统计类型分布
   */
  getTypeDistribution(engrams) {
    const distribution = { 'PATTERN': 0, 'LINK': 0, 'ATOMIC': 0 };
    for (const engram of engrams) {
      const type = engram.type || 'ATOMIC';
      distribution[type] = (distribution[type] || 0) + 1;
    }
    return distribution;
  }
}

module.exports = TwoPhaseRecallStrategy;