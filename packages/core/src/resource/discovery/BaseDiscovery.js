/**
 * BaseDiscovery - 资源发现基础抽象类
 * 
 * 按照DPML协议架构文档设计，提供统一的资源发现接口
 * 所有具体的Discovery实现都应该继承这个基类
 */
class BaseDiscovery {
  /**
   * 构造函数
   * @param {string} source - 发现源类型 (PACKAGE, PROJECT, USER, INTERNET)
   * @param {number} priority - 优先级，数字越小优先级越高
   */
  constructor(source, priority = 0) {
    if (!source) {
      throw new Error('Discovery source is required')
    }
    
    this.source = source
    this.priority = priority
    this.cache = new Map()
  }

  /**
   * 抽象方法：发现资源
   * 子类必须实现此方法
   * @returns {Promise<Array>} 发现的资源列表
   */
  async discover() {
    throw new Error('discover method must be implemented by subclass')
  }

  /**
   * 获取发现器信息
   * @returns {Object} 发现器元数据
   */
  getDiscoveryInfo() {
    return {
      source: this.source,
      priority: this.priority,
      description: `${this.source} resource discovery`
    }
  }

  /**
   * 验证资源结构
   * @param {Object} resource - 待验证的资源对象
   * @throws {Error} 如果资源结构无效
   */
  validateResource(resource) {
    if (!resource || typeof resource !== 'object') {
      throw new Error('Resource must be an object')
    }

    if (!resource.id || !resource.reference) {
      throw new Error('Resource must have id and reference')
    }

    // 验证ID格式 (protocol:resourcePath)
    if (typeof resource.id !== 'string' || !resource.id.includes(':')) {
      throw new Error('Resource id must be in format "protocol:resourcePath"')
    }

    // 验证引用格式 (@protocol://path)
    if (typeof resource.reference !== 'string' || !resource.reference.startsWith('@')) {
      throw new Error('Resource reference must be in DPML format "@protocol://path"')
    }
  }

  /**
   * 规范化资源对象，添加元数据
   * @param {Object} resource - 原始资源对象
   * @returns {Object} 规范化后的资源对象
   */
  normalizeResource(resource) {
    // 验证资源结构
    this.validateResource(resource)

    // 创建规范化的资源对象
    const normalizedResource = {
      id: resource.id,
      reference: resource.reference,
      metadata: {
        source: this.source,
        priority: this.priority,
        timestamp: new Date(),
        ...resource.metadata // 保留现有元数据
      }
    }

    return normalizedResource
  }

  /**
   * 清理缓存
   */
  clearCache() {
    this.cache.clear()
  }

  /**
   * 获取缓存大小
   * @returns {number} 缓存条目数量
   */
  getCacheSize() {
    return this.cache.size
  }

  /**
   * 从缓存获取资源
   * @param {string} key - 缓存键
   * @returns {*} 缓存的值或undefined
   */
  getFromCache(key) {
    return this.cache.get(key)
  }

  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {*} value - 缓存值
   */
  setCache(key, value) {
    this.cache.set(key, value)
  }
}

module.exports = BaseDiscovery