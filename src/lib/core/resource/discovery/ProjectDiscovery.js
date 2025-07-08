const logger = require('../../../utils/logger')
const RegistryData = require('../RegistryData')
const fs = require('fs-extra')
const path = require('path')

/**
 * ProjectDiscovery - 项目级资源发现器（重构版）
 * 
 * 核心设计原则：
 * 1. 完全基于@project协议，支持HTTP/本地模式
 * 2. 优先使用注册表，fallback到动态扫描  
 * 3. 零路径硬编码，零协议绕过
 * 4. 简洁高效，易维护
 */
class ProjectDiscovery {
  constructor() {
    this.source = 'PROJECT'
    this.priority = 2
    this.projectProtocol = null
  }

  /**
   * 获取ProjectProtocol实例
   */
  getProjectProtocol() {
    if (!this.projectProtocol) {
      const { getGlobalResourceManager } = require('../../resource')
      const resourceManager = getGlobalResourceManager()
      this.projectProtocol = resourceManager.protocols.get('project')
    }
    return this.projectProtocol
  }

  /**
   * 发现项目级资源注册表
   * @returns {Promise<Map>} 资源注册表 Map<resourceId, reference>
   */
  async discoverRegistry() {
    try {
      // 1. 优先尝试从注册表加载
      const registryMap = await this.loadFromRegistry()
      if (registryMap.size > 0) {
        logger.debug(`ProjectDiscovery 从注册表加载 ${registryMap.size} 个资源`)
        return registryMap
      }

      // 2. Fallback: 动态扫描生成注册表
      logger.debug('ProjectDiscovery 注册表不存在，使用动态扫描')
      const resources = await this.scanProjectResources()
      return this.buildRegistryFromResources(resources)

    } catch (error) {
      logger.warn(`[ProjectDiscovery] Registry discovery failed: ${error.message}`)
      return new Map()
    }
  }

  /**
   * 从注册表文件加载资源
   * @returns {Promise<Map>} 资源注册表
   */
  async loadFromRegistry() {
    try {
      const protocol = this.getProjectProtocol()
      
      // 使用@project协议检查注册表文件
      const registryPath = await protocol.resolvePath('.promptx/resource/project.registry.json')
      
      if (!await fs.pathExists(registryPath)) {
        return new Map()
      }

      // 加载并解析注册表
      const registryData = await RegistryData.fromFile('project', registryPath)
      return registryData.getResourceMap(true) // 带前缀
      
    } catch (error) {
      logger.warn(`[ProjectDiscovery] Failed to load registry: ${error.message}`)
      return new Map()
    }
  }

  /**
   * 动态扫描项目资源
   * @returns {Promise<Array>} 资源列表
   */
  async scanProjectResources() {
    try {
      const protocol = this.getProjectProtocol()
      
      // 使用@project协议获取资源目录
      const resourceDir = await protocol.resolvePath('.promptx/resource')
      
      if (!await fs.pathExists(resourceDir)) {
        logger.debug('ProjectDiscovery 项目资源目录不存在')
        return []
      }

      // 扫描所有资源文件
      const resources = []
      const domains = await fs.readdir(resourceDir)
      
      for (const domain of domains) {
        if (domain.startsWith('.')) continue
        
        const domainPath = path.join(resourceDir, domain)
        const domainStats = await fs.stat(domainPath)
        
        if (domainStats.isDirectory()) {
          const domainResources = await this.scanDomainDirectory(domainPath, domain)
          resources.push(...domainResources)
        }
      }

      logger.info(`[ProjectDiscovery] ✅ 项目注册表生成完成，发现 ${resources.length} 个资源`)
      return resources
      
    } catch (error) {
      logger.warn(`[ProjectDiscovery] 扫描项目资源失败: ${error.message}`)
      return []
    }
  }

  /**
   * 扫描域目录（如domain/andersen/）
   * @param {string} domainPath - 域目录路径
   * @param {string} domainName - 域名称  
   * @returns {Promise<Array>} 域内资源列表
   */
  async scanDomainDirectory(domainPath, domainName) {
    const resources = []
    
    try {
      const items = await fs.readdir(domainPath)
      
      for (const item of items) {
        const itemPath = path.join(domainPath, item)
        const itemStats = await fs.stat(itemPath)
        
        if (itemStats.isDirectory()) {
          // 扫描类型目录（如role/, thought/等）
          const typeResources = await this.scanTypeDirectory(itemPath, domainName, item)
          resources.push(...typeResources)
        } else if (itemStats.isFile()) {
          // 直接在域目录下的资源文件
          const resource = this.parseResourceFile(itemPath, domainName)
          if (resource) resources.push(resource)
        }
      }
      
    } catch (error) {
      logger.warn(`[ProjectDiscovery] 扫描域目录失败 ${domainPath}: ${error.message}`)
    }
    
    return resources
  }

  /**
   * 扫描类型目录（如thought/, execution/等）
   * @param {string} typePath - 类型目录路径
   * @param {string} domainName - 域名称
   * @param {string} typeName - 类型名称
   * @returns {Promise<Array>} 类型内资源列表
   */
  async scanTypeDirectory(typePath, domainName, typeName) {
    const resources = []
    
    try {
      const files = await fs.readdir(typePath)
      
      for (const file of files) {
        const filePath = path.join(typePath, file)
        const stats = await fs.stat(filePath)
        
        if (stats.isFile()) {
          const resource = this.parseResourceFile(filePath, domainName, typeName)
          if (resource) resources.push(resource)
        }
      }
      
    } catch (error) {
      logger.warn(`[ProjectDiscovery] 扫描类型目录失败 ${typePath}: ${error.message}`)
    }
    
    return resources
  }

  /**
   * 解析资源文件
   * @param {string} filePath - 文件路径
   * @param {string} domainName - 域名称
   * @param {string} typeName - 类型名称（可选）
   * @returns {Object|null} 资源对象
   */
  parseResourceFile(filePath, domainName, typeName = null) {
    const fileName = path.basename(filePath)
    const ext = path.extname(fileName)
    const baseName = path.basename(fileName, ext)
    
    // 识别资源类型
    let protocol = typeName
    if (!protocol) {
      if (fileName.includes('.role.')) protocol = 'role'
      else if (fileName.includes('.thought.')) protocol = 'thought'  
      else if (fileName.includes('.execution.')) protocol = 'execution'
      else if (fileName.includes('.knowledge.')) protocol = 'knowledge'
      else return null
    }
    
    // 生成资源ID和引用
    const resourceId = baseName.replace(/\.(role|thought|execution|knowledge)$/, '')
    const reference = `@project://.promptx/resource/${path.relative(
      path.dirname(path.dirname(path.dirname(filePath))), 
      filePath
    ).replace(/\\/g, '/')}`
    
    return {
      id: resourceId,
      protocol,
      reference,
      source: 'project'
    }
  }

  /**
   * 从资源列表构建注册表Map
   * @param {Array} resources - 资源列表
   * @returns {Map} 资源注册表
   */
  buildRegistryFromResources(resources) {
    const registryMap = new Map()
    
    resources.forEach(resource => {
      const key = `project:${resource.id}`
      registryMap.set(key, resource.reference)
    })
    
    return registryMap
  }

  /**
   * 生成并保存项目注册表文件
   * @returns {Promise<RegistryData>} 生成的注册表数据
   */
  async generateRegistry() {
    try {
      const resources = await this.scanProjectResources()
      
      // 获取注册表文件路径
      const protocol = this.getProjectProtocol()
      const registryPath = await protocol.resolvePath('.promptx/resource/project.registry.json')
      
      // 创建注册表数据（即使没有资源也要创建空注册表文件）
      const registryData = RegistryData.createEmpty('project', registryPath)
      
      if (resources.length === 0) {
        logger.debug('[ProjectDiscovery] 没有发现项目资源，创建空注册表')
      } else {
        // 添加发现的资源
        resources.forEach(resource => {
          registryData.addResource(resource.id, resource.protocol, resource.reference, resource.source)
        })
      }
      
      // 确保目录存在
      await fs.ensureDir(path.dirname(registryPath))
      
      // 保存注册表
      await registryData.save()
      
      logger.info(`[ProjectDiscovery] ✅ 项目注册表生成完成，发现 ${resources.length} 个资源`)
      return registryData
      
    } catch (error) {
      logger.error(`[ProjectDiscovery] 生成注册表失败: ${error.message}`)
      return RegistryData.createEmpty('project')
    }
  }

  /**
   * 获取注册表数据（兼容旧接口）
   * @returns {Promise<RegistryData>} 注册表数据
   */
  async getRegistryData() {
    try {
      const protocol = this.getProjectProtocol()
      const registryPath = await protocol.resolvePath('.promptx/resource/project.registry.json')
      
      if (await fs.pathExists(registryPath)) {
        const registryData = await RegistryData.fromFile('project', registryPath)
        
        if (registryData.size > 0) {
          logger.info(`[ProjectDiscovery] 📋 从注册表加载 ${registryData.size} 个资源`)
          return registryData
        }
      }
      
      // 动态生成注册表
      logger.info(`[ProjectDiscovery] 📋 项目注册表无效，重新生成`)
      return await this.generateRegistry()
      
    } catch (error) {
      logger.error(`[ProjectDiscovery] 获取注册表数据失败: ${error.message}`)
      return RegistryData.createEmpty('project')
    }
  }
}

module.exports = ProjectDiscovery