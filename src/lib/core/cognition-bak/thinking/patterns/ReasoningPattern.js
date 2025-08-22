// ReasoningPattern - 推理思维模式实现
// 基于因果推理、逻辑推导的思维模式
//
// === 设计原则 ===
// 1. 奥卡姆剃刀：最简洁的逻辑链，避免过度推理
// 2. 语义鸿沟：主动识别私有经验与公共知识的差异
// 3. 面向 AI：直接、明确的指令，避免含糊表达

const { BaseThinkingPattern } = require('./BaseThinkingPattern');

class ReasoningPattern extends BaseThinkingPattern {
  /**
   * 获取推理模式的特征描述
   * 【Pattern方法】返回静态的模式特征
   */
  getPatternCharacteristics() {
    return `推理思维模式特征（基于认知心理学双重加工理论）：

1. 推理类型体系（Types of Reasoning）
   - 演绎推理（Deductive）：从一般原理到具体结论，逻辑必然性
   - 归纳推理（Inductive）：从具体实例到一般规律，概率可能性
   - 溯因推理（Abductive）：寻找最佳解释，推断隐含原因
   - 类比推理（Analogical）：基于相似性进行知识迁移

2. 认知加工特征（Cognitive Processing）
   - 系统2主导：深度分析，逻辑验证，受控加工
   - 心理模型构建：建立问题的结构化表征
   - 工作记忆密集：保持多个前提和推理步骤
   - 元认知监控：持续评估推理的有效性

3. 因果推理机制（Causal Reasoning）
   - 因果链识别：追踪原因-结果的传递关系
   - 必要条件与充分条件区分
   - 反事实思考：如果X不发生，Y会怎样？
   - 多因一果与一因多果的分析

4. 推理质量保证（Quality Assurance）
   - 前提可靠性检验
   - 逻辑有效性验证
   - 结论必然性评估
   - 认知偏差识别与纠正`;
  }

  /**
   * 获取目标理解的模式化指导
   * 【Pattern方法】返回静态的目标理解指导
   */
  getGoalUnderstandingPattern() {
    return `基于认知心理学的目标理解框架：

1. 目标表征分析（Goal Representation）
   - 识别目标类型：声明性目标（了解/知道）vs 程序性目标（如何/方法）
   - 明确期望状态：从当前状态到目标状态的差距是什么？
   - 提取核心概念：目标中的关键实体、关系和约束

2. 目标层级解构（Goal Hierarchy）
   - 上位目标：这个目标服务于什么更高层的目的？
   - 当前目标：具体要解决的核心问题是什么？
   - 子目标链：需要哪些中间步骤才能达成？

3. 推理问题框架（Problem Space）
   - 初始条件：已知的事实和前提是什么？
   - 目标条件：需要证明或达到什么结论？
   - 推理路径：可能的逻辑推导方向有哪些？
   - 约束条件：有哪些限制或边界条件？

4. 语义鸿沟识别
   - 检查目标中是否包含私有经验相关的概念
   - 识别需要从记忆中检索的特定知识
   - 标注哪些是通用推理，哪些需要特定经验

注意：若目标来自前序思想，保持推理的连续性和一致性`;
  }

  /**
   * 获取激活扩散线索的模式化指导
   * 【Pattern方法】返回静态的线索激活指导
   */
  getSpreadActivationPattern() {
    return `基于认知心理学激活扩散理论（Collins & Loftus, 1975）生成检索线索：

1. 语义网络激活（Semantic Network Activation）
   - 核心概念识别：从goalEngram中提取中心节点
   - 语义关联扩散：激活语义相关的邻近概念
   - 类别层级激活：向上激活上位概念，向下激活具体实例
   - 特征属性激活：激活概念的关键属性和特征

2. 推理关系激活（Reasoning Relations）
   - 因果关系：原因→结果、前因→后果、条件→推论
   - 逻辑关系：前提→结论、证据→假设、规则→应用
   - 条件关系：如果→那么、必要条件、充分条件
   - 对比关系：相似→差异、正例→反例、规律→例外

3. 认知标记激活（Cognitive Markers）
   - 推理标记词：因为、所以、因此、由于、导致
   - 逻辑连接词：并且、或者、但是、然而、除非
   - 条件标记词：如果、假设、前提、条件、要求
   - 规律标记词：原理、定律、规则、模式、法则

4. 激活强度调控（Activation Strength）
   - 高激活：与目标直接相关的因果概念
   - 中激活：逻辑推理路径上的中间概念
   - 低激活：可能相关的背景知识
   - 抑制激活：避免无关概念的干扰

注意：优先激活与推理目标最相关的概念，避免过度扩散`;
  }

  /**
   * 获取记忆使用的模式化指导
   * 【Pattern方法】返回静态的记忆使用指导
   */
  getMemoryUtilizationPattern() {
    return `基于认知心理学记忆提取理论（Tulving & Thomson, 1973）使用回忆的记忆：

1. 编码特异性原则（Encoding Specificity）
   - 匹配编码环境：记忆在什么情境下形成的？
   - 提取线索匹配：当前线索与记忆编码时的线索是否一致？
   - 语境依赖提取：利用相似的认知状态促进记忆提取
   - 状态依赖效应：当前推理状态与记忆形成时的状态关联

2. 记忆类型区分（Memory Systems - Squire, 1987）
   - 陈述性记忆：提取事实、概念、规则（"是什么"）
   - 程序性记忆：提取方法、步骤、策略（"怎么做"）
   - 情景记忆：提取具体案例、经验、实例
   - 语义记忆：提取抽象知识、原理、定律

3. 推理相关性筛选（Relevance Filtering）
   - 因果链提取：识别记忆中的原因-结果关系
   - 逻辑前提识别：哪些记忆可作为推理的前提条件？
   - 规律模式发现：从多个记忆中归纳共同规律
   - 反例证据收集：寻找可能推翻假设的记忆

4. 语义鸿沟处理（Semantic Gap Management）
   - 高强度记忆（>0.8）：核心经验，优先使用
   - 中强度记忆（0.5-0.8）：辅助经验，选择性使用
   - 私有经验标注：明确哪些是个人特定经验
   - 知识融合策略：将私有经验与公共知识结合

注意：奥卡姆剃刀原则 - 只提取与当前推理目标直接相关的记忆`;
  }

  /**
   * 获取前序思想参考的模式化指导
   * 【Pattern方法】返回静态的前序思想参考指导
   */
  getPreviousThoughtReferencePattern() {
    return `基于认知心理学思维链理论（Thought Chain - Newell & Simon, 1972）参考前序思想：

1. 认知连续性原则（Cognitive Continuity）
   - 状态转移：前序思想的结论成为当前思考的起点
   - 上下文保持：维持推理的语境和假设前提
   - 目标一致性：确保与原始目标的逻辑连贯
   - 路径记录：保留推理路径避免重复探索

2. 推理深化策略（Reasoning Deepening）
   - 垂直深化：在前序结论基础上进一步推导
   - 水平扩展：探索前序结论的其他推理分支
   - 抽象提升：从具体结论归纳更一般的原理
   - 具体应用：将抽象结论应用到具体案例

3. 逻辑一致性检验（Logical Consistency Check）
   - 前提一致性：新推理不能与前序前提矛盾
   - 结论兼容性：新结论需与前序结论逻辑兼容
   - 推理链完整性：检查是否有逻辑跳跃或缺失
   - 循环论证检测：避免A→B→C→A的循环推理

4. 认知负荷管理（Cognitive Load Management）
   - 工作记忆优化：只保留关键的前序信息
   - 推理步骤简化：避免过长的推理链
   - 中间结果固化：将可靠结论作为新的事实
   - 认知资源分配：聚焦最有价值的推理方向

注意：每次迭代都应该产生新的洞察，而不是简单重复`;
  }

  /**
   * 获取洞察发现的模式化指导
   * 【Pattern方法】返回静态的洞察发现指导
   */
  getInsightDiscoveryPattern() {
    return `基于认知心理学洞察问题解决理论（Insight Problem Solving - Sternberg & Davidson, 1995）：

1. 洞察产生机制（Insight Generation Mechanisms）
   - 选择性编码：识别问题中的关键信息，忽略无关细节
   - 选择性比较：将新信息与已有知识进行创造性连接
   - 选择性组合：重新组织信息产生新的认知结构
   - 突破定势：打破思维定势，从新角度审视问题

2. 推理驱动的洞察类型（Reasoning-Driven Insights）
   - 演绎洞察：从一般原理推导出意外但必然的结论
   - 归纳洞察：从特殊案例中发现隐藏的普遍规律
   - 溯因洞察：发现最佳解释背后的深层原因
   - 类比洞察：通过跨域映射发现结构相似性

3. 洞察质量标准（Insight Quality Criteria）
   - 新颖性：不是显而易见的，具有认知突破
   - 有效性：逻辑严密，可以被验证
   - 解释力：能够解释多个现象或解决多个问题
   - 启发性：引发新的思考方向和推理路径

4. 洞察验证过程（Insight Verification）
   - 逻辑推导验证：每个洞察都有清晰的推理路径
   - 一致性检验：与已知事实和理论不矛盾
   - 预测性验证：能否产生可检验的预测？
   - 实用性评估：对解决当前问题的贡献度

注意：真正的洞察是"啊哈！"时刻 - 突然理解了之前未察觉的深层联系`;
  }

  /**
   * 获取结论形成的模式化指导
   * 【Pattern方法】返回静态的结论形成指导
   */
  getConclusionFormationPattern() {
    return `基于认知心理学判断与决策理论（Judgment and Decision Making - Kahneman & Tversky, 1979）：

1. 结论综合机制（Conclusion Synthesis）
   - 证据整合：汇聚所有支持性和反对性证据
   - 权重分配：根据证据可靠性分配不同权重
   - 逻辑闭合：确保从前提到结论的推理完整
   - 不确定性量化：明确指出结论的确定性程度

2. 推理结论类型（Types of Reasoning Conclusions）
   - 必然性结论：基于演绎推理的逻辑必然结果
   - 概率性结论：基于归纳推理的可能性判断
   - 最佳解释结论：基于溯因推理的合理推断
   - 条件性结论：在特定前提下成立的结论

3. 结论质量保证（Conclusion Quality Assurance）
   - 内部一致性：结论各部分之间逻辑协调
   - 外部有效性：与已知事实和理论相符
   - 适用边界明确：清楚说明结论的适用条件
   - 可操作性：结论能够指导实际行动

4. 语义鸿沟标注（Semantic Gap Annotation）
   - 经验基础标注：[基于个人经验] vs [基于普遍原理]
   - 确定性层级：[高度确定] vs [合理推测] vs [初步假设]
   - 知识来源区分：[私有记忆] vs [公共知识] vs [推理所得]
   - 泛化能力评估：[特定情境] vs [一般规律]

5. 元认知反思（Metacognitive Reflection）
   - 推理过程评估：推理链是否存在薄弱环节？
   - 认知偏差检查：是否受到确认偏差等影响？
   - 替代解释考虑：是否存在其他合理解释？
   - 结论稳健性：改变某个前提，结论是否仍然成立？

注意：好的结论应该是简洁、准确、可验证和有指导意义的`;
  }

  /**
   * 获取置信度评估的模式化指导
   * 【Pattern方法】返回静态的置信度评估指导
   */
  getConfidenceAssessmentPattern() {
    return `基于认知心理学元认知理论（Metacognition - Flavell, 1979）评估推理置信度：

1. 置信度评估维度（Confidence Assessment Dimensions）
   - 逻辑强度：推理链的逻辑必然性程度
   - 证据质量：支持证据的可靠性和充分性
   - 知识确定性：使用知识的确定程度
   - 推理复杂度：推理步骤越多，不确定性越高

2. 推理特定的置信度标准（Reasoning-Specific Confidence Criteria）
   
   【1.0 - 逻辑必然】
   - 纯演绎推理，前提真则结论必真
   - 数学证明或逻辑恒真式
   - 无需经验验证的分析判断
   
   【0.8-0.9 - 高度可信】
   - 强归纳推理，大量一致证据支持
   - 多重独立推理路径得出相同结论
   - 理论与经验高度吻合
   
   【0.6-0.7 - 合理推断】
   - 基于部分证据的合理推理
   - 存在少数反例但主体成立
   - 需要额外假设但假设合理
   
   【0.4-0.5 - 初步假设】
   - 基于有限信息的推测
   - 多种可能解释并存
   - 需要进一步验证
   
   【0.2-0.3 - 弱推理】
   - 证据不足，推理链存在跳跃
   - 主要基于类比或直觉
   - 存在明显的替代解释

3. 元认知监控要点（Metacognitive Monitoring）
   - 推理过程监控：是否存在逻辑漏洞？
   - 知识可靠性评估：使用的知识有多可靠？
   - 偏差意识：是否受到认知偏差影响？
   - 不确定性来源：不确定性主要来自哪里？

4. 置信度调整因素（Confidence Adjustment Factors）
   - 语义鸿沟影响：依赖私有经验时降低置信度
   - 推理链长度：每增加一个推理步骤，轻微降低
   - 反例存在：发现反例时显著降低
   - 多源验证：多个独立来源支持时提高

注意：置信度应反映推理的认知不确定性，而非情感确定性`;
  }

  /**
   * 获取 Thought 结构的模式化指导
   * 【Pattern方法】返回静态的 Thought 构造指导
   */
  getThoughtStructurePattern() {
    return `构造推理型 Thought 对象：
{
  goalEngram: { 
    content: "待推理的问题",
    schema: "问题领域\\n  具体问题\\n    推理目标"
  },
  thinkingPattern: "reasoning",
  spreadActivationCues: ["因果词", "逻辑词", "推理要素"],
  insightEngrams: [
    {
      content: "推理发现：因为X所以Y",
      schema: "推理类型\\n  具体推导\\n    逻辑关系"
    }
  ],
  conclusionEngram: {
    content: "推理结论：基于ABC推导出D",
    schema: "结论类型\\n  逻辑链条\\n    最终判断"
  },
  confidence: 0.85 // 基于逻辑严密性
}`;
  }

  /**
   * 组装完整的思考指导
   * 【Pattern方法】整合所有模式化指导
   */
  getThinkingGuidancePattern(thought) {
    const parts = [];
    
    // 1. 模式特征
    parts.push(`## 思维模式：推理 (Reasoning)\n`);
    parts.push(this.getPatternCharacteristics());
    
    // 2. 构造指导（面向 AI）
    parts.push('\n## Thought 对象构造示例');
    parts.push(this.getThoughtStructurePattern());
    
    // 3. 阶段性指导
    parts.push('\n## 推理步骤指导\n');
    
    // 目标理解
    parts.push('### 步骤1：理解推理目标');
    parts.push(this.getGoalUnderstandingPattern());
    
    // 线索激活
    if (!thought.getSpreadActivationCues() || thought.getSpreadActivationCues().length === 0) {
      parts.push('\n### 步骤2：激活推理线索');
      parts.push(this.getSpreadActivationPattern());
    }
    
    // 记忆使用
    if (thought.getRecalledEngrams() && thought.getRecalledEngrams().length > 0) {
      parts.push('\n### 步骤3：分析相关记忆');
      // 先显示实际召回的记忆
      parts.push(this.computeRecalledEngrams(thought.getRecalledEngrams()));
      // 再显示记忆使用指导
      parts.push('\n' + this.getMemoryUtilizationPattern());
    }
    
    // 前序参考
    if (thought.getPreviousThought()) {
      parts.push('\n### 步骤4：参考前序推理');
      parts.push(this.getPreviousThoughtReferencePattern());
    }
    
    // 洞察发现
    if (!thought.getInsightEngrams() || thought.getInsightEngrams().length === 0) {
      parts.push('\n### 步骤5：推导逻辑洞察');
      parts.push(this.getInsightDiscoveryPattern());
    }
    
    // 结论形成
    if (!thought.getConclusionEngram()) {
      parts.push('\n### 步骤6：形成推理结论');
      parts.push(this.getConclusionFormationPattern());
    }
    
    // 置信评估
    if (thought.getConclusionEngram() && !thought.getConfidence()) {
      parts.push('\n### 步骤7：评估推理置信度');
      parts.push(this.getConfidenceAssessmentPattern());
    }
    
    // 语义鸿沟提醒
    parts.push('\n## 语义鸿沟提醒');
    parts.push('- 区分私有经验推理（基于 remember 的记忆）与公共知识推理（基于预训练）');
    parts.push('- 标注推理依据的来源和可靠性');
    parts.push('- 明确推理的适用范围和局限性');
    
    return parts.filter(p => p).join('\n'); // 奥卡姆剃刀：过滤空内容
  }
}

module.exports = { ReasoningPattern };