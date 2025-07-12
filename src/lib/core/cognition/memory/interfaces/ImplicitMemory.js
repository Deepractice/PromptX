const { Memory } = require('./Memory.js');

/**
 * @interface ImplicitMemory
 * @extends Memory
 * @description 内隐记忆接口 - 处理无意识的、自动化的记忆过程
 * 
 * 内隐记忆特征：
 * - 无需有意识提取
 * - 基于刺激-反应的自动激活
 * - 支持启动效应(priming)
 * - 与语义网络(Semantic)紧密关联
 */
class ImplicitMemory extends Memory {
  /**
   * 启动效应 - 在语义网络中预激活相关记忆节点
   * @param {Array} cues - 启动线索数组
   * @returns {void}
   */
  prime(cues) {
    throw new Error('ImplicitMemory.prime() must be implemented');
  }
}

module.exports = { ImplicitMemory };
module.exports.default = ImplicitMemory;