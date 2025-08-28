/**
 * 资源模块基础数据类型定义
 * 基于DPML资源协议标准
 */

/**
 * 加载语义枚举
 */
const LoadingSemantics = {
  DEFAULT: 'default', // @ - AI自行决定加载时机
  HOT_LOAD: 'hot_load', // @! - 立即加载
  LAZY_LOAD: 'lazy_load' // @? - 懒加载
}

/**
 * 解析后的资源引用
 */
class ParsedReference {
  constructor () {
    this.loadingSemantics = LoadingSemantics.DEFAULT
    this.protocol = ''
    this.path = ''
    this.queryParams = new QueryParams()
    this.isNested = false
    this.nestedRef = null
    this.originalRef = ''
  }
}

/**
 * 查询参数
 */
class QueryParams {
  constructor () {
    this.line = null // 行范围 "5-10"
    this.format = null // 输出格式 "json"
    this.cache = null // 是否缓存，默认为null表示未设置
    this.params = new Map() // 其他参数
  }

  /**
   * 设置参数
   */
  set (key, value) {
    if (['line', 'format', 'cache'].includes(key)) {
      this[key] = value
    } else {
      this.params.set(key, value)
    }
  }

  /**
   * 获取参数
   */
  get (key) {
    if (['line', 'format', 'cache'].includes(key)) {
      return this[key]
    }
    return this.params.get(key)
  }

  /**
   * 获取所有参数
   */
  getAll () {
    const result = {}

    // 只添加非null的内置参数
    if (this.line !== null) {
      result.line = this.line
    }
    if (this.format !== null) {
      result.format = this.format
    }
    if (this.cache !== null) {
      result.cache = this.cache
    }

    // 添加其他参数
    for (const [key, value] of this.params) {
      result[key] = value
    }

    return result
  }

  /**
   * 转换为字符串用于缓存键
   */
  toString () {
    const params = []

    // 添加内置参数
    if (this.line !== null) {
      params.push(`line=${this.line}`)
    }
    if (this.format !== null) {
      params.push(`format=${this.format}`)
    }
    if (this.cache !== null) {
      params.push(`cache=${this.cache}`)
    }

    // 添加其他参数（按键排序以确保一致性）
    const sortedParams = Array.from(this.params.entries()).sort()
    for (const [key, value] of sortedParams) {
      params.push(`${key}=${value}`)
    }

    return params.join('&')
  }
}

/**
 * 嵌套引用
 */
class NestedReference {
  constructor () {
    this.outer = null // 外层引用
    this.inner = null // 内层引用
    this.depth = 0 // 嵌套深度
  }
}

/**
 * 资源内容
 */
class ResourceContent {
  constructor (path, content, metadata = {}) {
    this.path = path
    this.content = content
    this.metadata = metadata
    this.relativePath = ''
    this.lastModified = null
    this.size = content ? content.length : 0
  }
}

/**
 * 懒加载资源
 */
class LazyResource {
  constructor (path, loader) {
    this.path = path
    this.loader = loader
    this.loaded = false
    this._content = null
  }

  /**
   * 加载资源
   */
  async load () {
    if (!this.loaded) {
      this._content = await this.loader(this.path)
      this.loaded = true
    }
    return this._content
  }
}

/**
 * 处理后的结果
 */
class ProcessedResult {
  constructor () {
    this.content = ''
    this.metadata = {}
    this.format = 'text'
    this.sources = []
    this.cached = false
  }
}

/**
 * 最终资源结果
 */
class ResourceResult {
  constructor () {
    this.content = ''
    this.metadata = {}
    this.sources = []
    this.format = 'text'
    this.cached = false
    this.loadTime = Date.now()
    this.success = true
    this.error = null
  }

  /**
   * 创建成功结果
   */
  static success (content, metadata = {}) {
    const result = new ResourceResult()
    result.content = content
    result.metadata = metadata
    result.success = true
    return result
  }

  /**
   * 创建错误结果
   */
  static error (error, metadata = {}) {
    const result = new ResourceResult()
    result.success = false
    result.error = error
    result.metadata = metadata
    return result
  }
}

/**
 * 资源协议信息
 */
class ProtocolInfo {
  constructor () {
    this.name = ''
    this.description = ''
    this.location = '' // EBNF路径定义
    this.params = {} // 支持的参数
    this.registry = new Map() // ID到路径的映射
  }
}

module.exports = {
  LoadingSemantics,
  ParsedReference,
  QueryParams,
  NestedReference,
  ResourceContent,
  LazyResource,
  ProcessedResult,
  ResourceResult,
  ProtocolInfo
}
