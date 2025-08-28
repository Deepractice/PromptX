const logger = require('~/utils/logger')

/**
 * EnhancedResourceRegistry - 增强的资源注册表
 * 
 * 按照DPML协议架构文档设计，支持：
 * 1. 资源元数据管理（source, priority, timestamp）
 * 2. 智能合并策略（优先级和时间戳）
 * 3. 发现源优先级管理
 * 4. 批量操作支持
 */
class EnhancedResourceRegistry {
  constructor() {
    // 主索引：resourceId -> reference
    this.index = new Map()
    
    // 元数据索引：resourceId -> metadata
    this.metadata = new Map()
    
    // 发现源优先级映射
    this.sourcePriority = {
      'USER': 1,      // 最高优先级
      'PROJECT': 2,   
      'PACKAGE': 3,   
      'INTERNET': 4   // 最低优先级
    }
  }

  /**
   * 注册单个资源
   * @param {Object} resource - 资源对象
   * @param {string} resource.id - 资源ID
   * @param {string} resource.reference - 资源引用
   * @param {Object} resource.metadata - 资源元数据
   */
  register(resource) {
    this._validateResource(resource)

    const { id, reference, metadata } = resource

    // 如果资源已存在，检查是否应该覆盖
    if (this.has(id)) {
      const existingMetadata = this.metadata.get(id)
      if (!this._shouldOverride(existingMetadata, metadata)) {
        return // 不覆盖，保持现有资源
      }
    }

    // 注册资源
    this.index.set(id, reference)
    this.metadata.set(id, { ...metadata })
  }

  /**
   * 批量注册资源
   * @param {Array} resources - 资源数组
   */
  registerBatch(resources) {
    if (!Array.isArray(resources)) {
      throw new Error('Resources must be an array')
    }

    resources.forEach(resource => {
      try {
        if (resource && typeof resource === 'object') {
          this.register(resource)
        }
      } catch (error) {
        logger.warn(`[EnhancedResourceRegistry] Failed to register resource: ${error.message}`)
      }
    })
  }

  /**
   * 合并另一个注册表
   * @param {EnhancedResourceRegistry} otherRegistry - 另一个注册表实例
   */
  merge(otherRegistry) {
    if (!(otherRegistry instanceof EnhancedResourceRegistry)) {
      throw new Error('Can only merge with another EnhancedResourceRegistry instance')
    }

    // 获取所有资源并批量注册（会自动处理优先级）
    const otherResources = otherRegistry.list().map(id => ({
      id,
      reference: otherRegistry.resolve(id),
      metadata: otherRegistry.getMetadata(id)
    }))

    this.registerBatch(otherResources)
  }

  /**
   * 解析资源ID到引用
   * @param {string} resourceId - 资源ID
   * @returns {string} 资源引用
   */
  resolve(resourceId) {
    // 1. 直接查找
    if (this.index.has(resourceId)) {
      return this.index.get(resourceId)
    }

    // 2. 向后兼容：尝试添加协议前缀
    const protocols = ['role', 'thought', 'execution', 'memory']
    
    for (const protocol of protocols) {
      const fullId = `${protocol}:${resourceId}`
      if (this.index.has(fullId)) {
        return this.index.get(fullId)
      }
    }

    throw new Error(`Resource '${resourceId}' not found`)
  }

  /**
   * 检查资源是否存在
   * @param {string} resourceId - 资源ID
   * @returns {boolean} 是否存在
   */
  has(resourceId) {
    try {
      this.resolve(resourceId)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * 获取资源元数据
   * @param {string} resourceId - 资源ID
   * @returns {Object|null} 元数据对象或null
   */
  getMetadata(resourceId) {
    // 直接查找
    if (this.metadata.has(resourceId)) {
      return { ...this.metadata.get(resourceId) }
    }

    // 向后兼容查找
    const protocols = ['role', 'thought', 'execution', 'memory']
    
    for (const protocol of protocols) {
      const fullId = `${protocol}:${resourceId}`
      if (this.metadata.has(fullId)) {
        return { ...this.metadata.get(fullId) }
      }
    }

    return null
  }

  /**
   * 列出所有资源ID
   * @param {string} [protocol] - 可选的协议过滤器
   * @returns {Array<string>} 资源ID列表
   */
  list(protocol = null) {
    const allIds = Array.from(this.index.keys())
    
    if (!protocol) {
      return allIds
    }

    return allIds.filter(id => id.startsWith(`${protocol}:`))
  }

  /**
   * 获取注册表大小
   * @returns {number} 资源数量
   */
  size() {
    return this.index.size
  }

  /**
   * 清空注册表
   */
  clear() {
    this.index.clear()
    this.metadata.clear()
  }

  /**
   * 移除资源
   * @param {string} resourceId - 资源ID
   */
  remove(resourceId) {
    // 尝试直接移除
    if (this.index.has(resourceId)) {
      this.index.delete(resourceId)
      this.metadata.delete(resourceId)
      return
    }

    // 向后兼容移除
    const protocols = ['role', 'thought', 'execution', 'memory']
    
    for (const protocol of protocols) {
      const fullId = `${protocol}:${resourceId}`
      if (this.index.has(fullId)) {
        this.index.delete(fullId)
        this.metadata.delete(fullId)
        return
      }
    }
  }

  /**
   * 从发现管理器结果加载资源
   * @param {Array} discoveryResults - 发现器返回的资源数组
   */
  loadFromDiscoveryResults(discoveryResults) {
    if (!Array.isArray(discoveryResults)) {
      logger.warn('[EnhancedResourceRegistry] Discovery results must be an array')
      return
    }

    this.registerBatch(discoveryResults)
  }

  /**
   * 验证资源对象
   * @param {Object} resource - 资源对象
   * @private
   */
  _validateResource(resource) {
    if (!resource || typeof resource !== 'object') {
      throw new Error('Resource must be an object')
    }

    if (!resource.id || !resource.reference) {
      throw new Error('Resource must have id and reference')
    }

    if (!resource.metadata || typeof resource.metadata !== 'object') {
      throw new Error('Resource must have metadata with source and priority')
    }

    if (!resource.metadata.source || typeof resource.metadata.priority !== 'number') {
      throw new Error('Resource must have metadata with source and priority')
    }

    // 验证ID格式
    if (typeof resource.id !== 'string' || !resource.id.includes(':')) {
      throw new Error('Resource id must be in format "protocol:resourcePath"')
    }

    // 验证引用格式
    if (typeof resource.reference !== 'string' || !resource.reference.startsWith('@')) {
      throw new Error('Resource reference must be in DPML format "@protocol://path"')
    }
  }

  /**
   * 判断是否应该覆盖现有资源
   * @param {Object} existingMetadata - 现有资源元数据
   * @param {Object} newMetadata - 新资源元数据
   * @returns {boolean} 是否应该覆盖
   * @private
   */
  _shouldOverride(existingMetadata, newMetadata) {
    // 1. 按发现源优先级比较
    const existingSourcePriority = this.sourcePriority[existingMetadata.source] || 999
    const newSourcePriority = this.sourcePriority[newMetadata.source] || 999

    if (newSourcePriority < existingSourcePriority) {
      return true // 新资源优先级更高
    }

    if (newSourcePriority > existingSourcePriority) {
      return false // 现有资源优先级更高
    }

    // 2. 相同优先级，按数字优先级比较
    if (newMetadata.priority < existingMetadata.priority) {
      return true // 数字越小优先级越高
    }

    if (newMetadata.priority > existingMetadata.priority) {
      return false
    }

    // 3. 相同优先级，按时间戳比较（新的覆盖旧的）
    const existingTime = existingMetadata.timestamp ? new Date(existingMetadata.timestamp).getTime() : 0
    const newTime = newMetadata.timestamp ? new Date(newMetadata.timestamp).getTime() : 0

    return newTime >= existingTime
  }
}

module.exports = EnhancedResourceRegistry