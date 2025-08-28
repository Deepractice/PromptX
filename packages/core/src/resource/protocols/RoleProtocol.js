const ResourceProtocol = require('./ResourceProtocol')
const fs = require('fs-extra')
const path = require('path')

/**
 * AI角色协议处理器
 * 处理 role:// 协议的资源解析，直接加载完整role文件
 */
class RoleProtocol extends ResourceProtocol {
  constructor () {
    super('role')
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
      name: 'role',
      description: 'AI角色资源协议',
      location: 'role://{role_id}',
      examples: [
        'role://video-copywriter',
        'role://product-owner',
        'role://assistant',
        'role://prompt-developer'
      ]
    }
  }

  /**
   * 解析角色协议
   * @param {string} rolePath - 角色路径，如 'java-developer'
   * @param {Object} queryParams - 查询参数（暂未使用）
   * @returns {Promise<string>} 角色文件内容
   */
  async resolve(rolePath, queryParams = {}) {
    try {
      // 构建可能的资源ID格式
      const fullResourceId = `role:${rolePath}`
      const shortResourceId = rolePath
      
      // 从RegistryData查找资源
      let resourceData = this.registryManager.registryData.findResourceById(rolePath, 'role')
      
      if (!resourceData) {
        // 如果没找到，尝试其他格式
        resourceData = this.registryManager.registryData.findResourceById(fullResourceId)
      }
      
      if (!resourceData) {
        const availableRoles = this.registryManager.registryData.getResourcesByProtocol('role')
          .map(r => r.id).join(', ')
        throw new Error(`角色 '${rolePath}' 未找到。可用角色: ${availableRoles}`)
      }

      // 通过ResourceManager加载实际内容
      const result = await this.registryManager.loadResourceByProtocol(resourceData.reference)
      
      return result
    } catch (error) {
      throw new Error(`RoleProtocol.resolve failed: ${error.message}`)
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
      throw new Error(`无法加载角色文件 ${resolvedPath}: ${error.message}`)
    }
  }

  /**
   * 验证资源路径
   */
  validatePath (resourcePath) {
    return /^[a-zA-Z0-9_-]+$/.test(resourcePath)
  }
}

module.exports = RoleProtocol
