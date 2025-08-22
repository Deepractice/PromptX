// ThinkingPattern Interface - 思维模式接口
// 认知心理学基础：Cognitive Strategies（认知策略）
//
// === 认知心理学概念对齐 ===
//
// 1. 认知策略（Cognitive Strategies）
//    - 解决问题时采用的思维方法和路径
//    - 不同策略产生不同的认知过程和结果
//    - 策略选择影响信息处理的方式
//
// 2. 模式敏感性（Pattern Sensitivity）
//    - 基于 Thought.js 的字段分类分析
//    - 专注于模式敏感和模式相关的字段
//    - 不同思维模式产生不同的认知输出
//
// 3. 提示工程（Prompt Engineering）
//    - ThinkingPattern 是 prompt 生成器
//    - 指导 AI 按照特定模式思考
//    - 将认知策略转化为可执行的指令
//
// === 设计原则 ===
//
// 1. 单一职责：只负责生成 prompt，不执行思考
// 2. 模式聚焦：只处理模式敏感的字段
// 3. 简洁接口：基于奥卡姆剃刀原则的最小设计
// 4. 灵活组合：支持不同阶段的 prompt 生成
//
// === 方法命名约定 ===
//
// 我们使用三种方法后缀来区分不同的处理类型：
//
// 1. **Pattern** - 返回静态的模式化指导文本
//    - 不需要参数渲染，直接返回指导内容
//    - 例如：getGoalUnderstandingPattern()
//    - 返回："将目标分解为可验证的逻辑命题..."
//
// 2. **Template** - 返回需要渲染的模板字符串
//    - 包含占位符，需要参数填充
//    - 例如：getGoalUnderstandingTemplate()
//    - 返回："分析目标 ${goal.content} 的核心概念..."
//
// 3. **Compute** - 执行系统计算或调用
//    - 不是返回文本，而是执行实际的计算操作
//    - 例如：computeRecalledEngrams(cues)
//    - 执行：调用 recall() 方法获取记忆

class ThinkingPattern {
  /**
   * 获取目标理解的模式化指导
   * 【Pattern方法】返回静态的指导文本，不需要参数渲染
   * 
   * 认知心理学基础：
   * - Goal Representation（目标表征）：如何理解和表征目标
   * - Framing Effect（框架效应）：不同视角产生不同理解
   * 
   * 示例差异：
   * - 推理模式："将目标分解为可验证的命题"
   * - 创造模式："探索目标的多种可能性和潜在含义"
   * - 批判模式："质疑目标的前提假设和隐含偏见"
   * 
   * @returns {string} 静态的目标理解指导
   */
  getGoalUnderstandingPattern() {
    throw new Error('ThinkingPattern.getGoalUnderstandingPattern() must be implemented');
  }

  /**
   * 获取激活扩散线索的模式化指导
   * 【Pattern方法】返回静态的线索激活指导
   * 
   * 认知心理学基础：
   * - Spread Activation（激活扩散）：概念激活沿语义网络传播
   * - Selective Attention（选择性注意）：不同模式关注不同信息
   * 
   * 示例差异：
   * - 推理模式："请识别因果关系线索，如'因为'、'所以'、'导致'"
   * - 发散模式："请寻找跨领域的联想，不限于直接相关的概念"
   * - 收敛模式："请聚焦于最核心、最本质的概念"
   * 
   * @returns {string} 静态的线索激活指导
   */
  getSpreadActivationPattern() {
    throw new Error('ThinkingPattern.getSpreadActivationPattern() must be implemented');
  }

  /**
   * 获取记忆使用的模式化指导
   * 【Pattern方法】返回静态的记忆使用指导
   * 
   * 认知心理学基础：
   * - Memory Utilization（记忆利用）：如何使用检索到的记忆
   * - Selective Processing（选择性加工）：关注记忆的不同方面
   * 
   * 示例差异：
   * - 推理模式："关注记忆中的逻辑关系和因果链条"
   * - 经验模式："寻找相似案例和实践经验"
   * - 系统模式："识别记忆中的结构和模式"
   * 
   * @returns {string} 静态的记忆使用指导
   */
  getMemoryUtilizationPattern() {
    throw new Error('ThinkingPattern.getMemoryUtilizationPattern() must be implemented');
  }

  /**
   * 获取前序思想参考的模式化指导
   * 【Pattern方法】返回静态的前序思想参考指导
   * 
   * 认知心理学基础：
   * - Continuity of Thought（思维连续性）：基于已有认知继续深化
   * - Context Effect（语境效应）：前序思想影响当前理解
   * 
   * 示例差异：
   * - 推理模式："基于前序结论继续推导下一步"
   * - 发散模式："从前序思想中寻找新的探索方向"
   * - 收敛模式："整合前序发现，聚焦核心要点"
   * 
   * @returns {string} 静态的前序思想参考指导
   */
  getPreviousThoughtReferencePattern() {
    throw new Error('ThinkingPattern.getPreviousThoughtReferencePattern() must be implemented');
  }

  /**
   * 获取洞察发现的模式化指导
   * 【Pattern方法】返回静态的洞察发现指导
   * 
   * 认知心理学基础：
   * - Insight Problem Solving（洞察问题解决）：突然的理解
   * - Pattern Recognition（模式识别）：发现隐藏的规律
   * 
   * 示例差异：
   * - 分析模式："请通过逻辑推导发现内在规律"
   * - 创造模式："请寻找意想不到的概念组合"
   * - 批判模式："请识别潜在的问题和矛盾"
   * 
   * @returns {string} 静态的洞察发现指导
   */
  getInsightDiscoveryPattern() {
    throw new Error('ThinkingPattern.getInsightDiscoveryPattern() must be implemented');
  }

  /**
   * 获取结论形成的模式化指导
   * 【Pattern方法】返回静态的结论形成指导
   * 
   * 认知心理学基础：
   * - Conclusion Drawing（得出结论）：综合信息形成判断
   * - Mental Representation（心理表征）：结论的认知形式
   * 
   * 示例差异：
   * - 叙事模式："请将发现组织成有因果关系的故事"
   * - 系统模式："请构建结构化的知识框架"
   * - 实践模式："请提出具体可行的行动建议"
   * 
   * @returns {string} 静态的结论形成指导
   */
  getConclusionFormationPattern() {
    throw new Error('ThinkingPattern.getConclusionFormationPattern() must be implemented');
  }

  /**
   * 获取置信度评估的模式化指导
   * 【Pattern方法】返回静态的置信度评估指导
   * 
   * 认知心理学基础：
   * - Metacognitive Monitoring（元认知监控）：评估自己的认知
   * - Confidence Judgment（置信判断）：对结论可靠性的评估
   * 
   * 示例差异：
   * - 推理模式："基于逻辑链的完整性和前提的可靠性评估"
   * - 直觉模式："基于整体感觉和经验匹配度评估"
   * - 经验模式："基于相似案例的成功率评估"
   * 
   * @returns {string} 静态的置信度评估指导
   */
  getConfidenceAssessmentPattern() {
    throw new Error('ThinkingPattern.getConfidenceAssessmentPattern() must be implemented');
  }

  /**
   * 获取思维模式的特征描述
   * 用于让 AI 理解当前模式的核心特点
   * 
   * 认知心理学基础：
   * - Strategy Awareness（策略意识）：理解所用策略的特点
   * - Cognitive Style（认知风格）：不同的信息处理偏好
   * 
   * @returns {string} 模式特征描述
   */
  getPatternCharacteristics() {
    throw new Error('ThinkingPattern.getPatternCharacteristics() must be implemented');
  }

  /**
   * 获取 Thought 结构的模式化指导
   * 【Pattern方法】返回静态的 Thought 构造指导
   * 
   * 认知心理学基础：
   * - Schema（图式）：组织信息的认知框架
   * - Mental Model（心智模型）：对系统运作的理解
   * 
   * @returns {string} 静态的 Thought 构造指导
   */
  getThoughtStructurePattern() {
    throw new Error('ThinkingPattern.getThoughtStructurePattern() must be implemented');
  }

  /**
   * 组装完整的思考指导
   * 【Pattern方法】整合所有模式化指导，形成完整的指导文本
   * 
   * 设计考虑：
   * - 阶段感知：根据 thought 的当前状态选择性生成
   * - 渐进引导：从线索激活到结论形成的完整流程
   * - 灵活组合：支持部分阶段的单独使用
   * 
   * @param {Thought} thought - 当前思想状态
   * @returns {string} 完整的下一步思考指导
   */
  getThinkingGuidancePattern(thought) {
    throw new Error('ThinkingPattern.getThinkingGuidancePattern() must be implemented');
  }

  // === Compute 方法：系统计算部分 ===
  // 这些方法执行实际的系统调用，而不是生成文本

  /**
   * 计算并格式化召回的记忆
   * 【Compute方法】将已召回的记忆格式化为可读的提示词
   * 
   * 注意：记忆检索已在 Cognition 层完成，这里只负责格式化显示
   * 
   * 格式化策略：
   * - 按强度分组：高强度（核心经验）、中强度（辅助经验）、低强度（背景信息）
   * - 显示关键信息：内容、Schema路径、强度值
   * - 语义鸿沟标注：区分私有经验与公共知识
   * 
   * @param {Array<Engram>} recalledEngrams - 已召回的记忆数组
   * @returns {string} 格式化的记忆显示文本
   */
  computeRecalledEngrams(recalledEngrams) {
    throw new Error('ThinkingPattern.computeRecalledEngrams() must be implemented');
  }

  /**
   * 计算思考状态
   * 【Compute方法】基于 thought 内容推断当前状态
   * 
   * 状态判断逻辑（系统自动执行）：
   * - 基于 iteration、confidence、engrams 数量等客观指标
   * - 评估内容完整性、逻辑一致性、目标达成度
   * 
   * @param {Thought} thought - 当前思想状态
   * @returns {string} 推断的状态（exploring/deepening/converging/completed/blocked/contradictory/exceeded）
   */
  computeThinkingState(thought) {
    throw new Error('ThinkingPattern.computeThinkingState() must be implemented');
  }

  /**
   * 计算迭代次数
   * 【Compute方法】基于前序思想计算当前迭代
   * 
   * @param {Thought} previousThought - 前序思想
   * @returns {number} 当前迭代次数
   */
  computeIteration(previousThought) {
    throw new Error('ThinkingPattern.computeIteration() must be implemented');
  }

  /**
   * 计算时间戳
   * 【Compute方法】获取当前时间戳
   * 
   * @returns {number} 当前时间戳
   */
  computeTimestamp() {
    throw new Error('ThinkingPattern.computeTimestamp() must be implemented');
  }
}

module.exports = { ThinkingPattern };