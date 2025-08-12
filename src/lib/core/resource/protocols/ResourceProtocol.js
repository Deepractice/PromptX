/**
 * 资源协议接口基类
 * 定义所有DPML资源协议的统一规范
 */
class ResourceProtocol {
  /**
   * 构造函数
   * @param {string} name - 协议名称
   * @param {object} options - 配置选项
   */
  constructor (name, options = {}) {
    if (new.target === ResourceProtocol) {
      throw new Error('ResourceProtocol是抽象类，不能直接实例化')
    }

    this.name = name
    this.options = options
    this.cache = new Map()
    // 默认禁用缓存，避免开发时的问题，需要时显式启用
    this.enableCache = options.enableCache === true
  }

  /**
   * 协议信息 - 需要子类实现
   * @returns {object} 协议信息
   */
  getProtocolInfo () {
    throw new Error('子类必须实现 getProtocolInfo() 方法')
  }

  /**
   * 解析资源路径 - 需要子类实现
   * @param {string} resourcePath - 原始资源路径
   * @param {QueryParams} queryParams - 查询参数
   * @returns {Promise<string>} 解析后的路径
   */
  async resolvePath (resourcePath, queryParams) {
    throw new Error('子类必须实现 resolvePath() 方法')
  }

  /**
   * 加载资源内容 - 需要子类实现
   * @param {string} resolvedPath - 解析后的路径
   * @param {QueryParams} queryParams - 查询参数
   * @returns {Promise<string>} 资源内容
   */
  async loadContent (resolvedPath, queryParams) {
    throw new Error('子类必须实现 loadContent() 方法')
  }

  /**
   * 验证资源路径格式 - 可选实现
   * @param {string} resourcePath - 资源路径
   * @returns {boolean} 是否有效
   */
  validatePath (resourcePath) {
    return typeof resourcePath === 'string' && resourcePath.length > 0
  }

  /**
   * 支持的查询参数列表 - 可选实现
   * @returns {object} 参数说明
   */
  getSupportedParams () {
    return {
      line: 'string - 行范围，如 "1-10"',
      format: 'string - 输出格式',
      cache: 'boolean - 是否缓存'
    }
  }

  /**
   * 统一的资源解析入口点
   * @param {string} resourcePath - 资源路径
   * @param {QueryParams} queryParams - 查询参数
   * @returns {Promise<string>} 资源内容
   */
  async resolve (resourcePath, queryParams) {
    // 1. 验证路径格式
    if (!this.validatePath(resourcePath)) {
      const error = new Error(`无效的资源路径: ${resourcePath}`)
      const logger = require('../../../utils/logger')
      logger.error(`[ResourceProtocol] 路径验证失败: ${resourcePath}`)
      logger.error(`[ResourceProtocol] 调用堆栈:`, error.stack)
      throw error
    }

    // 2. 生成缓存键
    const cacheKey = this.generateCacheKey(resourcePath, queryParams)

    // 3. 检查缓存
    if (this.enableCache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    // 4. 解析路径
    const resolvedPath = await this.resolvePath(resourcePath, queryParams)

    // 5. 加载内容
    const content = await this.loadContent(resolvedPath, queryParams)

    // 6. 应用通用查询参数过滤
    const filteredContent = this.applyCommonParams(content, queryParams)

    // 7. 缓存结果
    if (this.enableCache) {
      this.cache.set(cacheKey, filteredContent)
    }

    return filteredContent
  }

  /**
   * 生成缓存键
   * @param {string} resourcePath - 资源路径
   * @param {QueryParams} queryParams - 查询参数
   * @returns {string} 缓存键
   */
  generateCacheKey (resourcePath, queryParams) {
    const params = queryParams ? queryParams.getAll() : {}
    return `${this.name}:${resourcePath}:${JSON.stringify(params)}`
  }

  /**
   * 应用通用查询参数
   * @param {string} content - 原始内容
   * @param {QueryParams} queryParams - 查询参数
   * @returns {string} 过滤后的内容
   */
  applyCommonParams (content, queryParams) {
    if (!queryParams) {
      return content
    }

    let result = content

    // 应用行过滤
    if (queryParams.line) {
      result = this.applyLineFilter(result, queryParams.line)
    }

    // 应用格式化（基础实现，子类可以重写）
    if (queryParams.format && queryParams.format !== 'text') {
      result = this.applyFormat(result, queryParams.format)
    }

    return result
  }

  /**
   * 应用行过滤
   * @param {string} content - 内容
   * @param {string} lineRange - 行范围，如 "5-10" 或 "5"
   * @returns {string} 过滤后的内容
   */
  applyLineFilter (content, lineRange) {
    const lines = content.split('\n')

    if (lineRange.includes('-')) {
      const [start, end] = lineRange.split('-').map(n => parseInt(n.trim(), 10))
      const startIndex = Math.max(0, start - 1)
      const endIndex = Math.min(lines.length, end)
      return lines.slice(startIndex, endIndex).join('\n')
    } else {
      const lineNum = parseInt(lineRange, 10)
      const lineIndex = lineNum - 1
      return lines[lineIndex] || ''
    }
  }

  /**
   * 应用格式化
   * @param {string} content - 内容
   * @param {string} format - 格式
   * @returns {string} 格式化后的内容
   */
  applyFormat (content, format) {
    // 基础实现，子类可以重写
    switch (format) {
      case 'json':
        try {
          return JSON.stringify(JSON.parse(content), null, 2)
        } catch {
          return content
        }
      case 'trim':
        return content.trim()
      default:
        return content
    }
  }

  /**
   * 清除缓存
   */
  clearCache () {
    this.cache.clear()
  }

  /**
   * 获取缓存统计
   * @returns {object} 缓存统计信息
   */
  getCacheStats () {
    return {
      protocol: this.name,
      size: this.cache.size,
      enabled: this.enableCache
    }
  }
}

module.exports = ResourceProtocol
