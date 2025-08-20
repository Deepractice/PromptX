const BasePouchCommand = require('../BasePouchCommand')
const { getGlobalResourceManager } = require('../../resource')
const { CognitionManager } = require('../../cognition/CognitionManager')
const logger = require('../../../utils/logger')

/**
 * 记忆保存锦囊命令 - 基于认知体系
 * 使用 CognitionManager 保存角色专属记忆
 */
class RememberCommand extends BasePouchCommand {
  constructor () {
    super()
    this.resourceManager = getGlobalResourceManager()
    this.cognitionManager = new CognitionManager(this.resourceManager)
  }

  getPurpose () {
    return '增强AI长期记忆能力，主动内化专业知识、最佳实践和项目经验'
  }

  async getContent (args) {
    // 解析参数：role 和 engrams数组
    const { role, engrams } = this.parseArgs(args)

    if (!role || !engrams) {
      return this.getUsageHelp()
    }

    try {
      logger.step('🧠 [RememberCommand] 开始批量记忆保存流程')
      logger.info(`📝 [RememberCommand] 批量保存 ${engrams.length} 个Engram`)
      
      // 使用 CognitionManager 批量保存记忆
      await this.cognitionManager.remember(role, engrams)

      logger.success('✅ [RememberCommand] 批量记忆保存完成')
      return this.formatBatchSaveResponse(engrams, role)
      
    } catch (error) {
      logger.error(`❌ [RememberCommand] 记忆保存失败: ${error.message}`)
      logger.debug(`🐛 [RememberCommand] 错误堆栈: ${error.stack}`)
      
      return `❌ 记忆保存失败：${error.message}

💡 **可能的原因**：
- 角色ID不正确
- 记忆内容格式问题
- 认知系统初始化失败

🔧 **建议操作**：
1. 检查角色ID是否正确
2. 重试记忆操作
3. 如持续失败，查看日志详情`
    }
  }

  /**
   * 解析命令行参数
   */
  parseArgs(args) {
    let role = ''
    let engrams = null
    
    // 第一个参数是role
    if (args.length > 0) {
      role = args[0]
    }
    
    // 第二个参数是JSON格式的engrams数组
    if (args.length > 1) {
      try {
        engrams = JSON.parse(args[1])
        if (!Array.isArray(engrams)) {
          throw new Error('engrams必须是数组格式')
        }
      } catch (error) {
        logger.error(`❌ [RememberCommand] 解析engrams参数失败: ${error.message}`)
        engrams = null
      }
    }
    
    return { role, engrams }
  }

  /**
   * 格式化保存响应
   */
  formatSaveResponse (value, strength, role) {
    return `✅ AI已内化新记忆：${value}

## 📋 记忆详情
- **角色**: ${role}
- **内化时间**: ${new Date().toISOString()}
- **记忆强度**: ${strength}

## 🎯 能力增强效果
- ✅ **知识已内化到角色认知体系**
- ✅ **支持基于语义的智能检索**
- ✅ **可通过recall命令主动检索**
- ✅ **自动形成知识网络连接**`
  }

  /**
   * 格式化批量保存响应
   */
  formatBatchSaveResponse (engrams, role) {
    const typeCount = engrams.reduce((acc, engram) => {
      acc[engram.type] = (acc[engram.type] || 0) + 1
      return acc
    }, {})
    
    const avgStrength = (engrams.reduce((sum, engram) => sum + engram.strength, 0) / engrams.length).toFixed(2)
    
    const typeStats = Object.entries(typeCount)
      .map(([type, count]) => `${type}: ${count}个`)
      .join(', ')
    
    let output = `✅ AI已批量内化 ${engrams.length} 个记忆：

## 📊 批量记忆统计
- **类型分布**: ${typeStats}
- **平均强度**: ${avgStrength}
- **角色**: ${role}
- **内化时间**: ${new Date().toISOString()}

## 🎯 批量记忆优势
- ✅ **原子性保持**: 每个概念独立存储，避免混淆
- ✅ **关联性建立**: 相关概念自动建立语义连接  
- ✅ **检索精确**: 原子Cue确保精确匹配
- ✅ **类型分离**: ATOMIC实体、LINK关系、PATTERN模式分别存储`
    
    return output
  }

  /**
   * 获取使用帮助
   */
  getUsageHelp () {
    return `🧠 **Remember锦囊 - AI角色专属记忆系统**

## 📖 基本用法
remember 角色ID "记忆内容" "结构化认知" 记忆强度

## 🎯 必填参数
- **角色ID**: 要保存记忆的角色ID
- **记忆内容**: 要保存的重要信息或经验
- **结构化认知**: Mermaid mindmap格式的认知结构
- **记忆强度**: 0-1之间的数值（默认0.8）

## 📋 使用示例
\`\`\`bash
remember java-developer "React Hooks最佳实践" "mindmap\\n  root((React))\\n    Hooks\\n      useState\\n      useEffect" 0.9
remember product-manager "用户研究三步法" "mindmap\\n  root((用户研究))\\n    观察\\n    访谈\\n    分析" 0.8
\`\`\`

## 🎭 角色专属记忆特性
- **认知体系**: 每个角色拥有独立的认知网络
- **语义连接**: 自动建立知识间的语义关联
- **智能检索**: 基于语义相似度的记忆检索
- **持久存储**: 长期记忆和语义网络双重存储

## 🔍 配套工具
- **查看角色**: welcome 工具查看所有可用角色ID
- **检索记忆**: recall 工具检索角色专属记忆
- **激活角色**: action 工具激活角色（自动激活语义网络）`
  }

  /**
   * 获取PATEOAS导航信息
   */
  getPATEOAS (args) {
    const content = args.join(' ')

    if (!content) {
      return {
        currentState: 'remember_awaiting_input',
        availableTransitions: ['welcome', 'learn', 'recall'],
        nextActions: [
          {
            name: '查看角色',
            description: '选择角色获取专业知识',
            method: 'MCP PromptX welcome 工具',
            priority: 'medium'
          },
          {
            name: '学习资源',
            description: '学习新知识然后保存',
            method: 'MCP PromptX learn 工具',
            priority: 'high'
          }
        ]
      }
    }

    return {
      currentState: 'memory_saved',
      availableTransitions: ['recall', 'learn', 'action', 'remember'],
      nextActions: [
        {
          name: '检索记忆',
          description: '测试记忆是否可检索',
          method: 'MCP PromptX recall 工具',
          priority: 'high'
        },
        {
          name: '应用记忆',
          description: '在实际场景中应用记忆',
          method: 'MCP PromptX action 工具',
          priority: 'medium'
        },
        {
          name: '继续内化',
          description: '本轮对话还有更多值得记忆的信息',
          method: 'MCP PromptX remember 工具',
          priority: 'high'
        }
      ],
      metadata: {
        savedMemory: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
        memoryLength: content.length,
        timestamp: new Date().toISOString(),
        systemVersion: '锦囊串联状态机 v1.0'
      }
    }
  }
}

module.exports = RememberCommand