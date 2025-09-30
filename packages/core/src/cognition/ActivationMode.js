const logger = require('@promptx/logger');

/**
 * ActivationMode - 认知激活模式配置
 *
 * ## 设计理念
 *
 * 基于认知神经科学的 Exploration-Exploitation 理论，
 * 提供三种基础的记忆激活模式，模拟人脑在不同任务下的激活策略。
 *
 * ## 学术基础
 *
 * 1. **Exploration-Exploitation Theory**
 *    - Exploration: 在不同记忆区域间切换，寻找远距离关联
 *    - Exploitation: 在当前区域内深度搜索，聚焦强连接
 *    来源: Hills et al. (2015) - Exploration versus exploitation in space, mind, and society
 *
 * 2. **ACT-R Cognitive Architecture**
 *    - Retrieval Threshold: 控制记忆检索的宽松/严格程度
 *    - Decay Rate: 控制激活能量的衰减速度
 *    来源: Anderson & Lebiere (1998) - The Atomic Components of Thought
 *
 * 3. **Dual Process Theory**
 *    - Type 1 (Automatic): 快速、并行、低努力 → Focused 模式
 *    - Type 2 (Controlled): 慢速、串行、高努力 → Creative 模式
 *    来源: Evans & Stanovich (2013) - Dual-Process Theories of Higher Cognition
 *
 * ## 三种模式
 *
 * - **Creative**: 创造性探索，广泛联想，发现远距离连接
 * - **Balanced**: 平衡模式，系统默认行为
 * - **Focused**: 聚焦检索，精确查找，优先常用记忆
 *
 * @class ActivationMode
 */
class ActivationMode {
  /**
   * 预定义的三种激活模式
   *
   * @static
   * @type {Object}
   */
  static MODES = {
    /**
     * Creative Mode - 创造性探索模式
     *
     * 适用场景：
     * - 头脑风暴，寻找创意
     * - 跨领域联想
     * - 探索未知概念
     * - 发现意外连接
     *
     * 特点：
     * - 低激活阈值，容易激活更多节点
     * - 高传递效率，能量扩散得更远
     * - 低侧抑制，允许更密集的激活
     * - 更多循环和结果，探索广度优先
     * - 低频率加成，不偏向常用记忆
     */
    creative: {
      name: 'Creative',
      description: '创造性探索模式，广泛联想，发现远距离连接',
      params: {
        // HippocampalActivationStrategy 参数
        firingThreshold: 0.05,      // 极低阈值，容易激活
        synapticDecay: 0.95,        // 高传递效率，能量损失少
        inhibitionFactor: 0.05,     // 低侧抑制，激活密集
        maxCycles: 12,              // 更多循环，探索更深
        cycleDecay: 0.95,           // 慢衰减，持续时间长
        frequencyBoost: 0.05,       // 低频率加成，探索新路径

        // TwoPhaseRecallStrategy 参数
        maxActivations: 150,        // 更大的候选集
        totalLimit: 80              // 更多的最终结果
      }
    },

    /**
     * Balanced Mode - 平衡模式
     *
     * 适用场景：
     * - 常规问答
     * - 通用记忆检索
     * - 默认行为
     *
     * 特点：
     * - 中等阈值和传递效率
     * - 平衡的激活范围
     * - 系统默认值
     */
    balanced: {
      name: 'Balanced',
      description: '平衡模式，系统默认行为',
      params: {
        // HippocampalActivationStrategy 参数
        firingThreshold: 0.1,       // 中等阈值
        synapticDecay: 0.9,         // 中等传递效率
        inhibitionFactor: 0.1,      // 中等侧抑制
        maxCycles: 8,               // 中等循环数
        cycleDecay: 0.9,            // 中等衰减
        frequencyBoost: 0.1,        // 中等频率加成

        // TwoPhaseRecallStrategy 参数
        maxActivations: 100,        // 中等候选集
        totalLimit: 50              // 中等结果数
      }
    },

    /**
     * Focused Mode - 聚焦检索模式
     *
     * 适用场景：
     * - 精确问题查找
     * - 检索特定知识
     * - 快速获取答案
     * - 专注任务执行
     *
     * 特点：
     * - 高激活阈值，只激活最相关的节点
     * - 低传递效率，快速衰减
     * - 高侧抑制，稀疏激活
     * - 少循环和结果，精确优先
     * - 高频率加成，偏向常用记忆
     */
    focused: {
      name: 'Focused',
      description: '聚焦检索模式，精确查找，优先常用记忆',
      params: {
        // HippocampalActivationStrategy 参数
        firingThreshold: 0.2,       // 高阈值，难激活
        synapticDecay: 0.75,        // 低传递效率，快速衰减
        inhibitionFactor: 0.15,     // 高侧抑制，稀疏激活
        maxCycles: 4,               // 少循环，快速终止
        cycleDecay: 0.85,           // 较快衰减
        frequencyBoost: 0.2,        // 高频率加成，偏向常用

        // TwoPhaseRecallStrategy 参数
        maxActivations: 50,         // 小候选集
        totalLimit: 20              // 少结果，精确聚焦
      }
    }
  };

  /**
   * 获取模式配置
   *
   * @static
   * @param {string} mode - 模式名称 ('creative' | 'balanced' | 'focused')
   * @returns {Object} 模式配置对象
   */
  static getConfig(mode = 'balanced') {
    const config = this.MODES[mode];

    if (!config) {
      logger.warn('[ActivationMode] Unknown mode, using balanced', {
        requestedMode: mode,
        availableModes: Object.keys(this.MODES)
      });
      return this.MODES.balanced;
    }

    logger.debug('[ActivationMode] Using mode', { mode, config: config.name });
    return config;
  }

  /**
   * 创建对应的 HippocampalActivationStrategy 实例
   *
   * @static
   * @param {string} mode - 模式名称
   * @returns {HippocampalActivationStrategy} 激活策略实例
   */
  static createStrategy(mode = 'balanced') {
    const config = this.getConfig(mode);
    const { HippocampalActivationStrategy } = require('./ActivationStrategy');

    logger.info('[ActivationMode] Creating activation strategy', {
      mode,
      name: config.name,
      params: config.params
    });

    return new HippocampalActivationStrategy(config.params);
  }

  /**
   * 创建对应的 TwoPhaseRecallStrategy 配置
   *
   * @static
   * @param {string} mode - 模式名称
   * @returns {Object} TwoPhaseRecallStrategy 构造函数参数
   */
  static createRecallConfig(mode = 'balanced') {
    const config = this.getConfig(mode);

    logger.info('[ActivationMode] Creating recall config', {
      mode,
      name: config.name,
      maxActivations: config.params.maxActivations,
      totalLimit: config.params.totalLimit
    });

    return {
      // 激活策略
      activationStrategy: this.createStrategy(mode),

      // 第一阶段参数
      maxActivations: config.params.maxActivations,

      // 第二阶段参数
      totalLimit: config.params.totalLimit
    };
  }

  /**
   * 获取所有可用模式的列表
   *
   * @static
   * @returns {Array<Object>} 模式列表
   */
  static listModes() {
    return Object.entries(this.MODES).map(([key, value]) => ({
      key,
      name: value.name,
      description: value.description
    }));
  }

  /**
   * 验证模式名称是否有效
   *
   * @static
   * @param {string} mode - 模式名称
   * @returns {boolean} 是否有效
   */
  static isValidMode(mode) {
    return mode && this.MODES.hasOwnProperty(mode);
  }
}

module.exports = ActivationMode;