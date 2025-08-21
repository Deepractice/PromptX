/**
 * Mind - 认知网络（以 Cue 为中心的激活子图）
 * 
 * Mind 是一个动态的认知状态，以某个 Cue 为中心向外扩散。
 * 它不是所有记忆的容器，而是当前激活的认知网络。
 * 
 * @class Mind
 */
class Mind {
  /**
   * @param {Cue} center - 中心 Cue（当前焦点）
   */
  constructor(center) {
    this.center = center;  // 激活中心
    this.activatedCues = new Set();  // 激活的 Cue 集合
    this.connections = [];  // [{from: word, to: word, weight: number}, ...]
  }
}

module.exports = Mind;