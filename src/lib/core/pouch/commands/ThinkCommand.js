const BasePouchCommand = require('../BasePouchCommand')
const { getGlobalResourceManager } = require('../../resource')
const { CognitionManager } = require('../../cognition/CognitionManager')
const logger = require('../../../utils/logger')

/**
 * 思考锦囊命令 - 基于认知心理学的思维链式推理
 * 使用 CognitionManager 进行递归深化的思考过程
 */
class ThinkCommand extends BasePouchCommand {
  constructor () {
    super()
    this.resourceManager = getGlobalResourceManager()
    this.cognitionManager = new CognitionManager(this.resourceManager)
  }

  getPurpose () {
    return 'AI主动深度思考，通过认知循环生成洞察和结论'
  }

  async getContent (args) {
    // 解析参数：role、thought对象、templateName
    const { role, thought, templateName } = this.parseArgs(args)

    if (!role || !thought) {
      return this.getUsageHelp()
    }

    try {
      logger.step('🤔 [ThinkCommand] 开始思考流程')
      logger.info(`🧠 [ThinkCommand] 角色: ${role}, 模板: ${templateName || 'reasoning'}`)
      
      // 验证 thought 必须包含 goalEngram
      if (!thought.goalEngram) {
        throw new Error('Thought 必须包含 goalEngram')
      }
      
      // 使用 CognitionManager 进行思考
      const prompt = await this.cognitionManager.think(role, thought, templateName)

      logger.success('✅ [ThinkCommand] 思考指导生成完成')
      return this.formatThinkResponse(thought, prompt, role)
      
    } catch (error) {
      logger.error(`❌ [ThinkCommand] 思考失败: ${error.message}`)
      logger.debug(`🐛 [ThinkCommand] 错误堆栈: ${error.stack}`)
      
      return `❌ 思考失败：${error.message}

💡 **可能的原因**：
- 角色ID不正确
- Thought 对象格式错误
- 缺少必需的 goalEngram
- 思维模板不存在

🔧 **建议操作**：
1. 确保 Thought 包含 goalEngram
2. 检查角色是否已激活
3. 验证思维模板名称`
    }
  }

  /**
   * 解析命令行参数
   */
  parseArgs(args) {
    let role = ''
    let thought = null
    let templateName = 'reasoning'
    
    // 第一个参数是role
    if (args.length > 0) {
      role = args[0]
    }
    
    // 第二个参数是JSON格式的thought对象
    if (args.length > 1) {
      try {
        thought = JSON.parse(args[1])
        if (typeof thought !== 'object') {
          throw new Error('thought必须是对象格式')
        }
      } catch (error) {
        logger.error(`❌ [ThinkCommand] 解析thought参数失败: ${error.message}`)
        thought = null
      }
    }
    
    // 第三个参数是可选的templateName
    if (args.length > 2) {
      templateName = args[2]
    }
    
    return { role, thought, templateName }
  }

  /**
   * 格式化思考响应
   */
  formatThinkResponse (thought, prompt, role) {
    const hasInsights = thought.insightEngrams && thought.insightEngrams.length > 0
    const hasConclusion = !!thought.conclusionEngram
    const hasConfidence = thought.confidence !== undefined
    
    let status = '初始思考'
    if (hasConfidence) {
      status = '完整思考'
    } else if (hasConclusion) {
      status = '形成结论'
    } else if (hasInsights) {
      status = '产生洞察'
    }
    
    return `🧠 思考指导已生成

## 📊 当前思考状态
- **角色**: ${role}
- **状态**: ${status}
- **目标**: ${thought.goalEngram.content}

## 💭 生成的思考指导
${prompt}

## 📊 当前进展
${hasInsights ? `- **洞察数量**: ${thought.insightEngrams.length}` : '- **洞察**: 尚未生成'}
${hasConclusion ? `- **已形成结论**: ${thought.conclusionEngram.content}` : '- **结论**: 尚未形成'}
${hasConfidence ? `- **置信度**: ${thought.confidence}` : '- **置信度**: 尚未评估'}

## 🔄 思考深化建议
${this.getDeepingAdvice(thought)}`
  }

  /**
   * 获取思考深化建议
   */
  getDeepingAdvice(thought) {
    const hasInsights = thought.insightEngrams && thought.insightEngrams.length > 0
    const hasConclusion = !!thought.conclusionEngram
    const hasConfidence = thought.confidence !== undefined
    
    if (!hasInsights) {
      return '- 基于检索到的记忆，生成关键洞察'
    } else if (!hasConclusion) {
      return '- 综合洞察形成明确结论'
    } else if (!hasConfidence) {
      return '- 评估结论的置信度'
    } else {
      return '- 思考已完整，可以开始新的思考目标'
    }
  }

  /**
   * 获取使用帮助
   */
  getUsageHelp () {
    return `🤔 **Think锦囊 - AI深度思考系统**

## 📖 基本用法
think 角色ID '{"goalEngram": {...}, ...}' [思维模板]

## 🎯 必填参数
- **角色ID**: 进行思考的角色ID
- **thought对象**: JSON格式的Thought对象，必须包含goalEngram

## 💭 Thought 结构
\`\`\`json
{
  "goalEngram": {
    "content": "推理天空呈现蓝色的光学原理",
    "schema": "自然现象\\n  光学现象\\n    大气散射"
  },
  "insightEngrams": [...],     // 可选
  "conclusionEngram": {...},    // 可选
  "confidence": 0.95           // 可选
}
\`\`\`

## 📋 使用示例
\`\`\`bash
# 第一次思考
think scientist '{"goalEngram": {"content": "推理天空蓝色原理", "schema": "物理学\\n  光学"}}'

# 深入思考
think scientist '{"goalEngram": {...}, "insightEngrams": [...]}'

# 使用不同模板
think writer '{"goalEngram": {...}}' creative
\`\`\`

## 🧠 思维模板
- **reasoning**: 推理思维（默认）
- **divergent**: 发散思维 [未实现]
- **convergent**: 收敛思维 [未实现]
- **creative**: 创造性思维 [未实现]
- **critical**: 批判性思维 [未实现]
- **systemic**: 系统性思维 [未实现]

## 🔍 配套工具
- **激活角色**: action 工具激活角色并启动语义网络
- **检索记忆**: recall 工具为思考提供记忆支持
- **保存洞察**: remember 工具保存重要的思考成果`
  }

  /**
   * 获取PATEOAS导航信息
   */
  getPATEOAS (args) {
    const hasThought = args.length >= 2

    if (!hasThought) {
      return {
        currentState: 'think_awaiting_input',
        availableTransitions: ['action', 'welcome'],
        nextActions: [
          {
            name: '激活角色',
            description: '选择并激活思考角色',
            method: 'MCP PromptX action 工具',
            priority: 'high'
          },
          {
            name: '查看角色',
            description: '查看可用角色列表',
            method: 'MCP PromptX welcome 工具',
            priority: 'medium'
          }
        ]
      }
    }

    return {
      currentState: 'thinking_in_progress',
      availableTransitions: ['think', 'remember', 'recall'],
      nextActions: [
        {
          name: '继续思考',
          description: '基于生成的prompt继续深化思考',
          method: 'MCP PromptX think 工具',
          priority: 'high'
        },
        {
          name: '保存洞察',
          description: '将重要洞察保存为记忆',
          method: 'MCP PromptX remember 工具',
          priority: 'medium'
        },
        {
          name: '检索记忆',
          description: '检索相关记忆支持思考',
          method: 'MCP PromptX recall 工具',
          priority: 'medium'
        }
      ],
      metadata: {
        thinkingRole: args[0],
        thinkingDepth: this.getThinkingDepth(args[1]),
        timestamp: new Date().toISOString(),
        systemVersion: '锦囊串联状态机 v1.0'
      }
    }
  }

  /**
   * 分析思考深度
   */
  getThinkingDepth(thoughtStr) {
    try {
      const thought = JSON.parse(thoughtStr)
      if (thought.confidence !== undefined) return 'complete'
      if (thought.conclusionEngram) return 'conclusion'
      if (thought.insightEngrams && thought.insightEngrams.length > 0) return 'insights'
      return 'initial'
    } catch {
      return 'unknown'
    }
  }
}

module.exports = ThinkCommand