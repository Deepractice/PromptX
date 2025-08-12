const BasePouchCommand = require('../BasePouchCommand')
const fs = require('fs-extra')
const path = require('path')
const os = require('os')
const { getGlobalResourceManager } = require('../../resource')
const ProjectManager = require('../../../utils/ProjectManager')
const { getGlobalProjectManager } = require('../../../utils/ProjectManager')
const { getGlobalServerEnvironment } = require('../../../utils/ServerEnvironment')
const ProjectDiscovery = require('../../resource/discovery/ProjectDiscovery')
const UserDiscovery = require('../../resource/discovery/UserDiscovery')
const logger = require('../../../utils/logger')

/**
 * 角色欢迎锦囊命令
 * 负责展示可用的AI角色和领域专家
 */
class WelcomeCommand extends BasePouchCommand {
  constructor () {
    super()
    // 使用全局单例 ResourceManager
    this.resourceManager = getGlobalResourceManager()
    this.projectManager = getGlobalProjectManager()
  }

  getPurpose () {
    return '为AI提供可用角色和工具信息，以便AI向主人汇报专业服务选项'
  }

  /**
   * 刷新所有资源（注册表文件 + ResourceManager）
   * 这是 welcome 命令的核心功能，确保能发现所有最新的资源
   */
  async refreshAllResources() {
    try {
      // 1. 刷新注册表文件
      await this.refreshAllRegistries()
      
      // 2. 刷新 ResourceManager，重新加载所有资源
      logger.info('[WelcomeCommand] Refreshing ResourceManager to discover new resources...')
      await this.resourceManager.initializeWithNewArchitecture()
      
    } catch (error) {
      logger.warn('[WelcomeCommand] 资源刷新失败:', error.message)
      // 不抛出错误，确保 welcome 命令能继续执行
    }
  }

  /**
   * 刷新所有注册表
   * 在加载资源前先刷新注册表，确保显示最新的资源
   */
  async refreshAllRegistries() {
    try {
      logger.info('[WelcomeCommand] 开始刷新所有注册表...')
      
      // 1. User 级注册表刷新（如果目录存在）
      const userResourceDir = path.join(os.homedir(), '.promptx/resource')
      if (await fs.pathExists(userResourceDir)) {
        const userDiscovery = new UserDiscovery()
        await userDiscovery.generateRegistry()
        logger.info('[WelcomeCommand] User 级注册表已刷新')
      } else {
        logger.debug('[WelcomeCommand] User 级资源目录不存在，跳过刷新')
      }
      
      // 2. Project 级注册表刷新
      try {
        const projectDiscovery = new ProjectDiscovery()
        await projectDiscovery.generateRegistry()
        logger.info('[WelcomeCommand] Project 级注册表已刷新')
      } catch (error) {
        logger.debug('[WelcomeCommand] Project 级注册表刷新失败（可能不在项目中）:', error.message)
      }
      
      // 3. Package 级通常不需要刷新（构建时生成）
      logger.debug('[WelcomeCommand] Package 级注册表无需刷新（构建时生成）')
      
    } catch (error) {
      logger.warn('[WelcomeCommand] 注册表刷新失败:', error.message)
    }
  }

  /**
   * 动态加载角色注册表 - 使用新的RegistryData架构
   */
  async loadRoleRegistry () {
    logger.info('[WelcomeCommand] Loading role registry...')
    
    // 资源刷新已经在 getContent 中的 refreshAllResources 完成
    // 这里直接使用ResourceManager的注册表
    const roles = this.resourceManager.registryData.getResourcesByProtocol('role')
    
    // 记录加载的角色信息
    logger.info('[WelcomeCommand] Loaded roles:', {
      count: roles.length,
      roleList: roles.map(r => ({
        id: r.id,
        source: r.source,
        reference: r.reference
      }))
    })
    
    return roles
  }

  /**
   * 动态加载工具注册表
   */
  async loadToolRegistry () {
    // 资源刷新已经在 getContent 中的 refreshAllResources 完成
    // 这里直接使用ResourceManager的注册表
    
    // 获取tool和manual资源
    const tools = this.resourceManager.registryData.getResourcesByProtocol('tool')
    const manuals = this.resourceManager.registryData.getResourcesByProtocol('manual')
    
    // 将工具和手册关联起来，保留source信息
    const toolsWithManuals = {}
    tools.forEach(tool => {
      const manual = manuals.find(m => m.id === tool.id && m.source === tool.source)
      toolsWithManuals[tool.id] = {
        id: tool.id,
        name: tool.name || tool.id,
        description: tool.description || '工具功能描述',
        source: tool.source || 'unknown',
        reference: tool.reference,
        manual: manual ? `@manual://${manual.id}` : null
      }
    })
    
    return toolsWithManuals
  }

  /**
   * 从角色内容中提取角色名称
   * @param {string} content - 角色文件内容
   * @returns {string|null} 角色名称
   */
  extractRoleNameFromContent(content) {
    if (!content || typeof content !== 'string') {
      return null
    }
    
    // 提取Markdown标题
    const match = content.match(/^#\s*(.+)$/m)
    return match ? match[1].trim() : null
  }

  /**
   * 从角色内容中提取描述
   * @param {string} content - 角色文件内容
   * @returns {string|null} 角色描述
   */
  extractDescriptionFromContent(content) {
    if (!content || typeof content !== 'string') {
      return null
    }
    
    // 提取Markdown引用（描述）
    const match = content.match(/^>\s*(.+)$/m)
    return match ? match[1].trim() : null
  }

  /**
   * 从角色信息中提取描述（保持向后兼容）
   * @param {Object} roleInfo - 角色信息对象
   * @returns {string} 角色描述
   */
  extractDescription(roleInfo) {
    // 尝试从不同字段提取描述
    if (roleInfo.description) {
      return roleInfo.description
    }
    
    // 如果有更多元数据，可以在这里扩展提取逻辑
    return null
  }

  /**
   * 获取所有角色列表（转换为数组格式）
   */
  async getAllRoles () {
    const registry = await this.loadRoleRegistry()
    return Object.entries(registry).map(([id, roleInfo]) => ({
      id,
      name: roleInfo.name,
      description: roleInfo.description,
      file: roleInfo.file,
      source: roleInfo.source
    }))
  }

  /**
   * 获取来源标签
   * @param {string} source - 资源来源
   * @param {string} type - 资源类型 ('role' 或 'tool')
   * @returns {string} 来源标签
   */
  getSourceLabel(source, type = 'role') {
    if (type === 'tool') {
      switch (source) {
        case 'package':
          return '📦 系统工具'
        case 'project':
          return '🏗️ 项目工具'
        case 'user':
          return '👤 用户工具'
        case 'merged':
          return '📦 系统工具'
        default:
          return '❓ 未知来源'
      }
    }
    
    // 角色标签
    switch (source) {
      case 'package':
        return '📦 系统角色'
      case 'project':
        return '🏗️ 项目角色'
      case 'user':
        return '👤 用户角色'
      case 'merged':
        return '📦 系统角色' // merged来源的资源主要来自package
      case 'fallback':
        return '🔄 默认角色'
      default:
        return '❓ 未知来源'
    }
  }

  async getContent (args) {
    // 首先刷新所有资源，确保发现最新的角色和工具
    await this.refreshAllResources()
    
    const roleRegistry = await this.loadRoleRegistry()
    const toolRegistry = await this.loadToolRegistry()
    const allRoles = Object.values(roleRegistry)
    const allTools = Object.values(toolRegistry)
    const totalRoles = allRoles.length
    const totalTools = allTools.length

    let content = `🤖 **AI专业服务清单** (共 ${totalRoles} 个专业角色 + ${totalTools} 个工具可供使用)

> 💡 **使用说明**：以下是可激活的AI专业角色和可调用的工具。每个都有唯一的ID，可通过MCP工具使用。


## 📋 可用角色列表

`

    // 按来源分组显示角色
    const rolesBySource = {}
    allRoles.forEach(role => {
      const source = role.source || 'unknown'
      if (!rolesBySource[source]) {
        rolesBySource[source] = []
      }
      rolesBySource[source].push(role)
    })

    let roleIndex = 1
    
    // User 级优先显示（优先级最高）
    const sourceOrder = ['user', 'project', 'package', 'merged', 'fallback', 'unknown']
    
    for (const source of sourceOrder) {
      if (!rolesBySource[source] || rolesBySource[source].length === 0) continue
      
      const sourceLabel = this.getSourceLabel(source)
      content += `### ${sourceLabel}\n\n`
      
      rolesBySource[source].forEach(role => {
        content += `#### ${roleIndex}. \`${role.id}\` - ${role.name}
**专业能力**: ${role.description}  
**来源**: ${sourceLabel}

---

`
        roleIndex++
      })
    }

    // 添加工具列表
    content += `
## 🔧 可用工具列表

`
    
    // 按来源分组显示工具
    const toolsBySource = {}
    allTools.forEach(tool => {
      const source = tool.source || 'unknown'
      if (!toolsBySource[source]) {
        toolsBySource[source] = []
      }
      toolsBySource[source].push(tool)
    })
    
    let toolIndex = 1
    
    for (const source of sourceOrder) {
      if (!toolsBySource[source] || toolsBySource[source].length === 0) continue
      
      const sourceLabel = this.getSourceLabel(source, 'tool')
      content += `### ${sourceLabel}\n\n`
      
      toolsBySource[source].forEach(tool => {
        content += `#### ${toolIndex}. \`${tool.id}\` - ${tool.name}
**功能描述**: ${tool.description}  
**使用手册**: ${tool.manual || '暂无手册'}  
**来源**: ${sourceLabel}

---

`
        toolIndex++
      })
    }

    content += `
## 🎯 **使用指南**

### 📋 角色激活
- 使用 **MCP PromptX 工具** 中的 \`action\` 功能
- 选择需要的角色ID进行激活
- 激活后AI将具备该角色的专业技能

### 🔧 工具使用
- **第一步**：通过 \`@manual://tool-name\` 查看工具手册
- **第二步**：理解工具功能和参数要求
- **第三步**：使用 \`promptx_tool\` 执行工具
- **重要**：禁止在未阅读手册的情况下使用工具！

### ⚡ 效果说明
- ✅ **角色激活** - 获得专业思维和技能
- ✅ **工具调用** - 执行具体的功能操作
- ✅ **安全使用** - 先读手册，再用工具
`

    return content
  }

  async getPATEOAS (args) {
    const allRoles = await this.getAllRoles()
    const toolRegistry = await this.loadToolRegistry()
    const allTools = Object.values(toolRegistry)
    
    const availableRoles = allRoles.map(role => ({
      roleId: role.id,
      name: role.name,
      source: role.source
    }))
    
    const availableTools = allTools.map(tool => ({
      toolId: tool.id,
      name: tool.name,
      source: tool.source,
      manual: tool.manual
    }))

    return {
      currentState: 'service_discovery',
      availableTransitions: ['action', 'learn', 'init', 'recall', 'tool'],
      nextActions: [
        {
          name: '向主人汇报服务选项',
          description: '将上述专业角色和工具清单告知主人，并询问需求',
          method: 'MCP PromptX action/tool 工具',
          priority: 'critical',
          instruction: '必须先询问主人需求，不要自主选择角色或工具'
        },
        {
          name: '工具使用流程',
          description: '如需使用工具，必须先查看manual手册',
          method: '1. 查看@manual://tool-name 2. 使用promptx_tool',
          priority: 'high',
          instruction: '严格遵循先读手册后使用的原则'
        }
      ],
      metadata: {
        totalRoles: allRoles.length,
        totalTools: allTools.length,
        availableRoles,
        availableTools,
        dataSource: 'RegistryData v2.0',
        systemVersion: '锦囊串联状态机 v1.0',
        designPhilosophy: 'AI use MCP tools for role activation and tool execution'
      }
    }
  }

  /**
   * 获取角色信息（提供给其他命令使用）
   */
  async getRoleInfo (roleId) {
    logger.debug(`[WelcomeCommand] getRoleInfo调用，角色ID: ${roleId}`)
    
    const registry = await this.loadRoleRegistry()
    logger.debug(`[WelcomeCommand] 注册表加载完成，包含角色:`, Object.keys(registry))
    
    const roleData = registry[roleId]
    logger.debug(`[WelcomeCommand] 查找角色${roleId}结果:`, roleData ? '找到' : '未找到')

    if (!roleData) {
      logger.debug(`[WelcomeCommand] 角色${roleId}在注册表中不存在`)
      return null
    }

    const result = {
      id: roleId,
      name: roleData.name,
      description: roleData.description,
      file: roleData.file
    }
    
    logger.debug(`[WelcomeCommand] 返回角色信息:`, result)
    return result
  }

  /**
   * 未来扩展：动态角色发现
   * TODO: 实现真正的文件扫描和解析
   */
  async discoverAvailableDomains () {
    // 现在基于注册表返回角色ID列表
    const allRoles = await this.getAllRoles()
    return allRoles.map(role => role.id)
  }

  /**
   * 注意：原来的discoverLocalRoles方法已被移除
   * 现在使用SimplifiedRoleDiscovery.discoverAllRoles()替代
   * 这避免了glob依赖和跨平台兼容性问题
   */

  /**
   * 调试方法：打印所有注册的资源
   */
  async debugRegistry() {
    await this.loadRoleRegistry()
    
    logger.info('\n🔍 WelcomeCommand - 注册表调试信息')
    logger.info('='.repeat(50))
    
    if (this.roleRegistry && Object.keys(this.roleRegistry).length > 0) {
      logger.info(`📊 发现 ${Object.keys(this.roleRegistry).length} 个角色资源:\n`)
      
      Object.entries(this.roleRegistry).forEach(([id, roleInfo]) => {
        logger.info(`🎭 ${id}`)
        logger.info(`   名称: ${roleInfo.name || '未命名'}`)
        logger.info(`   描述: ${roleInfo.description || '无描述'}`)
        logger.info(`   文件: ${roleInfo.file}`)
        logger.info(`   来源: ${roleInfo.source || '未知'}`)
        logger.info('')
      })
    } else {
      logger.info('🔍 没有发现任何角色资源')
    }
    
    // 显示RegistryData统计信息
    logger.info('\n📋 RegistryData 统计信息:')
    if (this.resourceManager && this.resourceManager.registryData) {
      const stats = this.resourceManager.registryData.getStats()
      logger.info(`总资源数: ${stats.totalResources}`)
      logger.info(`按协议分布: ${JSON.stringify(stats.byProtocol, null, 2)}`)
      logger.info(`按来源分布: ${JSON.stringify(stats.bySource, null, 2)}`)
    } else {
      logger.info('❌ RegistryData 不可用')
    }
  }

  /**
   * 重写execute方法以添加多项目状态检查
   */
  async execute (args = []) {
    // 从执行上下文获取MCP信息
    const mcpId = this.detectMcpId()
    const ideType = await this.detectIdeType()
    
    // 获取多项目状态提示
    const projectPrompt = await this.projectManager.generateTopLevelProjectPrompt('list', mcpId, ideType)
    
    const purpose = this.getPurpose()
    const content = await this.getContent(args)
    const pateoas = await this.getPATEOAS(args)

    return this.formatOutputWithProjectCheck(purpose, content, pateoas, projectPrompt)
  }

  /**
   * 检测MCP进程ID
   */
  detectMcpId() {
    const serverEnv = getGlobalServerEnvironment()
    if (serverEnv.isInitialized()) {
      return serverEnv.getMcpId()
    }
    return ProjectManager.generateMcpId()
  }

  /**
   * 检测IDE类型 - 从配置文件读取，移除环境变量检测
   */
  async detectIdeType() {
    const mcpId = this.detectMcpId()
    return await this.projectManager.getIdeType(mcpId)
  }
  
  /**
   * 格式化带有项目检查的输出
   */
  formatOutputWithProjectCheck(purpose, content, pateoas, projectPrompt) {
    const output = {
      purpose,
      content,
      pateoas,
      context: this.context,
      format: this.outputFormat,
      projectPrompt
    }

    if (this.outputFormat === 'json') {
      return output
    }

    // 人类可读格式
    return {
      ...output,
      toString () {
        const divider = '='.repeat(60)
        const nextSteps = (pateoas.nextActions || [])
          .map(action => `  - ${action.name}: ${action.description}\n    方式: ${action.method || action.command || '通过MCP工具'}`)
          .join('\n')

        return `${projectPrompt}

${divider}
🎯 锦囊目的：${purpose}
${divider}

📜 锦囊内容：
${content}

🔄 下一步行动：
${nextSteps}

📍 当前状态：${pateoas.currentState}
${divider}
`
      }
    }
  }
}

module.exports = WelcomeCommand
