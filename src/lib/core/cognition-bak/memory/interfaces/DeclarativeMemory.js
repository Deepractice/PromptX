// DeclarativeMemory Interface - 陈述性记忆接口
// 继承Memory基础能力，用于类型区分

const { Memory } = require('./Memory.js');

class DeclarativeMemory extends Memory {
  // 继承 remember(engram)
  // 继承 recall(cue)
  // 纯类型区分，无额外方法
}

module.exports = { DeclarativeMemory };