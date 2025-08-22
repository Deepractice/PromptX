// Cognition - 认知中心
// 认知体系的配置和执行入口

const { MemoryService } = require('./memory');
const { ThoughtEntity } = require('./thinking/entities/ThoughtEntity');
const path = require('path');

class Cognition {
  constructor(config = {}) {
    // 极简配置 - 只保留必要的存储路径
    this.config = {
      // 长期记忆存储路径
      longTermPath: config.longTermPath || './.cognition/longterm',
      // 语义网络存储路径
      semanticPath: config.semanticPath || './.cognition/semantic',
      // 程序性记忆存储路径
      proceduralPath: config.proceduralPath || './.cognition/procedural.json'
    };
    
    // 创建记忆服务（传入配置）
    this.memoryService = new MemoryService(this.config);
  }
  
  /**
   * 记住 - 保存新记忆
   * @param {string} content - 记忆内容（自然语言描述）
   * @param {string} schema - 结构化认知（Mermaid mindmap 格式）
   * @param {number} strength - 记忆强度（0-1之间）
   * @param {string} type - Engram类型（ATOMIC|LINK|PATTERN，默认ATOMIC）
   */
  async remember(content, schema, strength, type = 'ATOMIC') {
    // 验证参数
    if (typeof strength !== 'number' || strength < 0 || strength > 1) {
      throw new Error('strength 必须是 0-1 之间的数字');
    }
    
    // 验证type参数
    const { EngramType } = require('./engram/interfaces/Engram');
    if (!Object.values(EngramType).includes(type)) {
      throw new Error(`type 必须是以下值之一: ${Object.values(EngramType).join(', ')}`);
    }
    
    // 在内部创建 Engram 对象
    const { Engram } = require('./engram/Engram');
    const engram = new Engram(content, schema, type);
    engram.strength = strength;
    
    return this.memoryService.remember(engram);
  }
  
  /**
   * 回忆 - 检索记忆
   * @param {string} cue - 检索线索
   * @returns {Promise<Array<Engram>>} 匹配的记忆列表
   */
  async recall(cue) {
    return this.memoryService.recall(cue);
  }
  
  /**
   * 启动效应 - 预激活语义网络并返回 Mermaid 表示
   * @returns {string} Mermaid mindmap 格式的字符串
   */
  async prime() {
    return this.memoryService.prime();
  }
  
  /**
   * 启动程序性记忆 - 激活行为模式
   * @returns {string} 格式化的行为模式列表
   */
  async primeProcedural() {
    return this.memoryService.primeProcedural();
  }
  
  /**
   * 思考 - 基于当前Thought生成下一个Thought的指导prompt
   * 
   * === 核心改变：单一 Thought 参数 ===
   * 
   * 新设计中，AI 在创建 Thought 时就已经做出了三个关键决策：
   * 1. goalEngram - 要思考什么
   * 2. thinkingPattern - 怎么思考（如 'reasoning', 'creative', 'critical'）
   * 3. spreadActivationCues - 从哪开始
   * 
   * 系统基于 thinkingPattern 自动选择对应的 ThinkingPattern 实现
   * 
   * @param {Thought} thought - 当前的思想对象
   *                           必须包含：goalEngram, thinkingPattern, spreadActivationCues
   *                           系统自动填充：recalledEngrams, previousThought, iteration等
   * @returns {string} 用于生成下一个Thought的完整prompt
   */
  async think(thought) {
    // 验证参数
    if (!thought) {
      throw new Error('think方法需要一个Thought对象');
    }
    
    // 如果是普通对象，转换为ThoughtEntity
    if (!(thought instanceof ThoughtEntity)) {
      thought = ThoughtEntity.fromObject(thought);
    }
    
    // 验证必需字段（首次思考）
    if (!thought.getGoalEngram()) {
      throw new Error('Thought必须包含goalEngram');
    }
    
    if (!thought.getThinkingPattern()) {
      throw new Error('Thought必须包含thinkingPattern（AI需要选择思维模式）');
    }
    
    if (!thought.getSpreadActivationCues() || thought.getSpreadActivationCues().length === 0) {
      throw new Error('Thought必须包含spreadActivationCues（AI需要选择激活线索）');
    }
    
    // 基于 thinkingPattern 选择对应的模式实现
    const pattern = await this._getPatternImplementation(thought.getThinkingPattern());
    
    // 如果thought有cues但没有recalledEngrams，先执行记忆检索
    if (!thought.getRecalledEngrams() || thought.getRecalledEngrams().length === 0) {
      console.log('[Cognition] 开始记忆检索，线索:', thought.getSpreadActivationCues());
      const recalledEngrams = await this._recallByCues(
        thought.getSpreadActivationCues()
      );
      console.log('[Cognition] 检索到记忆数量:', recalledEngrams.length);
      // 使用ThoughtEntity的setSystemFields方法设置系统字段
      thought.setSystemFields({ recalledEngrams });
    }
    
    // 准备传递给pattern的组件
    const components = {
      goalEngram: thought.getGoalEngram(),
      recalledEngrams: thought.getRecalledEngrams(),
      insightEngrams: thought.getInsightEngrams(),
      conclusionEngram: thought.getConclusionEngram(),
      confidence: thought.getConfidence(),
      previousThought: thought.getPreviousThought(),
      iteration: thought.getIteration() || 0,
      thinkingPattern: thought.getThinkingPattern(),
      spreadActivationCues: thought.getSpreadActivationCues(),
      thinkingState: thought.getThinkingState()
    };
    
    // 调用pattern生成下一个Thought的指导prompt
    return pattern.getThinkingGuidancePattern(thought);
  }
  
  /**
   * 根据思维模式获取对应的模式实现
   * @private
   * @param {string} patternName - 思维模式标识符
   * @returns {BaseThinkingPattern} 对应的思维模式实例
   */
  async _getPatternImplementation(patternName) {
    const { createThinkingPattern } = require('./thinking/patterns');
    
    try {
      // 使用工厂函数创建思维模式实例
      return createThinkingPattern(patternName);
    } catch (error) {
      // 增强错误信息
      throw new Error(
        `无法加载思维模式 "${patternName}": ${error.message}`
      );
    }
  }
  
  /**
   * 基于激活线索检索记忆
   * @private
   * @param {Array<string>} cues - 激活线索数组
   * @returns {Array<Engram>} 检索到的记忆
   */
  async _recallByCues(cues) {
    const allEngrams = [];
    
    // 对每个线索进行检索
    for (const cue of cues) {
      const engrams = await this.memoryService.recall(cue);
      allEngrams.push(...engrams);
    }
    
    // 去重和排序（按强度降序）
    const uniqueEngrams = Array.from(
      new Map(allEngrams.map(e => [e.content, e])).values()
    );
    
    return uniqueEngrams.sort((a, b) => b.strength - a.strength);
  }
  
  /**
   * 获取配置
   * @returns {Object} 当前配置
   */
  getConfig() {
    return this.config;
  }
  
  /**
   * 更新配置
   * @param {Object} newConfig - 新配置（会与现有配置合并）
   */
  updateConfig(newConfig) {
    // 简单合并配置
    this.config = { ...this.config, ...newConfig };
    // 重新创建服务
    this.memoryService = new MemoryService(this.config);
  }
  
  /**
   * 获取所有可用的思维模式
   * @returns {string[]} 可用的思维模式名称数组
   */
  getAvailableThinkingPatterns() {
    const { getAvailablePatterns } = require('./thinking/patterns');
    return getAvailablePatterns();
  }
}

module.exports = { Cognition };