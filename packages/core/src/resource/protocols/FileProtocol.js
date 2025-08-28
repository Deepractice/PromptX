const ResourceProtocol = require('./ResourceProtocol')
const path = require('path')
const fs = require('fs').promises

/**
 * 文件协议实现
 * 实现@file://协议，用于访问本地文件系统中的文件
 */
class FileProtocol extends ResourceProtocol {
  constructor (options = {}) {
    super('file', options)
  }

  /**
   * 设置注册表（保持与其他协议的一致性）
   */
  setRegistry (registry) {
    // File协议不使用注册表，但为了一致性提供此方法
    this.registry = registry || {}
  }

  /**
   * 获取协议信息
   * @returns {object} 协议信息
   */
  getProtocolInfo () {
    return {
      name: 'file',
      description: '文件系统协议，提供本地文件访问',
      location: 'file://{path}',
      examples: [
        'file://package.json',
        'file:///absolute/path/to/file.txt',
        'file://./relative/path/file.md',
        'file://../parent/file.json'
      ],
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
      encoding: 'string - 文件编码 (utf8, ascii, binary等)',
      exists: 'boolean - 仅返回存在的文件'
    }
  }

  /**
   * 验证文件协议路径
   * @param {string} resourcePath - 资源路径
   * @returns {boolean} 是否有效
   */
  validatePath (resourcePath) {
    if (!super.validatePath(resourcePath)) {
      return false
    }

    // 基本路径验证 - 允许相对路径和绝对路径
    return typeof resourcePath === 'string' && resourcePath.length > 0
  }

  /**
   * 解析文件路径
   * @param {string} resourcePath - 原始资源路径
   * @param {QueryParams} queryParams - 查询参数
   * @returns {Promise<string>} 解析后的绝对路径
   */
  async resolvePath (resourcePath, queryParams) {
    let resolvedPath

    if (path.isAbsolute(resourcePath)) {
      // 绝对路径直接使用
      resolvedPath = resourcePath
    } else {
      // 相对路径相对于当前工作目录解析
      resolvedPath = path.resolve(process.cwd(), resourcePath)
    }

    // 规范化路径
    resolvedPath = path.normalize(resolvedPath)

    return resolvedPath
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
}

module.exports = FileProtocol