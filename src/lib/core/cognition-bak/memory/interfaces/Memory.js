// Memory Interface - 记忆接口
// 基于Cue驱动的极简设计

class Memory {
  remember(engram) {
    throw new Error('Memory.remember() must be implemented');
  }

  recall(cue) {
    throw new Error('Memory.recall() must be implemented');
  }
}

module.exports = { Memory };