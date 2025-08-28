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
   * 解析执行协议
   * @param {string} executionPath - 执行路径，如 'best-practice'
   * @param {Object} queryParams - 查询参数（暂未使用）
   * @returns {Promise<string>} 执行文件内容
   */
  async resolve(executionPath, queryParams = {}) {
    try {
      // 构建可能的资源ID格式
      const fullResourceId = `execution:${executionPath}`
      
      // 从RegistryData查找资源
      let resourceData = this.registryManager.registryData.findResourceById(executionPath, 'execution')
      
      if (!resourceData) {
        // 如果没找到，尝试其他格式
        resourceData = this.registryManager.registryData.findResourceById(fullResourceId)
      }
      
      if (!resourceData) {
        const availableExecutions = this.registryManager.registryData.getResourcesByProtocol('execution')
          .map(r => r.id).join(', ')
        throw new Error(`执行模式 '${executionPath}' 未找到。可用执行模式: ${availableExecutions}`)
      }

      // 通过ResourceManager加载实际内容
      const result = await this.registryManager.loadResourceByProtocol(resourceData.reference)
      
      return result
    } catch (error) {
      throw new Error(`ExecutionProtocol.resolve failed: ${error.message}`)
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
