const ResourceProtocol = require('./ResourceProtocol')
const fs = require('fs-extra')
const path = require('path')

/**
 * 思维模式协议处理器
 * 处理 thought:// 协议的资源解析
 */
class ThoughtProtocol extends ResourceProtocol {
  constructor () {
    super('thought')
    this.registry = {}
    this.registryManager = null // 统一注册表管理器
  }

  /**
   * 设置注册表管理器
   */
  setRegistryManager(manager) {
    this.registryManager = manager
  }

  /**
   * 设置注册表
   */
  setRegistry (registry) {
    this.registry = registry || {}
  }

  /**
   * 获取协议信息
   */
  getProtocolInfo () {
    return {
      name: 'thought',
      description: '思维模式资源协议',
      location: 'thought://{thought_id}',
      examples: [
        'thought://prompt-developer',
        'thought://product-owner'
      ]
    }
  }

  /**
   * 解析思维协议
   * @param {string} thoughtPath - 思维路径，如 'remember'
   * @param {Object} queryParams - 查询参数（暂未使用）
   * @returns {Promise<string>} 思维文件内容
   */
  async resolve(thoughtPath, queryParams = {}) {
    try {
      // 构建可能的资源ID格式
      const fullResourceId = `thought:${thoughtPath}`
      
      // 从RegistryData查找资源
      let resourceData = this.registryManager.registryData.findResourceById(thoughtPath, 'thought')
      
      if (!resourceData) {
        // 如果没找到，尝试其他格式
        resourceData = this.registryManager.registryData.findResourceById(fullResourceId)
      }
      
      if (!resourceData) {
        const availableThoughts = this.registryManager.registryData.getResourcesByProtocol('thought')
          .map(r => r.id).join(', ')
        throw new Error(`思维模式 '${thoughtPath}' 未找到。可用思维模式: ${availableThoughts}`)
      }

      // 通过ResourceManager加载实际内容
      const result = await this.registryManager.loadResourceByProtocol(resourceData.reference)
      
      return result
    } catch (error) {
      throw new Error(`ThoughtProtocol.resolve failed: ${error.message}`)
    }
  }

  /**
   * 加载资源内容
   */
  async loadContent (resolvedPath, queryParams) {
    try {
      const content = await fs.readFile(resolvedPath, 'utf-8')
      return content
    } catch (error) {
      throw new Error(`无法加载思维模式文件 ${resolvedPath}: ${error.message}`)
    }
  }

  /**
   * 验证资源路径
   */
  validatePath (resourcePath) {
    return /^[a-zA-Z0-9_-]+$/.test(resourcePath)
  }
}

module.exports = ThoughtProtocol
