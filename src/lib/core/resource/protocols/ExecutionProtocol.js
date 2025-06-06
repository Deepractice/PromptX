const ResourceProtocol = require('./ResourceProtocol')
const fs = require('fs-extra')
const path = require('path')

/**
 * 执行模式协议处理器
 * 处理 execution:// 协议的资源解析
 */
class ExecutionProtocol extends ResourceProtocol {
  constructor () {
    super('execution')
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
      name: 'execution',
      description: '执行模式资源协议',
      location: 'execution://{execution_id}',
      examples: [
        'execution://deal-at-reference',
        'execution://prompt-developer',
        'execution://memory-trigger'
      ]
    }
  }

  /**
   * 解析资源路径
   */
  async resolvePath (resourcePath, queryParams) {
    const executionId = resourcePath.trim()

    if (!this.registry[executionId]) {
      throw new Error(`执行模式 "${executionId}" 未在注册表中找到`)
    }

    let registryPath = this.registry[executionId]

    // 处理 @package:// 前缀 - 通过PackageProtocol正确解析
    if (registryPath.startsWith('@package://')) {
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
      throw new Error(`无法加载执行模式文件 ${resolvedPath}: ${error.message}`)
    }
  }

  /**
   * 验证资源路径
   */
  validatePath (resourcePath) {
    return /^[a-zA-Z0-9_-]+$/.test(resourcePath)
  }
}

module.exports = ExecutionProtocol
