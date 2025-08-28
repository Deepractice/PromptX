// Thinking Module Interfaces - 思考模块接口集合
// 导出所有认知思考相关的接口定义
//
// 接口关系说明：
// 1. Thinking - 定义思考的核心方法 think(thought)
// 2. Thought - 思想状态载体，包含goalEngram到conclusionEngram的完整状态
//
// 认知状态机模型：
// Thought(goalEngram) -> think() -> Thought(conclusionEngram)
//                         ↑
//                    认知操作过程
//
// 思维链示例：
// thought1 = think({goalEngram: "咖啡"})
// thought2 = think({goalEngram: thought1.conclusionEngram})
// thought3 = think({goalEngram: thought2.conclusionEngram})

// 核心思考接口
const { Thinking } = require('./Thinking');

// 思考结果数据结构
const { Thought } = require('./Thought');

// 思维模式接口
const { ThinkingPattern } = require('./ThinkingPattern');

// 统一导出
module.exports = {
  // 核心接口
  Thinking,
  Thought,
  ThinkingPattern
  
  // 未来将添加：
  // 具体的 ThinkingPattern 实现类
};