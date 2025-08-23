const logger = require('../../utils/logger');

/**
 * Remember - 记忆写入执行器
 * 
 * ## 设计理念
 * 
 * Remember是记忆系统的写入端，负责将Schema（概念序列）写入Network。
 * 采用纯执行器模式，不包含任何计算逻辑，所有计算委托给Strategy。
 * 
 * 类比生物记忆：
 * - Schema = 体验的序列（如"看到-理解-记住"）
 * - Remember = 海马体的编码过程
 * - 连接权重 = 突触强度
 * 
 * ## 为什么这样设计
 * 
 * 1. **职责单一**
 *    - Remember只负责执行流程，不负责算法
 *    - 便于测试和维护
 *    - 可以轻松切换不同的权重策略
 * 
 * 2. **批处理优化**
 *    - 同一批Schema使用相同时间戳
 *    - 保证批次内的一致性
 *    - 避免时间戳漂移
 * 
 * 3. **覆盖而非累加**
 *    - 新的记忆覆盖旧的（用户决定）
 *    - 简化模型，避免权重爆炸
 *    - 符合"遗忘即学习"的认知规律
 * 
 * ## 执行流程
 * 
 * ```
 * Schema: ["认知", "模型", "训练", "效果"]
 * 
 * Phase 1: 确保Cue存在
 *   - 创建/获取 "认知" Cue
 *   - 创建/获取 "模型" Cue
 *   - 创建/获取 "训练" Cue
 *   - 创建/获取 "效果" Cue
 * 
 * Phase 2: 建立连接
 *   - "认知" -> "模型" (position=0)
 *   - "模型" -> "训练" (position=1)
 *   - "训练" -> "效果" (position=2)
 * ```
 * 
 * ## 设计决策
 * 
 * Q: 为什么不在Remember中计算权重？
 * A: 策略模式，算法可独立演化，Remember保持稳定。
 * 
 * Q: 为什么要两个Phase？
 * A: 
 * - Phase 1确保所有节点存在，避免边创建时找不到节点
 * - Phase 2专注于边的创建，逻辑清晰
 * 
 * Q: 为什么返回connections数组？
 * A: 便于调试、日志记录和可视化展示。
 * 
 * @class Remember
 */
class Remember {
  /**
   * 创建Remember实例
   * 
   * @param {Network} network - 全局认知网络
   * @param {WeightStrategy} strategy - 权重计算策略
   */
  constructor(network, options = {}) {
    /**
     * 认知网络引用
     * @type {Network}
     */
    this.network = network;
    
    /**
     * 权重策略
     * @type {WeightStrategy}
     */
    this.strategy = options.strategy || null;
    
    if (this.strategy) {
      logger.debug('[Remember] Initialized with strategy', { 
        strategy: this.strategy.constructor.name 
      });
    } else {
      logger.warn('[Remember] No strategy provided');
    }
  }

  /**
   * 执行记忆写入
   * 
   * 将Engram中的Schema序列写入Network，建立Cue之间的连接。
   * 
   * @param {Engram} engram - 记忆痕迹对象
   * @returns {Object} 执行结果
   * @returns {number} returns.processed - 处理的节点数
   * @returns {Array} returns.connections - 创建的连接列表
   */
  execute(engram) {
    // 参数验证
    const Engram = require('./Engram');
    if (!engram || !(engram instanceof Engram)) {
      logger.warn('[Remember] Invalid engram provided', { engram });
      return {
        processed: 0,
        connections: []
      };
    }
    
    if (!engram.isValid()) {
      logger.debug('[Remember] Engram schema too short, no connections to create', { 
        length: engram.length 
      });
      return {
        processed: engram.length,
        connections: []
      };
    }
    
    const { schema, strength, timestamp } = engram;
    
    logger.debug('[Remember] Processing engram', { 
      length: schema.length,
      strength: strength,
      preview: engram.getPreview()
    });
    
    // Phase 1: 确保所有Cue存在
    logger.debug('[Remember] Phase 1: Ensuring all Cues exist');
    const createdCues = [];
    for (const word of schema) {
      // 使用Network的getOrCreateCue方法，它会创建FrequencyCue
      if (!this.network.cues.has(word)) {
        createdCues.push(word);
      }
      this.network.getOrCreateCue(word);
    }
    
    if (createdCues.length > 0) {
      logger.debug('[Remember] Created new Cues', { 
        count: createdCues.length,
        cues: createdCues.slice(0, 10)  // 只显示前10个
      });
    }
    
    // Phase 2: 建立连接结构（先用临时权重）
    logger.debug('[Remember] Phase 2: Building connection structure');
    const WeightContext = require('./WeightContext');
    const connections = [];
    // 使用engram的timestamp，保证时间一致性
    
    // 2.1 先建立所有连接（用临时权重0）
    for (let i = 0; i < schema.length - 1; i++) {
      const sourceWord = schema[i];
      const targetWord = schema[i + 1];
      const sourceCue = this.network.cues.get(sourceWord);
      
      // 检查是否已有连接
      const existingWeight = sourceCue.connections.get(targetWord);
      if (!existingWeight) {
        // 新连接，先用0占位
        sourceCue.connections.set(targetWord, 0);
      }
    }
    
    // 2.2 现在计算并更新权重（此时出度已正确）
    logger.debug('[Remember] Phase 2.2: Calculating and updating weights');
    for (let i = 0; i < schema.length - 1; i++) {
      const sourceWord = schema[i];
      const targetWord = schema[i + 1];
      const sourceCue = this.network.cues.get(sourceWord);
      
      // 构建上下文（现在sourceOutDegree是正确的）
      const context = new WeightContext({
        sourceCue: sourceCue,
        targetWord: targetWord,
        position: i,
        timestamp: timestamp,
        engram: engram  // 传递完整的engram对象
      });
      
      // 委托策略计算权重
      const weight = this.strategy.calculate(context);
      
      logger.debug('[Remember] Weight calculation', {
        from: sourceWord,
        to: targetWord,
        position: i,
        outDegree: context.sourceOutDegree,
        weight: weight
      });
      
      // 更新权重（覆盖）
      sourceCue.connections.set(targetWord, weight);
      
      // 记录本次更新
      connections.push({
        source: sourceWord,
        target: targetWord,
        weight: weight,
        position: i
      });
    }
    
    logger.info('[Remember] Schema processed successfully', {
      nodes: schema.length,
      connections: connections.length,
      timestamp: new Date(timestamp).toISOString()
    });
    
    return {
      processed: schema.length,
      connections: connections,
      timestamp: timestamp
    };
  }
}

module.exports = Remember;