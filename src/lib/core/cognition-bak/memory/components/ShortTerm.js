// ShortTerm - 短期记忆具体实现
// 基于队列的短期记忆，支持自动巩固
// 当前设置为容量1，实现即时巩固（未来可改为pull模式时再调整）

const { ShortTermMemory } = require('../interfaces/ShortTermMemory.js');

class ShortTerm extends ShortTermMemory {
  constructor(evaluator, consolidator, capacity = 1) {
    super();
    this.queue = [];
    this.capacity = capacity;
    this.evaluator = evaluator;   // 评估器：判断是否值得巩固
    this.consolidator = consolidator; // 巩固器：执行巩固过程
  }

  async remember(engram) {
    // 新记忆入队
    this.queue.push(engram);
    
    // 检查容量，超过容量则触发巩固流程
    // 保持 > 逻辑，为未来的 pull 模式预留设计空间
    if (this.queue.length > this.capacity) {
      await this.processOldestMemory();
    }
  }

  recall(cue) {
    if (!cue) {
      // 无线索时返回所有记忆
      return [...this.queue];
    }
    
    // 基于线索搜索队列中的记忆
    return this.queue.filter(engram => 
      engram.getContent().toLowerCase().includes(cue.toLowerCase())
    );
  }

  /**
   * 处理最老的记忆：评估 -> 巩固或丢弃
   */
  async processOldestMemory() {
    const oldestEngram = this.queue.shift(); // FIFO出队
    
    try {
      if (this.evaluator.evaluate(oldestEngram)) {
        // 值得巩固：交给Consolidator处理
        await this.consolidator.consolidate(oldestEngram);
        console.log('[ShortTerm.processOldestMemory] Consolidated engram');
      } else {
        console.log('[ShortTerm.processOldestMemory] Engram not worth consolidating, discarded');
      }
    } catch (error) {
      console.error('[ShortTerm.processOldestMemory] Error during consolidation:', error);
      throw error;
    }
  }

  /**
   * 获取当前队列大小
   */
  size() {
    return this.queue.length;
  }

  /**
   * 检查队列是否已满
   */
  isFull() {
    return this.queue.length >= this.capacity;
  }
}

module.exports = { ShortTerm };