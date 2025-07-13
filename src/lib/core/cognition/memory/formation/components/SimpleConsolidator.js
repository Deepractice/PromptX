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
   * @returns {Promise<import('../../../engram/Engram.js').Engram>} The consolidated engram
   */
  async consolidate(engram) {
    try {
      console.log('[SimpleConsolidator.consolidate] Processing engram:', engram.content);
      
      // 1. 存入长期记忆（显式记忆）
      await this.longTerm.remember(engram);
      console.log('[SimpleConsolidator.consolidate] Saved to long-term memory');
      
      // 2. 构建语义网络（内隐记忆）
      // schema 是必传的 Mermaid 格式字符串
      if (this.semantic) {
        await this.semantic.remember(engram);
        console.log('[SimpleConsolidator.consolidate] Added to semantic network');
      } else {
        console.warn('[SimpleConsolidator.consolidate] No semantic memory available');
      }
      
      return engram;
    } catch (error) {
      console.error('[SimpleConsolidator.consolidate] Error:', error);
      throw error;
    }
  }
}

module.exports = SimpleConsolidator;