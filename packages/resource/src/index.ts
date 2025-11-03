import * as path from 'path'
import * as fs from 'fs'
import { promises as fsPromises } from 'fs'
import type { Resource, ResourceRegistry, ResourcePackage } from './types'
import { 
  PreinstalledDependenciesManager,
  getPreinstalledDependenciesManager,
  analyzeToolDependencies
} from './PreinstalledDependenciesManager'

const logger = require('@promptx/logger')

// electron-util - 解决ASAR打包后的路径问题
let fixPathForAsarUnpack: ((path: string) => string) | undefined
let isElectron = false
try {
  // 只在Electron环境中加载electron-util
  if (process.versions && process.versions.electron) {
    isElectron = true
    const electronUtil = require('electron-util')
    fixPathForAsarUnpack = electronUtil.fixPathForAsarUnpack
  }
} catch (error) {
  // 如果不在Electron环境中或electron-util未安装，使用空函数
  fixPathForAsarUnpack = undefined
}

/**
 * 获取资源基础目录
 * 在 Electron 打包环境中，资源文件被复制到 extraResources 目录
 */
function getResourceBaseDir(): string {
  if (isElectron && process.env.NODE_ENV === 'production') {
    // 在 Electron 生产环境中，资源文件位于 extraResources 目录
    const { app } = require('electron')
    const appPath = app.getAppPath()
    
    // appPath 通常是 .../resources/app.asar
    // extraResources 位于 .../resources/resources
    const resourcesDir = path.dirname(appPath) // 获取 resources 目录
    return path.join(resourcesDir, 'resources') // 指向 extraResources 中的 resources 目录
  }
  
  // 开发环境或非 Electron 环境，使用默认路径
  return path.join(__dirname, 'resources')
}

/**
 * PackageResource - 统一的包资源访问管理器
 * 自动处理所有路径问题（ASAR、跨平台等）
 */
class PackageResource {
  private baseDir: string

  constructor() {
    this.baseDir = getResourceBaseDir()
  }

  /**
   * 解析资源路径 - 自动处理ASAR路径转换
   * @param {string} resourcePath - 相对于包根目录的资源路径
   * @returns {string} 解析后的绝对路径
   */
  resolvePath(resourcePath: string): string {
    // 移除 resources/ 前缀（如果存在），因为 baseDir 已经指向 resources 目录
    const cleanPath = resourcePath.startsWith('resources/') 
      ? resourcePath.substring('resources/'.length) 
      : resourcePath
    
    const basePath = path.join(this.baseDir, cleanPath)
    
    // 在Electron环境中，自动处理ASAR路径（主要用于开发环境）
    if (fixPathForAsarUnpack && process.env.NODE_ENV !== 'production') {
      return fixPathForAsarUnpack(basePath)
    }
    
    return basePath
  }

  /**
   * 检查资源是否存在
   * @param {string} resourcePath - 资源路径
   * @returns {boolean} 资源是否存在
   */
  exists(resourcePath: string): boolean {
    try {
      const resolvedPath = this.resolvePath(resourcePath)
      return fs.existsSync(resolvedPath)
    } catch (error) {
      return false
    }
  }

  /**
   * 异步检查资源是否存在
   * @param {string} resourcePath - 资源路径
   * @returns {Promise<boolean>} 资源是否存在
   */
  async existsAsync(resourcePath: string): Promise<boolean> {
    try {
      const resolvedPath = this.resolvePath(resourcePath)
      await fsPromises.access(resolvedPath)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * 加载资源内容
   * @param {string} resourcePath - 资源路径
   * @returns {Promise<{content: string, metadata: object}>} 资源内容和元数据
   */
  async loadContent(resourcePath: string): Promise<{
    content: string
    metadata: {
      path: string
      size: number
      lastModified: Date
      relativePath: string
    }
  }> {
    const resolvedPath = this.resolvePath(resourcePath)
    
    try {
      const content = await fsPromises.readFile(resolvedPath, 'utf8')
      const stats = await fsPromises.stat(resolvedPath)
      
      return {
        content,
        metadata: {
          path: resolvedPath,
          size: content.length,
          lastModified: stats.mtime,
          relativePath: resourcePath
        }
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error(`Resource not found: ${resourcePath} (resolved: ${resolvedPath})`)
      }
      throw new Error(`Failed to load resource: ${error.message}`)
    }
  }

  /**
   * 同步加载资源内容
   * @param {string} resourcePath - 资源路径
   * @returns {string} 资源内容
   */
  loadContentSync(resourcePath: string): string {
    const resolvedPath = this.resolvePath(resourcePath)
    
    try {
      return fs.readFileSync(resolvedPath, 'utf8')
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error(`Resource not found: ${resourcePath} (resolved: ${resolvedPath})`)
      }
      throw new Error(`Failed to load resource: ${error.message}`)
    }
  }

  /**
   * 便捷方法 - 加载角色资源
   * @param {string} roleName - 角色名称
   * @returns {Promise<{content: string, metadata: object}>} 角色资源
   */
  async loadRole(roleName: string) {
    return this.loadContent(`resources/role/${roleName}/${roleName}.role.md`)
  }

  /**
   * 便捷方法 - 加载工具资源
   * @param {string} toolName - 工具名称
   * @returns {Promise<{content: string, metadata: object}>} 工具资源
   */
  async loadTool(toolName: string) {
    return this.loadContent(`resources/tool/${toolName}/${toolName}.tool.md`)
  }

  /**
   * 便捷方法 - 加载手册资源
   * @param {string} manualName - 手册名称
   * @returns {Promise<{content: string, metadata: object}>} 手册资源
   */
  async loadManual(manualName: string) {
    return this.loadContent(`resources/manual/${manualName}/${manualName}.manual.md`)
  }
}

// 获取包根目录和注册表路径
function getPackageRoot(): string {
  if (isElectron && process.env.NODE_ENV === 'production') {
    // 在 Electron 生产环境中，使用 extraResources 目录的父目录
    const { app } = require('electron')
    const appPath = app.getAppPath()
    return path.dirname(appPath)
  }
  
  // 开发环境或非 Electron 环境
  return __dirname
}

function getRegistryPath(): string {
  if (isElectron && process.env.NODE_ENV === 'production') {
    // 在 Electron 生产环境中，registry.json 位于 extraResources 目录
    const { app } = require('electron')
    const appPath = app.getAppPath()
    return path.join(path.dirname(appPath), 'registry.json')
  }
  
  // 开发环境或非 Electron 环境
  let registryPath = path.join(__dirname, 'registry.json')
  if (fixPathForAsarUnpack) {
    registryPath = fixPathForAsarUnpack(registryPath)
  }
  return registryPath
}

const packageRoot = getPackageRoot()

// 注册表路径 - 直接从当前目录（dist/）读取，在Electron环境中处理ASAR路径
let registryPath = getRegistryPath()

// 加载注册表
let registry: ResourceRegistry

try {
  if (fs.existsSync(registryPath)) {
    const content = fs.readFileSync(registryPath, 'utf-8')
    registry = JSON.parse(content) as ResourceRegistry
    
    // 验证版本
    if (registry.version !== '2.0.0') {
      throw new Error(`Unsupported registry version: ${registry.version}`)
    }
  } else {
    throw new Error('Registry file not found')
  }
} catch (error: any) {
  logger.error('[@promptx/resource] Failed to load registry:', error.message)
  logger.error('[@promptx/resource] Registry path:', registryPath)
  logger.error('[@promptx/resource] __dirname:', __dirname)
  throw new Error(`@promptx/resource package is corrupted: ${error.message}`)
}

/**
 * 获取资源的绝对路径
 */
export function getResourcePath(relativePath: string): string {
  // 添加详细的环境检测日志
  logger.info(`[@promptx/resource] Environment check:`)
  logger.info(`[@promptx/resource] - isElectron: ${isElectron}`)
  logger.info(`[@promptx/resource] - NODE_ENV: ${process.env.NODE_ENV}`)
  
  if (isElectron) {
    try {
      logger.info(`[@promptx/resource] - Attempting to require electron...`)
      const electron = require('electron')
      logger.info(`[@promptx/resource] - Electron object obtained`)
      
      // 检查是否在主进程中
      const app = electron.app
      if (app) {
        logger.info(`[@promptx/resource] - Running in main process`)
        const isPackaged = app.isPackaged
        logger.info(`[@promptx/resource] - app.isPackaged: ${isPackaged}`)
        
        if (isPackaged) {
          // 在 Electron 打包环境中，直接使用 extraResources 目录
          const appPath = app.getAppPath()
          const resourcesDir = path.dirname(appPath) // 获取 resources 目录
          
          // 处理相对路径，确保指向正确的 extraResources 位置
          let cleanPath = relativePath
          if (relativePath.startsWith('resources/')) {
            cleanPath = relativePath.substring('resources/'.length)
          }
          
          const finalPath = path.join(resourcesDir, 'resources', cleanPath)
          
          logger.info(`[@promptx/resource] getResourcePath (packaged):`)
          logger.info(`[@promptx/resource] - input: ${relativePath}`)
          logger.info(`[@promptx/resource] - appPath: ${appPath}`)
          logger.info(`[@promptx/resource] - resourcesDir: ${resourcesDir}`)
          logger.info(`[@promptx/resource] - cleanPath: ${cleanPath}`)
          logger.info(`[@promptx/resource] - finalPath: ${finalPath}`)
          
          return finalPath
        } else {
          logger.info(`[@promptx/resource] - App is not packaged, using development path`)
        }
      } else {
        logger.info(`[@promptx/resource] - Running in renderer process, checking for packaged app`)
        
        // 在渲染进程中，我们需要通过其他方式检测是否为打包环境
        // 检查是否存在 app.asar 文件来判断是否为打包环境
        const currentPath = __dirname
        logger.info(`[@promptx/resource] - Current __dirname: ${currentPath}`)
        
        if (currentPath.includes('app.asar')) {
          logger.info(`[@promptx/resource] - Detected packaged app (asar found in path)`)
          
          // 在打包环境中，计算 extraResources 路径
          // 从 app.asar 路径推导出 resources 目录
          const asarIndex = currentPath.indexOf('app.asar')
          const appDir = currentPath.substring(0, asarIndex)
          const resourcesDir = path.join(appDir, 'resources')
          
          // 处理相对路径
          let cleanPath = relativePath
          if (relativePath.startsWith('resources/')) {
            cleanPath = relativePath.substring('resources/'.length)
          }
          
          const finalPath = path.join(resourcesDir, cleanPath)
          
          logger.info(`[@promptx/resource] getResourcePath (packaged renderer):`)
          logger.info(`[@promptx/resource] - input: ${relativePath}`)
          logger.info(`[@promptx/resource] - currentPath: ${currentPath}`)
          logger.info(`[@promptx/resource] - appDir: ${appDir}`)
          logger.info(`[@promptx/resource] - resourcesDir: ${resourcesDir}`)
          logger.info(`[@promptx/resource] - cleanPath: ${cleanPath}`)
          logger.info(`[@promptx/resource] - finalPath: ${finalPath}`)
          
          return finalPath
        } else {
          logger.info(`[@promptx/resource] - Development environment (no asar in path)`)
        }
      }
    } catch (error) {
      logger.error(`[@promptx/resource] - Error accessing electron: ${error}`)
    }
  }
  
  // 开发环境或非 Electron 环境
  if (!relativePath.startsWith('resources/')) {
    relativePath = `resources/${relativePath}`
  }
  
  const finalPath = path.join(packageRoot, relativePath)
  logger.info(`[@promptx/resource] getResourcePath (dev): ${relativePath} -> ${finalPath}`)
  return finalPath
}

/**
 * 根据 ID 查找资源
 */
export function findResourceById(id: string): Resource | undefined {
  if (!registry || !Array.isArray(registry.resources)) return undefined
  return registry.resources.find(r => r.id === id)
}

/**
 * 根据协议类型获取资源列表
 */
export function getResourcesByProtocol(protocol: string): Resource[] {
  if (!registry || !Array.isArray(registry.resources)) return []
  return registry.resources.filter(r => r.protocol === protocol)
}

/**
 * 获取所有资源列表
 */
export function getAllResources(): Resource[] {
  if (!registry || !Array.isArray(registry.resources)) return []
  return registry.resources
}

// 导出单例实例
const packageResource = new PackageResource()

// 导出包信息
const resourcePackage: ResourcePackage = {
  registry,
  getResourcePath,
  findResourceById,
  getResourcesByProtocol,
  getAllResources
}

// CommonJS 导出（兼容性）
module.exports = {
  ...resourcePackage,
  packageResource,
  PackageResource,
  registry,
  PreinstalledDependenciesManager,
  getPreinstalledDependenciesManager,
  analyzeToolDependencies
}

// ES Module 导出
export { 
  registry, 
  packageResource, 
  PackageResource,
  PreinstalledDependenciesManager,
  getPreinstalledDependenciesManager,
  analyzeToolDependencies
}
export default resourcePackage