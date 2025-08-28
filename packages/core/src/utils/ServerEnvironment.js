/**
 * 服务器环境全局管理器
 * 管理MCP服务器的核心运行时属性：transport、host、port、processId
 * 启动时装配，运行时直接获取，避免参数传递错误
 */
class ServerEnvironment {
  constructor() {
    this.transport = null   // 'stdio' | 'http' | 'sse'
    this.host = null       // 'localhost' | '0.0.0.0' 等
    this.port = null       // 端口号（stdio模式为null）
    this.processId = null  // 进程ID，用于生成mcpId
    this.initialized = false
  }

  /**
   * 初始化服务环境（各启动渠道调用一次）
   * @param {Object} config - 配置对象
   * @param {string} config.transport - 传输协议
   * @param {string} config.host - 主机地址（可选）
   * @param {number} config.port - 端口号（可选）
   */
  initialize(config) {
    this.transport = config.transport
    this.host = config.host || null
    this.port = config.port || null
    this.processId = process.pid
    this.initialized = true
  }

  /**
   * 获取MCP ID（基于processId生成）
   * @returns {string} MCP进程ID
   */
  getMcpId() {
    if (!this.initialized) {
      throw new Error('ServerEnvironment not initialized')
    }
    return `mcp-${this.processId}`
  }

  /**
   * 获取传输协议
   * @returns {string} transport类型
   */
  getTransport() {
    if (!this.initialized) {
      throw new Error('ServerEnvironment not initialized')
    }
    return this.transport
  }

  /**
   * 获取服务器地址信息（仅HTTP/SSE模式）
   * @returns {Object|null} {host, port} 或 null
   */
  getServerAddress() {
    if (!this.initialized) {
      throw new Error('ServerEnvironment not initialized')
    }
    if (this.transport === 'stdio') {
      return null
    }
    return {
      host: this.host,
      port: this.port
    }
  }

  /**
   * 检查是否已初始化
   * @returns {boolean}
   */
  isInitialized() {
    return this.initialized
  }
}

// 创建全局单例实例
let globalServerEnvironment = null

/**
 * 获取全局ServerEnvironment单例
 * @returns {ServerEnvironment} 全局ServerEnvironment实例
 */
function getGlobalServerEnvironment() {
  if (!globalServerEnvironment) {
    globalServerEnvironment = new ServerEnvironment()
  }
  return globalServerEnvironment
}

module.exports = ServerEnvironment
module.exports.getGlobalServerEnvironment = getGlobalServerEnvironment