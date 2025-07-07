const ResourceProtocol = require('./ResourceProtocol')
const path = require('path')
const fs = require('fs').promises
const { getGlobalProjectPathResolver } = require('../../../utils/ProjectPathResolver')

/**
 * 项目协议实现 - 新架构
 * 实现@project://协议，基于当前项目状态的高性能路径解析
 * 移除.promptx目录查找，直接使用ProjectManager的当前项目信息
 */
class ProjectProtocol extends ResourceProtocol {
  constructor (options = {}) {
    super('project', options)
    
    // 🎯 新架构：延迟初始化路径解析器，避免在项目未初始化时创建
    this.pathResolver = null
  }

  /**
   * 获取路径解析器（延迟初始化）
   * @returns {ProjectPathResolver} 路径解析器实例
   */
  getPathResolver() {
    if (!this.pathResolver) {
      this.pathResolver = getGlobalProjectPathResolver()
    }
    return this.pathResolver
  }

  /**
   * 设置注册表（保持与其他协议的一致性）
   */
  setRegistry (registry) {
    // Project协议不使用注册表，但为了一致性提供此方法
    this.registry = registry || {}
  }

  /**
   * 获取协议信息
   * @returns {object} 协议信息
   */
  getProtocolInfo () {
    return {
      name: 'project',
      description: '项目协议，基于当前项目状态的高性能路径解析',
      location: 'project://{directory}/{path}',
      examples: [
        'project://src/index.js',
        'project://lib/utils.js',
        'project://docs/README.md',
        'project://root/package.json',
        'project://test/unit/'
      ],
      supportedDirectories: this.getPathResolver().getSupportedDirectories(),
      architecture: 'state-based',
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
      from: 'string - 指定搜索起始目录',
      create: 'boolean - 如果目录不存在是否创建',
      exists: 'boolean - 仅返回存在的文件/目录',
      type: 'string - 过滤类型 (file|dir|both)'
    }
  }

  /**
   * 验证项目协议路径
   * @param {string} resourcePath - 资源路径
   * @returns {boolean} 是否有效
   */
  validatePath (resourcePath) {
    if (!super.validatePath(resourcePath)) {
      return false
    }

    // 特殊处理：允许.promptx开头的路径（项目配置目录）
    if (resourcePath.startsWith('.promptx/')) {
      return true
    }

    // 解析路径的第一部分（目录类型）
    const parts = resourcePath.split('/')
    const dirType = parts[0]

    return this.getPathResolver().isSupportedDirectory(dirType)
  }


  /**
   * 解析项目路径 - 新架构：高性能零查找
   * @param {string} resourcePath - 原始资源路径，如 "src/index.js" 或 ".promptx/resource/..."
   * @param {QueryParams} queryParams - 查询参数
   * @returns {Promise<string>} 解析后的绝对路径
   */
  async resolvePath (resourcePath, queryParams) {
    // 🚀 新架构：直接使用路径解析器，无需查找.promptx
    try {
      return this.getPathResolver().resolvePath(resourcePath)
    } catch (error) {
      throw new Error(`解析@project://路径失败: ${error.message}`)
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
        // 检查是否需要创建目录
        if (queryParams?.get('create') === 'true') {
          await fs.mkdir(path.dirname(resolvedPath), { recursive: true })
          return '' // 返回空内容
        }

        // 如果设置了exists参数为false，返回空内容而不是错误
        if (queryParams?.get('exists') === 'false') {
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
   * 列出项目结构信息 - 新架构
   * @returns {Promise<object>} 项目信息
   */
  async getProjectInfo () {
    try {
      const projectRoot = this.getPathResolver().getProjectRoot()
      const promptxPath = this.getPathResolver().getPromptXDirectory()
      
      const result = {
        projectRoot,
        promptxPath,
        architecture: 'state-based',
        supportedDirectories: this.getPathResolver().getSupportedDirectories(),
        directories: {}
      }

      // 检查支持的目录是否存在
      for (const dirType of this.getPathResolver().getSupportedDirectories()) {
        try {
          const fullPath = this.getPathResolver().resolvePath(dirType)
          const stats = await fs.stat(fullPath)
          result.directories[dirType] = {
            path: fullPath,
            exists: true,
            type: stats.isDirectory() ? 'directory' : 'file'
          }
        } catch (error) {
          result.directories[dirType] = {
            path: 'N/A',
            exists: false
          }
        }
      }

      return result
    } catch (error) {
      return { 
        error: `获取项目信息失败: ${error.message}`,
        architecture: 'state-based'
      }
    }
  }

  /**
   * 清除缓存 - 新架构：无需清除路径缓存
   */
  clearCache () {
    super.clearCache()
    // 🎯 新架构：基于状态管理，无需路径缓存
  }
}

module.exports = ProjectProtocol
