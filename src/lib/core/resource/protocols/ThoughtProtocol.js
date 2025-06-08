const ResourceProtocol = require('./ResourceProtocol')
const fs = require('fs-extra')
const path = require('path')

/**
 * 思维模式协议处理器
 * 处理 thought:// 协议的资源解析
 * 支持跨项目思维模式发现机制
 */
class ThoughtProtocol extends ResourceProtocol {
  constructor () {
    super('thought')
    this.registry = {}
    this.packageProtocol = null
    this.dynamicThoughtsCache = null
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
   * 发现所有可用思维模式（包括本地项目中的思维）
   */
  async discoverAllThoughts () {
    if (this.dynamicThoughtsCache) {
      return this.dynamicThoughtsCache
    }

    const allThoughts = {}

    // 1. 添加注册表中的思维模式（包内思维）
    for (const [thoughtId, thoughtPath] of Object.entries(this.registry)) {
      allThoughts[thoughtId] = thoughtPath
    }

    // 2. 扫描本地思维文件（双重扫描机制）
    try {
      const localThoughts = await this.scanLocalThoughts()
      // 本地思维优先级更高，可覆盖包内同名思维
      Object.assign(allThoughts, localThoughts)
    } catch (error) {
      // 本地思维扫描失败不影响包内思维使用
      console.warn('本地思维扫描失败:', error.message)
    }

    this.dynamicThoughtsCache = allThoughts
    return allThoughts
  }

  /**
   * 扫描本地思维文件
   * 双重扫描机制：包根目录 + 当前工作目录
   */
  async scanLocalThoughts () {
    const thoughts = {}

    try {
      // 1. 扫描包根目录中的思维（内置思维）
      if (this.packageProtocol) {
        const packageRoot = await this.packageProtocol.getPackageRoot()
        const packageDomainPath = path.join(packageRoot, 'prompt', 'domain')
        
        if (await fs.pathExists(packageDomainPath)) {
          const packageEntries = await fs.readdir(packageDomainPath, { withFileTypes: true })
          
          for (const entry of packageEntries) {
            if (entry.isDirectory()) {
              const roleId = entry.name
              const thoughtFile = path.join(packageDomainPath, roleId, 'thought', `${roleId}.thought.md`)
              
              if (await fs.pathExists(thoughtFile)) {
                thoughts[roleId] = `@package://prompt/domain/${roleId}/thought/${roleId}.thought.md`
              }
            }
          }
        }
      }

      // 2. 扫描当前工作目录中的思维（本地思维，优先级更高）
      const workingDomainPath = path.resolve(process.cwd(), 'prompt', 'domain')
      
      if (await fs.pathExists(workingDomainPath)) {
        const workingEntries = await fs.readdir(workingDomainPath, { withFileTypes: true })
        
        for (const entry of workingEntries) {
          if (entry.isDirectory()) {
            const roleId = entry.name
            const thoughtFile = path.join(workingDomainPath, roleId, 'thought', `${roleId}.thought.md`)
            
            if (await fs.pathExists(thoughtFile)) {
              // 工作目录思维使用绝对路径，优先级更高
              thoughts[roleId] = thoughtFile
            }
          }
        }
      }

    } catch (error) {
      console.warn('扫描本地思维时出错:', error.message)
    }

    return thoughts
  }

  /**
   * 清除动态思维缓存
   */
  clearDynamicCache () {
    this.dynamicThoughtsCache = null
  }

  /**
   * 获取协议信息
   */
  getProtocolInfo () {
    return {
      name: 'thought',
      description: '思维模式资源协议',
      location: 'thought://{thought_id}',
      examples: [
        'thought://prompt-developer',
        'thought://product-owner'
      ]
    }
  }

  /**
   * 解析资源路径
   */
  async resolvePath (resourcePath, queryParams) {
    const thoughtId = resourcePath.trim()

    // 使用动态思维发现
    const allThoughts = await this.discoverAllThoughts()

    if (!allThoughts[thoughtId]) {
      throw new Error(`思维模式 "${thoughtId}" 未找到。可用思维：${Object.keys(allThoughts).join(', ')}`)
    }

    let thoughtPath = allThoughts[thoughtId]

    // 处理 @package:// 前缀 - 通过PackageProtocol正确解析
    if (thoughtPath.startsWith('@package://')) {
      if (!this.packageProtocol) {
        throw new Error('PackageProtocol未设置，无法解析@package://路径')
      }
      
      const packageRelativePath = thoughtPath.replace('@package://', '')
      const resolvedPath = await this.packageProtocol.resolvePath(packageRelativePath, queryParams)
      return resolvedPath
    }

    // 绝对路径直接返回（来自工作目录的思维）
    if (path.isAbsolute(thoughtPath)) {
      return thoughtPath
    }

    return thoughtPath
  }

  /**
   * 加载资源内容
   */
  async loadContent (resolvedPath, queryParams) {
    try {
      const content = await fs.readFile(resolvedPath, 'utf-8')
      return content
    } catch (error) {
      throw new Error(`无法加载思维模式文件 ${resolvedPath}: ${error.message}`)
    }
  }

  /**
   * 验证资源路径
   */
  validatePath (resourcePath) {
    return /^[a-zA-Z0-9_-]+$/.test(resourcePath)
  }
}

module.exports = ThoughtProtocol
