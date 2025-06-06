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
    this.packageProtocol = null
  }

  /**
   * 设置PackageProtocol实例
   */
  setPackageProtocol (packageProtocol) {
    this.packageProtocol = packageProtocol
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
   * 解析资源路径
   */
  async resolvePath (resourcePath, queryParams) {
    const roleId = resourcePath.trim()

    if (!this.registry[roleId]) {
      throw new Error(`角色 "${roleId}" 未在注册表中找到。可用角色：${Object.keys(this.registry).join(', ')}`)
    }

    const registryEntry = this.registry[roleId]
    
    // 兼容两种格式：字符串路径或对象格式
    let registryPath
    if (typeof registryEntry === 'string') {
      registryPath = registryEntry
    } else if (registryEntry && registryEntry.file) {
      registryPath = registryEntry.file
    } else {
      throw new Error(`无效的注册表条目格式: ${JSON.stringify(registryEntry)}`)
    }

    // 处理 @package:// 前缀 - 通过PackageProtocol正确解析
    if (registryPath && registryPath.startsWith('@package://')) {
      if (!this.packageProtocol) {
        throw new Error('PackageProtocol未设置，无法解析@package://路径')
      }
      
      const packageRelativePath = registryPath.replace('@package://', '')
      const resolvedPath = await this.packageProtocol.resolvePath(packageRelativePath, queryParams)
      return resolvedPath
    }

    return registryPath
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
