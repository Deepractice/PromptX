const {
  LoadingSemantics,
  ParsedReference,
  QueryParams,
  NestedReference
} = require('./types')

/**
 * 资源协议解析器
 * 解析DPML资源引用语法：@protocol://path?params
 */
class ResourceProtocolParser {
  constructor () {
    // 资源引用正则表达式
    this.resourceRefRegex = /^(@[!?]?|@)([a-zA-Z][a-zA-Z0-9_-]*):(.+)$/
    this.nestedRefRegex = /^(@[!?]?|@)([a-zA-Z][a-zA-Z0-9_-]*):(@[!?]?|@)?(.+)$/
    this.queryParamsRegex = /^([^?]+)(?:\?(.+))?$/
  }

  /**
   * 解析资源引用
   * @param {string} resourceRef - 资源引用字符串
   * @returns {ParsedReference} 解析后的引用对象
   */
  parse (resourceRef) {
    if (!resourceRef || typeof resourceRef !== 'string') {
      throw new Error('Invalid resource reference: must be a non-empty string')
    }

    const trimmedRef = resourceRef.trim()
    if (!this.validateSyntax(trimmedRef)) {
      throw new Error(`Invalid resource reference syntax: ${trimmedRef}`)
    }

    const parsed = new ParsedReference()
    parsed.originalRef = trimmedRef

    // 检查是否为嵌套引用
    if (this.isNestedReference(trimmedRef)) {
      return this.parseNestedReference(trimmedRef)
    }

    // 解析基础引用
    return this.parseBasicReference(trimmedRef)
  }

  /**
   * 解析基础资源引用
   * @param {string} ref - 基础引用
   * @returns {ParsedReference}
   */
  parseBasicReference (ref) {
    const parsed = new ParsedReference()
    parsed.originalRef = ref

    // 解析加载语义
    parsed.loadingSemantics = this.parseLoadingSemantics(ref)

    // 移除加载语义前缀
    const withoutSemantics = this.removeLoadingSemantics(ref)

    // 匹配协议和路径
    const match = withoutSemantics.match(/^([a-zA-Z][a-zA-Z0-9_-]*):(.+)$/)
    if (!match) {
      throw new Error(`Invalid protocol format: ${ref}`)
    }

    parsed.protocol = match[1]
    let pathAndParams = match[2]

    // 移除 :// 前缀（如果存在）
    if (pathAndParams.startsWith('//')) {
      pathAndParams = pathAndParams.substring(2)
    }

    // 解析路径和查询参数
    const pathMatch = pathAndParams.match(this.queryParamsRegex)
    if (pathMatch) {
      parsed.path = pathMatch[1]
      if (pathMatch[2]) {
        parsed.queryParams = this.parseQueryParams(pathMatch[2])
      }
    } else {
      parsed.path = pathAndParams
    }

    return parsed
  }

  /**
   * 解析嵌套引用
   * @param {string} ref - 嵌套引用
   * @returns {ParsedReference}
   */
  parseNestedReference (ref) {
    const parsed = new ParsedReference()
    parsed.originalRef = ref
    parsed.isNested = true

    // 解析外层加载语义
    parsed.loadingSemantics = this.parseLoadingSemantics(ref)
    const withoutOuterSemantics = this.removeLoadingSemantics(ref)

    // 匹配嵌套结构: protocol:@inner_protocol://path 或 protocol:inner_protocol://path
    const match = withoutOuterSemantics.match(/^([a-zA-Z][a-zA-Z0-9_-]*):(.+)$/)
    if (!match) {
      throw new Error(`Invalid nested reference format: ${ref}`)
    }

    parsed.protocol = match[1]
    let innerRef = match[2]

    // 处理内层引用：移除可能的 :// 前缀，但保留 @ 前缀
    if (innerRef.startsWith('//')) {
      innerRef = innerRef.substring(2)
    }

    // 确保内层引用有正确的格式
    if (!innerRef.startsWith('@')) {
      innerRef = '@' + innerRef
    }

    // 递归解析内层引用
    try {
      const innerParsed = this.parse(innerRef)

      // 创建嵌套引用结构
      const nested = new NestedReference()
      nested.outer = parsed
      nested.inner = innerParsed
      nested.depth = this.calculateNestingDepth(innerParsed)

      parsed.nestedRef = nested
    } catch (error) {
      throw new Error(`Invalid nested inner reference: ${error.message}`)
    }

    return parsed
  }

  /**
   * 解析加载语义
   * @param {string} ref - 资源引用
   * @returns {string} 加载语义
   */
  parseLoadingSemantics (ref) {
    if (ref.startsWith('@!')) {
      return LoadingSemantics.HOT_LOAD
    } else if (ref.startsWith('@?')) {
      return LoadingSemantics.LAZY_LOAD
    } else if (ref.startsWith('@')) {
      return LoadingSemantics.DEFAULT
    }

    throw new Error(`Invalid loading semantics: ${ref}`)
  }

  /**
   * 移除加载语义前缀
   * @param {string} ref - 资源引用
   * @returns {string} 移除前缀后的引用
   */
  removeLoadingSemantics (ref) {
    if (ref.startsWith('@!') || ref.startsWith('@?')) {
      return ref.substring(2)
    } else if (ref.startsWith('@')) {
      return ref.substring(1)
    }
    return ref
  }

  /**
   * 解析查询参数
   * @param {string} queryString - 查询字符串
   * @returns {QueryParams} 查询参数对象
   */
  parseQueryParams (queryString) {
    const params = new QueryParams()

    if (!queryString) {
      return params
    }

    const pairs = queryString.split('&')
    for (const pair of pairs) {
      const [key, value] = pair.split('=').map(decodeURIComponent)

      if (key) {
        // 处理特殊参数
        if (key === 'cache') {
          params.set(key, value === 'true' || value === '1')
        } else {
          params.set(key, value || '')
        }
      }
    }

    return params
  }

  /**
   * 验证语法
   * @param {string} ref - 资源引用
   * @returns {boolean} 是否有效
   */
  validateSyntax (ref) {
    if (!ref) return false

    // 必须以@开头
    if (!ref.startsWith('@')) return false

    // 基本格式检查
    const withoutSemantics = this.removeLoadingSemantics(ref)
    return /^[a-zA-Z][a-zA-Z0-9_-]*:.+$/.test(withoutSemantics)
  }

  /**
   * 检查是否为嵌套引用
   * @param {string} ref - 资源引用
   * @returns {boolean} 是否为嵌套引用
   */
  isNestedReference (ref) {
    const withoutSemantics = this.removeLoadingSemantics(ref)
    const colonIndex = withoutSemantics.indexOf(':')

    if (colonIndex === -1) return false

    const afterColon = withoutSemantics.substring(colonIndex + 1)

    // 检查是否包含内层引用 (@protocol: 或 protocol:)
    return afterColon.includes('@') || afterColon.includes('://')
  }

  /**
   * 计算嵌套深度
   * @param {ParsedReference} ref - 解析后的引用
   * @returns {number} 嵌套深度
   */
  calculateNestingDepth (ref) {
    if (!ref.isNested) return 1
    return 1 + this.calculateNestingDepth(ref.nestedRef.inner)
  }

  /**
   * 提取协议名
   * @param {string} ref - 资源引用
   * @returns {string} 协议名
   */
  extractProtocol (ref) {
    const withoutSemantics = this.removeLoadingSemantics(ref)
    const colonIndex = withoutSemantics.indexOf(':')
    return colonIndex > 0 ? withoutSemantics.substring(0, colonIndex) : ''
  }

  /**
   * 提取路径
   * @param {string} ref - 资源引用
   * @returns {string} 路径
   */
  extractPath (ref) {
    const withoutSemantics = this.removeLoadingSemantics(ref)
    const colonIndex = withoutSemantics.indexOf(':')
    if (colonIndex === -1) return ''

    let pathAndParams = withoutSemantics.substring(colonIndex + 1)

    // 移除 :// 前缀（如果存在）
    if (pathAndParams.startsWith('//')) {
      pathAndParams = pathAndParams.substring(2)
    }

    const queryIndex = pathAndParams.indexOf('?')
    return queryIndex > 0 ? pathAndParams.substring(0, queryIndex) : pathAndParams
  }

  /**
   * 提取查询参数字符串
   * @param {string} ref - 资源引用
   * @returns {string} 查询参数字符串
   */
  extractParams (ref) {
    const queryIndex = ref.indexOf('?')
    return queryIndex > 0 ? ref.substring(queryIndex + 1) : ''
  }
}

module.exports = ResourceProtocolParser
