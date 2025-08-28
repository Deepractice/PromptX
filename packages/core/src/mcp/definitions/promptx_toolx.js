module.exports = {
  name: 'toolx',
  description: `🔧 [ToolX执行器] 执行PromptX工具体系(ToolX)中的JavaScript功能
基于PromptX工具生态系统，提供安全可控的工具执行环境。

何时使用此工具:
- 已通过promptx_learn学习了@manual://工具名并理解其功能
- 用户明确要求使用某个工具解决具体问题
- 当前任务正好匹配工具的设计用途
- 所有必需参数都已准备就绪
- 确认这是解决问题的最佳工具选择

核心执行能力:
- 动态加载和执行JavaScript工具模块
- 自动处理工具依赖的npm包安装
- 提供隔离的执行沙箱环境
- 支持异步工具执行和超时控制
- 完整的错误捕获和友好提示
- 工具执行状态的实时监控
- 参数验证和类型检查

使用前置条件:
- 必须先使用promptx_learn学习@manual://工具名
- 完全理解工具的功能、参数和返回值格式
- 确认工具适用于当前的使用场景
- 准备好所有必需的参数值

执行流程规范:
1. 识别需求 → 2. learn manual → 3. 理解功能 → 4. 准备参数 → 5. 执行工具

严格禁止:
- 未学习manual就直接调用工具
- 基于猜测使用工具
- 将工具用于非设计用途
- 忽略工具的使用限制和边界

你应该:
1. 永远遵循"先学习后使用"的原则
2. 仔细阅读manual中的参数说明和示例
3. 根据manual中的最佳实践使用工具
4. 处理工具返回的错误并给出建议
5. 向用户解释工具的执行过程和结果
6. 在工具执行失败时参考manual的故障排除
7. 记录工具使用经验供后续参考
8. 推荐相关工具形成完整解决方案`,
  inputSchema: {
    type: 'object',
    properties: {
      tool_resource: {
        type: 'string',
        description: '工具资源引用，格式：@tool://tool-name，如@tool://calculator',
        pattern: '^@tool://.+'
      },
      parameters: {
        type: 'object',
        description: '传递给工具的参数对象'
      },
      rebuild: {
        type: 'boolean',
        description: '是否强制重建沙箱（默认false）。用于处理异常情况如node_modules损坏、权限问题等。正常情况下会自动检测依赖变化',
        default: false
      },
      timeout: {
        type: 'number',
        description: '工具执行超时时间（毫秒），默认30000ms',
        default: 30000
      }
    },
    required: ['tool_resource', 'parameters']
  }
};