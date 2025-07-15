// Cognition - 认知中心
// 认知体系的配置和执行入口

const { MemoryService } = require('./memory');
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
   * 思考 - 基于当前Thought和思维模板生成下一个Thought的指导prompt
   * 
   * @param {Thought} thought - 当前的思想对象（包含五大要素）
   * @param {BaseThinkingTemplate} template - 思维模板（如ReasoningTemplate）
   * @returns {string} 用于生成下一个Thought的完整prompt
   */
  async think(thought, template) {
    // 验证参数
    if (!thought) {
      throw new Error('think方法需要一个Thought对象');
    }
    
    if (!template || typeof template.getNextThoughtGenerationPrompt !== 'function') {
      throw new Error('think方法需要一个有效的ThinkingTemplate');
    }
    
    // 如果thought有goalEngram但没有recalledEngrams，先执行记忆检索
    if (thought.goalEngram && !thought.recalledEngrams) {
      const recalledEngrams = await template.recallEngramsByGoalEngramCues(
        thought.goalEngram, 
        this.memoryService
      );
      thought.recalledEngrams = recalledEngrams;
    }
    
    // 准备传递给template的组件
    const components = {
      goalEngram: thought.goalEngram,
      recalledEngrams: thought.recalledEngrams,
      insightEngrams: thought.insightEngrams,
      conclusionEngram: thought.conclusionEngram,
      confidence: thought.confidence,
      previousThought: thought.previousThought,
      iteration: thought.iteration || 0,
      input: thought.input // 初始输入（当还没有goalEngram时）
    };
    
    // 调用template生成下一个Thought的指导prompt
    return template.getNextThoughtGenerationPrompt(components);
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
}

module.exports = { Cognition };