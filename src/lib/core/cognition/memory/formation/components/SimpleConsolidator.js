const Consolidator = require('../interfaces/Consolidator.js');

/**
 * Simple consolidator that handles both explicit and implicit memory consolidation
 * @implements {Consolidator}
 */
class SimpleConsolidator extends Consolidator {
  constructor(longTerm, semantic) {
    super();
    this.longTerm = longTerm;
    this.semantic = semantic;
  }

  /**
   * Consolidate engram into both long-term memory and semantic network
   * @param {import('../../../engram/Engram.js').Engram} engram - The engram to consolidate
   * @returns {import('../../../engram/Engram.js').Engram} The consolidated engram
   */
  consolidate(engram) {
    // 1. 存入长期记忆（显式记忆）
    this.longTerm.remember(engram);
    
    // 2. 构建语义网络（内隐记忆）
    // schema 是必传的 Mermaid 格式字符串
    if (this.semantic) {
      this.semantic.remember(engram);
    }
    
    return engram;
  }
}

module.exports = SimpleConsolidator;