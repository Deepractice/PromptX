// Cue - 词汇接口
// 认知原子的本质定义
//
// 核心洞察：Cue = Word = Keyword
// 最小的认知单元，就是一个可连接的词汇。
//
// 设计原则：
// 1. Cue 就是一个词汇，没有其他复杂概念
// 2. 只存储词汇本身，不存储语义、重要性等属性
// 3. 连接语义：同义词、近义词、相关词、层次关系
// 4. 所有复杂的语义分析、相似度计算都是外部算法
//
// 连接示例：
// - 同义词："快乐".connect("高兴")
// - 相关词："苹果".connect("水果")
// - 层次关系："动物".connect("狗")
// - 关联网络："红色".connect("爱情").connect("玫瑰")

const { Mind } = require('./Mind.js');

class Cue extends Mind {
  /**
   * 构造词汇节点
   * @param {string} word - 词汇内容
   * @param {number} initialStrength - 初始强度（可选）
   */
  constructor(word, initialStrength = 0.5) {
    super();
    if (!word || typeof word !== 'string') {
      throw new Error('Cue requires a valid word string');
    }
    this.word = word.trim();
    
    // 新增：强度字段，用于记忆权重管理
    this.strength = initialStrength;
  }

  /**
   * Cue的认知层次定义
   * 词汇级是最小的认知单元，层次为1
   * 
   * @returns {number} 层次值1，表示词汇级
   */
  getLayer() {
    return 1;
  }

  // Cue 继承 Mind 的 connect/disconnect 实现
  // 层次主导原则已在 Mind 基类中实现

  /**
   * 词汇相等性判断
   * 
   * 两个 Cue 相等当且仅当其词汇内容相同。
   * 这是 Cue 作为图节点的身份标识。
   * 
   * @param {Cue} other - 对比的词汇节点
   * @returns {boolean} 是否相等
   */
  equals(other) {
    return other instanceof Cue && this.word === other.word;
  }

  /**
   * 词汇字符串表示
   * 
   * 返回词汇内容，方便调试和显示。
   * 
   * @returns {string} 词汇字符串
   */
  toString() {
    return this.word;
  }
}

module.exports = { Cue };