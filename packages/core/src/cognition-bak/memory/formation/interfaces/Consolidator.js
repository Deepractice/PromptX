// Consolidator Interface - 巩固器接口
// 记忆巩固的分流处理核心：统一管理LongTerm存储和Mind网络整合

class Consolidator {
  /**
   * 巩固记忆 - 内部分流处理LongTerm和Mind网络
   * @param {Engram} engram - 要巩固的记忆痕迹
   */
  consolidate(engram) {
    throw new Error('Consolidator.consolidate() must be implemented');
  }
}

module.exports = Consolidator;