const FilePatternDiscovery = require('./FilePatternDiscovery')
const logger = require('../../../utils/logger')
const fs = require('fs-extra')
const path = require('path')
const RegistryData = require('../RegistryData')

/**
 * ProjectDiscovery - 项目级资源发现器
 * 
 * 负责发现项目本地的资源：
 * 1. 优先从 project.registry.json 读取（构建时优化）
 * 2. Fallback: 扫描 .promptx/resource/ 目录（动态发现）
 * 3. 发现用户自定义的角色、执行模式、思维模式等
 * 
 * 优先级：2
 */
class ProjectDiscovery extends FilePatternDiscovery {
  constructor() {
    super('PROJECT', 2)
    this.registryData = null
  }

  /**
   * 发现项目级资源注册表 (新架构方法)
   * @returns {Promise<Map>} 发现的资源注册表 Map<resourceId, reference>
   */
  async discoverRegistry() {
    try {
      // 1. 查找项目根目录
      const projectRoot = await this._findProjectRoot()
      
      // 2. 检查.promptx目录是否存在
      const hasPrompxDir = await this._checkPrompxDirectory(projectRoot)
      if (!hasPrompxDir) {
        return new Map()
      }

      // 3. 优先尝试从注册表加载
      const registryMap = await this._loadFromRegistry(projectRoot)
      if (registryMap.size > 0) {
        logger.debug(`ProjectDiscovery 从注册表加载 ${registryMap.size} 个资源`)
        return registryMap
      }

      // 4. Fallback: 动态扫描
      logger.debug('ProjectDiscovery 注册表不存在，使用动态扫描')
      const resources = await this._scanProjectResources(projectRoot)
      return this._buildRegistryFromResources(resources)

    } catch (error) {
      logger.warn(`[ProjectDiscovery] Registry discovery failed: ${error.message}`)
      return new Map()
    }
  }

  /**
   * 从注册表文件加载资源
   * @param {string} projectRoot - 项目根目录
   * @returns {Promise<Map>} 资源注册表
   */
  async _loadFromRegistry(projectRoot) {
    try {
      const registryPath = path.join(projectRoot, '.promptx', 'resource', 'project.registry.json')
      
      // 检查注册表文件是否存在
      if (!await this._fsExists(registryPath)) {
        return new Map()
      }

      // 读取并解析注册表
      this.registryData = await RegistryData.fromFile('project', registryPath)
      
      // 获取分层级资源映射
      return this.registryData.getResourceMap(true) // 带前缀
      
    } catch (error) {
      logger.warn(`[ProjectDiscovery] Failed to load registry: ${error.message}`)
      return new Map()
    }
  }

  /**
   * 发现项目级资源 (旧版本兼容方法)
   * @returns {Promise<Array>} 发现的资源列表
   */
  async discover() {
    try {
      // 使用新的注册表方法
      const registryMap = await this.discoverRegistry()
      
      // 转换为旧格式
      const resources = []
      for (const [id, reference] of registryMap.entries()) {
        resources.push({
          id: id.replace(/^project:/, ''), // 移除前缀以保持兼容性
          reference: reference
        })
      }

      // 规范化所有资源
      return resources.map(resource => this.normalizeResource(resource))

    } catch (error) {
      logger.warn(`[ProjectDiscovery] Discovery failed: ${error.message}`)
      return []
    }
  }

  /**
   * 从资源列表构建注册表
   * @param {Array} resources - 资源列表
   * @returns {Map} 资源注册表 Map<resourceId, reference>
   */
  _buildRegistryFromResources(resources) {
    const registry = new Map()

    for (const resource of resources) {
      if (resource.id && resource.reference) {
        registry.set(resource.id, resource.reference)
      }
    }

    return registry
  }

  /**
   * 查找项目根目录
   * @deprecated 使用 DirectoryService.getProjectRoot() 替代
   * @returns {Promise<string>} 项目根目录路径
   */
  async _findProjectRoot() {
    // 🚀 新架构：直接使用ProjectManager的当前项目状态
    const ProjectManager = require('../../../utils/ProjectManager')
    
    // ✅ 修复：检查项目是否已初始化，避免在init过程中抛出错误
    if (ProjectManager.isInitialized()) {
      try {
        return ProjectManager.getCurrentProjectPath()
      } catch (error) {
        // 如果获取失败，使用回退路径
        logger.debug(`[ProjectDiscovery] 获取当前项目路径失败，使用回退路径: ${error.message}`)
        return process.cwd()
      }
    } else {
      // 项目未初始化时使用当前工作目录作为回退
      logger.debug(`[ProjectDiscovery] 项目未初始化，使用当前工作目录作为回退: ${process.cwd()}`)
      return process.cwd()
    }
  }

  /**
   * 检查.promptx目录是否存在
   * @param {string} projectRoot - 项目根目录
   * @returns {Promise<boolean>} 是否存在.promptx/resource目录
   */
  async _checkPrompxDirectory(projectRoot) {
    const promptxResourcePath = path.join(projectRoot, '.promptx', 'resource')
    return await this._fsExists(promptxResourcePath)
  }

  /**
   * 实现基类要求的方法：获取项目扫描基础目录
   * @returns {Promise<string>} 项目资源目录路径
   */
  async _getBaseDirectory() {
    const projectRoot = await this._findProjectRoot()
    return path.join(projectRoot, '.promptx', 'resource')
  }

  /**
   * 扫描项目资源（使用新的基类方法）
   * @param {string} projectRoot - 项目根目录
   * @returns {Promise<Array>} 扫描发现的资源列表
   */
  async _scanProjectResources(projectRoot) {
    try {
      // 使用新的基类扫描方法
      const registryData = RegistryData.createEmpty('project', null)
      await this._scanResourcesByFilePattern(registryData)
      
      // 转换为旧格式兼容性
      const resources = []
      for (const resource of registryData.resources) {
        resources.push({
          id: resource.id,
          reference: resource.reference
        })
      }

      return resources
    } catch (error) {
      logger.warn(`[ProjectDiscovery] Failed to scan project resources: ${error.message}`)
      return []
    }
  }

  /**
   * 文件系统存在性检查（保留用于向后兼容）
   * @param {string} filePath - 文件路径
   * @returns {Promise<boolean>} 文件是否存在
   */
  async _fsExists(filePath) {
    return await fs.pathExists(filePath)
  }

  /**
   * 生成项目级注册表文件
   * @param {string} projectRoot - 项目根目录
   * @returns {Promise<RegistryData>} 生成的注册表数据
   */
  async generateRegistry(projectRoot) {
    const registryPath = path.join(projectRoot, '.promptx', 'resource', 'project.registry.json')
    const registryData = RegistryData.createEmpty('project', registryPath)
    
    // 扫描.promptx/resource目录
    const resourcesDir = path.join(projectRoot, '.promptx', 'resource')
    
    if (await this._fsExists(resourcesDir)) {
      await this._scanDirectory(resourcesDir, registryData)
    }
    
    // 保存注册表文件
    await registryData.save()
    
    logger.info(`[ProjectDiscovery] ✅ 项目注册表生成完成，发现 ${registryData.size} 个资源`)
    return registryData
  }

  /**
   * 扫描目录并添加资源到注册表（使用新的基类方法）
   * @param {string} resourcesDir - 资源目录
   * @param {RegistryData} registryData - 注册表数据
   * @private
   */
  async _scanDirectory(resourcesDir, registryData) {
    // 使用基类的统一文件模式扫描
    await this._scanResourcesByFilePattern(registryData)
  }

  /**
   * 扫描role目录（项目角色资源）
   * @param {string} roleDir - role目录路径
   * @param {RegistryData} registryData - 注册表数据
   * @private
   */
  async _scanRoleDirectory(roleDir, registryData) {
    const items = await fs.readdir(roleDir)
    
    for (const item of items) {
      const itemPath = path.join(roleDir, item)
      const stat = await fs.stat(itemPath)
      
      if (stat.isDirectory()) {
        // 查找role文件
        const roleFile = path.join(itemPath, `${item}.role.md`)
        if (await this._fsExists(roleFile)) {
          const reference = `@project://.promptx/resource/role/${item}/${item}.role.md`
          
          const resourceData = new ResourceData({
            id: item,
            source: 'project',
            protocol: 'role',
            name: ResourceData._generateDefaultName(item, 'role'),
            description: ResourceData._generateDefaultDescription(item, 'role'),
            reference: reference,
            metadata: {
              scannedAt: new Date().toISOString()
            }
          })
          
          registryData.addResource(resourceData)
        }
        
        // 查找thought文件
        const thoughtDir = path.join(itemPath, 'thought')
        if (await this._fsExists(thoughtDir)) {
          const thoughtFiles = await fs.readdir(thoughtDir)
          for (const thoughtFile of thoughtFiles) {
            if (thoughtFile.endsWith('.thought.md')) {
              const thoughtId = path.basename(thoughtFile, '.thought.md')
              const reference = `@project://.promptx/resource/role/${item}/thought/${thoughtFile}`
              
              const resourceData = new ResourceData({
                id: thoughtId,
                source: 'project',
                protocol: 'thought',
                name: ResourceData._generateDefaultName(thoughtId, 'thought'),
                description: ResourceData._generateDefaultDescription(thoughtId, 'thought'),
                reference: reference,
                metadata: {
                  scannedAt: new Date().toISOString()
                }
              })
              
              registryData.addResource(resourceData)
            }
          }
        }
        
        // 查找execution文件
        const executionDir = path.join(itemPath, 'execution')
        if (await this._fsExists(executionDir)) {
          const executionFiles = await fs.readdir(executionDir)
          for (const execFile of executionFiles) {
            if (execFile.endsWith('.execution.md')) {
              const execId = path.basename(execFile, '.execution.md')
              const reference = `@project://.promptx/resource/role/${item}/execution/${execFile}`
              
              const resourceData = new ResourceData({
                id: execId,
                source: 'project',
                protocol: 'execution',
                name: ResourceData._generateDefaultName(execId, 'execution'),
                description: ResourceData._generateDefaultDescription(execId, 'execution'),
                reference: reference,
                metadata: {
                  scannedAt: new Date().toISOString()
                }
              })
              
              registryData.addResource(resourceData)
            }
          }
        }
        
        // 查找knowledge文件
        const knowledgeDir = path.join(itemPath, 'knowledge')
        if (await this._fsExists(knowledgeDir)) {
          const knowledgeFiles = await fs.readdir(knowledgeDir)
          for (const knowledgeFile of knowledgeFiles) {
            if (knowledgeFile.endsWith('.knowledge.md')) {
              const knowledgeId = path.basename(knowledgeFile, '.knowledge.md')
              const reference = `@project://.promptx/resource/role/${item}/knowledge/${knowledgeFile}`
              
              const resourceData = new ResourceData({
                id: knowledgeId,
                source: 'project',
                protocol: 'knowledge',
                name: ResourceData._generateDefaultName(knowledgeId, 'knowledge'),
                description: ResourceData._generateDefaultDescription(knowledgeId, 'knowledge'),
                reference: reference,
                metadata: {
                  scannedAt: new Date().toISOString()
                }
              })
              
              registryData.addResource(resourceData)
            }
          }
        }
      }
    }
  }

  /**
   * 重写基类方法：获取注册表文件路径
   * @returns {Promise<string>} 注册表文件路径
   */
  async _getRegistryPath() {
    const projectRoot = await this._findProjectRoot()
    return path.join(projectRoot, '.promptx', 'resource', 'project.registry.json')
  }

  /**
   * 获取RegistryData对象（新架构方法）
   * @returns {Promise<RegistryData>} 项目级RegistryData对象
   */
  async getRegistryData() {
    try {
      const registryPath = await this._getRegistryPath()
      
      // 尝试加载现有的注册表文件
      if (await this._fsExists(registryPath)) {
        const registryData = await RegistryData.fromFile('project', registryPath)
        
        // 检查注册表是否有效（有完整的资源数据）
        if (registryData.size > 0 && registryData.resources.length > 0) {
          const firstResource = registryData.resources[0]
          if (firstResource.id && firstResource.protocol && firstResource.reference) {
            logger.info(`[ProjectDiscovery] 📋 从注册表加载 ${registryData.size} 个资源`)
            return registryData
          }
        }
        
        // 如果注册表无效，重新生成
        logger.info(`[ProjectDiscovery] 📋 项目注册表无效，重新生成`)
        const baseDirectory = await this._getBaseDirectory()
        return await this.generateRegistry(baseDirectory)
      } else {
        // 如果没有注册表文件，生成新的
        logger.info(`[ProjectDiscovery] 📋 项目注册表不存在，生成新注册表`)
        const baseDirectory = await this._getBaseDirectory()
        return await this.generateRegistry(baseDirectory)
      }
    } catch (error) {
      logger.warn(`[ProjectDiscovery] Failed to load RegistryData: ${error.message}`)
      // 返回空的RegistryData
      return RegistryData.createEmpty('project', null)
    }
  }
}

module.exports = ProjectDiscovery