const ResourceProtocol = require('./ResourceProtocol')
const path = require('path')
const fs = require('fs').promises

// 使用env-paths提供跨平台用户目录支持
const envPaths = require('env-paths')
const os = require('os')

/**
 * 获取跨平台用户目录路径
 * 使用env-paths替代platform-folders，提供更好的跨平台兼容性
 */
const getUserDirectories = () => {
  const promptxPaths = envPaths('promptx')
  
  return {
    getHomeFolder: () => os.homedir(),
    getDesktopFolder: () => path.join(os.homedir(), 'Desktop'),
    getDocumentsFolder: () => path.join(os.homedir(), 'Documents'),
    getDownloadsFolder: () => path.join(os.homedir(), 'Downloads'),
    getMusicFolder: () => path.join(os.homedir(), 'Music'),
    getPicturesFolder: () => path.join(os.homedir(), 'Pictures'),
    getVideosFolder: () => path.join(os.homedir(), 'Videos'),
    // 新增：env-paths标准目录
    getDataFolder: () => promptxPaths.data,
    getConfigFolder: () => promptxPaths.config,
    getCacheFolder: () => promptxPaths.cache,
    getLogFolder: () => promptxPaths.log,
    getTempFolder: () => promptxPaths.temp
  }
}

/**
 * 用户目录协议实现
 * 实现@user://协议，用于访问用户的标准目录（Documents、Desktop、Downloads等）
 */
class UserProtocol extends ResourceProtocol {
  constructor (options = {}) {
    super('user', options)

    // 支持的用户目录映射
    this.userDirs = {
      home: 'getHomeFolder',
      desktop: 'getDesktopFolder',
      documents: 'getDocumentsFolder',
      downloads: 'getDownloadsFolder',
      music: 'getMusicFolder',
      pictures: 'getPicturesFolder',
      videos: 'getVideosFolder',
      // 新增：env-paths标准目录
      data: 'getDataFolder',
      config: 'getConfigFolder',
      cache: 'getCacheFolder',
      log: 'getLogFolder',
      temp: 'getTempFolder'
    }

    // 目录路径缓存
    this.dirCache = new Map()
  }

  /**
   * 设置注册表（保持与其他协议的一致性）
   */
  setRegistry (registry) {
    // User协议不使用注册表，但为了一致性提供此方法
    this.registry = registry || {}
  }

  /**
   * 获取协议信息
   * @returns {object} 协议信息
   */
  getProtocolInfo () {
    return {
      name: 'user',
      description: '用户目录协议，提供跨平台的用户标准目录访问',
      location: 'user://{directory}/{path}',
      examples: [
        'user://documents/notes.txt',
        'user://desktop/readme.md',
        'user://downloads/',
        'user://home/.bashrc',
        'user://config/promptx.json',
        'user://data/memories.json',
        'user://cache/temp-data.json'
      ],
      supportedDirectories: Object.keys(this.userDirs),
      params: this.getSupportedParams()
    }
  }

  /**
   * 支持的查询参数
   * @returns {object} 参数说明
   */
  getSupportedParams () {
    return {
      ...super.getSupportedParams(),
      exists: 'boolean - 仅返回存在的文件/目录',
      type: 'string - 过滤类型 (file|dir|both)'
    }
  }

  /**
   * 验证用户协议路径
   * @param {string} resourcePath - 资源路径
   * @returns {boolean} 是否有效
   */
  validatePath (resourcePath) {
    if (!super.validatePath(resourcePath)) {
      return false
    }

    // 解析路径的第一部分（目录类型）
    const parts = resourcePath.split('/')
    const dirType = parts[0]

    return this.userDirs.hasOwnProperty(dirType)
  }

  /**
   * 解析用户目录路径
   * @param {string} resourcePath - 原始资源路径，如 "documents/notes.txt"
   * @param {QueryParams} queryParams - 查询参数
   * @returns {Promise<string>} 解析后的绝对路径
   */
  async resolvePath (resourcePath, queryParams) {
    const parts = resourcePath.split('/')
    const dirType = parts[0]
    const relativePath = parts.slice(1).join('/')

    // 验证目录类型
    if (!this.userDirs[dirType]) {
      throw new Error(`不支持的用户目录类型: ${dirType}。支持的类型: ${Object.keys(this.userDirs).join(', ')}`)
    }

    // 获取用户目录路径
    const userDirPath = await this.getUserDirectory(dirType)

    // 如果没有相对路径，返回目录本身
    if (!relativePath) {
      return userDirPath
    }

    // 拼接完整路径
    const fullPath = path.join(userDirPath, relativePath)

    // 安全检查：确保路径在用户目录内
    const resolvedPath = path.resolve(fullPath)
    const resolvedUserDir = path.resolve(userDirPath)

    if (!resolvedPath.startsWith(resolvedUserDir)) {
      throw new Error(`安全错误：路径超出用户目录范围: ${resolvedPath}`)
    }

    return resolvedPath
  }

  /**
   * 获取用户目录路径
   * @param {string} dirType - 目录类型
   * @returns {Promise<string>} 目录路径
   */
  async getUserDirectory (dirType) {
    // 检查缓存
    if (this.dirCache.has(dirType)) {
      return this.dirCache.get(dirType)
    }

    const userDirectories = getUserDirectories()
    const methodName = this.userDirs[dirType]

    if (!userDirectories[methodName]) {
      throw new Error(`未找到用户目录获取方法: ${methodName}`)
    }

    try {
      let dirPath

      // 调用用户目录获取方法
      if (typeof userDirectories[methodName] === 'function') {
        dirPath = userDirectories[methodName]()
      } else {
        dirPath = userDirectories[methodName]
      }

      // 缓存结果
      this.dirCache.set(dirType, dirPath)

      return dirPath
    } catch (error) {
      throw new Error(`获取用户目录失败 (${dirType}): ${error.message}`)
    }
  }

  /**
   * 加载资源内容
   * @param {string} resolvedPath - 解析后的路径
   * @param {QueryParams} queryParams - 查询参数
   * @returns {Promise<string>} 资源内容
   */
  async loadContent (resolvedPath, queryParams) {
    try {
      // 检查路径是否存在
      const stats = await fs.stat(resolvedPath)

      if (stats.isDirectory()) {
        return await this.loadDirectoryContent(resolvedPath, queryParams)
      } else if (stats.isFile()) {
        return await this.loadFileContent(resolvedPath, queryParams)
      } else {
        throw new Error(`不支持的文件类型: ${resolvedPath}`)
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        // 如果设置了exists参数为false，返回空内容而不是错误
        if (queryParams && queryParams.get('exists') === 'false') {
          return ''
        }
        throw new Error(`文件或目录不存在: ${resolvedPath}`)
      }
      throw error
    }
  }

  /**
   * 加载文件内容
   * @param {string} filePath - 文件路径
   * @param {QueryParams} queryParams - 查询参数
   * @returns {Promise<string>} 文件内容
   */
  async loadFileContent (filePath, queryParams) {
    const encoding = queryParams?.get('encoding') || 'utf8'
    return await fs.readFile(filePath, encoding)
  }

  /**
   * 加载目录内容
   * @param {string} dirPath - 目录路径
   * @param {QueryParams} queryParams - 查询参数
   * @returns {Promise<string>} 目录内容列表
   */
  async loadDirectoryContent (dirPath, queryParams) {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })

    // 应用类型过滤
    const typeFilter = queryParams?.get('type')
    let filteredEntries = entries

    if (typeFilter) {
      filteredEntries = entries.filter(entry => {
        switch (typeFilter) {
          case 'file': return entry.isFile()
          case 'dir': return entry.isDirectory()
          case 'both': return true
          default: return true
        }
      })
    }

    // 格式化输出
    const format = queryParams?.get('format') || 'list'

    switch (format) {
      case 'json':
        return JSON.stringify(
          filteredEntries.map(entry => ({
            name: entry.name,
            type: entry.isDirectory() ? 'directory' : 'file',
            path: path.join(dirPath, entry.name)
          })),
          null,
          2
        )

      case 'paths':
        return filteredEntries
          .map(entry => path.join(dirPath, entry.name))
          .join('\n')

      case 'list':
      default:
        return filteredEntries
          .map(entry => {
            const type = entry.isDirectory() ? '[DIR]' : '[FILE]'
            return `${type} ${entry.name}`
          })
          .join('\n')
    }
  }

  /**
   * 列出所有支持的用户目录
   * @returns {Promise<object>} 目录信息
   */
  async listUserDirectories () {
    const result = {}

    for (const dirType of Object.keys(this.userDirs)) {
      try {
        result[dirType] = await this.getUserDirectory(dirType)
      } catch (error) {
        result[dirType] = { error: error.message }
      }
    }

    return result
  }

  /**
   * 清除目录缓存
   */
  clearCache () {
    super.clearCache()
    this.dirCache.clear()
  }
}

module.exports = UserProtocol
