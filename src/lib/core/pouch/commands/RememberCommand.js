const BasePouchCommand = require('../BasePouchCommand')
const fs = require('fs-extra')
const path = require('path')
const { COMMANDS } = require('../../../../constants')
const { getGlobalResourceManager } = require('../../resource')
const { getDirectoryService } = require('../../../utils/DirectoryService')
const logger = require('../../../utils/logger')

/**
 * 记忆保存锦囊命令 - 纯XML模式
 * 负责将知识、经验和最佳实践保存到XML格式记忆库中
 * 已升级为统一XML架构，移除Markdown兼容逻辑
 */
class RememberCommand extends BasePouchCommand {
  constructor () {
    super()
    this.resourceManager = getGlobalResourceManager()
    this.FORCE_XML_MODE = true  // 🎯 强制XML模式标志
  }

  getPurpose () {
    return '增强AI长期记忆能力，主动内化专业知识、最佳实践和项目经验（纯XML模式）'
  }

  async getContent (args) {
    // 解析参数：content, --tags, --context
    const { content, tags, context } = this.parseArgs(args)

    if (!content) {
      return this.getUsageHelp()
    }

    try {
      // 🛡️ 升级前自动备份（仅首次）
      await this.ensureSafetyBackupExists()
      
      logger.step('🧠 [RememberCommand] 开始记忆保存流程 (纯XML模式)')
      logger.info(`📝 [RememberCommand] 记忆内容: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`)
      
      // 🎯 传递context参数到保存方法
      const memoryEntry = await this.saveMemoryXMLOnly(content, context)

      logger.success(`✅ [RememberCommand] XML记忆保存完成 - 路径: ${memoryEntry.filePath}`)
      return this.formatSaveResponse(content, memoryEntry)
      
    } catch (error) {
      logger.error(`❌ [RememberCommand] 记忆保存失败: ${error.message}`)
      logger.debug(`🐛 [RememberCommand] 错误堆栈: ${error.stack}`)
      
      return this.formatErrorWithRecovery(error)
    }
  }

  /**
   * 🎯 解析命令行参数
   */
  parseArgs(args) {
    let content = ''
    let tags = ''
    let context = null
    
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--tags' && i + 1 < args.length) {
        tags = args[i + 1]
        i++ // 跳过下一个参数
      } else if (args[i] === '--context' && i + 1 < args.length) {
        try {
          context = JSON.parse(args[i + 1])
        } catch (error) {
          logger.warn(`⚠️ [RememberCommand] context参数解析失败: ${args[i + 1]}`)
        }
        i++ // 跳过下一个参数
      } else {
        // 内容参数
        if (content) {
          content += ' ' + args[i]
        } else {
          content = args[i]
        }
      }
    }
    
    return { content, tags, context }
  }

  /**
   * 🛡️ 确保安全备份存在
   */
  async ensureSafetyBackupExists() {
    const projectPath = await this.getProjectPath()
    const backupMarker = path.join(projectPath, '.promptx', '.xml-upgrade-backup-done')
    
    if (!await fs.pathExists(backupMarker)) {
      logger.step('🛡️ [RememberCommand] 执行升级前安全备份...')
      await this.createSafetyBackup()
      await fs.writeFile(backupMarker, new Date().toISOString())
      logger.success('🛡️ [RememberCommand] 安全备份完成')
    }
  }

  /**
   * 🛡️ 创建安全备份
   */
  async createSafetyBackup() {
    const projectPath = await this.getProjectPath()
    const memoryDir = path.join(projectPath, '.promptx', 'memory')
    const backupDir = path.join(projectPath, '.promptx', 'backup', `backup_${Date.now()}`)
    
    await fs.ensureDir(backupDir)
    
    // 备份所有现有记忆文件
    const filesToBackup = ['declarative.dpml', 'declarative.md', 'declarative.md.bak']
    
    for (const file of filesToBackup) {
      const source = path.join(memoryDir, file)
      if (await fs.pathExists(source)) {
        await fs.copy(source, path.join(backupDir, file))
        logger.success(`✅ 备份文件: ${file}`)
      }
    }
    
    // 创建备份元数据
    const backupMeta = {
      timestamp: new Date().toISOString(),
      version: 'pre-xml-upgrade',
      files: filesToBackup.filter(f => fs.pathExistsSync(path.join(memoryDir, f)))
    }
    
    await fs.writeJSON(path.join(backupDir, 'backup-meta.json'), backupMeta, {spaces: 2})
    
    logger.success(`🛡️ 安全备份完成: ${backupDir}`)
    return backupDir
  }

  /**
   * 纯XML记忆保存（移除所有Markdown逻辑）
   */
  async saveMemoryXMLOnly(value, context) {
    logger.step('🔧 [RememberCommand] 执行角色专属记忆保存')
    
    const memoryDir = await this.ensureMemoryDirectory()
    logger.info(`📁 [RememberCommand] 基础记忆目录: ${memoryDir}`)
    
    // 🎯 角色专属记忆处理流程
    logger.info(`🎯 [RememberCommand] === 角色专属记忆处理开始 ===`)
    const currentRole = await this.getCurrentRole(context)
    logger.info(`🎯 [RememberCommand] 当前激活角色: "${currentRole}"`)
    
    const roleMemoryDir = path.join(memoryDir, currentRole)
    logger.info(`🎯 [RememberCommand] 角色记忆目录: ${roleMemoryDir}`)
    
    const xmlFile = path.join(roleMemoryDir, 'declarative.dpml')
    logger.info(`🎯 [RememberCommand] 角色记忆文件: ${xmlFile}`)
    
    // 确保角色目录存在
    logger.info(`📁 [RememberCommand] 准备创建角色目录...`)
    await fs.ensureDir(roleMemoryDir)
    logger.success(`📁 [RememberCommand] 角色目录创建完成: ${roleMemoryDir}`)
    
    // 验证目录是否真的存在
    const dirExists = await fs.pathExists(roleMemoryDir)
    logger.info(`📁 [RememberCommand] 目录存在验证: ${dirExists}`)
    
    logger.info(`💾 [RememberCommand] 准备保存记忆到: ${xmlFile}`)
    const memoryItem = this.formatXMLMemoryItem(value)
    const action = await this.appendToXMLFile(xmlFile, memoryItem)
    logger.success(`💾 [RememberCommand] 记忆保存完成，操作类型: ${action}`)
    
    logger.info(`🎯 [RememberCommand] === 角色专属记忆处理完成 ===`)
    
    return {
      value,
      filePath: xmlFile,
      action,
      timestamp: new Date().toISOString(),
      format: 'xml'
    }
  }

  /**
   * 🔄 安全的Legacy迁移
   */
  async performSafeLegacyMigration(memoryDir) {
    const legacyFile = path.join(memoryDir, 'declarative.md')
    const xmlFile = path.join(memoryDir, 'declarative.dpml')
    
    if (await fs.pathExists(legacyFile) && !await fs.pathExists(xmlFile)) {
      logger.step('🔄 [RememberCommand] 检测到Legacy数据，执行安全迁移...')
      
      try {
        // 迁移前再次备份
        const timestamp = Date.now()
        await fs.copy(legacyFile, `${legacyFile}.pre-migration.${timestamp}`)
        
        // 执行迁移
        await this.migrateLegacyMemoriesIfNeeded(memoryDir)
        
        logger.success('🔄 [RememberCommand] Legacy数据迁移完成')
        
      } catch (error) {
        logger.error(`❌ [RememberCommand] Legacy迁移失败: ${error.message}`)
        logger.debug(`❌ [RememberCommand] 迁移错误堆栈: ${error.stack}`)
        logger.warn(`⚠️ [RememberCommand] 迁移失败，继续使用新记忆系统，备份文件已保存`)
        // 静默处理，不向用户抛出错误，宁愿丢失旧记忆也不影响用户体验
      }
    }
  }

  /**
   * 🚨 错误恢复建议
   */
  formatErrorWithRecovery(error) {
    return `❌ XML记忆保存失败：${error.message}

🛡️ **恢复方案**：
1. 检查 .promptx/backup/ 目录中的数据备份
2. 如需回滚，请联系技术支持
3. 备份文件位置：.promptx/backup/backup_*

🔧 **可能的原因**：
- 磁盘空间不足
- 文件权限问题  
- XML格式验证失败

💡 **建议操作**：
1. 检查磁盘空间和权限
2. 重试记忆操作
3. 如持续失败，查看备份数据`
  }

  /**
   * 确保AI记忆体系目录存在（使用ResourceManager路径获取）
   */
  async ensureMemoryDirectory () {
    logger.debug('🔍 [RememberCommand] 初始化ResourceManager...')
    
    // 确保ResourceManager已初始化（就像ActionCommand那样）
    if (!this.resourceManager.initialized) {
      logger.info('⚙️ [RememberCommand] ResourceManager未初始化，正在初始化...')
      await this.resourceManager.initializeWithNewArchitecture()
      logger.success('⚙️ [RememberCommand] ResourceManager初始化完成')
    }
    
    // 通过ResourceManager获取项目路径（与ActionCommand一致）
    const projectPath = await this.getProjectPath()
    logger.info(`📍 [RememberCommand] 项目根路径: ${projectPath}`)
    
    const memoryDir = path.join(projectPath, '.promptx', 'memory')
    logger.info(`📁 [RememberCommand] 创建记忆目录: ${memoryDir}`)
    
    await fs.ensureDir(memoryDir)
    logger.success(`📁 [RememberCommand] 记忆目录确保完成: ${memoryDir}`)
    
    return memoryDir
  }

  /**
   * 🎯 获取当前激活角色（Context参数优先，默认为default）
   */
  async getCurrentRole(context) {
    try {
      logger.info(`🎭 [RememberCommand] === getCurrentRole开始 ===`)
      
      // 🎯 优先使用context.role_id参数
      if (context && context.role_id) {
        logger.success(`🎭 [RememberCommand] 从context参数获取角色: "${context.role_id}"`)
        logger.info(`🎭 [RememberCommand] === getCurrentRole完成 === 返回角色: ${context.role_id}`)
        return context.role_id
      }
      
      // 🎯 无Context时使用默认角色
      logger.info(`🎭 [RememberCommand] 无context.role_id，使用默认角色: default`)
      logger.info(`🎭 [RememberCommand] === getCurrentRole完成 === 返回默认角色: default`)
      return 'default'
      
    } catch (error) {
      logger.error(`❌ [RememberCommand] getCurrentRole失败: ${error.message}`)
      logger.warn(`🎭 [RememberCommand] === getCurrentRole完成 === 返回默认角色: default (错误回退)`)
      return 'default'
    }
  }

  /**
   * 获取项目路径（复用ActionCommand逻辑）
   */
  async getProjectPath() {
    logger.debug('📍 [RememberCommand] 获取项目路径...')
    
    // 🚀 新架构：直接使用ProjectManager的当前项目状态
    const ProjectManager = require('../../../utils/ProjectManager')
    const projectPath = ProjectManager.getCurrentProjectPath()
    
    if (process.env.PROMPTX_DEBUG === 'true') {
      logger.debug(`📍 [RememberCommand] 项目路径解析结果: ${projectPath}`)
    }
    
    return projectPath
  }

  /**
   * 格式化为XML记忆项
   */
  formatXMLMemoryItem (value) {
    logger.debug('🏷️ [RememberCommand] 开始格式化XML记忆项...')
    
    const now = new Date()
    const timestamp = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const id = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    logger.debug(`🏷️ [RememberCommand] 生成记忆ID: ${id}`)
    logger.debug(`🏷️ [RememberCommand] 时间戳: ${timestamp}`)

    // 自动生成标签
    const tags = this.generateTags(value)
    logger.debug(`🏷️ [RememberCommand] 自动生成标签: ${tags}`)

    // XML转义
    const escapedContent = this.escapeXML(value)
    const escapedTags = this.escapeXML(tags)
    
    logger.debug(`🏷️ [RememberCommand] XML转义完成 - 内容长度: ${escapedContent.length}`)
    if (escapedContent !== value) {
      logger.info('🔄 [RememberCommand] 检测到特殊字符，已进行XML转义')
    }

    return {
      id,
      timestamp,
      content: escapedContent,
      tags: escapedTags,
      rawContent: value,
      rawTags: tags
    }
  }

  /**
   * XML转义函数
   */
  escapeXML (text) {
    if (typeof text !== 'string') {
      return text
    }
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
  }

  /**
   * 格式化内容缩进（添加适当的缩进让XML更美观）
   */
  formatContentWithIndent (content, indentLevel = 3) {
    if (typeof content !== 'string') {
      return content
    }
    
    // 基础缩进字符串（每级2个空格）
    const baseIndent = '  '.repeat(indentLevel)
    
    // 分割内容为行
    const lines = content.split('\n')
    
    // 格式化每一行，添加缩进
    const formattedLines = lines.map((line, index) => {
      // 第一行和最后一行特殊处理
      if (index === 0 && index === lines.length - 1) {
        // 单行内容
        return line.trim() ? `\n${baseIndent}${line.trim()}\n    ` : line
      } else if (index === 0) {
        // 第一行
        return line.trim() ? `\n${baseIndent}${line.trim()}` : `\n${baseIndent}`
      } else if (index === lines.length - 1) {
        // 最后一行
        return line.trim() ? `${baseIndent}${line.trim()}\n    ` : `\n    `
      } else {
        // 中间行
        return line.trim() ? `${baseIndent}${line.trim()}` : baseIndent.substring(2) // 空行保持基础缩进
      }
    })
    
    return formattedLines.join('\n')
  }

  /**
   * 追加到XML文件
   */
  async appendToXMLFile (xmlFile, memoryItem) {
    logger.debug(`💾 [RememberCommand] 检查XML文件是否存在: ${xmlFile}`)
    
    // 格式化内容缩进
    const formattedContent = this.formatContentWithIndent(memoryItem.content)
    
    // 检查文件是否存在以及是否为空
    const fileExists = await fs.pathExists(xmlFile)
    let fileIsEmpty = false
    
    if (fileExists) {
      const stats = await fs.stat(xmlFile)
      fileIsEmpty = stats.size === 0
      logger.debug(`💾 [RememberCommand] XML文件状态检查 - 存在: ${fileExists}, 大小: ${stats.size}字节, 为空: ${fileIsEmpty}`)
    }
    
    // 初始化XML文件（如果不存在或为空）
    if (!fileExists || fileIsEmpty) {
      if (fileIsEmpty) {
        logger.info('📄 [RememberCommand] XML文件存在但为空，重新初始化...')
      } else {
        logger.info('📄 [RememberCommand] XML文件不存在，创建新文件...')
      }
      
      const initialXML = `<?xml version="1.0" encoding="UTF-8"?>
<memory>
  <item id="${memoryItem.id}" time="${memoryItem.timestamp}">
    <content>${formattedContent}</content>
    <tags>${memoryItem.tags}</tags>
  </item>
</memory>`
      
      await fs.writeFile(xmlFile, initialXML, 'utf8')
      logger.success('📄 [RememberCommand] XML文件初始化完成')
      logger.debug(`📄 [RememberCommand] 初始XML内容长度: ${initialXML.length}字符`)
      
      return 'created'
    }

    logger.info('📄 [RememberCommand] XML文件已存在且有内容，追加新记忆项...')
    
    // 读取现有XML并添加新项
    const content = await fs.readFile(xmlFile, 'utf8')
    logger.debug(`📄 [RememberCommand] 读取现有XML文件 - 长度: ${content.length}字符`)
    
    // 验证XML文件格式
    if (!content.includes('</memory>')) {
      logger.warn('📄 [RememberCommand] XML文件格式异常，缺少</memory>标签，重新初始化...')
      // 重新初始化文件
      const initialXML = `<?xml version="1.0" encoding="UTF-8"?>
<memory>
  <item id="${memoryItem.id}" time="${memoryItem.timestamp}">
    <content>${formattedContent}</content>
    <tags>${memoryItem.tags}</tags>
  </item>
</memory>`
      
      await fs.writeFile(xmlFile, initialXML, 'utf8')
      logger.success('📄 [RememberCommand] XML文件重新初始化完成')
      return 'created'
    }
    
    // 找到</memory>标签的位置，在它之前插入新的记忆项
    const newItem = `  <item id="${memoryItem.id}" time="${memoryItem.timestamp}">
    <content>${formattedContent}</content>
    <tags>${memoryItem.tags}</tags>
  </item>`
    
    const updatedContent = content.replace('</memory>', `${newItem}
</memory>`)
    
    logger.debug(`📄 [RememberCommand] 新XML内容长度: ${updatedContent.length}字符`)
    logger.debug(`📄 [RememberCommand] 新增记忆项ID: ${memoryItem.id}`)
    
    await fs.writeFile(xmlFile, updatedContent, 'utf8')
    logger.success('📄 [RememberCommand] XML文件追加完成')
    
    return 'created'
  }

  /**
   * 从legacy Markdown格式迁移到XML格式
   */
  async migrateLegacyMemoriesIfNeeded (memoryDir) {
    const legacyFile = path.join(memoryDir, 'declarative.md')
    const xmlFile = path.join(memoryDir, 'declarative.dpml')
    const backupFile = path.join(memoryDir, 'declarative.md.bak')

    logger.debug(`🔄 [RememberCommand] 检查迁移需求 - legacy: ${legacyFile}, xml: ${xmlFile}`)

    // 如果XML文件已存在，说明已经迁移过了
    if (await fs.pathExists(xmlFile)) {
      logger.debug('🔄 [RememberCommand] XML文件已存在，无需迁移')
      return
    }

    // 如果legacy文件不存在，无需迁移
    if (!await fs.pathExists(legacyFile)) {
      logger.debug('🔄 [RememberCommand] Legacy文件不存在，无需迁移')
      return
    }

    logger.step('🔄 [RememberCommand] 正在迁移记忆数据从Markdown到XML格式...')

    try {
      // 读取legacy文件
      const legacyContent = await fs.readFile(legacyFile, 'utf8')
      logger.info(`🔄 [RememberCommand] 读取legacy文件 - 长度: ${legacyContent.length}字符`)
      
      // 解析legacy记忆
      const legacyMemories = this.parseLegacyMemories(legacyContent)
      logger.info(`🔄 [RememberCommand] 解析到 ${legacyMemories.length} 条legacy记忆`)
      
      // 创建XML文件
      let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n<memory>\n'
      
      for (const memory of legacyMemories) {
        const escapedContent = this.escapeXML(memory.content)
        const escapedTags = this.escapeXML(memory.tags.join(' '))
        const id = `legacy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        logger.debug(`🔄 [RememberCommand] 迁移记忆项: ${memory.content.substring(0, 30)}...`)
        
        xmlContent += `  <item id="${id}" time="${memory.timestamp}">
    <content>${escapedContent}</content>
    <tags>${escapedTags}</tags>
  </item>
`
      }
      
      xmlContent += '</memory>'
      
      // 写入XML文件
      await fs.writeFile(xmlFile, xmlContent, 'utf8')
      logger.success(`🔄 [RememberCommand] XML文件创建成功 - 长度: ${xmlContent.length}字符`)
      
      // 备份legacy文件
      await fs.move(legacyFile, backupFile)
      logger.success(`🔄 [RememberCommand] Legacy文件备份到: ${backupFile}`)
      
      logger.success(`🔄 [RememberCommand] 成功迁移${legacyMemories.length}条记忆到XML格式`)
      
    } catch (error) {
      logger.error(`🔄 [RememberCommand] 记忆迁移失败: ${error.message}`)
      logger.debug(`🔄 [RememberCommand] 迁移错误堆栈: ${error.stack}`)
      throw new Error(`记忆迁移失败: ${error.message}`)
    }
  }

  /**
   * 解析legacy Markdown格式的记忆（支持START-END多行格式）
   */
  parseLegacyMemories (content) {
    logger.debug('🔍 [RememberCommand] 开始解析Legacy记忆，支持START-END多行格式')
    
    const memories = []
    
    // 🎯 首先尝试解析START-END多行格式
    const multiLineMemories = this.parseMultiLineMemories(content)
    memories.push(...multiLineMemories)
    
    // 🎯 只有在没有找到多行格式时才解析单行格式（避免重复）
    if (multiLineMemories.length === 0) {
      logger.info('🔍 [RememberCommand] 未找到START-END格式，尝试单行格式解析')
      const singleLineMemories = this.parseSingleLineMemories(content)
      memories.push(...singleLineMemories)
      logger.success(`🔍 [RememberCommand] 单行格式解析完成 - ${singleLineMemories.length} 条记忆`)
    } else {
      logger.success(`🔍 [RememberCommand] 多行格式解析完成 - ${multiLineMemories.length} 条记忆，跳过单行解析`)
    }
    
    logger.success(`🔍 [RememberCommand] Legacy记忆解析完成 - 总计: ${memories.length} 条`)
    
    return memories
  }

  /**
   * 解析START-END多行格式记忆
   */
  parseMultiLineMemories (content) {
    logger.debug('📝 [RememberCommand] 解析START-END多行格式记忆')
    
    const memories = []
    const blocks = this.parseMemoryBlocks(content)
    
    for (const block of blocks) {
      const memory = this.parseMemoryBlock(block)
      if (memory) {
        memories.push(memory)
        logger.debug(`📝 [RememberCommand] 成功解析多行记忆: "${memory.content.substring(0, 30)}..."`)
      }
    }
    
    logger.debug(`📝 [RememberCommand] 多行格式解析完成 - ${memories.length} 条记忆`)
    return memories
  }

  /**
   * 解析记忆块（START-END格式）
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
      tags
    }
  }

  /**
   * 解析单行格式记忆（向后兼容）
   */
  parseSingleLineMemories (content) {
    logger.debug('📄 [RememberCommand] 解析单行格式记忆（向后兼容）')
    
    const memories = []
    const lines = content.split('\n')
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      
      // 跳过START-END格式的行（避免重复解析）
      if (trimmedLine.includes(' START') || trimmedLine === '- END' || trimmedLine.startsWith('--tags')) {
        continue
      }
      
      // 解析标准单行格式：- 2025/01/15 14:30 内容 #标签 #评分:8 #有效期:长期
      const match = trimmedLine.match(/^- (\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}) (.+)$/)
      if (match) {
        const [, timestamp, contentAndTags] = match
        
        // 分离内容和标签
        let content = contentAndTags
        let tags = []
        
        // 提取 --tags 后面的内容
        const tagsMatch = contentAndTags.match(/--tags\s+(.*)/)
        if (tagsMatch) {
          content = contentAndTags.substring(0, contentAndTags.indexOf('--tags')).trim()
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
        
        memories.push({
          timestamp,
          content,
          tags
        })
        
        logger.debug(`📄 [RememberCommand] 成功解析单行记忆: "${content.substring(0, 30)}..."`)
      }
    }
    
    logger.debug(`📄 [RememberCommand] 单行格式解析完成 - ${memories.length} 条记忆`)
    return memories
  }

  /**
   * 自动生成标签
   */
  generateTags (value) {
    const tags = []
    const lowerValue = value.toLowerCase()

    // 基于value生成标签
    if (lowerValue.includes('最佳实践') || lowerValue.includes('规则')) tags.push('#最佳实践')
    if (lowerValue.includes('流程') || lowerValue.includes('步骤')) tags.push('#流程管理')
    if (lowerValue.includes('命令') || lowerValue.includes('工具')) tags.push('#工具使用')

    return tags.join(' ') || '#其他'
  }

  /**
   * 格式化保存响应（XML版本）
   */
  formatSaveResponse (value, memoryEntry) {
    const { action, timestamp, format, filePath } = memoryEntry

    const actionLabels = {
      created: '✅ AI已内化新记忆（XML格式）'
    }

    return `${actionLabels[action]}：${value}

## 📋 记忆详情
- **存储格式**: ${format.toUpperCase()}
- **内化时间**: ${timestamp.split('T')[0]}
- **存储路径**: ${path.basename(filePath)}
- **知识内容**: ${value.length > 100 ? value.substring(0, 100) + '...' : value}

## 🎯 能力增强效果
- ✅ **知识已内化到AI长期记忆（XML结构化存储）**
- ✅ **支持精确的内容检索和标签搜索**
- ✅ **可通过recall命令主动检索**
- ✅ **支持跨会话记忆保持**
- ✅ **自动从legacy格式迁移**

## 🔄 下一步行动：
- 记忆检索: 使用 MCP PromptX recall 工具验证知识内化效果
- 能力强化: 使用 MCP PromptX learn 工具学习相关知识增强记忆
- 应用实践: 使用 MCP PromptX action 工具在实际场景中运用记忆

📍 当前状态：memory_saved_xml`
  }

  /**
   * 获取使用帮助（纯XML模式）
   */
  getUsageHelp () {
    return `🧠 **Remember锦囊 - AI记忆增强系统（纯XML模式）**

## 📖 基本用法
通过 MCP PromptX remember 工具内化知识

## 🆕 升级特性
- **纯XML存储**: 统一使用XML格式，性能更优
- **自动备份**: 升级前自动创建安全备份
- **Legacy迁移**: 自动迁移旧格式数据
- **数据安全**: 多重备份保护机制

## 🛡️ 安全保障
- 升级前自动备份所有数据
- Legacy数据自动迁移到XML格式
- 出错时提供恢复建议和备份位置

## 💡 记忆内化示例

### 📝 AI记忆内化
AI学习和内化各种专业知识：
- "构建代码 → 运行测试 → 部署到staging → 验证功能 → 发布生产"
- "用户反馈视频加载慢，排查发现是CDN配置问题，修改后加载速度提升60%"
- "React Hooks允许在函数组件中使用state和其他React特性"
- "每个PR至少需要2个人review，必须包含测试用例"

## 🆕 XML记忆模式特性
- **结构化存储**: 使用XML格式存储，支持更精确的数据管理
- **自动迁移**: 从legacy Markdown格式自动迁移到XML
- **XML转义**: 自动处理特殊字符，确保数据完整性
- **向后兼容**: 继续支持读取legacy格式记忆

## 🔍 记忆检索与应用
- 使用 MCP PromptX recall 工具主动检索记忆
- 使用 MCP PromptX action 工具运用记忆激活角色

🔄 下一步行动：
  - 开始记忆: 使用 MCP PromptX remember 工具内化第一条知识
  - 学习资源: 使用 MCP PromptX learn 工具学习新知识再内化`
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
          name: '学习强化',
          description: '学习相关知识加强记忆',
          method: 'MCP PromptX learn 工具',
          priority: 'medium'
        },
        {
          name: '应用记忆',
          description: '在实际场景中应用记忆',
          method: 'MCP PromptX action 工具',
          priority: 'medium'
        },
        {
          name: '继续内化',
          description: 'AI继续内化更多知识',
          method: 'MCP PromptX remember 工具',
          priority: 'low'
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
