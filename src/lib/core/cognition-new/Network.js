/**
 * Network - 全局认知网络（所有 Cue 的容器）
 * 
 * Network 包含所有的 Cue，无论它们是连接的还是游离的。
 * 这是整个认知系统的基础设施，就像海马体中的完整神经网络。
 * 
 * 极简设计：只存储 Cue，连接信息在 Cue 内部
 * 
 * @class Network
 */
class Network {
  constructor() {
    this.cues = new Map();  // word -> Cue 实例
  }
}

module.exports = Network;