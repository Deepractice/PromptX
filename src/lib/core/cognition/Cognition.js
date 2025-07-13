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
      semanticPath: config.semanticPath || './.cognition/semantic'
    };
    
    // 创建记忆服务（传入配置）
    this.memoryService = new MemoryService(this.config);
  }
  
  /**
   * 记住 - 保存新记忆
   * @param {string} content - 记忆内容（自然语言描述）
   * @param {string} schema - 结构化认知（Mermaid mindmap 格式）
   * @param {number} strength - 记忆强度（0-1之间）
   */
  remember(content, schema, strength) {
    // 验证参数
    if (typeof strength !== 'number' || strength < 0 || strength > 1) {
      throw new Error('strength 必须是 0-1 之间的数字');
    }
    
    // 在内部创建 Engram 对象
    const { Engram } = require('./engram/Engram');
    const engram = new Engram(content, schema);
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