/**
 * Cue - 认知线索（记忆网络节点）
 * 
 * 基于认知心理学：Cue 是海马体中体验网络的节点。
 * 它不是原始的感性材料，而是已经经过综合处理的认知单元。
 * 在记忆网络中，Cue 作为可被激活和检索的基本节点存在。
 * 
 * 关键设计：每个 Cue 管理自己的出边连接（像神经元管理突触）
 * 
 * @class Cue
 */
class Cue {
  /**
   * @param {string} word - 词
   */
  constructor(word) {
    this.word = word;
    
    // 核心：管理到其他 Cue 的连接
    // Map: targetWord -> {weight, count, lastUsed}
    this.connections = new Map();
  }
}

module.exports = Cue;