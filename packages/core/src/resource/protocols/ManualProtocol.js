const ResourceProtocol = require('./ResourceProtocol')

/**
 * Manual协议处理器
 * 处理 @manual://tool-name 格式的资源引用
 * 从注册表中查找并加载工具使用手册
 */
class ManualProtocol extends ResourceProtocol {
  constructor() {
    super('manual')
    this.registryManager = null
  }

  /**
   * 设置注册表管理器引用
   * @param {Object} manager - ResourceManager实例
   */
  setRegistryManager(manager) {
    this.registryManager = manager
  }

  /**
   * 解析工具手册资源路径
   * @param {string} manualPath - 手册名称，如 "calculator"
   * @param {Object} queryParams - 查询参数（可选）
   * @returns {Promise<Object>} 手册内容和元数据
   */
  async resolve(manualPath, queryParams = {}) {
    if (!this.registryManager) {
      throw new Error('ManualProtocol: Registry manager not set')
    }

    // 1. 从注册表查找manual资源
    const manualResource = this.registryManager.registryData
      .findResourceById(manualPath, 'manual')
    
    if (!manualResource) {
      // 尝试查找对应的tool资源，给出更友好的提示
      const toolResource = this.registryManager.registryData
        .findResourceById(manualPath, 'tool')
      
      if (toolResource) {
        throw new Error(`Manual '${manualPath}' not found. Found corresponding tool but no manual. Consider creating ${manualPath}.manual.md`)
      }
      
      throw new Error(`Manual '${manualPath}' not found in registry`)
    }

    // 2. 加载manual文件内容
    const manualContent = await this.registryManager
      .loadResourceByProtocol(manualResource.reference)
    
    // 3. 验证手册内容格式
    this.validateManualContent(manualContent, manualPath)

    // 4. 返回手册信息
    return {
      id: manualPath,
      content: manualContent,
      metadata: manualResource,
      source: manualResource.source || 'unknown'
    }
  }

  /**
   * 验证手册内容格式
   * @param {string} content - 手册文件内容
   * @param {string} manualPath - 手册路径
   */
  validateManualContent(content, manualPath) {
    if (!content || typeof content !== 'string') {
      throw new Error(`Manual '${manualPath}': Invalid or empty content`)
    }

    const trimmedContent = content.trim()
    if (trimmedContent.length === 0) {
      throw new Error(`Manual '${manualPath}': Empty manual content`)
    }

    // 验证是否包含<manual>标签
    if (!trimmedContent.includes('<manual>') || !trimmedContent.includes('</manual>')) {
      throw new Error(`Manual '${manualPath}': Missing required <manual> tags`)
    }
  }

  /**
   * 获取协议信息
   * @returns {Object} 协议描述信息
   */
  getProtocolInfo() {
    return {
      name: 'manual',
      description: 'Manual资源协议 - 加载工具使用手册和说明文档',
      syntax: 'manual://{manual_id}',
      examples: [
        'manual://calculator',
        'manual://send-email',
        'manual://data-processor',
        'manual://api-client'
      ],
      supportedFileTypes: ['.manual.md'],
      usageNote: '手册文件必须使用<manual>标签包裹内容，提供工具的详细使用说明'
    }
  }

  /**
   * 检查缓存策略
   * @param {string} manualPath - 手册路径
   * @returns {boolean} 是否应该缓存
   */
  shouldCache(manualPath) {
    // 手册内容通常比较稳定，启用缓存
    return true
  }

  /**
   * 获取缓存键
   * @param {string} manualPath - 手册路径
   * @returns {string} 缓存键
   */
  getCacheKey(manualPath) {
    return `manual://${manualPath}`
  }
}

module.exports = ManualProtocol