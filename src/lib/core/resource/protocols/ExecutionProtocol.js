const ResourceProtocol = require('./ResourceProtocol')
const fs = require('fs-extra')
const path = require('path')

/**
 * 执行模式协议处理器
 * 处理 execution:// 协议的资源解析
 * 支持跨项目执行模式发现机制
 */
class ExecutionProtocol extends ResourceProtocol {
  constructor () {
    super('execution')
    this.registry = {}
    this.packageProtocol = null
    this.dynamicExecutionsCache = null
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
   * 发现所有可用执行模式（包括本地项目中的执行）
   */
  async discoverAllExecutions () {
    if (this.dynamicExecutionsCache) {
      return this.dynamicExecutionsCache
    }

    const allExecutions = {}

    // 1. 添加注册表中的执行模式（包内执行）
    for (const [executionId, executionPath] of Object.entries(this.registry)) {
      allExecutions[executionId] = executionPath
    }

    // 2. 扫描本地执行文件（双重扫描机制）
    try {
      const localExecutions = await this.scanLocalExecutions()
      // 本地执行优先级更高，可覆盖包内同名执行
      Object.assign(allExecutions, localExecutions)
    } catch (error) {
      // 本地执行扫描失败不影响包内执行使用
      console.warn('本地执行扫描失败:', error.message)
    }

    this.dynamicExecutionsCache = allExecutions
    return allExecutions
  }

  /**
   * 扫描本地执行文件
   * 双重扫描机制：包根目录 + 当前工作目录
   */
  async scanLocalExecutions () {
    const executions = {}

    try {
      // 1. 扫描包根目录中的执行（内置执行）
      if (this.packageProtocol) {
        const packageRoot = await this.packageProtocol.getPackageRoot()
        const packageDomainPath = path.join(packageRoot, 'prompt', 'domain')
        
        if (await fs.pathExists(packageDomainPath)) {
          const packageEntries = await fs.readdir(packageDomainPath, { withFileTypes: true })
          
          for (const entry of packageEntries) {
            if (entry.isDirectory()) {
              const roleId = entry.name
              const executionFile = path.join(packageDomainPath, roleId, 'execution', `${roleId}.execution.md`)
              
              if (await fs.pathExists(executionFile)) {
                executions[roleId] = `@package://prompt/domain/${roleId}/execution/${roleId}.execution.md`
              }
            }
          }
        }
      }

      // 2. 扫描当前工作目录中的执行（本地执行，优先级更高）
      const workingDomainPath = path.resolve(process.cwd(), 'prompt', 'domain')
      
      if (await fs.pathExists(workingDomainPath)) {
        const workingEntries = await fs.readdir(workingDomainPath, { withFileTypes: true })
        
        for (const entry of workingEntries) {
          if (entry.isDirectory()) {
            const roleId = entry.name
            const executionFile = path.join(workingDomainPath, roleId, 'execution', `${roleId}.execution.md`)
            
            if (await fs.pathExists(executionFile)) {
              // 工作目录执行使用绝对路径，优先级更高
              executions[roleId] = executionFile
            }
          }
        }
      }

    } catch (error) {
      console.warn('扫描本地执行时出错:', error.message)
    }

    return executions
  }

  /**
   * 清除动态执行缓存
   */
  clearDynamicCache () {
    this.dynamicExecutionsCache = null
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

    // 使用动态执行发现
    const allExecutions = await this.discoverAllExecutions()

    if (!allExecutions[executionId]) {
      throw new Error(`执行模式 "${executionId}" 未找到。可用执行：${Object.keys(allExecutions).join(', ')}`)
    }

    let executionPath = allExecutions[executionId]

    // 处理 @package:// 前缀 - 通过PackageProtocol正确解析
    if (executionPath.startsWith('@package://')) {
      if (!this.packageProtocol) {
        throw new Error('PackageProtocol未设置，无法解析@package://路径')
      }
      
      const packageRelativePath = executionPath.replace('@package://', '')
      const resolvedPath = await this.packageProtocol.resolvePath(packageRelativePath, queryParams)
      return resolvedPath
    }

    // 绝对路径直接返回（来自工作目录的执行）
    if (path.isAbsolute(executionPath)) {
      return executionPath
    }

    return executionPath
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
