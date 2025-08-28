const path = require('path')
const fs = require('fs')
const fsPromises = require('fs').promises
const ResourceProtocol = require('./ResourceProtocol')
const { QueryParams } = require('../types')
const logger = require('~/utils/logger')
const { getDirectoryService } = require('~/utils/DirectoryService')

/**
 * 包协议实现
 * 实现@package://协议，智能检测并访问NPM包资源
 * 支持：本地开发、npm install、npm -g、npx、monorepo等场景
 */
class PackageProtocol extends ResourceProtocol {
  constructor (options = {}) {
    super('package', options)

    // 包安装模式检测缓存
    this.installModeCache = new Map()
    this.directoryService = getDirectoryService()
  }

  /**
   * 设置注册表（保持与其他协议的一致性）
   */
  setRegistry (registry) {
    // Package协议不使用注册表，但为了一致性提供此方法
    this.registry = registry || {}
  }

  /**
   * 获取协议信息
   */
  getProtocolInfo () {
    return {
      name: this.name,
      description: '包协议 - 智能访问NPM包资源，支持多种安装模式',
      examples: [
        '@package://package.json',
        '@package://src/index.js',
        '@package://docs/README.md',
        '@package://resource/core/thought.md',
        '@package://templates/basic/template.md'
      ],
      installModes: [
        'development', // 开发模式
        'local', // 本地npm install
        'global', // 全局npm install -g
        'npx', // npx执行
        'monorepo', // monorepo workspace
        'link' // npm link
      ]
    }
  }

  /**
   * 检测当前包安装模式
   */
  async detectInstallMode () {
    const cacheKey = 'currentInstallMode'
    if (this.installModeCache.has(cacheKey)) {
      return this.installModeCache.get(cacheKey)
    }

    const mode = await this._performInstallModeDetection()
    this.installModeCache.set(cacheKey, mode)
    return mode
  }

  /**
   * 执行安装模式检测
   */
  async _performInstallModeDetection () {
    let cwd
    try {
      const context = {
        startDir: process.cwd(),
        platform: process.platform,
        avoidUserHome: true
      }
      cwd = await this.directoryService.getProjectRoot(context)
    } catch (error) {
      cwd = process.cwd()
    }
    
    const execPath = process.argv[0]
    const scriptPath = process.argv[1]

    // 检测npx执行
    if (this._isNpxExecution()) {
      return 'npx'
    }

    // 检测全局安装
    if (this._isGlobalInstall()) {
      return 'global'
    }

    // 检测开发模式
    if (this._isDevelopmentMode()) {
      return 'development'
    }

    // 检测monorepo
    if (this._isMonorepoWorkspace()) {
      return 'monorepo'
    }

    // 检测npm link
    if (this._isNpmLink()) {
      return 'link'
    }

    // 默认为本地安装
    return 'local'
  }

  /**
   * 检测是否是npx执行
   */
  _isNpxExecution () {
    // 标准化环境变量路径（处理Windows反斜杠）
    const normalizeEnvPath = (envPath) => {
      return envPath ? envPath.replace(/\\/g, '/').toLowerCase() : ''
    }

    // 检查环境变量 - Windows和Unix兼容
    if (process.env.npm_execpath) {
      const normalizedExecPath = normalizeEnvPath(process.env.npm_execpath)
      if (normalizedExecPath.includes('npx')) {
        return true
      }
    }

    // 检查npm_config_cache路径 - Windows和Unix兼容
    if (process.env.npm_config_cache) {
      const normalizedCachePath = normalizeEnvPath(process.env.npm_config_cache)
      if (normalizedCachePath.includes('_npx')) {
        return true
      }
    }

    // 检查执行路径 - Windows和Unix兼容
    const scriptPath = process.argv[1]
    if (scriptPath) {
      const normalizedScriptPath = normalizeEnvPath(scriptPath)
      if (normalizedScriptPath.includes('_npx')) {
        return true
      }
    }

    // Windows特定检查：检查.cmd或.bat文件
    if (process.platform === 'win32') {
      // 检查是否通过npx.cmd执行
      if (process.env.npm_execpath && 
          (process.env.npm_execpath.endsWith('npx.cmd') || 
           process.env.npm_execpath.endsWith('npx.bat'))) {
        return true
      }
      
      // Windows NPX缓存目录通常包含_npx
      const windowsNpxPaths = [
        process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'npm-cache', '_npx'),
        process.env.APPDATA && path.join(process.env.APPDATA, 'npm', '_npx'),
        process.env.TEMP && path.join(process.env.TEMP, '_npx')
      ].filter(Boolean)
      
      const currentPath = __dirname
      if (windowsNpxPaths.some(npxPath => currentPath.includes(npxPath))) {
        return true
      }
    }

    return false
  }

  /**
   * 检测是否是全局安装
   */
  _isGlobalInstall () {
    const currentPath = __dirname

    // 常见全局安装路径
    const globalPaths = [
      '/usr/lib/node_modules',
      '/usr/local/lib/node_modules',
      '/opt/homebrew/lib/node_modules',
      path.join(process.env.HOME || '', '.npm-global'),
      path.join(process.env.APPDATA || '', 'npm', 'node_modules'),
      path.join(process.env.PREFIX || '', 'lib', 'node_modules')
    ]

    return globalPaths.some(globalPath =>
      currentPath.startsWith(globalPath)
    )
  }

  /**
   * 检测是否是开发模式
   */
  _isDevelopmentMode () {
    // 检查NODE_ENV
    if (process.env.NODE_ENV === 'development') {
      return true
    }

    // 检查是否在node_modules外
    const currentPath = __dirname
    if (!currentPath.includes('node_modules')) {
      return true
    }

    // 检查package.json中的main字段是否指向源文件
    try {
      const packageJsonPath = this.findPackageJson()
      if (packageJsonPath) {
        const packageJson = require(packageJsonPath)
        const mainFile = packageJson.main || 'index.js'
        return mainFile.startsWith('src/') || mainFile.startsWith('lib/')
      }
    } catch (error) {
      // 忽略错误，继续其他检测
    }

    return false
  }

  /**
   * 检测是否是monorepo workspace
   */
  _isMonorepoWorkspace () {
    try {
      const packageJsonPath = this.findPackageJson()
      if (packageJsonPath) {
        const packageJson = require(packageJsonPath)

        // 检查workspaces字段
        if (packageJson.workspaces) {
          return true
        }

        // 检查是否在workspace包内
        const rootPackageJsonPath = this.findRootPackageJson()
        if (rootPackageJsonPath && rootPackageJsonPath !== packageJsonPath) {
          const rootPackageJson = require(rootPackageJsonPath)
          return !!rootPackageJson.workspaces
        }
      }
    } catch (error) {
      // 忽略错误
    }

    return false
  }

  /**
   * 检测是否是npm link
   */
  _isNpmLink () {
    try {
      const currentPath = __dirname
      const stats = require('fs').lstatSync(currentPath)
      return stats.isSymbolicLink()
    } catch (error) {
      return false
    }
  }

  /**
   * 查找package.json文件
   */
  findPackageJson (startPath = __dirname) {
    let currentPath = path.resolve(startPath)

    let maxIterations = 50 // Prevent infinite loops
    while (currentPath !== path.parse(currentPath).root && maxIterations-- > 0) {
      const packageJsonPath = path.join(currentPath, 'package.json')
      if (require('fs').existsSync(packageJsonPath)) {
        return packageJsonPath
      }
      const parentPath = path.dirname(currentPath)
      if (parentPath === currentPath) {
        break // Additional protection
      }
      currentPath = parentPath
    }

    return null
  }

  /**
   * 查找根package.json文件（用于monorepo检测）
   */
  findRootPackageJson () {
    let currentPath = process.cwd()
    let lastValidPackageJson = null
    let maxIterations = 50 // Prevent infinite loops

    while (currentPath !== path.parse(currentPath).root && maxIterations-- > 0) {
      const packageJsonPath = path.join(currentPath, 'package.json')
      if (require('fs').existsSync(packageJsonPath)) {
        lastValidPackageJson = packageJsonPath
      }
      const parentPath = path.dirname(currentPath)
      if (parentPath === currentPath) {
        break // Additional protection
      }
      currentPath = parentPath
    }

    return lastValidPackageJson
  }

  /**
   * 获取包根目录
   */
  async getPackageRoot () {
    const mode = this.detectInstallMode()

    switch (mode) {
      case 'development':
        // 开发模式：查找项目根目录
        return this._findProjectRoot()

      case 'global':
        // 全局安装：查找全局包目录
        return this._findGlobalPackageRoot()

      case 'npx':
        // npx：查找临时包目录
        return this._findNpxPackageRoot()

      case 'monorepo':
        // monorepo：查找workspace包目录
        return this._findWorkspacePackageRoot()

      case 'link':
        // npm link：解析符号链接
        return this._findLinkedPackageRoot()

      case 'local':
      default:
        // 本地安装：查找node_modules中的包目录
        return this._findLocalPackageRoot()
    }
  }

  /**
   * 查找项目根目录
   */
  _findProjectRoot () {
    const packageJsonPath = this.findPackageJson()
    return packageJsonPath ? path.dirname(packageJsonPath) : process.cwd()
  }

  /**
   * 查找全局包根目录
   */
  _findGlobalPackageRoot () {
    // 从当前模块路径向上查找，直到找到package.json
    return this._findProjectRoot()
  }

  /**
   * 查找npx包根目录
   */
  _findNpxPackageRoot () {
    // npx通常将包缓存在特定目录
    const packageJsonPath = this.findPackageJson()
    return packageJsonPath ? path.dirname(packageJsonPath) : process.cwd()
  }

  /**
   * 查找workspace包根目录
   */
  _findWorkspacePackageRoot () {
    // 在monorepo中查找当前workspace的根目录
    return this._findProjectRoot()
  }

  /**
   * 查找链接包根目录
   */
  _findLinkedPackageRoot () {
    try {
      // 解析符号链接
      const realPath = require('fs').realpathSync(__dirname)
      const packageJsonPath = this.findPackageJson(realPath)
      return packageJsonPath ? path.dirname(packageJsonPath) : realPath
    } catch (error) {
      return this._findProjectRoot()
    }
  }

  /**
   * 查找本地包根目录
   */
  _findLocalPackageRoot () {
    // 在node_modules中查找包根目录
    return this._findProjectRoot()
  }

  /**
   * 解析路径到具体的文件系统路径
   * @param {string} relativePath - 相对于包根目录的路径
   * @param {QueryParams} params - 查询参数
   * @returns {Promise<string>} 解析后的绝对路径
   */
  async resolvePath (relativePath, params = null) {
    // 生成缓存键
    const cacheKey = `resolve:${relativePath}:${params ? params.toString() : ''}`
    
    // 检查缓存
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    // 获取包根目录
    const packageRoot = await this.getPackageRoot()

    // 验证路径是否在package.json的files字段中
    this.validateFileAccess(packageRoot, relativePath)

    // 直接处理路径，不需要目录映射
    const relativePathClean = relativePath.replace(/^\/+/, '')
    const fullPath = path.resolve(packageRoot, relativePathClean)

    // 安全检查：确保路径在包根目录内
    if (!fullPath.startsWith(packageRoot)) {
      throw new Error(`路径安全检查失败: ${relativePath}`)
    }

    // 存储到缓存
    this.cache.set(cacheKey, fullPath)

    return fullPath
  }

  /**
   * 验证文件访问权限（基于package.json的files字段）
   * @param {string} packageRoot - 包根目录
   * @param {string} relativePath - 相对路径
   */
  validateFileAccess (packageRoot, relativePath) {
    try {
      const packageJsonPath = path.join(packageRoot, 'package.json')
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

      // 如果没有files字段，允许访问所有文件（开发模式）
      if (!packageJson.files || !Array.isArray(packageJson.files)) {
        return
      }

      // 使用Node.js原生API进行跨平台路径规范化
      const normalizedPath = this.normalizePathForComparison(relativePath)

      // 检查是否匹配files字段中的任何模式
      const isAllowed = packageJson.files.some(filePattern => {
        // 标准化文件模式
        const normalizedPattern = this.normalizePathForComparison(filePattern)

        // 精确匹配
        if (normalizedPattern === normalizedPath) {
          return true
        }

        // 目录匹配（以/结尾或包含/*）
        if (normalizedPattern.endsWith('/') || normalizedPattern.endsWith('/*')) {
          const dirPattern = normalizedPattern.replace(/\/?\*?$/, '/')
          return normalizedPath.startsWith(dirPattern)
        }

        // 通配符匹配
        if (normalizedPattern.includes('*')) {
          const regexPattern = normalizedPattern
            .replace(/\./g, '\\.')
            .replace(/\*/g, '.*')
          const regex = new RegExp(`^${regexPattern}$`)
          return regex.test(normalizedPath)
        }

        // 目录前缀匹配
        if (normalizedPath.startsWith(normalizedPattern + '/')) {
          return true
        }

        return false
      })

      if (!isAllowed) {
        // 在生产环境严格检查，开发环境只警告
        const installMode = this.detectInstallMode()
        if (installMode === 'development' || installMode === 'npx') {
          logger.warn(`⚠️  Warning: Path '${relativePath}' not in package.json files field. This may cause issues after publishing.`)
        } else {
          throw new Error(`Access denied: Path '${relativePath}' is not included in package.json files field`)
        }
      }
    } catch (error) {
      // 如果读取package.json失败，在开发模式下允许访问
      const installMode = this.detectInstallMode()
      if (installMode === 'development' || installMode === 'npx') {
        logger.warn(`⚠️  Warning: Could not validate file access for '${relativePath}': ${error.message}`)
      } else {
        throw error
      }
    }
  }

  /**
   * 跨平台路径规范化函数
   * @param {string} inputPath - 输入路径
   * @returns {string} 规范化后的路径
   */
  normalizePathForComparison (inputPath) {
    if (!inputPath || typeof inputPath !== 'string') {
      return ''
    }
    
    // 使用Node.js原生API进行路径规范化
    let normalized = path.normalize(inputPath)
    
    // 统一使用正斜杠进行比较（但不破坏实际的文件系统操作）
    normalized = normalized.replace(/\\/g, '/')
    
    // 移除开头的斜杠
    normalized = normalized.replace(/^\/+/, '')
    
    return normalized
  }

  /**
   * 检查资源是否存在
   */
  async exists (resourcePath, queryParams) {
    try {
      const resolvedPath = await this.resolvePath(resourcePath, queryParams)
      await fsPromises.access(resolvedPath)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * 加载资源内容
   * @param {string} resolvedPath - 已解析的路径
   * @param {QueryParams} [queryParams] - 查询参数
   * @returns {Object} 包含内容和元数据的对象
   */
  async loadContent (resolvedPath, queryParams) {
    try {
      await fsPromises.access(resolvedPath)
      const content = await fsPromises.readFile(resolvedPath, 'utf8')
      const stats = await fsPromises.stat(resolvedPath)
      const packageRoot = await this.getPackageRoot()
      
      return {
        content,
        path: resolvedPath,
        protocol: 'package',
        installMode: this.detectInstallMode(),
        metadata: {
          size: content.length,
          lastModified: stats.mtime,
          absolutePath: resolvedPath,
          relativePath: path.relative(packageRoot, resolvedPath)
        }
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`包资源不存在: ${resolvedPath}`)
      }
      throw new Error(`加载包资源失败: ${error.message}`)
    }
  }

  /**
   * 获取调试信息
   */
  getDebugInfo () {
    const mode = this.detectInstallMode()

    return {
      protocol: this.name,
      installMode: mode,
      packageRoot: this.getPackageRoot(),
      currentWorkingDirectory: process.cwd(),
      moduleDirectory: __dirname,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        npm_execpath: process.env.npm_execpath,
        npm_config_cache: process.env.npm_config_cache
      },
      cacheSize: this.cache.size
    }
  }

  /**
   * 清理缓存
   */
  clearCache () {
    super.clearCache()
    this.installModeCache.clear()
  }
}

module.exports = PackageProtocol
