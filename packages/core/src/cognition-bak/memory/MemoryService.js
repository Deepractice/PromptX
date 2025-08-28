// MemoryService.js - 极简记忆服务
// 只有 remember 和 recall 两个核心方法
// 内部自动管理短期记忆和长期记忆的协作

const { ShortTerm } = require('./components/ShortTerm.js');
const { LongTerm } = require('./components/LongTerm.js');
const { SimpleEvaluator } = require('./formation/index.js');
const SimpleConsolidator = require('./formation/components/SimpleConsolidator.js');
const Semantic = require('./components/Semantic.js');
const Procedural = require('./components/Procedural.js');

class MemoryService {
  constructor(config = {}) {
    this.config = config;
    
    // 创建长期记忆（使用配置的存储路径）
    this.longTerm = new LongTerm({ 
      inMemoryOnly: process.env.NODE_ENV === 'test',
      dbPath: config.longTermPath
    });
    
    // 使用默认评估器
    this.evaluator = new SimpleEvaluator();
    
    // 创建语义内隐记忆（传入语义存储路径配置）
    this.semantic = new Semantic(config.semanticPath);
    
    // 创建程序性内隐记忆（传入程序性存储路径配置）
    this.procedural = new Procedural(config.proceduralPath);
    
    // 使用 SimpleConsolidator，同时处理长期记忆、语义网络和程序性记忆
    this.consolidator = new SimpleConsolidator(this.longTerm, this.semantic, this.procedural);
    
    // 创建短期记忆，容量设为0实现立即巩固
    this.shortTerm = new ShortTerm(this.evaluator, this.consolidator, 0);
    
    // 设置 mindService 的存储路径
    if (config.semanticPath) {
      this.semantic.mindService.setStoragePath(config.semanticPath);
    }
  }

  /**
   * 记住 - 保存新记忆
   * @param {Engram} engram - 记忆痕迹对象（schema 必须是 Mermaid 格式字符串）
   */
  async remember(engram) {
    try {
      console.log('[MemoryService.remember] Processing engram:', engram.content);
      // 简单地保存到短期记忆
      // 短期记忆会自动处理溢出和巩固
      await this.shortTerm.remember(engram);
      console.log('[MemoryService.remember] Successfully saved to memory');
    } catch (error) {
      console.error('[MemoryService.remember] Error:', error);
      throw error;
    }
  }

  /**
   * 回忆 - 检索记忆
   * @param {string} cue - 检索线索（可选）
   * @returns {Array<Engram>} 匹配的记忆列表
   */
  async recall(cue) {
    // 从短期和长期记忆中检索
    const shortTermResults = this.shortTerm.recall(cue);
    const longTermResults = await this.longTerm.recall(cue);
    
    // 合并结果，去重（基于ID）
    const allResults = [...shortTermResults, ...longTermResults];
    const uniqueResults = Array.from(
      new Map(allResults.map(item => [item.getId(), item])).values()
    );
    
    // 如果有检索线索，通知语义网络更新权重
    if (cue && this.semantic) {
      await this.semantic.notifyAccess(cue);
    }
    
    // 按时间戳排序（最早的在前，保持学习顺序）
    return uniqueResults.sort((a, b) => {
      const timeA = a.timestamp || new Date(0);
      const timeB = b.timestamp || new Date(0);
      return timeA - timeB;
    });
  }

  /**
   * 启动效应 - 预激活语义网络并返回 Mermaid 表示
   * @param {string} input - 语义网络名称（可选）
   * @returns {string} Mermaid mindmap 格式的字符串
   */
  async prime(input) {
    // 调用语义内隐记忆的 prime 方法，直接返回 Mermaid
    return await this.semantic.prime(input);
  }

  /**
   * 启动程序性记忆 - 激活行为模式
   * @returns {string} 格式化的行为模式列表
   */
  async primeProcedural() {
    return await this.procedural.prime();
  }

}

module.exports = { MemoryService };