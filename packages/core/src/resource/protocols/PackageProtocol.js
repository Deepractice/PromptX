const path = require('path')
const fs = require('fs')
const fsPromises = require('fs').promises
const ResourceProtocol = require('./ResourceProtocol')
const { QueryParams } = require('../types')
import logger from '@promptx/logger'
const { getDirectoryService } = require('~/utils/DirectoryService')

/**
 * 包协议实现
 * 实现@package://协议，智能检测并访问NPM包资源
 * 支持：本地开发、npm install、npm -g、npx、monorepo等场景
 */
class PackageProtocol extends ResourceProtocol {
  constructor (options = {}) {
    super('package', options)
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
   * 获取包根目录 - 始终使用 dist 目录
   */
  async getPackageRoot () {
    try {
      // 直接使用 @promptx/resource 包的 dist 目录
      const resourcePath = require.resolve('@promptx/resource')
      logger.info(`[PackageProtocol] require.resolve('@promptx/resource') returned: ${resourcePath}`)
      
      // require.resolve 返回的是 dist/index.js，所以 dirname 就是 dist 目录
      const distDir = path.dirname(resourcePath)
      logger.info(`[PackageProtocol] Using dist directory as package root: ${distDir}`)
      
      const resourcesDir = path.join(distDir, 'resources')
      logger.info(`[PackageProtocol] Resources directory path: ${resourcesDir}`)
      logger.info(`[PackageProtocol] Resources directory exists: ${fs.existsSync(resourcesDir)}`)
      
      return distDir
      
    } catch (error) {
      logger.error(`[PackageProtocol] Cannot locate @promptx/resource package: ${error.message}`)
      logger.error(`[PackageProtocol] Error stack:`, error.stack)
      logger.error(`[PackageProtocol] This is a critical system error, @promptx/resource must exist and be accessible via require`)
      throw error
    }
  }


  /**
   * 解析路径到具体的文件系统路径 - 使用 PackageResource
   * @param {string} relativePath - 相对于包根目录的路径
   * @param {QueryParams} params - 查询参数
   * @returns {Promise<string>} 解析后的绝对路径
   */
  async resolvePath (relativePath, params = null) {
    logger.info(`[PackageProtocol] Resolving path: ${relativePath}`)
    
    try {
      // 使用新的 PackageResource API
      const resourceModule = require('@promptx/resource')
      logger.info(`[PackageProtocol] Resource module loaded:`, Object.keys(resourceModule))
      const { packageResource } = resourceModule
      logger.info(`[PackageProtocol] PackageResource type:`, typeof packageResource)
      logger.debug(`[PackageProtocol] Successfully loaded PackageResource`)
      
      // 清理路径
      const cleanPath = relativePath.replace(/^\/+/, '')
      logger.debug(`[PackageProtocol] Cleaned path: ${cleanPath}`)
      
      // 使用 PackageResource 解析路径（自动处理ASAR）
      const fullPath = packageResource.resolvePath(cleanPath)
      logger.info(`[PackageProtocol] PackageResource resolved path: ${fullPath}`)
      
      // 检查文件是否存在
      const exists = packageResource.exists(cleanPath)
      logger.info(`[PackageProtocol] File exists: ${exists} (path: ${fullPath})`)
      
      if (!exists) {
        logger.error(`[PackageProtocol] Resource file not found: ${fullPath}`)
        return null
      }
      
      return fullPath
    } catch (error) {
      logger.error(`[PackageProtocol] Failed to resolve resource path: ${error.message}`)
      logger.error(`[PackageProtocol] Error stack:`, error.stack)
      throw error
    }
  }

  /**
   * 验证文件访问权限（基于package.json的files字段）
   * @param {string} packageRoot - 包根目录
   * @param {string} relativePath - 相对路径
   */
  validateFileAccess (packageRoot, relativePath) {
    // 简化版本：既然使用 require.resolve，就信任包的正确性
    // 不再进行复杂的 files 字段检查
    logger.debug(`[PackageProtocol] Validating file access for: ${relativePath}`)
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
      // 可以直接使用PackageResource的loadContent方法
      // 但为了保持协议层的一致性，这里继续使用传统方法
      await fsPromises.access(resolvedPath)
      const content = await fsPromises.readFile(resolvedPath, 'utf8')
      const stats = await fsPromises.stat(resolvedPath)
      const packageRoot = await this.getPackageRoot()
      
      return {
        content,
        path: resolvedPath,
        protocol: 'package',
        metadata: {
          size: content.length,
          lastModified: stats.mtime,
          absolutePath: resolvedPath,
          relativePath: path.relative(packageRoot, resolvedPath)
        }
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Package resource not found: ${resolvedPath}`)
      }
      throw new Error(`Failed to load package resource: ${error.message}`)
    }
  }

  /**
   * 获取调试信息
   */
  getDebugInfo () {
    return {
      protocol: this.name,
      packageRoot: this.getPackageRoot(),
      currentWorkingDirectory: process.cwd(),
      moduleDirectory: __dirname,
      cacheSize: this.cache.size
    }
  }

  /**
   * 清理缓存
   */
  clearCache () {
    super.clearCache()
  }
}

module.exports = PackageProtocol
