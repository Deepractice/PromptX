const BasePouchCommand = require('../BasePouchCommand')
const WelcomeHeaderArea = require('../areas/welcome/WelcomeHeaderArea')
const RoleListArea = require('../areas/welcome/RoleListArea')
const ToolListArea = require('../areas/welcome/ToolListArea')
const StateArea = require('../areas/common/StateArea')
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
 * 欢迎命令
 * 负责展示可用的AI角色和工具
 * 使用Area架构组装输出
 */
class WelcomeCommand extends BasePouchCommand {
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
    const headerArea = new WelcomeHeaderArea(stats)
    this.registerArea(headerArea)
    
    const roleArea = new RoleListArea(roleCategories)
    this.registerArea(roleArea)
    
    const toolArea = new ToolListArea(toolCategories)
    this.registerArea(toolArea)
    
    const stateArea = new StateArea('welcome_completed')
    this.registerArea(stateArea)
  }
  
  /**
   * 按来源分组资源
   */
  categorizeBySource(registry) {
    const categories = {
      system: [],
      project: [],
      user: []
    }
    
    Object.values(registry).forEach(item => {
      const source = this.normalizeSource(item.source)
      if (categories[source]) {
        categories[source].push(item)
      }
    })
    
    return categories
  }
  
  /**
   * 标准化来源
   */
  normalizeSource(source) {
    if (source === 'user') return 'user'
    if (source === 'project') return 'project'
    if (['package', 'merged', 'fallback', 'system'].includes(source)) return 'system'
    return 'system'
  }
  
  /**
   * 计算统计信息
   */
  calculateStats(roleCategories, toolCategories) {
    const systemRoles = roleCategories.system?.length || 0
    const projectRoles = roleCategories.project?.length || 0
    const userRoles = roleCategories.user?.length || 0
    const systemTools = toolCategories.system?.length || 0
    const projectTools = toolCategories.project?.length || 0
    const userTools = toolCategories.user?.length || 0
    
    return {
      totalRoles: systemRoles + projectRoles + userRoles,
      systemRoles,
      projectRoles,
      userRoles,
      totalTools: systemTools + projectTools + userTools,
      systemTools,
      projectTools,
      userTools
    }
  }

  /**
   * 刷新所有资源（注册表文件 + ResourceManager）
   * 这是 welcome 命令的核心功能，确保能发现所有最新的资源
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
        logger.info(`[WelcomeCommand] 📋 用户注册表中的工具: ${tools.join(', ') || '无'}`)
      }
      
      // 2. 刷新 ResourceManager，重新加载所有资源
      logger.info('[WelcomeCommand] Refreshing ResourceManager to discover new resources...')
      await this.resourceManager.initializeWithNewArchitecture()
      
      // 🔍 Knuth调试：验证ResourceManager加载结果
      const loadedTools = this.resourceManager.registryData.getResourcesByProtocol('tool')
      logger.info(`[WelcomeCommand] 📦 ResourceManager加载的工具: ${loadedTools.map(t => t.id).join(', ') || '无'}`)
      
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
      
      // 1. 刷新项目级注册表（如果在项目环境中）
      // 项目级注册表是可选的，可能没有初始化项目
      try {
        const currentProject = ProjectManager.getCurrentProject()
        if (currentProject && currentProject.initialized) {
          logger.info('[WelcomeCommand] 刷新项目级注册表...')
          const projectDiscovery = new ProjectDiscovery()
          await projectDiscovery.generateRegistry()
        }
      } catch (projectError) {
        // 项目未初始化是正常情况，不需要报错
        logger.debug('[WelcomeCommand] 项目未初始化，跳过项目级注册表刷新')
      }
      
      // 2. 刷新用户级注册表（这个是必须的）
      logger.info('[WelcomeCommand] 刷新用户级注册表...')
      const userDiscovery = new UserDiscovery()
      await userDiscovery.generateRegistry()
      
      logger.info('[WelcomeCommand] 注册表刷新完成')
    } catch (error) {
      logger.warn('[WelcomeCommand] 注册表刷新失败:', error.message)
      // 不抛出错误，继续使用现有注册表
    }
  }

  /**
   * 加载角色注册表
   * @returns {Promise<Object>} 角色注册信息（按来源分类）
   */
  async loadRoleRegistry () {
    logger.info('[WelcomeCommand] Loading role registry...')
    
    // 资源刷新已经在 assembleAreas 中的 refreshAllResources 完成
    // 这里直接使用ResourceManager的注册表
    const roles = this.resourceManager.registryData.getResourcesByProtocol('role')
    
    // 转换为对象格式以保持兼容性
    const registry = {}
    roles.forEach(role => {
      registry[role.id] = role
    })
    
    logger.info(`[WelcomeCommand] Found ${Object.keys(registry).length} roles`)
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
    
    // 转换为对象格式以保持兼容性
    const registry = {}
    tools.forEach(tool => {
      registry[tool.id] = tool
    })
    
    logger.info(`[WelcomeCommand] Found ${Object.keys(registry).length} tools`)
    return registry
  }
  
  /**
   * 检测MCP进程ID
   */
  detectMcpId() {
    const serverEnv = getGlobalServerEnvironment()
    if (serverEnv.isInitialized()) {
      return serverEnv.getMcpId()
    }
    return 'unknown'
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

module.exports = WelcomeCommand