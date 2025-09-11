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
try {
  // 只在Electron环境中加载electron-util
  if (process.versions && process.versions.electron) {
    const electronUtil = require('electron-util')
    fixPathForAsarUnpack = electronUtil.fixPathForAsarUnpack
  }
} catch (error) {
  // 如果不在Electron环境中或electron-util未安装，使用空函数
  fixPathForAsarUnpack = undefined
}

/**
 * PackageResource - 统一的包资源访问管理器
 * 自动处理所有路径问题（ASAR、跨平台等）
 */
class PackageResource {
  private baseDir: string

  constructor() {
    this.baseDir = __dirname
  }

  /**
   * 解析资源路径 - 自动处理ASAR路径转换
   * @param {string} resourcePath - 相对于包根目录的资源路径
   * @returns {string} 解析后的绝对路径
   */
  resolvePath(resourcePath: string): string {
    const basePath = path.join(this.baseDir, resourcePath)
    
    // 在Electron环境中，自动处理ASAR路径
    if (fixPathForAsarUnpack) {
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

// 包根目录 - 构建后的 dist 目录就是包根目录
const packageRoot = __dirname

// 注册表路径 - 直接从当前目录（dist/）读取，在Electron环境中处理ASAR路径
let registryPath = path.join(__dirname, 'registry.json')
if (fixPathForAsarUnpack) {
  registryPath = fixPathForAsarUnpack(registryPath)
}

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
  // 处理相对路径
  if (!relativePath.startsWith('resources/')) {
    relativePath = `resources/${relativePath}`
  }
  return path.join(packageRoot, relativePath)
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