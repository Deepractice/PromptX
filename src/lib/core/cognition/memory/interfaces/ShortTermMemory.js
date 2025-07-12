// ShortTermMemory Interface - 短期记忆接口
// 继承DeclarativeMemory，用于类型区分

const { DeclarativeMemory } = require('./DeclarativeMemory.js');

class ShortTermMemory extends DeclarativeMemory {
  // 继承 remember(engram)
  // 继承 recall(cue)
  // 纯类型区分，无额外方法
}

module.exports = { ShortTermMemory };