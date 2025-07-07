const BasePouchCommand = require('../BasePouchCommand')
const fs = require('fs-extra')
const path = require('path')
const { COMMANDS } = require('../../../../constants')
const { getGlobalResourceManager } = require('../../resource')
const { getDirectoryService } = require('../../../utils/DirectoryService')
const logger = require('../../../utils/logger')

/**
 * 记忆检索锦囊命令 - 纯XML模式
 * 负责从XML格式记忆库中检索相关知识和经验
 * 已升级为统一XML架构，移除Markdown兼容逻辑
 */
class RecallCommand extends BasePouchCommand {
  constructor () {
    super()
    this.lastSearchCount = 0
    this.resourceManager = getGlobalResourceManager()
    this.FORCE_XML_MODE = true  // 🎯 强制XML模式标志
  }

  getPurpose () {
    return 'AI主动检索记忆中的专业知识、最佳实践和历史经验（纯XML模式）'
  }

  async getContent (args) {
    // 解析参数：query, --context
    const { query, context } = this.parseArgs(args)

    logger.step('🧠 [RecallCommand] 开始记忆检索流程 (纯XML模式)')
    logger.info(`🔍 [RecallCommand] 查询内容: ${query ? `"${query}"` : '全部记忆'}`)

    try {
      // 🎯 传递context参数到检索方法
      const memories = await this.getXMLMemoriesOnly(query, context)

      logger.success(`✅ [RecallCommand] XML记忆检索完成 - 找到 ${memories.length} 条匹配记忆`)

      if (memories.length === 0) {
        if (query) {
          logger.warn(`⚠️ [RecallCommand] 未找到匹配查询"${query}"的记忆`)
          return `🔍 记忆检索结果：未找到匹配"${query}"的相关记忆

💡 优化建议：
1. **扩大查询范围**：尝试使用更通用的关键词
2. **换个角度查询**：尝试相关词汇或概念
3. **检查拼写**：确认关键词拼写正确
4. **查看全部记忆**：不使用查询参数，浏览所有记忆寻找灵感

🔄 下一步行动：
- 不带参数再次使用 recall 工具查看全部记忆
- 使用 remember 工具记录新的相关知识
- 使用 learn 工具学习相关资源后再检索`
        } else {
          logger.warn('⚠️ [RecallCommand] 记忆体系为空')
          return `🧠 AI记忆体系中暂无内容。
💡 建议：
1. 使用 MCP PromptX remember 工具内化新知识
2. 使用 MCP PromptX learn 工具学习后再内化
3. 开始构建AI的专业知识体系`
        }
      }

      const formattedMemories = this.formatRetrievedKnowledge(memories, query)

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

🛡️ **数据安全提示**：
- 如果是升级后首次使用，数据在 .promptx/backup/ 目录中有备份
- DPML格式记忆文件位置：.promptx/memory/declarative.dpml
- 如需帮助，请检查备份数据或重新运行记忆迁移`
    }
  }

  /**
   * 🎯 解析命令行参数
   */
  parseArgs(args) {
    let query = ''
    let context = null
    
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--context' && i + 1 < args.length) {
        try {
          context = JSON.parse(args[i + 1])
        } catch (error) {
          logger.warn(`⚠️ [RecallCommand] context参数解析失败: ${args[i + 1]}`)
        }
        i++ // 跳过下一个参数
      } else {
        // 查询参数
        if (query) {
          query += ' ' + args[i]
        } else {
          query = args[i]
        }
      }
    }
    
    return { query, context }
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
   * 获取XML记忆（纯XML模式，移除Markdown兼容）
   */
  async getXMLMemoriesOnly (query, context) {
    logger.step('🔧 [RecallCommand] 执行纯XML检索模式')
    
    this.lastSearchCount = 0
    const memories = []

    logger.debug('🔍 [RecallCommand] 初始化ResourceManager...')
    
    // 确保ResourceManager已初始化
    if (!this.resourceManager.initialized) {
      logger.info('⚙️ [RecallCommand] ResourceManager未初始化，正在初始化...')
      await this.resourceManager.initializeWithNewArchitecture()
      logger.success('⚙️ [RecallCommand] ResourceManager初始化完成')
    }
    
    const projectPath = await this.getProjectPath()
    logger.info(`📍 [RecallCommand] 项目根路径: ${projectPath}`)
    
    // 🎯 从角色专属目录读取记忆
    const currentRole = await this.getCurrentRole(context)
    const memoryDir = path.join(projectPath, '.promptx', 'memory')
    const roleMemoryDir = path.join(memoryDir, currentRole)
    const xmlFile = path.join(roleMemoryDir, 'declarative.dpml')
    
    logger.info(`📁 [RecallCommand] 检索角色记忆: ${xmlFile}`)

    try {
      // 🎯 只读取XML格式，不再兼容Markdown
      if (await fs.pathExists(xmlFile)) {
        logger.info('📄 [RecallCommand] 读取XML格式记忆文件')
        const xmlMemories = await this.readXMLMemories(xmlFile, query)
        memories.push(...xmlMemories)
        logger.success(`📄 [RecallCommand] XML记忆读取完成 - ${xmlMemories.length} 条记忆`)
      } else {
        logger.warn('📄 [RecallCommand] 未找到XML记忆文件，可能需要先创建记忆')
      }
    } catch (error) {
      logger.error(`❌ [RecallCommand] 读取XML记忆文件时发生错误: ${error.message}`)
      logger.debug(`🐛 [RecallCommand] 读取错误堆栈: ${error.stack}`)
    }

    this.lastSearchCount = memories.length
    logger.info(`📊 [RecallCommand] XML记忆检索统计 - 总计: ${memories.length} 条`)
    
    return memories
  }

  /**
   * 🎯 获取当前激活角色（Context参数优先，默认为default）
   */
  async getCurrentRole(context) {
    try {
      logger.debug(`🎭 [RecallCommand] === getCurrentRole开始 ===`)
      
      // 🎯 优先使用context.role_id参数
      if (context && context.role_id) {
        logger.success(`🎭 [RecallCommand] 从context参数获取角色: "${context.role_id}"`)
        logger.debug(`🎭 [RecallCommand] === getCurrentRole完成 === 返回角色: ${context.role_id}`)
        return context.role_id
      }
      
      // 🎯 无Context时使用默认角色
      logger.debug(`🎭 [RecallCommand] 无context.role_id，使用默认角色: default`)
      logger.debug(`🎭 [RecallCommand] === getCurrentRole完成 === 返回默认角色: default`)
      return 'default'
      
    } catch (error) {
      logger.error(`❌ [RecallCommand] getCurrentRole失败: ${error.message}`)
      logger.debug(`🎭 [RecallCommand] === getCurrentRole完成 === 返回默认角色: default (错误回退)`)
      return 'default'
    }
  }

  /**
   * 获取项目路径（复用ActionCommand逻辑）
   */
  async getProjectPath() {
    logger.debug('📍 [RecallCommand] 获取项目路径...')
    
    // 🚀 新架构：直接使用ProjectManager的当前项目状态
    const ProjectManager = require('../../../utils/ProjectManager')
    const projectPath = ProjectManager.getCurrentProjectPath()
    
    if (process.env.PROMPTX_DEBUG === 'true') {
      logger.debug(`📍 [RecallCommand] 项目路径解析结果: ${projectPath}`)
    }
    
    return projectPath
  }

  /**
   * 检查记忆是否匹配查询 - 增强版匹配算法
   */
  matchesMemory (memory, query) {
    if (!query) return true
    
    logger.debug(`🎯 [RecallCommand] 开始匹配检查 - 查询: "${query}", 记忆: "${memory.content.substring(0, 30)}..."`)
    
    const lowerQuery = query.toLowerCase()
    const lowerContent = memory.content.toLowerCase()
    
    // 1. 完全匹配 - 最高优先级
    if (lowerContent.includes(lowerQuery) || 
        memory.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) {
      logger.debug(`✅ [RecallCommand] 完全匹配成功`)
      return true
    }
    
    // 2. 分词匹配 - 支持多关键词组合查询
    const queryWords = lowerQuery.split(/\s+/).filter(word => word.length > 1)
    if (queryWords.length > 1) {
      const matchedWords = queryWords.filter(word => 
        lowerContent.includes(word) || 
        memory.tags.some(tag => tag.toLowerCase().includes(word))
      )
      // 如果匹配了一半以上的关键词，认为相关
      if (matchedWords.length >= Math.ceil(queryWords.length / 2)) {
        logger.debug(`✅ [RecallCommand] 分词匹配成功 - 匹配词数: ${matchedWords.length}/${queryWords.length}`)
        return true
      }
    }
    
    // 3. 模糊匹配 - 支持常见同义词和缩写
    const synonyms = this.getSynonyms(lowerQuery)
    for (const synonym of synonyms) {
      if (lowerContent.includes(synonym) || 
          memory.tags.some(tag => tag.toLowerCase().includes(synonym))) {
        logger.debug(`✅ [RecallCommand] 同义词匹配成功 - 同义词: "${synonym}"`)
        return true
      }
    }
    
    logger.debug(`❌ [RecallCommand] 无匹配`)
    return false
  }
  
  /**
   * 获取查询词的同义词和相关词
   */
  getSynonyms (query) {
    const synonymMap = {
      'mcp': ['model context protocol', '工具'],
      'promptx': ['prompt-x', '提示词'],
      '测试': ['test', 'testing', 'qa', '质量保证'],
      '工具': ['tool', 'mcp', '功能'],
      '记忆': ['memory', 'recall', '回忆'],
      '学习': ['learn', 'study', '学会'],
      '角色': ['role', 'character', '专家'],
      '产品': ['product', 'pm', '产品经理'],
      '开发': ['develop', 'dev', 'coding', '编程'],
      '前端': ['frontend', 'fe', 'ui'],
      '后端': ['backend', 'be', 'api', '服务端'],
      'github': ['git', '代码仓库', '版本控制'],
      'issue': ['问题', 'bug', '需求'],
      '敏捷': ['agile', 'scrum', '迭代']
    }
    
    const result = [query] // 包含原查询词
    
    // 查找直接同义词
    if (synonymMap[query]) {
      result.push(...synonymMap[query])
    }
    
    // 查找包含关系的同义词
    for (const [key, values] of Object.entries(synonymMap)) {
      if (key.includes(query) || query.includes(key)) {
        result.push(key, ...values)
      }
      if (values.some(v => v.includes(query) || query.includes(v))) {
        result.push(key, ...values)
      }
    }
    
    return [...new Set(result)] // 去重
  }

  matchesQuery (content, query) {
    const lowerContent = content.toLowerCase()
    const lowerQuery = query.toLowerCase()
    const keywords = lowerQuery.split(/\s+/)

    return keywords.some(keyword => lowerContent.includes(keyword))
  }

  /**
   * 格式化检索到的记忆（支持多行显示，确保XML反转义）
   */
  formatRetrievedKnowledge (memories, query) {
    return memories.map((memory, index) => {
      // 保持完整的记忆内容，不进行截断
      // 陈述性记忆的完整性对于系统价值至关重要
      let content = memory.content
      
      // 🔧 确保XML转义字符被正确反转义
      content = this.unescapeXML(content)
      
      // 只对格式进行优化，但不截断内容
      // 确保换行符正确显示
      content = content.trim()

      // 🔧 也要对标签进行反转义处理
      const unescapedTags = memory.tags.map(tag => this.unescapeXML(tag))

      return `📝 ${index + 1}. **记忆** (${memory.timestamp})
${content}
${unescapedTags.slice(0, 8).join(' ')}  
---`
    }).join('\n')
  }

  extractDomain (query) {
    const domains = ['copywriter', 'scrum', 'developer', 'test', 'prompt']
    const lowerQuery = query.toLowerCase()

    return domains.find(domain => lowerQuery.includes(domain)) || null
  }

  getRelatedQuery (query) {
    const relatedMap = {
      copywriter: 'marketing',
      scrum: 'agile',
      frontend: 'ui',
      backend: 'api',
      test: 'qa'
    }

    for (const [key, value] of Object.entries(relatedMap)) {
      if (query.toLowerCase().includes(key)) {
        return value
      }
    }

    return query + '-advanced'
  }

  /**
   * 读取XML格式记忆
   */
  async readXMLMemories (xmlFile, query) {
    logger.step('📄 [RecallCommand] 开始读取XML格式记忆')
    
    const memories = []
    
    try {
      const xmlContent = await fs.readFile(xmlFile, 'utf8')
      logger.info(`📄 [RecallCommand] XML文件读取成功 - 文件大小: ${xmlContent.length} 字符`)
      
      const xmlMemories = this.parseXMLMemories(xmlContent)
      logger.info(`📄 [RecallCommand] XML解析完成 - 解析出 ${xmlMemories.length} 条记忆`)
      
      for (const memory of xmlMemories) {
        if (!query || this.matchesMemory(memory, query)) {
          memories.push(memory)
          if (query) {
            logger.debug(`🎯 [RecallCommand] 记忆匹配成功: "${memory.content.substring(0, 30)}..."`)
          }
        } else if (query) {
          logger.debug(`❌ [RecallCommand] 记忆不匹配: "${memory.content.substring(0, 30)}..."`)
        }
      }
      
      logger.success(`📄 [RecallCommand] XML记忆筛选完成 - 匹配: ${memories.length}/${xmlMemories.length} 条`)
      
    } catch (error) {
      logger.error(`❌ [RecallCommand] XML记忆读取失败: ${error.message}`)
      logger.debug(`🐛 [RecallCommand] XML读取错误堆栈: ${error.stack}`)
    }
    
    return memories
  }

  /**
   * 解析XML格式记忆
   */
  parseXMLMemories (xmlContent) {
    logger.debug('🔍 [RecallCommand] 开始解析XML记忆内容')
    
    const memories = []
    
    try {
      // 简单的XML解析（不依赖外部库）
      const itemRegex = /<item\s+id="([^"]*?)"\s+time="([^"]*?)">(.*?)<\/item>/gs
      let match
      let itemCount = 0
      
      while ((match = itemRegex.exec(xmlContent)) !== null) {
        itemCount++
        const [, id, timestamp, itemContent] = match
        
        logger.debug(`🔍 [RecallCommand] 解析记忆项 ${itemCount}: ID=${id}, 时间=${timestamp}`)
        
        // 解析内容和标签
        const contentMatch = itemContent.match(/<content>(.*?)<\/content>/s)
        const tagsMatch = itemContent.match(/<tags>(.*?)<\/tags>/s)
        
        if (contentMatch) {
          const content = this.unescapeXML(contentMatch[1].trim())
          const tagsString = tagsMatch ? this.unescapeXML(tagsMatch[1].trim()) : ''
          const tags = tagsString ? tagsString.split(/\s+/).filter(t => t) : []
          
          logger.debug(`🔍 [RecallCommand] 记忆项内容: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`)
          logger.debug(`🔍 [RecallCommand] 记忆项标签: [${tags.join(', ')}]`)
          
          memories.push({
            id,
            timestamp,
            content,
            tags,
            source: 'xml'
          })
        } else {
          logger.warn(`⚠️ [RecallCommand] 记忆项 ${itemCount} 缺少content标签`)
        }
      }
      
      logger.success(`🔍 [RecallCommand] XML解析完成 - 成功解析 ${memories.length} 条记忆`)
      
    } catch (error) {
      logger.error(`❌ [RecallCommand] XML解析失败: ${error.message}`)
      logger.debug(`🐛 [RecallCommand] XML解析错误堆栈: ${error.stack}`)
    }
    
    return memories
  }

  /**
   * XML反转义函数（增强版，处理所有常见XML转义字符）
   */
  unescapeXML (text) {
    if (typeof text !== 'string') {
      return text
    }
    return text
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&#x2F;/g, '/') 
      .replace(/&#47;/g, '/')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
  }
}

module.exports = RecallCommand
