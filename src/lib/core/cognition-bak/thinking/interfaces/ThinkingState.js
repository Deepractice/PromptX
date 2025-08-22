// ThinkingState - 思考状态枚举
// 基于认知心理学的思维阶段理论（Stages of Thinking）
//
// === 认知心理学基础 ===
//
// 思考过程的阶段性特征：
// 1. 探索阶段（Exploration）：激活扩散，寻找相关信息
// 2. 整合阶段（Integration）：识别模式，产生洞察
// 3. 收敛阶段（Convergence）：形成结论，评估质量
// 4. 终止阶段（Termination）：达成目标或资源耗尽
//
// === 状态推断原则 ===
//
// 系统基于 Thought 的客观指标自动推断状态：
// - 不依赖 AI 的主观判断
// - 基于多个字段的组合分析
// - 确保状态判断的一致性和可靠性

/**
 * 思考状态枚举
 * 
 * 定义思考过程中的各种可能状态
 * 用于系统控制思考流程和终止条件
 */
class ThinkingState {
  /**
   * 探索中（Exploring）
   * 
   * 认知特征：
   * - 激活扩散活跃，寻找相关记忆
   * - 尚未形成明确的洞察或结论
   * - 信息收集和初步分析阶段
   * 
   * 判断条件：
   * - iteration < 3
   * - !conclusionEngram
   * - insightEngrams.length < 2
   */
  static EXPLORING = 'exploring';

  /**
   * 深化中（Deepening）
   * 
   * 认知特征：
   * - 已有初步洞察，正在深入分析
   * - 识别模式，建立联系
   * - 概念整合和重组阶段
   * 
   * 判断条件：
   * - iteration >= 3
   * - insightEngrams.length >= 2
   * - !conclusionEngram || confidence < 0.5
   */
  static DEEPENING = 'deepening';

  /**
   * 收敛中（Converging）
   * 
   * 认知特征：
   * - 形成初步结论，评估可靠性
   * - 整合各种洞察，构建连贯理解
   * - 准备完成思考的过渡阶段
   * 
   * 判断条件：
   * - conclusionEngram exists
   * - confidence >= 0.5 && confidence < 0.8
   * - insightEngrams support conclusion
   */
  static CONVERGING = 'converging';

  /**
   * 已完成（Completed）
   * 
   * 认知特征：
   * - 达到高质量的结论
   * - 置信度高，逻辑连贯
   * - 可以安全终止思考
   * 
   * 判断条件：
   * - conclusionEngram exists
   * - confidence >= 0.8
   * - 内部一致性检查通过
   */
  static COMPLETED = 'completed';

  /**
   * 受阻（Blocked）
   * 
   * 认知特征：
   * - 缺少必要信息，无法继续
   * - 发现知识盲区或语义鸿沟
   * - 需要外部输入或学习
   * 
   * 判断条件：
   * - iteration > 5 && !conclusionEngram
   * - recalledEngrams.length < 2
   * - 连续2轮无新insightEngrams
   */
  static BLOCKED = 'blocked';

  /**
   * 矛盾（Contradictory）
   * 
   * 认知特征：
   * - 发现相互冲突的信息或推理
   * - 无法调和的认知失调
   * - 需要重新审视前提或切换思维模式
   * 
   * 判断条件：
   * - insightEngrams 存在逻辑冲突
   * - confidence < 0.3 with conclusionEngram
   * - 多个可能结论相互矛盾
   */
  static CONTRADICTORY = 'contradictory';

  /**
   * 超限（Exceeded）
   * 
   * 认知特征：
   * - 思考时间或迭代次数超过限制
   * - 陷入循环或过度分析
   * - 强制终止以避免资源浪费
   * 
   * 判断条件：
   * - iteration > 10
   * - 思考时间超过阈值
   * - 系统资源限制
   */
  static EXCEEDED = 'exceeded';

  /**
   * 获取所有有效状态
   * @returns {Array<string>} 所有状态值数组
   */
  static getAllStates() {
    return [
      this.EXPLORING,
      this.DEEPENING,
      this.CONVERGING,
      this.COMPLETED,
      this.BLOCKED,
      this.CONTRADICTORY,
      this.EXCEEDED
    ];
  }

  /**
   * 检查是否为终止状态
   * @param {string} state - 要检查的状态
   * @returns {boolean} 是否应该终止思考
   */
  static isTerminalState(state) {
    return [
      this.COMPLETED,
      this.BLOCKED,
      this.CONTRADICTORY,
      this.EXCEEDED
    ].includes(state);
  }

  /**
   * 检查是否可以继续思考
   * @param {string} state - 要检查的状态
   * @returns {boolean} 是否可以继续
   */
  static canContinue(state) {
    return [
      this.EXPLORING,
      this.DEEPENING,
      this.CONVERGING
    ].includes(state);
  }

  /**
   * 获取状态的认知负荷级别
   * @param {string} state - 要评估的状态
   * @returns {number} 认知负荷级别 (0-1)
   */
  static getCognitiveLoad(state) {
    const loadMap = {
      [this.EXPLORING]: 0.3,
      [this.DEEPENING]: 0.7,
      [this.CONVERGING]: 0.5,
      [this.COMPLETED]: 0.1,
      [this.BLOCKED]: 0.8,
      [this.CONTRADICTORY]: 0.9,
      [this.EXCEEDED]: 1.0
    };
    return loadMap[state] || 0.5;
  }
}

module.exports = { ThinkingState };