const BasePouchCommand = require('../BasePouchCommand')
const fs = require('fs-extra')
const path = require('path')
const { COMMANDS } = require('../../../../constants')
const { getGlobalResourceManager } = require('../../resource')

/**
 * 记忆检索锦囊命令
 * 负责从记忆库中检索相关知识和经验
 */
class RecallCommand extends BasePouchCommand {
  constructor () {
    super()
    // 复用ActionCommand的ResourceManager方式
    this.resourceManager = getGlobalResourceManager()
  }

  getPurpose () {
    return 'AI主动检索记忆中的专业知识、最佳实践和历史经验'
  }

  async getContent (args) {
    const [query] = args

    try {
      const memories = await this.getAllMemories(query)

      if (memories.length === 0) {
        if (query) {
          // 针对特定查询的优化提示
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
          // 无记忆的情况
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
      return `❌ 检索记忆时出错：${error.message}`
    }
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
   * 获取所有记忆（支持多行格式，使用ResourceManager路径获取）
   */
  async getAllMemories (query) {
    this.lastSearchCount = 0
    const memories = []

    // 确保ResourceManager已初始化（就像ActionCommand那样）
    if (!this.resourceManager.initialized) {
      await this.resourceManager.initializeWithNewArchitecture()
    }
    
    // 通过ResourceManager获取项目路径（与ActionCommand一致）
    const projectPath = await this.getProjectPath()
    const memoryDir = path.join(projectPath, '.promptx', 'memory')
    const memoryFile = path.join(memoryDir, 'declarative.md')

    try {
      if (await fs.pathExists(memoryFile)) {
        const content = await fs.readFile(memoryFile, 'utf-8')
        const memoryBlocks = this.parseMemoryBlocks(content)

        for (const memoryBlock of memoryBlocks) {
          const memory = this.parseMemoryBlock(memoryBlock)
          if (memory && (!query || this.matchesMemory(memory, query))) {
            memories.push(memory)
          }
        }
      }
    } catch (error) {
      console.error('Error reading memories:', error)
    }

    this.lastSearchCount = memories.length
    return memories
  }

  /**
   * 获取项目路径（复用ActionCommand逻辑）
   */
  async getProjectPath() {
    // 使用ResourceManager的项目路径获取逻辑
    return this.resourceManager.projectPath || process.cwd()
  }

  /**
   * 解析记忆块（新多行格式）
   */
  parseMemoryBlocks (content) {
    const blocks = []
    const lines = content.split('\n')
    let currentBlock = []
    let inBlock = false

    for (const line of lines) {
      if (line.match(/^- \d{4}\/\d{2}\/\d{2} \d{2}:\d{2} START$/)) {
        // 开始新的记忆块
        if (inBlock && currentBlock.length > 0) {
          blocks.push(currentBlock.join('\n'))
        }
        currentBlock = [line]
        inBlock = true
      } else if (line === '- END' && inBlock) {
        // 结束当前记忆块
        currentBlock.push(line)
        blocks.push(currentBlock.join('\n'))
        currentBlock = []
        inBlock = false
      } else if (inBlock) {
        // 记忆块内容
        currentBlock.push(line)
      }
    }

    // 处理未结束的块
    if (inBlock && currentBlock.length > 0) {
      blocks.push(currentBlock.join('\n'))
    }

    return blocks
  }

  /**
   * 解析单个记忆块
   */
  parseMemoryBlock (blockContent) {
    const lines = blockContent.split('\n')
    
    // 解析开始行：- 2025/06/15 15:58 START
    const startLine = lines[0]
    const startMatch = startLine.match(/^- (\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}) START$/)
    if (!startMatch) return null

    const timestamp = startMatch[1]
    
    // 查找标签行：--tags xxx
    let tagsLine = ''
    let contentLines = []
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      if (line.startsWith('--tags ')) {
        tagsLine = line
      } else if (line !== '- END') {
        contentLines.push(line)
      }
    }

    // 提取内容（去除空行）
    const content = contentLines.join('\n').trim()
    
    // 解析标签
    let tags = []
    if (tagsLine) {
      const tagsContent = tagsLine.replace('--tags ', '')
      const hashTags = tagsContent.match(/#[^\s]+/g) || []
      const regularTags = tagsContent.replace(/#[^\s]+/g, '').trim().split(/\s+/).filter(t => t)
      tags = [...regularTags, ...hashTags]
    }

    return {
      timestamp,
      content,
      tags,
      source: 'memory'
    }
  }

  /**
   * 解析记忆行（向下兼容旧格式）
   */
  parseMemoryLine (line) {
    // 修复正则表达式，适配实际的记忆格式
    // 格式：- 2025/05/31 14:30 内容 --tags 标签 ##分类 #评分:8 #有效期:长期
    const match = line.match(/^- (\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}) (.+)$/)
    if (!match) return null

    const [, timestamp, contentAndTags] = match
    
    // 分离内容和标签
    let content = contentAndTags
    let tags = []
    
    // 提取 --tags 后面的内容
    const tagsMatch = contentAndTags.match(/--tags\s+(.*)/)
    if (tagsMatch) {
      const beforeTags = contentAndTags.substring(0, contentAndTags.indexOf('--tags')).trim()
      content = beforeTags
      
      // 解析标签部分，包括 --tags 后的内容和 # 开头的标签
      const tagsContent = tagsMatch[1]
      const hashTags = tagsContent.match(/#[^\s]+/g) || []
      const regularTags = tagsContent.replace(/#[^\s]+/g, '').trim().split(/\s+/).filter(t => t)
      
      tags = [...regularTags, ...hashTags]
    } else {
      // 如果没有 --tags，检查是否有直接的 # 标签
      const hashTags = contentAndTags.match(/#[^\s]+/g) || []
      if (hashTags.length > 0) {
        content = contentAndTags.replace(/#[^\s]+/g, '').trim()
        tags = hashTags
      }
    }

    return {
      timestamp,
      content,
      tags,
      source: 'memory'
    }
  }

  /**
   * 检查记忆是否匹配查询 - 增强版匹配算法
   */
  matchesMemory (memory, query) {
    const lowerQuery = query.toLowerCase()
    const lowerContent = memory.content.toLowerCase()
    
    // 1. 完全匹配 - 最高优先级
    if (lowerContent.includes(lowerQuery) || 
        memory.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) {
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
      return matchedWords.length >= Math.ceil(queryWords.length / 2)
    }
    
    // 3. 模糊匹配 - 支持常见同义词和缩写
    const synonyms = this.getSynonyms(lowerQuery)
    for (const synonym of synonyms) {
      if (lowerContent.includes(synonym) || 
          memory.tags.some(tag => tag.toLowerCase().includes(synonym))) {
        return true
      }
    }
    
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
   * 格式化检索到的记忆（支持多行显示）
   */
  formatRetrievedKnowledge (memories, query) {
    return memories.map((memory, index) => {
      // 保持完整的记忆内容，不进行截断
      // 陈述性记忆的完整性对于系统价值至关重要
      let content = memory.content
      
      // 只对格式进行优化，但不截断内容
      // 确保换行符正确显示
      content = content.trim()

      return `📝 ${index + 1}. **记忆** (${memory.timestamp})
${content}
${memory.tags.slice(0, 8).join(' ')}  
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
}

module.exports = RecallCommand
