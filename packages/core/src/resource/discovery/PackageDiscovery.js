/**
 * 包级资源发现器 - 从 @promptx/resource 包加载系统内置资源
 * 新版本：直接从 npm 包加载，不再依赖文件系统扫描
 */

const BaseDiscovery = require('./BaseDiscovery')
import logger from '@promptx/logger'

/**
 * 包级资源发现器
 * 负责从 @promptx/resource 包加载系统内置的角色、工具等资源
 */
class PackageDiscovery extends BaseDiscovery {
  constructor(resourceManager) {
    super('PACKAGE')
    this.resourceManager = resourceManager
  }

  /**
   * 发现包级资源 - 从 @promptx/resource 包加载
   * @returns {Promise<Array>} 发现的资源列表
   */
  async discover() {
    try {
      // 使用新的 @promptx/resource API
      const { registry } = require('@promptx/resource')
      
      if (!registry) {
        logger.warn('[PackageDiscovery] @promptx/resource 注册表未正确加载')
        return []
      }
      const resources = []
      
      // v2.0.0 格式：resources 是数组
      if (Array.isArray(registry.resources)) {
        for (const resource of registry.resources) {
          resources.push({
            id: resource.id,
            type: resource.protocol,  // 使用 protocol 字段
            path: resource.metadata?.path || resource.reference,
            name: resource.name || resource.id,
            metadata: {
              description: resource.description,
              modified: resource.metadata?.modified,
              size: resource.metadata?.size,
              source: 'package',  // 小写以保持一致
              packageName: '@promptx/resource'
            }
          })
        }
      }
      
      logger.info(`[PackageDiscovery]  从 @promptx/resource 加载了 ${resources.length} 个系统资源`)
      return resources

    } catch (error) {
      // 如果包不存在或加载失败，返回空数组（不阻塞其他发现器）
      logger.warn(`[PackageDiscovery]  加载 @promptx/resource 失败: ${error.message}`)
      return []
    }
  }

  /**
   * 发现包级资源注册表
   * @returns {Promise<Map>} 资源注册表 Map<resourceId, reference>
   */
  async discoverRegistry() {
    try {
      // 使用新的 @promptx/resource API
      const { registry } = require('@promptx/resource')
      
      if (!registry) {
        logger.warn('[PackageDiscovery] @promptx/resource 注册表未正确加载')
        return new Map()
      }

      const registryMap = new Map()
      
      // v2.0.0 格式：resources 是数组
      if (Array.isArray(registry.resources)) {
        for (const resource of registry.resources) {
          // 添加多种引用格式
          const reference = resource.reference || `@package://resources/${resource.metadata?.path}`
          registryMap.set(resource.id, reference)
          registryMap.set(`package:${resource.id}`, reference)
        }
      }
      
      if (registryMap.size > 0) {
        logger.info(`[PackageDiscovery]  从 @promptx/resource 加载了 ${registryMap.size / 2} 个系统资源到注册表`)
      }
      
      return registryMap

    } catch (error) {
      logger.warn(`[PackageDiscovery]  系统资源注册表加载失败: ${error.message}`)
      return new Map()
    }
  }

  /**
   * 获取包资源的基础目录（用于文件访问）
   * @returns {Promise<string>} 包资源目录路径
   */
  async getPackageRoot() {
    try {
      // 获取 @promptx/resource 包的实际路径
      const resourcePackagePath = require.resolve('@promptx/resource')
      const path = require('path')
      
      // 找到包的根目录（包含 package.json 的目录）
      let currentDir = path.dirname(resourcePackagePath)
      while (currentDir !== path.dirname(currentDir)) {
        const packageJsonPath = path.join(currentDir, 'package.json')
        try {
          const packageJson = require(packageJsonPath)
          if (packageJson.name === '@promptx/resource') {
            return currentDir
          }
        } catch {
          // 继续向上查找
        }
        currentDir = path.dirname(currentDir)
      }
      
      throw new Error('无法找到 @promptx/resource 包的根目录')
    } catch (error) {
      logger.error(`[PackageDiscovery]  获取包根目录失败: ${error.message}`)
      throw error
    }
  }

  /**
   * 获取注册表数据（ResourceManager 需要的方法）
   * @returns {Promise<RegistryData>} 注册表数据实例
   */
  async getRegistryData() {
    try {
      logger.info('[PackageDiscovery] Starting getRegistryData...')
      const { registry } = require('@promptx/resource')
      logger.info('[PackageDiscovery] @promptx/resource loaded successfully')
      const RegistryData = require('../RegistryData')
      const ResourceData = require('../ResourceData')
      
      if (!registry) {
        logger.warn('[PackageDiscovery] Registry is empty')
        return new RegistryData('package', '', [])
      }
      
      logger.info(`[PackageDiscovery] Registry loaded with ${registry.resources?.length || 0} resources`)
      const resources = []
      
      // v2.0.0 格式：resources 是数组，直接处理
      if (Array.isArray(registry.resources)) {
        for (const resource of registry.resources) {
          resources.push(new ResourceData({
            id: resource.id,
            source: 'package',  // 使用小写保持一致
            protocol: resource.protocol,  // 直接使用资源的 protocol 字段
            name: resource.name || resource.id,
            description: resource.description || '',
            reference: resource.reference,
            metadata: resource.metadata || {}
          }))
        }
      }
      
      logger.info(`[PackageDiscovery] Successfully created ${resources.length} ResourceData objects`)
      return new RegistryData('package', '@promptx/resource', resources)
    } catch (error) {
      logger.error(`[PackageDiscovery] Error in getRegistryData: ${error.message}`)
      logger.error(`[PackageDiscovery] Stack trace: ${error.stack}`)
      logger.warn(`[PackageDiscovery] 获取注册表数据失败: ${error.message}`)
      const RegistryData = require('../RegistryData')
      return new RegistryData('package', '', [])
    }
  }

  /**
   * 获取环境信息（用于调试）
   */
  getEnvironmentInfo() {
    return {
      type: 'PackageDiscovery',
      source: '@promptx/resource',
      loaded: this._tryRequirePackage() !== null
    }
  }

  /**
   * 尝试加载包（内部辅助方法）
   */
  _tryRequirePackage() {
    try {
      const { registry } = require('@promptx/resource')
      return registry ? { registry } : null
    } catch {
      return null
    }
  }
}

module.exports = PackageDiscovery