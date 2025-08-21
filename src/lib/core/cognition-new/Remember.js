/**
 * Remember - 记忆写入执行器
 * 
 * 负责将Schema（时间性综合的Cue序列）写入Network。
 * 这是从外部经验到内部记忆网络的关键转换点。
 * 
 * 康德哲学映射：
 * - Schema作为时间性综合（temporal synthesis）进入
 * - 通过图式论（schematism）建立Cue之间的连接
 * - 更新Network中的持久结构
 * 
 * @class Remember
 */
class Remember {
  /**
   * @param {Network} network - 全局认知网络
   */
  constructor(network) {
    this.network = network;
  }

  /**
   * 执行记忆写入
   * 
   * 将Schema（Cue序列）写入Network，建立或强化连接。
   * Schema格式：[cue1, cue2, cue3, ...]
   * 
   * 处理逻辑：
   * 1. 确保所有Cue在Network中存在
   * 2. 建立序列中相邻Cue的连接
   * 3. 更新连接权重和元信息
   * 
   * @param {Array<string>} schema - Cue词的有序序列
   * @param {Object} options - 可选参数
   * @param {number} options.baseWeight - 基础权重（默认1.0）
   * @param {number} options.decay - 衰减因子（默认0.9）
   */
  execute(schema, options = {}) {
    const { baseWeight = 1.0, decay = 0.9 } = options;
    
    // 确保所有Cue存在于Network中
    for (const word of schema) {
      if (!this.network.cues.has(word)) {
        const Cue = require('./Cue');
        this.network.cues.set(word, new Cue(word));
      }
    }
    
    // 建立序列连接（时间性因果）
    for (let i = 0; i < schema.length - 1; i++) {
      const fromCue = this.network.cues.get(schema[i]);
      const toWord = schema[i + 1];
      
      // 获取或创建连接
      let connection = fromCue.connections.get(toWord);
      if (!connection) {
        connection = {
          weight: 0,
          count: 0,
          lastUsed: Date.now()
        };
        fromCue.connections.set(toWord, connection);
      }
      
      // 更新连接（STDP原理：时序决定因果）
      connection.weight += baseWeight * Math.pow(decay, i);
      connection.count += 1;
      connection.lastUsed = Date.now();
    }
    
    return {
      processed: schema.length,
      connections: schema.length - 1
    };
  }
}

module.exports = Remember;