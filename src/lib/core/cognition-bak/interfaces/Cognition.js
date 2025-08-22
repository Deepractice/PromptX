// Cognition Interface - 认知接口
// 定义认知系统的核心能力：启动和思考

/**
 * 认知接口
 * 任何认知系统都必须具备的两个核心能力
 */
class Cognition {
  /**
   * 启动认知系统
   * 激活语义网络，准备认知活动
   * @param {string} semanticName - 语义网络名称
   * @returns {Promise<string>} 激活的语义网络表示
   */
  async prime(semanticName) {
    throw new Error('Cognition.prime() must be implemented');
  }

  /**
   * 进行思考
   * 基于输入的思想进行认知处理
   * @param {Thought} thought - 输入的思想
   * @returns {Promise<string>} 思考指导或结果
   */
  async think(thought) {
    throw new Error('Cognition.think() must be implemented');
  }
}

module.exports = { Cognition };