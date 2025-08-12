const fs = require('fs')
const RegistryData = require('./RegistryData')
const ResourceProtocolParser = require('./resourceProtocolParser') 
const DiscoveryManager = require('./discovery/DiscoveryManager')
const logger = require('../../utils/logger')

// 导入协议处理器
const PackageProtocol = require('./protocols/PackageProtocol')
const ProjectProtocol = require('./protocols/ProjectProtocol')
const RoleProtocol = require('./protocols/RoleProtocol')
const ThoughtProtocol = require('./protocols/ThoughtProtocol')
const ExecutionProtocol = require('./protocols/ExecutionProtocol')
const KnowledgeProtocol = require('./protocols/KnowledgeProtocol')
const ToolProtocol = require('./protocols/ToolProtocol')
const ManualProtocol = require('./protocols/ManualProtocol')
const UserProtocol = require('./protocols/UserProtocol')
const FileProtocol = require('./protocols/FileProtocol')

class ResourceManager {
  constructor() {
    // 新架构：统一的资源注册表
    this.registryData = RegistryData.createEmpty('merged', null)
    
    // 协议解析器
    this.protocolParser = new ResourceProtocolParser()
    this.parser = new ResourceProtocolParser() // 向后兼容别名
    
    // 资源发现管理器
    this.discoveryManager = new DiscoveryManager()
    
    // 初始化协议处理器
    this.protocols = new Map()
    this.initializeProtocols()
  }

  /**
   * 初始化所有协议处理器
   */
  initializeProtocols() {
    // 基础协议 - 直接文件系统映射
    this.protocols.set('package', new PackageProtocol())
    this.protocols.set('project', new ProjectProtocol()) 
    this.protocols.set('file', new FileProtocol())
    this.protocols.set('user', new UserProtocol())

    // 逻辑协议 - 需要注册表查询
    this.protocols.set('role', new RoleProtocol())
    this.protocols.set('thought', new ThoughtProtocol())
    this.protocols.set('execution', new ExecutionProtocol())
    this.protocols.set('knowledge', new KnowledgeProtocol())
    this.protocols.set('tool', new ToolProtocol())
    this.protocols.set('manual', new ManualProtocol())
  }

  /**
   * 新架构初始化方法
   */
  async initializeWithNewArchitecture() {
    try {
      logger.info('[ResourceManager] Starting initialization...')
      
      // 1. 清空现有注册表
      this.registryData.clear()
      logger.info('[ResourceManager] Cleared existing registry')

      // 2. 清除发现器缓存
      if (this.discoveryManager && typeof this.discoveryManager.clearCache === 'function') {
        this.discoveryManager.clearCache()
        logger.info('[ResourceManager] Cleared discovery cache')
      }

      // 3. 填充新的RegistryData
      logger.info('[ResourceManager] Populating registry data...')
      await this.populateRegistryData()

      // 4. 为逻辑协议设置注册表引用
      this.setupLogicalProtocols()

      // 5. 设置初始化状态
      this.initialized = true

      // 记录初始化完成的统计信息
      const stats = this.registryData.getStats()
      logger.info('[ResourceManager] Initialization complete:', {
        totalResources: this.registryData.size,
        bySource: stats.bySource,
        byProtocol: stats.byProtocol
      })
    } catch (error) {
      logger.warn(`ResourceManager new architecture initialization failed: ${error.message}`)
      logger.warn('ResourceManager continuing with empty registry')
      this.initialized = true // 即使失败也标记为已初始化，避免重复尝试
    }
  }

  /**
   * 填充新的RegistryData
   */
  async populateRegistryData() {
    // 清空现有数据
    this.registryData.clear()
    
    logger.info('[ResourceManager] Discovery managers:', {
      count: this.discoveryManager.discoveries.length,
      sources: this.discoveryManager.discoveries.map(d => d.source)
    })
    
    // 从各个发现器获取RegistryData并合并
    for (const discovery of this.discoveryManager.discoveries) {
      try {
        logger.info(`[ResourceManager] Loading from ${discovery.source} discovery...`)
        
        if (typeof discovery.getRegistryData === 'function') {
          const registryData = await discovery.getRegistryData()
          if (registryData && registryData.resources) {
            const resourceCount = registryData.size || 0
            logger.info(`[ResourceManager] Found ${resourceCount} resources from ${discovery.source}`)
            
            // 合并资源到主注册表
            this.registryData.merge(registryData, true) // 允许覆盖
            
            // 调试：打印合并的资源
            if (discovery.source === 'USER' && registryData.resources) {
              logger.debug(`[ResourceManager] USER resources to merge:`, registryData.resources.map(r => `${r.protocol}://${r.id}`))
            }
            
            // 记录合并后的状态
            logger.info(`[ResourceManager] After merging ${discovery.source}, total: ${this.registryData.size}`)
          } else {
            logger.info(`[ResourceManager] No resources found from ${discovery.source}`)
          }
        } else {
          logger.info(`[ResourceManager] ${discovery.source} does not support getRegistryData`)
        }
      } catch (error) {
        logger.warn(`Failed to get RegistryData from ${discovery.source}: ${error.message}`)
      }
    }
    
    logger.info('[ResourceManager] Registry population complete, total resources:', this.registryData.size)
  }

  /**
   * 为逻辑协议设置注册表引用
   */
  setupLogicalProtocols() {
    // 将统一注册表传递给逻辑协议处理器
    const roleProtocol = this.protocols.get('role')
    const executionProtocol = this.protocols.get('execution')
    const thoughtProtocol = this.protocols.get('thought')
    const knowledgeProtocol = this.protocols.get('knowledge')
    const toolProtocol = this.protocols.get('tool')
    const manualProtocol = this.protocols.get('manual')
    
    if (roleProtocol) {
      roleProtocol.setRegistryManager(this)
    }
    if (executionProtocol) {
      executionProtocol.setRegistryManager(this)
    }
    if (thoughtProtocol) {
      thoughtProtocol.setRegistryManager(this)
    }
    if (knowledgeProtocol) {
      knowledgeProtocol.setRegistryManager(this)
    }
    if (toolProtocol) {
      toolProtocol.setRegistryManager(this)
    }
    if (manualProtocol) {
      manualProtocol.setRegistryManager(this)
    }
    
    // 逻辑协议设置完成，不输出日志避免干扰用户界面
  }

  /**
   * 通过协议解析加载资源内容
   * @param {string} reference - 资源引用
   * @returns {Promise<string>} 资源内容
   */
  async loadResourceByProtocol(reference) {
    // 1. 使用ResourceProtocolParser解析DPML语法
    const parsed = this.protocolParser.parse(reference)
    
    // 2. 获取对应的协议处理器
    const protocol = this.protocols.get(parsed.protocol)
    if (!protocol) {
      throw new Error(`不支持的协议: ${parsed.protocol}`)
    }

    // 3. 委托给协议处理器解析并加载内容
    const result = await protocol.resolve(parsed.path, parsed.queryParams)
    
    // 4. 确保返回字符串内容，解包可能的对象格式
    if (typeof result === 'string') {
      return result
    } else if (result && typeof result === 'object' && result.content) {
      return result.content
    } else {
      throw new Error(`协议${parsed.protocol}返回了无效的内容格式`)
    }
  }

  async loadResource(resourceId) {
    try {
      // 确保ResourceManager已初始化
      if (!this.initialized) {
        logger.info('[ResourceManager] Initializing resource manager...')
        await this.initializeWithNewArchitecture()
      }
      
      // 处理@开头的DPML格式（如 @file://path, @!role://java-developer）
      if (resourceId.startsWith('@')) {
        const parsed = this.protocolParser.parse(resourceId)
        
        // 对于基础协议（file, user, package, project），直接通过协议处理器加载
        const basicProtocols = ['file', 'user', 'package', 'project']
        if (basicProtocols.includes(parsed.protocol)) {
          const content = await this.loadResourceByProtocol(resourceId)
          return {
            success: true,
            content,
            resourceId,
            reference: resourceId
          }
        }
        
        // 对于逻辑协议，从RegistryData查找资源
        logger.debug(`[ResourceManager] Finding resource: protocol=${parsed.protocol}, id=${parsed.path}`)
        const resourceData = this.registryData.findResourceById(parsed.path, parsed.protocol)
        if (!resourceData) {
          // 打印所有可用的资源以便调试
          const availableResources = this.registryData.getResourcesByProtocol(parsed.protocol)
          logger.error(`[ResourceManager] Resource not found: ${parsed.protocol}:${parsed.path}`)
          logger.error(`[ResourceManager] Available ${parsed.protocol} resources:`, availableResources.map(r => `${r.id} (${r.source})`))
          throw new Error(`Resource not found: ${parsed.protocol}:${parsed.path}`)
        }
        logger.debug(`[ResourceManager] Found resource: ${resourceData.id} from ${resourceData.source}`)
        
        // 通过协议解析加载内容
        const content = await this.loadResourceByProtocol(resourceData.reference)
        
        return {
          success: true,
          content,
          resourceId,
          reference: resourceData.reference
        }
      }
      
      // 处理URL格式（如 thought://systematic-testing）
      const urlMatch = resourceId.match(/^([a-zA-Z][a-zA-Z0-9_-]*):\/\/(.+)$/)
      if (urlMatch) {
        const [, protocol, id] = urlMatch
        const resourceData = this.registryData.findResourceById(id, protocol)
        if (!resourceData) {
          throw new Error(`Resource not found: ${resourceId}`)
        }
        
        // 通过协议解析加载内容
        const content = await this.loadResourceByProtocol(resourceData.reference)
        
        return {
          success: true,
          content,
          resourceId,
          reference: resourceData.reference
        }
      }
      
      // 处理传统格式（如 role:java-developer）
      let reference = null
      
      // 如果包含协议前缀（如 thought:remember）
      if (resourceId.includes(':')) {
        const [protocol, id] = resourceId.split(':', 2)
        const resourceData = this.registryData.findResourceById(id, protocol)
        if (resourceData) {
          reference = resourceData.reference
        }
      } else {
        // 如果没有协议前缀，尝试查找任意协议的资源
        const resourceData = this.registryData.findResourceById(resourceId)
        if (resourceData) {
          reference = resourceData.reference
        }
      }
      
      if (!reference) {
        throw new Error(`Resource not found: ${resourceId}`)
      }
      
      // 通过协议解析加载内容
      const content = await this.loadResourceByProtocol(reference)

      return {
        success: true,
        content,
        resourceId,
        reference
      }
    } catch (error) {
      logger.debug(`ResourceManager.loadResource failed for ${resourceId}: ${error.message}`)
      return {
        success: false,
        error: error,  // 返回完整的Error对象，而不是message字符串
        resourceId
      }
    }
  }

  /**
   * 解析协议引用并返回相关信息
   */
  async resolveProtocolReference(reference) {
    try {
      const parsed = this.protocolParser.parse(reference)
      
      return {
        success: true,
        protocol: parsed.protocol,
        path: parsed.path,
        queryParams: parsed.queryParams,
        reference
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        reference
      }
    }
  }

  /**
   * 获取所有可用的协议列表
   */
  getAvailableProtocols() {
    return Array.from(this.protocols.keys())
  }

  /**
   * 检查是否支持指定协议
   */
  supportsProtocol(protocol) {
    return this.protocols.has(protocol)
  }

  /**
   * 设置初始化状态
   */
  set initialized(value) {
    this._initialized = value
  }

  /**
   * 获取初始化状态
   */
  get initialized() {
    return this._initialized || false
  }

  /**
   * 解析资源URL（向后兼容接口）
   * 返回格式：{success: boolean, content?: string, error?: Error}
   */
  async resolve(resourceUrl) {
    return await this.loadResource(resourceUrl)
  }

  /**
   * 获取注册表统计信息
   */
  getStats() {
    return {
      totalResources: this.registryData.size,
      protocols: this.getAvailableProtocols(),
      initialized: this.initialized
    }
  }

  /**
   * 刷新资源（重新发现并注册）
   */
  async refreshResources() {
    try {
      // 1. 标记为未初始化
      this.initialized = false
      
      // 2. 清空注册表
      this.registryData.clear()
      
      // 3. 清除发现器缓存
      if (this.discoveryManager && typeof this.discoveryManager.clearCache === 'function') {
        this.discoveryManager.clearCache()
      }
      
      // 4. 重新初始化
      await this.initializeWithNewArchitecture()
      
    } catch (error) {
      logger.warn(`ResourceManager resource refresh failed: ${error.message}`)
      // 失败时保持注册表为空状态，下次调用时重试
    }
  }
}

module.exports = ResourceManager