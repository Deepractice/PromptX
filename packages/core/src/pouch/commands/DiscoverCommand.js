const BasePouchCommand = require('../BasePouchCommand')
const DiscoverHeaderArea = require('../areas/discover/DiscoverHeaderArea')
const RoleListArea = require('../areas/discover/RoleListArea')
const ToolListArea = require('../areas/discover/ToolListArea')
const StateArea = require('../areas/common/StateArea')
const fs = require('fs-extra')
const path = require('path')
const os = require('os')
const { getGlobalResourceManager } = require('../../resource')
const ProjectManager = require('~/project/ProjectManager')
const { getGlobalProjectManager } = require('~/project/ProjectManager')
const ProjectDiscovery = require('../../project/ProjectDiscovery')
const UserDiscovery = require('../../resource/discovery/UserDiscovery')
const { getRolexBridge } = require('../../rolex/RolexBridge')
const logger = require('@promptx/logger')

/**
 * 发现命令
 * 负责展示可用的AI角色和工具
 * 使用Area架构组装输出
 */
class DiscoverCommand extends BasePouchCommand {
  constructor () {
    super()
    // 使用全局单例 ResourceManager
    this.resourceManager = getGlobalResourceManager()
    this.projectManager = getGlobalProjectManager()
  }

  /**
   * 组装Areas
   */
  async assembleAreas(args) {
    // 首先刷新所有资源
    await this.refreshAllResources()
    
    // 加载角色和工具
    const roleRegistry = await this.loadRoleRegistry()
    const toolRegistry = await this.loadToolRegistry()
    
    // 按来源分组
    const roleCategories = this.categorizeBySource(roleRegistry)
    const toolCategories = this.categorizeBySource(toolRegistry)
    
    // 统计信息
    const stats = this.calculateStats(roleCategories, toolCategories)
    
    // 注册Areas
    const headerArea = new DiscoverHeaderArea(stats)
    this.registerArea(headerArea)
    
    const roleArea = new RoleListArea(roleCategories)
    this.registerArea(roleArea)
    
    const toolArea = new ToolListArea(toolCategories)
    this.registerArea(toolArea)
    
    const stateArea = new StateArea('discover_completed')
    this.registerArea(stateArea)
  }
  
  /**
   * 按来源分组资源
   */
  categorizeBySource(registry) {
    const logger = require('@promptx/logger')
    const categories = {
      system: [],
      project: [],
      user: [],
      rolex: []
    }
    
    const items = Object.values(registry)
    logger.info(`[DiscoverCommand] Starting to categorize ${items.length} resources`)
    
    // 统计各种 source 值
    const sourceCounts = {}
    items.forEach(item => {
      const src = item.source || 'undefined'
      sourceCounts[src] = (sourceCounts[src] || 0) + 1
    })
    logger.info(`[DiscoverCommand] Original source distribution: ${JSON.stringify(sourceCounts)}`)
    
    items.forEach(item => {
      const source = this.normalizeSource(item.source)
      if (categories[source]) {
        categories[source].push(item)
      }
    })
    
    logger.info(`[DiscoverCommand] Categorization result: system=${categories.system.length}, project=${categories.project.length}, user=${categories.user.length}`)
    
    return categories
  }
  
  /**
   * 标准化来源
   */
  normalizeSource(source) {
    const logger = require('@promptx/logger')
    logger.info(`[DiscoverCommand] normalizeSource input: "${source}" (type: ${typeof source})`)
    
    // 转换为小写进行比较
    const lowerSource = String(source).toLowerCase()
    
    if (lowerSource === 'user') return 'user'
    if (lowerSource === 'project') return 'project'
    if (lowerSource === 'rolex') return 'rolex'
    if (['package', 'merged', 'fallback', 'system'].includes(lowerSource)) {
      logger.info(`[DiscoverCommand] normalizeSource: "${source}" -> "system"`)
      return 'system'
    }
    logger.info(`[DiscoverCommand] normalizeSource: "${source}" -> "system" (default)`)
    return 'system'
  }
  
  /**
   * 计算统计信息
   */
  calculateStats(roleCategories, toolCategories) {
    const systemRoles = roleCategories.system?.length || 0
    const projectRoles = roleCategories.project?.length || 0
    const userRoles = roleCategories.user?.length || 0
    const rolexRoles = roleCategories.rolex?.length || 0
    const systemTools = toolCategories.system?.length || 0
    const projectTools = toolCategories.project?.length || 0
    const userTools = toolCategories.user?.length || 0

    return {
      totalRoles: systemRoles + projectRoles + userRoles + rolexRoles,
      systemRoles,
      projectRoles,
      userRoles,
      rolexRoles,
      totalTools: systemTools + projectTools + userTools,
      systemTools,
      projectTools,
      userTools
    }
  }

  /**
   * 刷新所有资源（注册表文件 + ResourceManager）
   * 这是 discover 命令的核心功能，确保能发现所有最新的资源
   */
  async refreshAllResources() {
    try {
      // 1. 刷新注册表文件
      await this.refreshAllRegistries()
      
      // 🔍 Knuth调试：验证注册表文件更新
      const fs = require('fs-extra')
      const userRegistryPath = require('os').homedir() + '/.promptx/resource/user.registry.json'
      if (await fs.pathExists(userRegistryPath)) {
        const registry = await fs.readJson(userRegistryPath)
        const tools = registry.resources?.filter(r => r.protocol === 'tool').map(r => r.id) || []
        logger.info(`[DiscoverCommand] Tools in user registry: ${tools.join(', ') || 'none'}`)
      }
      
      // 2. 刷新 ResourceManager，重新加载所有资源
      logger.info('[DiscoverCommand] Refreshing ResourceManager to discover new resources...')
      await this.resourceManager.initializeWithNewArchitecture()
      
      // 🔍 Knuth调试：验证ResourceManager加载结果
      const loadedTools = this.resourceManager.registryData.getResourcesByProtocol('tool')
      logger.info(`[DiscoverCommand] Tools loaded by ResourceManager: ${loadedTools.map(t => t.id).join(', ') || 'none'}`)
      
    } catch (error) {
      logger.warn('[DiscoverCommand] Resource refresh failed:', error.message)
      // 不抛出错误，确保 discover 命令能继续执行
    }
  }

  /**
   * 刷新所有注册表
   * 在加载资源前先刷新注册表，确保显示最新的资源
   */
  async refreshAllRegistries() {
    try {
      logger.info('[DiscoverCommand] Starting to refresh all registries...')
      
      // 1. 刷新项目级注册表（如果在项目环境中）
      // 项目级注册表是可选的，可能没有初始化项目
      try {
        const currentProject = ProjectManager.getCurrentProject()
        if (currentProject && currentProject.initialized) {
          logger.info('[DiscoverCommand] Refreshing project-level registry...')
          const projectDiscovery = new ProjectDiscovery()
          await projectDiscovery.generateRegistry()
        }
      } catch (projectError) {
        // 项目未初始化是正常情况，不需要报错
        logger.debug('[DiscoverCommand] Project not initialized, skipping project-level registry refresh')
      }
      
      // 2. 刷新用户级注册表（这个是必须的）
      logger.info('[DiscoverCommand] Refreshing user-level registry...')
      const userDiscovery = new UserDiscovery()
      await userDiscovery.generateRegistry()
      
      logger.info('[DiscoverCommand] Registry refresh completed')
    } catch (error) {
      logger.warn('[DiscoverCommand] Registry refresh failed:', error.message)
      // 不抛出错误，继续使用现有注册表
    }
  }

  /**
   * 加载角色注册表
   * @returns {Promise<Object>} 角色注册信息（按来源分类）
   */
  async loadRoleRegistry () {
    logger.info('[DiscoverCommand] Loading role registry...')
    
    // 资源刷新已经在 assembleAreas 中的 refreshAllResources 完成
    // 这里直接使用ResourceManager的注册表
    const roles = this.resourceManager.registryData.getResourcesByProtocol('role')
    
    // 严格过滤：只保留 protocol 确实是 'role' 的资源
    const filteredRoles = roles.filter(role => role.protocol === 'role')
    
    // 转换为对象格式以保持兼容性
    const registry = {}
    filteredRoles.forEach(role => {
      registry[role.id] = role
    })
    
    logger.info(`[DiscoverCommand] Found ${Object.keys(registry).length} roles`)

    // 合并 V2 角色（RoleX）
    try {
      const bridge = getRolexBridge()
      const v2Roles = await bridge.listV2Roles()
      v2Roles.forEach(role => {
        registry[`v2:${role.id}`] = role
      })
      if (v2Roles.length > 0) {
        logger.info(`[DiscoverCommand] Found ${v2Roles.length} V2 roles from RoleX`)
      }
    } catch (error) {
      // RoleX 不可用时静默跳过
      logger.debug('[DiscoverCommand] RoleX not available, skipping V2 roles:', error.message)
    }

    return registry
  }
  
  /**
   * 加载工具注册表
   * @returns {Promise<Object>} 工具注册信息（按来源分类）
   */
  async loadToolRegistry () {
    // 资源刷新已经在 assembleAreas 中的 refreshAllResources 完成
    // 这里直接使用ResourceManager的注册表
    
    // 从注册表中获取所有工具资源
    const tools = this.resourceManager.registryData.getResourcesByProtocol('tool')
    
    // 严格过滤：只保留 protocol 确实是 'tool' 的资源
    const filteredTools = tools.filter(tool => tool.protocol === 'tool')
    
    // 转换为对象格式以保持兼容性
    const registry = {}
    filteredTools.forEach(tool => {
      registry[tool.id] = tool
    })
    
    logger.info(`[DiscoverCommand] Found ${Object.keys(registry).length} tools`)
    return registry
  }
  
  /**
   * 检测MCP进程ID
   */
  detectMcpId() {
    return ProjectManager.getCurrentMcpId()
  }

  /**
   * 检测IDE类型
   * @returns {string} IDE类型
   */
  async detectIdeType() {
    // 使用 ProjectManager 的检测方法
    return this.projectManager.detectIdeType()
  }
}

module.exports = DiscoverCommand