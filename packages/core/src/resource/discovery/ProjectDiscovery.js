const logger = require('@promptx/logger')
const RegistryData = require('../RegistryData')
const ResourceData = require('../ResourceData')
const fs = require('fs-extra')
const path = require('path')

/**
 * ProjectDiscovery - 项目级资源发现器（恢复重构前完整逻辑）
 * 
 * 核心设计原则：
 * 1. 完全基于@project协议，支持HTTP/本地模式
 * 2. 优先使用注册表，fallback到动态扫描  
 * 3. 恢复重构前的专业目录结构处理能力
 * 4. 恢复完整的ResourceData构建和文件验证逻辑
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
   * 动态扫描项目资源 - 恢复重构前的专业扫描逻辑
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

      // 创建临时注册表来收集资源
      const tempRegistry = RegistryData.createEmpty('project', null)
      
      // 扫描专业目录结构
      await this._scanDirectory(resourceDir, tempRegistry)
      
      // 转换为资源列表
      const resources = []
      for (const resource of tempRegistry.resources) {
        resources.push({
          id: resource.id,
          protocol: resource.protocol,
          reference: resource.reference,
          source: resource.source
        })
      }

      logger.info(`[ProjectDiscovery] ✅ 项目扫描完成，发现 ${resources.length} 个资源`)
      return resources
      
    } catch (error) {
      logger.warn(`[ProjectDiscovery] 扫描项目资源失败: ${error.message}`)
      return []
    }
  }

  /**
   * 扫描目录并添加资源到注册表（通用递归扫描）
   * @param {string} resourcesDir - 资源目录
   * @param {RegistryData} registryData - 注册表数据
   * @private
   */
  async _scanDirectory(resourcesDir, registryData) {
    try {
      // 递归扫描整个resource目录
      await this._recursiveScan(resourcesDir, '', registryData)
    } catch (error) {
      logger.warn(`[ProjectDiscovery] 扫描资源目录失败: ${error.message}`)
    }
  }

  /**
   * 递归扫描目录
   * @param {string} currentPath - 当前扫描路径
   * @param {string} relativePath - 相对于resource目录的路径
   * @param {RegistryData} registryData - 注册表数据
   * @private
   */
  async _recursiveScan(currentPath, relativePath, registryData) {
    try {
      const items = await fs.readdir(currentPath)
      
      for (const item of items) {
        const itemPath = path.join(currentPath, item)
        const stat = await fs.stat(itemPath)
        const newRelativePath = relativePath ? `${relativePath}/${item}` : item
        
        if (stat.isDirectory()) {
          // 递归扫描子目录
          await this._recursiveScan(itemPath, newRelativePath, registryData)
        } else {
          // 处理文件
          await this._processFile(itemPath, newRelativePath, registryData)
        }
      }
    } catch (error) {
      logger.warn(`[ProjectDiscovery] 扫描${currentPath}失败: ${error.message}`)
    }
  }

  /**
   * 处理单个文件
   * @param {string} filePath - 文件完整路径
   * @param {string} relativePath - 相对路径
   * @param {RegistryData} registryData - 注册表数据
   * @private
   */
  async _processFile(filePath, relativePath, registryData) {
    const fileName = path.basename(filePath)
    let protocol = null
    let resourceId = null
    
    // 根据文件名后缀识别资源类型
    if (fileName.endsWith('.role.md')) {
      protocol = 'role'
      resourceId = path.basename(fileName, '.role.md')
    } else if (fileName.endsWith('.thought.md')) {
      protocol = 'thought'
      resourceId = path.basename(fileName, '.thought.md')
    } else if (fileName.endsWith('.execution.md')) {
      protocol = 'execution'
      resourceId = path.basename(fileName, '.execution.md')
    } else if (fileName.endsWith('.knowledge.md')) {
      protocol = 'knowledge'
      resourceId = path.basename(fileName, '.knowledge.md')
    } else if (fileName.endsWith('.tool.js')) {
      protocol = 'tool'
      resourceId = path.basename(fileName, '.tool.js')
    } else if (fileName.endsWith('.manual.md')) {
      protocol = 'manual'
      resourceId = path.basename(fileName, '.manual.md')
    }
    
    if (protocol && resourceId) {
      // 验证文件内容
      if (await this._validateResourceFile(filePath, protocol)) {
        const reference = `@project://.promptx/resource/${relativePath}`
        
        const resourceData = new ResourceData({
          id: resourceId,
          source: 'project',
          protocol: protocol,
          name: ResourceData._generateDefaultName(resourceId, protocol),
          description: ResourceData._generateDefaultDescription(resourceId, protocol),
          reference: reference,
          metadata: {
            scannedAt: new Date().toISOString(),
            path: relativePath
          }
        })
        
        registryData.addResource(resourceData)
        logger.debug(`[ProjectDiscovery] 发现${protocol}资源: ${resourceId} at ${relativePath}`)
      }
    }
  }


  /**
   * 验证资源文件格式（恢复重构前逻辑）
   * @param {string} filePath - 文件路径
   * @param {string} protocol - 协议类型
   * @returns {Promise<boolean>} 是否是有效的资源文件
   */
  async _validateResourceFile(filePath, protocol) {
    try {
      const content = await fs.readFile(filePath, 'utf8')

      if (!content || typeof content !== 'string') {
        return false
      }

      const trimmedContent = content.trim()
      if (trimmedContent.length === 0) {
        return false
      }

      // 根据协议类型验证DPML标签
      switch (protocol) {
        case 'role':
          return trimmedContent.includes('<role>') && trimmedContent.includes('</role>')
        case 'execution':
          return trimmedContent.includes('<execution>') && trimmedContent.includes('</execution>')
        case 'thought':
          return trimmedContent.includes('<thought>') && trimmedContent.includes('</thought>')
        case 'knowledge':
          // knowledge类型比较灵活，只要文件有内容就认为是有效的
          return true
        case 'manual':
          return trimmedContent.includes('<manual>') && trimmedContent.includes('</manual>')
        case 'tool':
          // tool文件是JavaScript，进行基本的语法验证
          try {
            new Function(trimmedContent)
            return true
          } catch (e) {
            logger.warn(`[ProjectDiscovery] Invalid JavaScript in tool file ${filePath}: ${e.message}`)
            return false
          }
        default:
          return false
      }
    } catch (error) {
      logger.warn(`[ProjectDiscovery] Failed to validate ${filePath}: ${error.message}`)
      return false
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
      const protocol = this.getProjectProtocol()
      
      // 获取注册表文件路径
      const registryPath = await protocol.resolvePath('.promptx/resource/project.registry.json')
      
      // 创建注册表数据
      const registryData = RegistryData.createEmpty('project', registryPath)
      
      // 扫描资源目录
      const resourceDir = await protocol.resolvePath('.promptx/resource')
      
      if (await fs.pathExists(resourceDir)) {
        await this._scanDirectory(resourceDir, registryData)
      }
      
      // 确保目录存在
      await fs.ensureDir(path.dirname(registryPath))
      
      // 保存注册表
      await registryData.save()
      
      logger.info(`[ProjectDiscovery] ✅ 项目注册表生成完成，发现 ${registryData.size} 个资源`)
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