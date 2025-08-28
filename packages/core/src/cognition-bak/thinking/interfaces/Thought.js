// Thought Interface - 思想/念头接口
// 认知心理学基础：Mental Representation（心理表征）
//
// === 认知心理学概念对齐 ===
//
// 1. 心理表征（Mental Representation）
//    - 思想是信息在认知系统中的表征形式
//    - 包含概念、关系、模式等多层次信息
//    - 既有内容（what）也有结构（how）
//
// 2. 思维产物特征（Thought as Cognitive Product）
//    - 内容性：思考得出的结论或洞察
//    - 过程性：思考的路径和激活序列
//    - 关联性：与其他概念的连接网络
//    - 元认知：对思考过程的认识
//
// 3. 工作记忆痕迹（Working Memory Traces）
//    - 思想保留了工作记忆中的激活痕迹
//    - 记录了从起始线索到最终理解的路径
//    - 包含激活强度和时序信息
//
// 4. 思考基于记忆（Thinking Based on Memory）
//    - 认知心理学核心原理：所有思考都建立在已有记忆之上
//    - 思考不是凭空创造，而是记忆的激活、重组和转化
//    - 这就是为什么 Thought 使用 Engram（记忆单元）而非简单的 content
//    - Engram 包含了记忆的完整认知结构：内容、Schema、强度、关联
//    - 新的思考结果（如 conclusionEngram）也会成为未来的记忆基础
//
// 5. 三层记忆架构与语义鸿沟（Three-Layer Memory Architecture）
//    === 记忆的三个层次 ===
//    - **经验（Experience）**：AI在运行时积累的私有记忆，个性化、情境化
//    - **知识（Knowledge）**：大模型预训练的公共知识，通用化、标准化
//    - **学习（Learning）**：实时获取的新信息，需要整合到经验或知识中
//    
//    === 语义鸿沟（Semantic Gap）===
//    三层之间存在认知差距，需要主动桥接：
//    - 经验与知识的鸿沟：个人理解 vs 公共认知
//    - 知识与学习的鸿沟：已有框架 vs 新兴信息
//    - 经验与学习的鸿沟：过往经历 vs 当前情境
//    
//    这种语义鸿沟是 recall 和 remember 的核心驱动力
//
// === 设计原则 ===
//
// 1. 完整性：包含思考的结果和过程
// 2. 可追溯：能够重现思考路径
// 3. 层次性：反映概念的层次关系
// 4. 时间性：保留思考的时序信息
// 5. 记忆性：所有组件都是 Engram，体现思考的记忆本质

/**
 * Thought Interface - 思想接口规范
 * 
 * 定义思想对象必须具备的访问方法
 * 基于认知心理学的自动加工和受控加工理论
 * 
 * === 字段分类表 ===
 * 
 * | 字段名                  | 分类        | 说明                                    | 生成时机           | 模式敏感性         |
 * |------------------------|------------|---------------------------------------|------------------|--------------------|
 * | goalEngram             | AI创建     | 思考目标，从用户输入中提取                | 首次思考时必须      | 模式无关（不变）    |
 * | thinkingPattern        | AI创建     | 选择的思维模式，AI基于目标主动选择         | 首次思考时必须      | 模式本身（定义模式） |
 * | spreadActivationCues   | AI创建     | 激活的检索线索，AI主动选择               | 首次思考时必须      | 模式敏感（变化）    |
 * | insightEngrams         | AI创建     | 产生的洞察和发现                        | 思考过程中生成      | 模式敏感（变化）    |
 * | conclusionEngram       | AI创建     | 思考得出的结论                          | 思考结束时生成      | 模式敏感（变化）    |
 * | confidence             | AI创建     | 对结论的置信度评估                       | 思考结束时评估      | 模式相关（标准不同） |
 * |------------------------|------------|---------------------------------------|------------------|--------------------|
 * | recalledEngrams        | 系统自动   | 基于cues召回的记忆                      | recall()后自动填充  | 间接敏感（依赖cues）|
 * | previousThought        | 系统自动   | 前序思想引用                            | 系统自动维护        | 模式无关（不变）    |
 * | iteration              | 系统自动   | 迭代次数                                | 系统自动递增        | 模式无关（不变）    |
 * | timestamp              | 系统自动   | 创建时间戳                              | 系统自动记录        | 模式无关（不变）    |
 * | thinkingState          | 系统自动   | 思考状态推断                            | 系统基于内容推断    | 模式无关（不变）    |
 * 
 * === 模式敏感性的认知心理学基础 ===
 * 
 * **模式无关字段**（认知不变量 Cognitive Invariants）：
 * - goalEngram：目标表征在不同思维模式下保持稳定（Goal Constancy）
 * - previousThought：工作记忆的连续性不受思维模式影响（Memory Continuity）
 * - iteration/timestamp：时间序列信息是客观的认知标记（Temporal Markers）
 * 
 * **模式敏感字段**（认知变量 Cognitive Variables）：
 * - spreadActivationCues：不同思维模式激活不同的语义路径（Selective Activation）
 *   · 推理模式：激活因果关系线索
 *   · 发散模式：激活远距离联想
 *   · 收敛模式：激活核心概念
 * 
 * - insightEngrams：洞察的类型和深度随模式变化（Insight Variability）
 *   · 分析模式：逻辑推导的洞察
 *   · 创造模式：跨域组合的洞察
 *   · 批判模式：问题识别的洞察
 * 
 * - conclusionEngram：结论的形式和内容受模式影响（Conclusion Framing）
 *   · 叙事模式：故事化的结论
 *   · 系统模式：结构化的结论
 *   · 实践模式：行动导向的结论
 * 
 * **模式相关字段**（认知元变量 Cognitive Meta-variables）：
 * - confidence：不同模式有不同的置信度评估标准（Confidence Criteria）
 *   · 推理模式：逻辑严密性决定置信度
 *   · 直觉模式：整体感觉决定置信度
 *   · 经验模式：相似案例决定置信度
 * 
 * - templateUsed：直接记录使用的思维模式（Mode Indicator）
 * 
 * **间接敏感字段**（认知派生量 Cognitive Derivatives）：
 * - recalledEngrams：虽由系统执行，但依赖于模式敏感的cues（Derived Sensitivity）
 * 
 * === 认知过程分类 ===
 * - 受控加工（AI主动创建）：需要意识参与和主动选择的字段
 * - 自动加工（系统自动）：无需AI干预，系统自动处理的字段
 * 
 * === 启动时必须的字段 ===
 * 首次调用 think() 时，AI必须提供：
 * 1. goalEngram - 明确的思考目标
 * 2. thinkingPattern - 选择的思维模式（如 'reasoning', 'creative', 'critical' 等）
 * 3. spreadActivationCues - 基于目标和模式激活的检索线索
 * 
 * 后续迭代时，这些信息会从 previousThought 中继承和演化
 */
class Thought {
  // === 目标导向字段 ===
  // 认知心理学：Goal-Directed Behavior - 目标既是起点也是方向

  /**
   * 获取目标记忆
   * 【目标导向】整个思考的起点和导向，体现认知状态机的初始状态
   * 
   * === 为什么是 Engram 而不是简单的 content ===
   * 
   * 认知心理学核心原理：思考基于记忆（Thinking Based on Memory）
   * - 所有思考都是对已有记忆的激活、重组和转化
   * - 即使是"新"想法，也是基于已有记忆元素的新组合
   * - 思考不能凭空产生，必须有记忆作为基础
   * 
   * Engram 的完整性：
   * - content：记忆的内容（what）
   * - schema：记忆的结构和关系（how）
   * - strength：记忆的强度和重要性（weight）
   * - type：记忆的类型（declarative/procedural）
   * 
   * 使用 Engram 的价值：
   * 1. 保持认知的完整性 - 不仅知道"是什么"，还知道"如何关联"
   * 2. 支持激活扩散 - Schema 提供了扩散的路径
   * 3. 实现思维链 - conclusionEngram 可以直接作为下一个 goalEngram
   * 4. 统一认知模型 - 输入和输出都是同类型，形成闭环
   * 
   * === 认知心理学基础 ===
   * 
   * - 目标导向行为（Goal-Directed Behavior）：思考是为了达到某个目标状态
   * - 目标即记忆：目标本身就是一个Engram，可以是声明性或程序性的
   * - 状态机起点：goalEngram是认知状态机的初始状态
   * 
   * goalEngram的类型：
   * 1. 声明性目标："我想了解咖啡对健康的影响"（明确的知识获取）
   * 2. 程序性目标："探索咖啡文化"（开放式的探索过程）
   * 3. 元认知目标："评估我对咖啡的理解"（对认知的认知）
   * 
   * @returns {Engram} 目标记忆
   */
  getGoalEngram() {
    throw new Error('Thought.getGoalEngram() must be implemented');
  }

  // === 系统自动加工字段 ===
  // 认知心理学：Automatic Processing - 无需意识控制的认知过程


  /**
   * 获取前序思想
   * 【自动加工】工作记忆中的上下文，自动保持激活状态
   * 
   * 核心作用：构建思维链（Chain of Thought）
   * - 每个Thought通过previousThought链接，形成完整的思考历史
   * - 类似区块链，每个思想都记录了前一个思想的引用
   * 
   * 思维链示例：
   * ```
   * thought1: "咖啡" → previousThought: null
   *    ↓
   * thought2: "早餐" → previousThought: thought1
   *    ↓
   * thought3: "健康" → previousThought: thought2
   * ```
   * 
   * 主要用途：
   * 1. 思考连贯性：基于已有认知继续深化，而非重新开始
   * 2. 避免循环：知道哪些已经思考过，避免陷入循环
   * 3. 路径回溯：可以追溯整个思考过程如何演进
   * 4. 认知状态：包含已激活的概念、识别的模式、产生的洞察
   * 
   * 认知心理学基础：
   * - 工作记忆（Working Memory）：保持最近的认知状态活跃
   * - 语境效应（Context Effect）：前序思想影响当前理解
   * - 启动效应（Priming）：已激活概念更容易被再次激活
   * 
   * @returns {Thought|null} 前序思想，首次思考时为null
   */
  getPreviousThought() {
    throw new Error('Thought.getPreviousThought() must be implemented');
  }

  /**
   * 获取回忆的记忆
   * 【自动加工】从记忆系统中回忆起的相关记忆
   * 
   * 核心优势：避免图遍历，直接获得丰富信息
   * - 传统方式：从Cue开始遍历语义网络，逐步扩散
   * - 优化方式：直接通过recall获取所有相关Engrams
   * 
   * === 三层记忆的整合 ===
   * 
   * recalledEngrams 可能包含三种类型的记忆：
   * 
   * 1. **经验记忆（私有）**
   *    - 来源：AI运行时通过 remember 存储的记忆
   *    - 特征：个性化、情境化、与特定角色绑定
   *    - 示例："用户喜欢在早晨喝黑咖啡"（strength: 0.9）
   * 
   * 2. **知识激活（公有）**
   *    - 来源：大模型预训练知识被激活
   *    - 特征：通用化、标准化、科学共识
   *    - 示例："咖啡含有咖啡因"（来自LLM内置知识）
   * 
   * 3. **学习整合（新增）**
   *    - 来源：通过 learn 或实时获取的新信息
   *    - 特征：最新的、待验证的、需要整合的
   *    - 示例："最新研究表明咖啡可以..."（刚学习的）
   * 
   * === 语义鸿沟的桥接 ===
   * 
   * recall 的核心价值在于主动识别和桥接语义鸿沟：
   * - 当私有经验与公共知识冲突时，需要协调
   * - 当新学习与已有认知不符时，需要整合
   * - 当不同层次的记忆相关时，需要连接
   * 
   * 这就是为什么 recall 是"强制触发"的 - 
   * 它不仅是检索，更是主动发现和弥合认知差距的过程。
   * 
   * @returns {Array<Engram>} 自动检索的记忆集合，包含完整的记忆信息
   */
  getRecalledEngrams() {
    throw new Error('Thought.getRecalledEngrams() must be implemented');
  }

  /**
   * 获取迭代次数
   * 【自动加工】系统自动跟踪的思考深度
   * 
   * @returns {number} 当前迭代次数
   */
  getIteration() {
    throw new Error('Thought.getIteration() must be implemented');
  }

  /**
   * 获取时间戳
   * 【自动加工】系统自动记录的创建时间
   * 
   * @returns {number} 创建时间戳
   */
  getTimestamp() {
    throw new Error('Thought.getTimestamp() must be implemented');
  }

  /**
   * 获取思考状态
   * 【自动加工】系统基于思考内容自动推断的状态
   * 
   * 认知心理学基础：执行控制（Executive Control）
   * - 人类的前额叶皮层自动监控认知过程状态
   * - 不是意识主动判断，而是基于多重信号的综合评估
   * - 状态推断是元认知监控的重要功能
   * 
   * 状态推断逻辑（系统自动执行）：
   * 1. 基于客观指标：iteration、confidence、engrams数量等
   * 2. 综合多个维度：内容完整性、逻辑一致性、目标达成度
   * 3. 动态更新：每次 think 调用后重新评估
   * 
   * 状态的作用：
   * - **流程控制**：决定是否继续或终止思考
   * - **资源管理**：评估认知负荷，优化资源分配
   * - **质量保证**：确保思考达到期望的深度和质量
   * - **用户反馈**：让用户了解AI的思考进展
   * 
   * 可能的状态值：
   * - 'exploring'：探索阶段，激活扩散，收集信息
   * - 'deepening'：深化阶段，识别模式，产生洞察
   * - 'converging'：收敛阶段，形成结论，评估质量
   * - 'completed'：完成状态，高质量结论，可以终止
   * - 'blocked'：受阻状态，缺少信息，需要输入
   * - 'contradictory'：矛盾状态，发现冲突，需要调解
   * - 'exceeded'：超限状态，资源耗尽，强制终止
   * 
   * @returns {string} 当前思考状态（见 ThinkingState 枚举）
   */
  getThinkingState() {
    throw new Error('Thought.getThinkingState() must be implemented');
  }

  // === AI受控加工字段 ===
  // 认知心理学：Controlled Processing - 需要意识控制和主动选择的认知过程
  // 注意：Thought只是Engrams的容器，不包含中间分析结果（如selectedEngrams、recognizedSchemas）

  /**
   * 获取思维模式
   * 【受控加工】AI基于目标性质主动选择的认知策略
   * 
   * === 认知心理学基础：思维模式选择（Pattern Selection） ===
   * 
   * 元认知决策的核心体现：
   * - 识别问题类型，选择合适的思维方式
   * - 不同模式激活不同的认知资源和路径
   * - 影响整个思考过程的方向和特征
   * 
   * === 为什么是 AI 创建而非系统指定 ===
   * 
   * 1. **问题适配性**
   *    AI 需要基于 goalEngram 的性质判断：
   *    - "为什么天空是蓝色的" → reasoning（推理）
   *    - "设计一个新产品" → creative（创造）
   *    - "评估这个方案" → critical（批判）
   *    - "讲一个故事" → narrative（叙事）
   * 
   * 2. **认知灵活性**
   *    - 同一个目标可能需要多种模式组合
   *    - AI 可以基于初步探索调整模式
   *    - 体现了人类思维的适应性
   * 
   * 3. **个性化倾向**
   *    - 不同角色可能偏好不同的思维模式
   *    - 工程师倾向于 systematic（系统化）
   *    - 艺术家倾向于 creative（创造性）
   *    - 但都能根据需要切换模式
   * 
   * === 常见思维模式 ===
   * 
   * - **reasoning**：逻辑推理，因果分析，演绎归纳
   * - **creative**：发散思维，跨域联想，新颖组合
   * - **critical**：批判分析，问题识别，质疑验证
   * - **systematic**：系统思考，结构分析，整体把握
   * - **narrative**：故事思维，时序组织，情节构建
   * - **intuitive**：直觉判断，整体感知，快速决策
   * - **analytical**：分解分析，细节考察，精确计算
   * - **experiential**：经验导向，案例类比，实践智慧
   * 
   * @returns {string} 选择的思维模式标识符
   */
  getThinkingPattern() {
    throw new Error('Thought.getThinkingPattern() must be implemented');
  }

  /**
   * 获取激活扩散的线索
   * 【受控加工】AI主动选择的检索线索
   * 
   * === 认知心理学基础：Spread Activation（激活扩散） ===
   * 
   * 激活扩散是认知网络中概念激活传播的核心机制。
   * 当一个概念被激活时，激活会沿着语义网络扩散到相关概念。
   * 
   * === 为什么必须独立存储 spreadActivationCues ===
   * 
   * 1. **认知的个性化本质**
   *    同一个 goalEngram 在不同角色/个体中会激活不同的线索
   *    例如 goalEngram: "理解咖啡文化"
   *    - 工程师扩散：["咖啡因", "算法", "效率", "熬夜"]
   *    - 艺术家扩散：["氛围", "灵感", "咖啡馆", "创作"]
   *    - 商人扩散：["星巴克", "成本", "市场", "连锁"]
   * 
   * 2. **思维模式的影响**
   *    不同的思维模式产生不同的激活扩散路径：
   *    - 推理模式：倾向于因果关系的线索
   *    - 发散模式：倾向于跨领域的联想
   *    - 收敛模式：倾向于核心概念的聚焦
   *    - 创造模式：倾向于新颖组合的探索
   * 
   * 3. **语义网络的体现**
   *    spreadActivationCues 反映了个人独特的语义网络结构：
   *    - 哪些概念联系更紧密（高强度连接）
   *    - 哪些路径更常被激活（使用偏好）
   *    - 哪些领域更为熟悉（知识分布）
   *    - 哪些联想更具创造性（认知灵活性）
   * 
   * === 设计的核心价值 ===
   * 
   * 这个设计实现了"同样的输入，不同的思考路径"：
   * goalEngram → AI基于个性选择cues → recall基于cues检索 → 形成独特思考路径
   * 
   * 而不是：
   * goalEngram → 固定的检索模式 → 千篇一律的结果
   * 
   * 这正是让每个AI角色都有自己独特思考方式的关键，
   * 不仅仅是知识的差异，更是认知过程的差异。
   * 
   * @returns {Array<string>} 激活的检索线索
   */
  getSpreadActivationCues() {
    throw new Error('Thought.getSpreadActivationCues() must be implemented');
  }

  /**
   * 获取结论
   * 【受控加工】思考得出的最终结论
   * 
   * 结论（Conclusion）的认知意义：
   * - 状态机终点：整个思考过程达到的最终认知状态
   * - 新的记忆：可以被存储并在未来被检索
   * - 目标达成：对goalEngram的回应和实现
   * - 循环起点：可以作为下一轮思考的goalEngram
   * 
   * 结论与目标的关系：
   * - 问答关系：goal提问，conclusion回答
   * - 转化关系：goal是原始状态，conclusion是转化后状态
   * - 深化关系：goal是表层理解，conclusion是深层理解
   * 
   * @returns {Engram} 思考的结论
   */
  getConclusionEngram() {
    throw new Error('Thought.getConclusionEngram() must be implemented');
  }

  /**
   * 获取洞察记忆
   * 【受控加工】思考过程中产生的新理解和发现
   * 
   * 洞察（Insights）的组成：
   * 1. 突破性理解：超越已有信息的新认识
   * 2. 模式发现：识别隐藏的关系和规律
   * 3. 概念重组：将已知概念以新方式组合
   * 4. 问题重构：从新角度理解问题本质
   * 
   * @returns {Array<Engram>} 思考产生的洞察和发现
   */
  getInsightEngrams() {
    throw new Error('Thought.getInsightEngrams() must be implemented');
  }

  /**
   * 获取最终思考内容
   * 【受控加工】为了兼容性保留，从finalEngram中提取content
   * 
   * 最终内容（Final Content）的认知意义：
   * - 思维产品：整个思考过程的结晶
   * - 知识整合：将碎片信息组织成连贯理解
   * - 交流载体：可以传递给他人的思想表达
   * - 行动基础：指导决策和行动的结论
   * 
   * 内容综合的认知过程：
   * 1. 信息整合
   *    - 综合所有识别的Schema
   *    - 整合产生的洞察
   *    - 考虑前序思想的影响
   * 
   * 2. 结构组织
   *    - 建立逻辑框架
   *    - 安排信息层次
   *    - 确保内容连贯
   * 
   * 3. 表达优化
   *    - 选择恰当的表达方式
   *    - 平衡深度与可理解性
   *    - 突出关键要点
   * 
   * 不同思维模式的内容特征：
   * - 推理模式：逻辑严密的论证过程
   * - 发散模式：丰富多样的可能性探索
   * - 收敛模式：聚焦核心的精炼总结
   * - 叙事模式：有时序和因果的故事线
   * 
   * 高质量内容的标准：
   * - 完整性：涵盖思考的主要发现
   * - 深度性：提供有价值的理解
   * - 清晰性：结构清楚，易于理解
   * - 实用性：能指导后续思考或行动
   * 
   * 实现考虑：
   * ```javascript
   * // 内容组织模板
   * const contentTemplate = `
   *   基于 [起始线索]，我的思考过程：
   *   
   *   1. 关键发现：
   *      - [从Schema中提取的核心模式]
   *   
   *   2. 主要洞察：
   *      - [产生的深刻理解]
   *   
   *   3. 结论：
   *      - [综合性的认识]
   *   
   *   4. 下一步思考方向：
   *      - [生成的新线索]
   * `;
   * ```
   * 
   * @returns {string} 综合性的思考结论
   */

  // === 元认知信息 ===
  // 认知心理学：Metacognition - 对思考过程本身的认知

  /**
   * 获取置信度
   * 【元认知】AI对思考结果质量的元认知判断
   * 
   * 置信度的认知含义：
   * - 质量评估：对思考结果可靠性的判断
   * - 不确定性量化：识别思考中的薄弱环节
   * - 决策支持：帮助决定是否需要继续思考
   * - 风险管理：标识需要谨慎对待的结论
   * 
   * 影响置信度的因素：
   * 1. 信息充分性
   *    - 检索到的记忆是否足够
   *    - Schema覆盖是否全面
   * 
   * 2. 逻辑一致性
   *    - 识别的模式是否相互支持
   *    - 洞察之间是否存在矛盾
   * 
   * 3. 思考深度
   *    - 是否达到问题的核心
   *    - 是否只停留在表面
   * 
   * 4. 模式匹配度
   *    - 使用的思维模式是否适合问题
   *    - 是否需要切换到其他模式
   * 
   * 置信度级别解释：
   * - 0.9-1.0：高度确信，结论可靠
   * - 0.7-0.9：较为确信，可以采用
   * - 0.5-0.7：中等确信，可能需要验证
   * - 0.3-0.5：较低确信，建议继续探索
   * - 0.0-0.3：不确信，需要重新思考
   * 
   * 使用建议：
   * ```javascript
   * if (thought.getConfidence() < 0.5) {
   *   // 置信度低，可能需要：
   *   // 1. 切换思维模式
   *   // 2. 获取更多信息
   *   // 3. 进行更多轮思考
   * }
   * ```
   * 
   * @returns {number} 置信度评分 (0-1)
   */
  getConfidence() {
    throw new Error('Thought.getConfidence() must be implemented');
  }
}

module.exports = { Thought };