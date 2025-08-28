const ResourceProtocol = require('./ResourceProtocol')
const fs = require('fs-extra')
const path = require('path')

/**
 * 知识资源协议处理器
 * 处理 knowledge:// 协议的资源解析
 */
class KnowledgeProtocol extends ResourceProtocol {
  constructor () {
    super('knowledge')
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
      name: 'knowledge',
      description: '知识资源协议',
      location: 'knowledge://{knowledge_id}',
      examples: [
        'knowledge://xiaohongshu-marketing',
        'knowledge://ai-tools-guide'
      ]
    }
  }

  /**
   * 解析知识协议
   * @param {string} knowledgePath - 知识路径，如 'scrum'
   * @param {Object} queryParams - 查询参数（暂未使用）
   * @returns {Promise<string>} 知识文件内容
   */
  async resolve(knowledgePath, queryParams = {}) {
    try {
      // 构建可能的资源ID格式
      const fullResourceId = `knowledge:${knowledgePath}`
      
      // 从RegistryData查找资源
      let resourceData = this.registryManager.registryData.findResourceById(knowledgePath, 'knowledge')
      
      if (!resourceData) {
        // 如果没找到，尝试其他格式
        resourceData = this.registryManager.registryData.findResourceById(fullResourceId)
      }
      
      if (!resourceData) {
        const availableKnowledge = this.registryManager.registryData.getResourcesByProtocol('knowledge')
          .map(r => r.id).join(', ')
        throw new Error(`知识模块 '${knowledgePath}' 未找到。可用知识模块: ${availableKnowledge}`)
      }

      // 通过ResourceManager加载实际内容
      const result = await this.registryManager.loadResourceByProtocol(resourceData.reference)
      
      return result
    } catch (error) {
      throw new Error(`KnowledgeProtocol.resolve failed: ${error.message}`)
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
      throw new Error(`无法加载知识资源文件 ${resolvedPath}: ${error.message}`)
    }
  }

  /**
   * 验证资源路径
   */
  validatePath (resourcePath) {
    return /^[a-zA-Z0-9_-]+$/.test(resourcePath)
  }
}

module.exports = KnowledgeProtocol 