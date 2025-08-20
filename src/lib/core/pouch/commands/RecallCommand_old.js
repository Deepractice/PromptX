const BasePouchCommand = require('../BasePouchCommand')
const { getGlobalResourceManager } = require('../../resource')
const { CognitionManager } = require('../../cognition/CognitionManager')
const logger = require('../../../utils/logger')

/**
 * 记忆检索锦囊命令 - 基于认知体系
 * 使用 CognitionManager 进行智能语义检索
 */
class RecallCommand extends BasePouchCommand {
  constructor () {
    super()
    this.lastSearchCount = 0
    this.resourceManager = getGlobalResourceManager()
    this.cognitionManager = new CognitionManager(this.resourceManager)
  }

  getPurpose () {
    return 'AI主动检索记忆中的专业知识、最佳实践和历史经验（基于认知体系）'
  }

  async getContent (args) {
    // 解析参数：--role, query
    const { role, query } = this.parseArgs(args)

    if (!role) {
      return `❌ 错误：缺少必填参数 role

🎯 **使用方法**：
recall 角色ID [查询关键词]

📋 **示例**：
recall java-developer "React Hooks"
recall product-manager  # 查看所有产品经理记忆
recall copywriter "A/B测试"

💡 **可用角色ID**：通过 welcome 工具查看所有可用角色`
    }

    logger.step('🧠 [RecallCommand] 开始记忆检索流程 (基于认知体系)')
    logger.info(`🔍 [RecallCommand] 角色: ${role}, 查询内容: ${query ? `"${query}"` : '全部记忆'}`)

    try {
      // 🎯 使用CognitionManager进行检索
      const memories = await this.cognitionManager.recall(role, query || '')

      this.lastSearchCount = memories.length
      logger.success(`✅ [RecallCommand] 认知检索完成 - 找到 ${memories.length} 条匹配记忆`)

      if (memories.length === 0) {
        if (query) {
          logger.warn(`⚠️ [RecallCommand] 未找到匹配查询"${query}"的记忆`)
          return `🔍 记忆检索结果：未找到匹配"${query}"的相关记忆

📌 **重要提示**：检索线索必须来自角色激活时的 mindmap！
- 🧠 **查看 mindmap**：重新激活角色（使用 action 工具）查看完整的语义网络索引
- 🎯 **使用精确概念**：从 mindmap 中选择精确的概念作为检索线索
- ⚠️ **避免拆分组合**：如 mindmap 中有"用户体验"，不要拆成"用户"+"体验"

💡 **检索优化建议**：
1. **使用父节点概念**：尝试 mindmap 中的上层概念，可能找到相关线索
2. **扩大查询范围**：使用 mindmap 中更通用的概念进行检索

⚠️ **如果依然失败**：这可能是新问题，建议：
1. **🤝 与用户讨论**：停下来和用户探讨这个问题的解决方案
2. **🔍 搜索解决方案**：使用 WebSearch 工具搜索相关资料
3. **📝 记录新知识**：解决后用 remember 工具记录经验，避免下次遗忘`
        } else {
          logger.warn('⚠️ [RecallCommand] 记忆体系为空')
          return `🧠 AI记忆体系中暂无内容。

💡 提示：尚未建立该角色的记忆体系，请通过学习和实践积累经验。`
        }
      }

      const formattedMemories = this.formatEngrams(memories, query)

      return `🧠 AI记忆体系 ${query ? `检索"${query}"` : '全部记忆'} (${memories.length}条)：
${formattedMemories}
💡 记忆运用建议：
1. 结合当前任务场景灵活运用
2. 根据实际情况调整和变通
3. 持续学习和增强记忆能力`
    } catch (error) {
      logger.error(`❌ [RecallCommand] 记忆检索失败: ${error.message}`)
      logger.debug(`🐛 [RecallCommand] 错误堆栈: ${error.stack}`)
      return `❌ 检索记忆时出错：${error.message}

💡 **可能的原因**：
- 角色ID不正确
- 认知系统初始化失败
- 记忆存储路径问题

🔧 **建议操作**：
1. 检查角色ID是否正确
2. 重试检索操作
3. 如持续失败，查看日志详情`
    }
  }

  /**
   * 🎯 解析命令行参数 - role作为第一个位置参数
   */
  parseArgs(args) {
    let query = ''
    let role = ''
    let argIndex = 0
    
    // 第一个参数是role
    if (args.length > 0) {
      role = args[0]
      argIndex = 1
    }
    
    // 从第二个参数开始解析查询内容
    for (let i = argIndex; i < args.length; i++) {
      // 查询参数
      if (query) {
        query += ' ' + args[i]
      } else {
        query = args[i]
      }
    }
    
    return { role, query }
  }

  getPATEOAS (args) {
    const [query] = args
    const currentState = query ? `recalled-${query}` : 'recall-waiting'

    return {
      currentState,
      availableTransitions: ['welcome', 'remember', 'learn', 'recall'],
      nextActions: [
        {
          name: '选择角色',
          description: '选择专业角色来应用检索到的知识',
          method: 'MCP PromptX welcome 工具'
        },
        {
          name: '记忆新知识',
          description: '继续内化更多专业知识',
          method: 'MCP PromptX remember 工具'
        },
        {
          name: '学习资源',
          description: '学习相关专业资源',
          method: 'MCP PromptX learn 工具'
        },
        {
          name: '继续检索',
          description: '检索其他相关记忆',
          method: 'MCP PromptX recall 工具'
        }
      ],
      metadata: {
        query: query || null,
        resultCount: this.lastSearchCount || 0,
        searchTime: new Date().toISOString(),
        hasResults: (this.lastSearchCount || 0) > 0
      }
    }
  }





  /**
   * 格式化Engram对象（突出核心要素：content, schema, strength, timestamp）
   */
  formatEngrams (engrams, query) {
    let formattedEngrams = engrams.map((engram, index) => {
      const content = engram.getContent ? engram.getContent() : engram.content
      const schema = engram.schema
      const strength = engram.getStrength ? engram.getStrength() : engram.strength || 0
      const timestamp = engram.timestamp ? new Date(engram.timestamp).toLocaleString() : '未知时间'
      
      let result = `📝 ${index + 1}. **记忆** [强度: ${strength.toFixed(2)}] (${timestamp})
💭 **内容**: ${content}`

      if (schema) {
        // 如果schema是字符串（Mermaid格式），简化显示
        if (typeof schema === 'string') {
          const schemaPreview = schema.replace(/\n/g, ' → ').substring(0, 100)
          result += `\n🗺️  **认知结构**: ${schemaPreview}${schema.length > 100 ? '...' : ''}`
        } else if (schema.name) {
          result += `\n🗺️  **认知结构**: ${schema.name}`
        }
      }
      
      return result + '\n---'
    }).join('\n')
    
    
    return formattedEngrams
  }

}

module.exports = RecallCommand
