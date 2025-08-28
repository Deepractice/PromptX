const fs = require('fs-extra')
const path = require('path')
const ResourceData = require('./ResourceData')

/**
 * 注册表数据管理器 v2.0
 * 基于ResourceData数组的全新架构，严格区分资源来源(source)和资源种类(protocol)
 */
class RegistryData {
  /**
   * @param {string} source - 注册表来源 ('package' | 'project' | 'user')
   * @param {string} filePath - 注册表文件路径
   * @param {Array<ResourceData>} resources - 资源数据数组
   * @param {Object} metadata - 注册表元数据
   */
  constructor(source, filePath, resources = [], metadata = {}) {
    this.source = source
    this.filePath = filePath
    this.resources = resources.map(r => r instanceof ResourceData ? r : ResourceData.fromRawData(r))
    this.metadata = {
      version: "2.0.0",
      description: `${source} 级资源注册表`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...metadata
    }
    this.cache = new Map()
  }

  /**
   * 从文件加载注册表数据
   * @param {string} source - 注册表来源
   * @param {string} filePath - 文件路径
   * @returns {Promise<RegistryData>} 注册表数据实例
   */
  static async fromFile(source, filePath) {
    try {
      const data = await fs.readJSON(filePath)
      
      // 处理新格式（v2.0）
      if (data.version === "2.0.0" && Array.isArray(data.resources)) {
        return new RegistryData(source, filePath, data.resources, data.metadata)
      }
      
      // 处理旧格式（v1.0）- 自动转换
      if (data.resources && typeof data.resources === 'object') {
        const resources = []
        for (const [protocol, resourcesOfType] of Object.entries(data.resources)) {
          if (resourcesOfType && typeof resourcesOfType === 'object') {
            for (const [id, reference] of Object.entries(resourcesOfType)) {
              resources.push(ResourceData.fromFilePath(
                reference.replace(/^@\w+:\/\//, ''), 
                source, 
                protocol, 
                reference
              ))
            }
          }
        }
        return new RegistryData(source, filePath, resources, { 
          migratedFrom: "v1.0.0",
          originalTimestamp: data.timestamp 
        })
      }
      
      throw new Error(`Unsupported registry format in ${filePath}`)
    } catch (error) {
      throw new Error(`Failed to load ${source} registry from ${filePath}: ${error.message}`)
    }
  }

  /**
   * 创建空的注册表数据
   * @param {string} source - 注册表来源
   * @param {string} filePath - 注册表文件路径
   * @returns {RegistryData} 空注册表数据实例
   */
  static createEmpty(source, filePath) {
    return new RegistryData(source, filePath, [], {
      description: `${source} 级资源注册表`,
      createdAt: new Date().toISOString()
    })
  }

  /**
   * 添加资源
   * @param {ResourceData|Object} resource - 资源数据
   */
  addResource(resource) {
    const resourceData = resource instanceof ResourceData ? resource : ResourceData.fromRawData(resource)
    
    // 对于merged类型的注册表，保持原始来源信息
    // 只有在非merged注册表中才强制统一来源
    if (this.source !== 'merged' && resourceData.source !== this.source) {
      resourceData.source = this.source
    }
    
    // 检查是否已存在相同ID的资源
    const existingIndex = this.resources.findIndex(r => r.id === resourceData.id && r.protocol === resourceData.protocol)
    
    if (existingIndex >= 0) {
      // 更新现有资源
      this.resources[existingIndex] = resourceData
    } else {
      // 添加新资源
      this.resources.push(resourceData)
    }
    
    this._updateMetadata()
    this.cache.clear()
  }

  /**
   * 移除资源
   * @param {string} id - 资源ID
   * @param {string} protocol - 资源协议
   * @returns {boolean} 是否成功移除
   */
  removeResource(id, protocol) {
    const initialLength = this.resources.length
    this.resources = this.resources.filter(r => !(r.id === id && r.protocol === protocol))
    
    const removed = this.resources.length < initialLength
    if (removed) {
      this._updateMetadata()
      this.cache.clear()
    }
    
    return removed
  }

  /**
   * 查找资源
   * @param {Object} filters - 过滤条件
   * @returns {Array<ResourceData>} 匹配的资源数组
   */
  findResources(filters = {}) {
    return this.resources.filter(resource => resource.matches(filters))
  }

  /**
   * 根据ID查找资源
   * @param {string} id - 资源ID
   * @param {string} protocol - 资源协议（可选）
   * @returns {ResourceData|null} 找到的资源
   */
  findResourceById(id, protocol = null) {
    return this.resources.find(r => {
      if (protocol) {
        return r.id === id && r.protocol === protocol
      }
      return r.id === id
    }) || null
  }

  /**
   * 获取指定协议类型的所有资源
   * @param {string} protocol - 资源协议
   * @returns {Array<ResourceData>} 资源数组
   */
  getResourcesByProtocol(protocol) {
    return this.resources.filter(r => r.protocol === protocol)
  }

  /**
   * 获取资源Map（兼容旧接口）
   * @param {boolean} includeSourcePrefix - 是否包含源前缀
   * @returns {Map<string, string>} 资源ID到引用的映射
   */
  getResourceMap(includeSourcePrefix = true) {
    const cacheKey = `resourceMap_${includeSourcePrefix}`
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    const registry = new Map()
    
    for (const resource of this.resources) {
      if (includeSourcePrefix) {
        // 包含源前缀的完整ID
        registry.set(resource.getFullId(), resource.reference)
        // 同时也注册基础ID（用于向后兼容）
        registry.set(resource.getBaseId(), resource.reference)
      } else {
        // 仅使用基础ID
        registry.set(resource.getBaseId(), resource.reference)
      }
    }

    this.cache.set(cacheKey, registry)
    return registry
  }

  /**
   * 获取所有资源数据
   * @returns {Array<ResourceData>} 所有资源数组
   */
  getAllResources() {
    return [...this.resources]
  }

  /**
   * 获取统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    const stats = {
      totalResources: this.resources.length,
      byProtocol: {},
      bySource: {}
    }

    for (const resource of this.resources) {
      // 按协议统计
      stats.byProtocol[resource.protocol] = (stats.byProtocol[resource.protocol] || 0) + 1
      
      // 按来源统计
      stats.bySource[resource.source] = (stats.bySource[resource.source] || 0) + 1
    }

    return stats
  }

  /**
   * 合并其他注册表数据
   * @param {RegistryData} otherRegistry - 其他注册表数据
   * @param {boolean} overwrite - 是否覆盖现有资源
   */
  merge(otherRegistry, overwrite = false) {
    for (const resource of otherRegistry.resources) {
      const existing = this.findResourceById(resource.id, resource.protocol)
      
      if (!existing || overwrite) {
        this.addResource(resource.clone())
      }
    }
  }

  /**
   * 保存注册表到文件
   * @returns {Promise<void>}
   */
  async save() {
    try {
      // 确保目录存在
      await fs.ensureDir(path.dirname(this.filePath))
      
      // 更新元数据
      this._updateMetadata()
      
      // 构建保存数据
      const saveData = {
        version: this.metadata.version,
        source: this.source,
        metadata: this.metadata,
        resources: this.resources.map(r => r.toJSON()),
        stats: this.getStats()
      }
      
      // 保存文件
      await fs.writeJSON(this.filePath, saveData, { spaces: 2 })
    } catch (error) {
      throw new Error(`Failed to save ${this.source} registry to ${this.filePath}: ${error.message}`)
    }
  }

  /**
   * 更新元数据
   * @private
   */
  _updateMetadata() {
    this.metadata.updatedAt = new Date().toISOString()
    this.metadata.resourceCount = this.resources.length
  }

  /**
   * 获取注册表大小
   * @returns {number} 资源数量
   */
  get size() {
    return this.resources.length
  }

  /**
   * 检查注册表是否为空
   * @returns {boolean} 是否为空
   */
  isEmpty() {
    return this.resources.length === 0
  }

  /**
   * 清空所有资源
   */
  clear() {
    this.resources = []
    this._updateMetadata()
    this.cache.clear()
  }

  /**
   * 克隆注册表数据
   * @returns {RegistryData} 克隆的注册表数据
   */
  clone() {
    const clonedResources = this.resources.map(r => r.clone())
    return new RegistryData(this.source, this.filePath, clonedResources, { ...this.metadata })
  }

  /**
   * 转换为JSON对象
   * @returns {Object} JSON对象
   */
  toJSON() {
    return {
      version: this.metadata.version,
      source: this.source,
      metadata: this.metadata,
      resources: this.resources.map(r => r.toJSON()),
      stats: this.getStats()
    }
  }
}

module.exports = RegistryData 