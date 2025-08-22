// Thinking Interface - 思考接口
// 认知心理学基础：Central Executive System（中央执行系统）
//
// === 认知心理学概念对齐 ===
// 
// 1. 中央执行系统（Baddeley & Hitch, 1974）
//    - 思考是认知系统的核心控制器
//    - 协调和控制信息从各个认知子系统流动
//    - 管理注意力资源的分配
//
// 2. 信息处理理论（Information Processing Theory）
//    - 思考是将输入信息转换为输出的核心过程
//    - 类似计算机的CPU，但具有并行和联想能力
//
// 3. 认知控制（Cognitive Control）
//    - 自上而下的控制过程
//    - 根据目标和上下文调节认知活动
//    - 抑制无关信息，增强相关信息
//
// 4. 认知状态机（Cognitive State Machine）
//    - 思考是状态转换的过程
//    - 从初始状态（goalEngram）到终结状态（conclusionEngram）
//    - Thought作为状态载体，包含完整的认知信息
//
// === 设计原则 ===
//
// 1. 单一入口：所有思考活动都通过think方法
// 2. 状态完备：Thought包含思考所需的全部状态
// 3. 模式选择：AI主动选择thinkingPattern，决定思维方式
// 4. 模式执行：ThinkingPattern实现类执行具体的思维策略
// 5. 思维连续：支持基于前序思想的连续思考

class Thinking {
  /**
   * 执行思考操作
   * 
   * 认知心理学基础：
   * 1. 认知状态机（Cognitive State Machine）
   *    - 输入：Thought对象（包含goalEngram作为初始状态）
   *    - 处理：基于goalEngram进行认知操作
   *    - 输出：新的Thought对象（包含conclusionEngram作为终结状态）
   * 
   * 2. 思维连续性（Continuity of Thought）
   *    - Thought可以包含previousThought，形成思维链
   *    - goalEngram可以是前一个thought的conclusionEngram
   *    - 支持迭代深化和持续探索
   * 
   * 3. 目标导向处理（Goal-Directed Processing）
   *    - goalEngram提供思考的目标和方向
   *    - 可以是声明性目标（获取知识）或程序性目标（探索过程）
   *    - 思考过程围绕目标展开，最终产生结论
   * 
   * 使用示例：
   * ```javascript
   * // 初始思考 - AI需要提供三个核心决策
   * const thought1 = thinking.think({
   *   goalEngram: new Engram("了解咖啡对健康的影响"),
   *   thinkingPattern: "reasoning",  // AI选择推理模式
   *   spreadActivationCues: ["咖啡", "健康", "影响"],
   *   previousThought: null
   * });
   * 
   * // 基于结论继续思考（思维链）
   * const thought2 = thinking.think({
   *   goalEngram: thought1.getConclusionEngram(),
   *   thinkingPattern: "analytical",  // 可以切换到分析模式
   *   spreadActivationCues: ["咖啡因", "睡眠", "心血管"],
   *   previousThought: thought1
   * });
   * 
   * // 探索性思考
   * const thought3 = thinking.think({
   *   goalEngram: new Engram("探索咖啡文化"),
   *   thinkingPattern: "creative",  // 选择创造模式
   *   spreadActivationCues: ["文化", "仪式", "社交"],
   *   previousThought: null
   * });
   * ```
   * 
   * @param {Thought} thought - 输入的思想状态
   *                            首次思考必须包含：goalEngram, thinkingPattern, spreadActivationCues
   *                            后续思考会从 previousThought 继承并演化
   * @returns {Thought} 新的思想状态，包含系统处理结果和AI生成的认知内容
   */
  think(thought) {
    throw new Error('Thinking.think() must be implemented');
  }
}

module.exports = { Thinking };