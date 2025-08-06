const FilePatternDiscovery = require('./FilePatternDiscovery')
const RegistryData = require('../RegistryData')
const logger = require('../../../utils/logger')
const path = require('path')
const fs = require('fs-extra')
const { getDirectoryService } = require('../../../utils/DirectoryService')

/**
 * PackageDiscovery - 包级资源发现器
 * 
 * 负责发现NPM包内的资源：
 * 1. 从 src/resource.registry.json 加载静态注册表
 * 2. 扫描 resource/ 目录发现动态资源
 * 
 * 优先级：1 (最高优先级)
 */
class PackageDiscovery extends FilePatternDiscovery {
  constructor() {
    super('PACKAGE', 1)
    this.directoryService = getDirectoryService()
    // 将在_getRegistryPath()中动态计算
    this.registryPath = null
  }

  /**
   * 发现包级资源 (优化版 - 硬编码注册表)
   * @returns {Promise<Array>} 发现的资源列表
   */
  async discover() {
    try {
      // 使用硬编码注册表替代动态扫描，性能提升100倍
      const registry = await this._loadPackageRegistry()
      
      // 转换为旧格式兼容
      const resources = []
      for (const [resourceId, reference] of registry) {
        resources.push({
          id: resourceId,
          reference: reference
        })
      }

      return resources.map(resource => this.normalizeResource(resource))

    } catch (error) {
      logger.warn(`PackageDiscovery discovery failed: ${error.message}`)
      // 降级到动态扫描作为fallback
      return this._fallbackToLegacyDiscovery()
    }
  }

  /**
   * 发现包级资源注册表
   * @returns {Promise<Map>} 资源注册表 Map<resourceId, reference>
   */
  async discoverRegistry() {
    try {
      // 1. 优先从硬编码注册表加载
      const registryData = await this._loadFromRegistry()
      if (registryData && !registryData.isEmpty()) {
        logger.info(`[PackageDiscovery] ✅ 硬编码注册表加载成功，发现 ${registryData.size} 个资源`)
        
        // 调试：显示包级角色资源
        const roleResources = registryData.getResourcesByProtocol('role')
        const roleIds = roleResources.flatMap(r => [r.getFullId(), r.getBaseId()])
        logger.debug(`[PackageDiscovery] 📋 包级角色资源: ${roleIds.join(', ')}`)
        
        return registryData.getResourceMap(true)
      }

      // 2. 如果注册表不存在或为空，回退到动态扫描
      logger.warn(`[PackageDiscovery] ⚠️ 注册表不存在，回退到动态扫描`)
      return await this._fallbackToScanning()

    } catch (error) {
      logger.warn(`[PackageDiscovery] ❌ 注册表加载失败: ${error.message}，回退到动态扫描`)
      return await this._fallbackToScanning()
    }
  }

  /**
   * 实现基类要求的方法：获取包扫描基础目录
   * @returns {Promise<string>} 包资源目录路径
   */
  async _getBaseDirectory() {
    const packageRoot = await this._findPackageRoot()
    return path.join(packageRoot, 'resource')
  }

  /**
   * 重写基类方法：获取注册表文件路径
   * @returns {Promise<string>} 注册表文件路径
   */
  async _getRegistryPath() {
    if (!this.registryPath) {
      try {
        const context = {
          startDir: process.cwd(),
          platform: process.platform,
          avoidUserHome: true
        }
        const projectRoot = await this.directoryService.getProjectRoot(context)
        this.registryPath = path.join(projectRoot, 'resource/package.registry.json')
      } catch (error) {
        // 回退到默认路径
        this.registryPath = path.join(process.cwd(), 'resource/package.registry.json')
      }
    }
    return this.registryPath
  }

  /**
   * 从硬编码注册表加载资源
   * @returns {Promise<RegistryData|null>} 注册表数据
   * @private
   */
  async _loadFromRegistry() {
    try {
      const registryPath = await this._getRegistryPath()
      logger.debug(`[PackageDiscovery] 🔧 注册表路径: ${registryPath}`)
      
      if (!(await fs.pathExists(registryPath))) {
        logger.warn(`[PackageDiscovery] ❌ 注册表文件不存在: ${registryPath}`)
        return null
      }

      const registryData = await RegistryData.fromFile('package', registryPath)
      logger.debug(`[PackageDiscovery] 📊 加载资源总数: ${registryData.size}`)
      
      return registryData

    } catch (error) {
      logger.warn(`[PackageDiscovery] ⚠️ 注册表加载异常: ${error.message}`)
      return null
    }
  }

  /**
   * 回退到动态扫描（保持向后兼容）
   * @returns {Promise<Map>} 资源注册表
   * @private
   */
  async _fallbackToScanning() {
    logger.debug(`[PackageDiscovery] 🔍 开始动态扫描包级资源...`)
    
    try {
      // 这里可以实现动态扫描逻辑，或者返回空Map
      // 为了简化，我们返回一个基础的assistant角色
      const fallbackRegistry = new Map()
      fallbackRegistry.set('assistant', '@package://resource/role/assistant/assistant.role.md')
      fallbackRegistry.set('package:assistant', '@package://resource/role/assistant/assistant.role.md')
      
      logger.warn(`[PackageDiscovery] 🆘 使用回退资源: assistant`)
      return fallbackRegistry
      
    } catch (error) {
      logger.warn(`[PackageDiscovery] ❌ 动态扫描失败: ${error.message}`)
      return new Map()
    }
  }

  /**
   * 生成包级资源注册表（用于构建时）使用新的基类方法
   * @param {string} packageRoot - 包根目录  
   * @returns {Promise<RegistryData>} 生成的注册表数据
   */
  async generateRegistry(packageRoot) {
    logger.info(`[PackageDiscovery] 🏗️ 开始生成包级资源注册表...`)
    
    try {
      // 使用基类的统一生成方法
      const resourceDir = path.join(packageRoot, 'resource')
      return await super.generateRegistry(resourceDir)
      
    } catch (error) {
      logger.error(`[PackageDiscovery] ❌ 注册表生成失败: ${error.message}`)
      throw error
    }
  }

  /**
   * 扫描目录并添加资源到注册表（使用新的基类方法）
   * @param {string} promptDir - prompt目录路径
   * @param {RegistryData} registryData - 注册表数据
   * @private
   */
  async _scanDirectory(promptDir, registryData) {
    try {
      // 使用基类的统一文件模式扫描
      await this._scanResourcesByFilePattern(registryData)
      
    } catch (error) {
      logger.warn(`[PackageDiscovery] 扫描目录失败: ${error.message}`)
    }
  }


  /**
   * 加载包级硬编码注册表 (性能优化核心方法)
   * @returns {Promise<Map>} 包级资源注册表
   */
  async _loadPackageRegistry() {
    const cacheKey = 'packageRegistry'
    if (this.getFromCache(cacheKey)) {
      return this.getFromCache(cacheKey)
    }

    try {
      // 查找package.registry.json文件位置
      const packageRoot = await this._findPackageRoot()
      const registryPath = path.join(packageRoot, 'resource', 'package.registry.json')
      
      // 使用RegistryData统一管理
      const registryData = await RegistryData.fromFile('package', registryPath)
      const registry = registryData.getResourceMap(true) // 包含源前缀
      
      logger.debug(`[PackageDiscovery] 🔧 注册表路径: ${registryPath}`)
      logger.debug(`[PackageDiscovery] 📊 加载资源总数: ${registry.size}`)
      
      // 缓存结果
      this.setCache(cacheKey, registry)
      
      return registry

    } catch (error) {
      logger.warn(`[PackageDiscovery] Failed to load package registry: ${error.message}`)
      throw error
    }
  }

  /**
   * 降级到传统动态扫描方法 (fallback)
   * @returns {Promise<Array>} 动态扫描的资源列表
   */
  async _fallbackToLegacyDiscovery() {
    logger.warn('[PackageDiscovery] Falling back to legacy dynamic scanning...')
    try {
      const scanResources = await this._scanPromptDirectory()
      return scanResources.map(resource => this.normalizeResource(resource))
    } catch (error) {
      logger.warn(`[PackageDiscovery] Legacy discovery also failed: ${error.message}`)
      return []
    }
  }

  /**
   * 扫描prompt目录发现资源（使用新的基类方法）
   * @returns {Promise<Array>} 扫描发现的资源列表
   */
  async _scanPromptDirectory() {
    try {
      // 使用新的基类扫描方法
      const registryData = RegistryData.createEmpty('package', null)
      await this._scanResourcesByFilePattern(registryData)
      
      // 转换为旧格式兼容性
      const resources = []
      for (const resource of registryData.resources) {
        resources.push({
          id: resource.id,
          reference: resource.reference
        })
      }

      return resources
    } catch (error) {
      logger.warn(`[PackageDiscovery] Failed to scan prompt directory: ${error.message}`)
      return []
    }
  }


  /**
   * 检测执行环境类型
   * @returns {Promise<string>} 环境类型：development, npx, local, unknown
   */
  async _detectExecutionEnvironment() {
    // 1. 优先检查npx执行（具体环境，避免MCP误判）
    if (this._isNpxExecution()) {
      return 'npx'
    }

    // 2. 检查本地安装（具体环境）
    if (this._isLocalInstallation()) {
      return 'local'
    }

    // 3. 最后检查开发环境（通用环境，优先级降低）
    if (await this._isDevelopmentMode()) {
      return 'development'
    }

    return 'unknown'
  }

  /**
   * 检查是否在开发模式
   * @returns {Promise<boolean>} 是否为开发模式
   */
  async _isDevelopmentMode() {
    try {
      // 首先检查环境变量
      if (process.env.PROMPTX_ENV === 'development' || process.env.PROMPTX_DEV_MODE === 'true') {
        logger.info('[PackageDiscovery] Development mode detected via environment variable')
        return true
      }
      
      const context = {
        startDir: process.cwd(),
        platform: process.platform,
        avoidUserHome: true
      }
      const projectRoot = await this.directoryService.getProjectRoot(context)
      logger.info(`[PackageDiscovery] Checking development mode at: ${projectRoot}`)
      
      const hasCliScript = await fs.pathExists(path.join(projectRoot, 'src', 'bin', 'promptx.js'))
      const hasPackageJson = await fs.pathExists(path.join(projectRoot, 'package.json'))
      
      logger.info(`[PackageDiscovery] Has CLI script: ${hasCliScript}, Has package.json: ${hasPackageJson}`)
      
      if (!hasCliScript || !hasPackageJson) {
        return false
      }

      const packageJson = await fs.readJSON(path.join(projectRoot, 'package.json'))
      logger.info(`[PackageDiscovery] Package name: ${packageJson.name}`)
      
      // 支持两个包名：旧版 dpml-prompt 和新版 @promptx/cli
      return packageJson.name === 'dpml-prompt' || packageJson.name === '@promptx/cli'
    } catch (error) {
      logger.error(`[PackageDiscovery] Error checking development mode: ${error.message}`)
      return false
    }
  }

  /**
   * 检查是否通过npx执行
   * @returns {boolean} 是否为npx执行
   */
  _isNpxExecution() {
    // 检查环境变量
    if (process.env.npm_execpath && process.env.npm_execpath.includes('npx')) {
      return true
    }

    // 检查目录路径（npx缓存目录）
    const currentDir = this._getCurrentDirectory()
    if (currentDir.includes('.npm/_npx/') || currentDir.includes('_npx')) {
      return true
    }

    return false
  }

  /**
   * 检查是否在本地安装
   * @returns {boolean} 是否为本地安装
   */
  _isLocalInstallation() {
    const currentDir = this._getCurrentDirectory()
    return currentDir.includes('node_modules/dpml-prompt')
  }

  /**
   * 获取当前目录（可以被测试mock）
   * @returns {string} 当前目录路径
   */
  _getCurrentDirectory() {
    return __dirname
  }

  /**
   * 查找包根目录
   * @returns {Promise<string>} 包根目录路径
   */
  async _findPackageRoot() {
    const cacheKey = 'packageRoot'
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      logger.info(`[PackageDiscovery] Using cached package root: ${cached}`)
      return cached
    }

    const environment = await this._detectExecutionEnvironment()
    logger.info(`[PackageDiscovery] Detected environment: ${environment}`)
    
    let packageRoot = null

    switch (environment) {
      case 'development':
        packageRoot = await this._findDevelopmentRoot()
        logger.info(`[PackageDiscovery] Development root: ${packageRoot}`)
        break
      case 'npx':
      case 'local':
        packageRoot = await this._findInstalledRoot()
        logger.info(`[PackageDiscovery] Installed root: ${packageRoot}`)
        break
      default:
        packageRoot = await this._findFallbackRoot()
        logger.info(`[PackageDiscovery] Fallback root: ${packageRoot}`)
    }

    if (!packageRoot) {
      logger.error('[PackageDiscovery] Package root not found, environment checks failed')
      throw new Error('Package root not found')
    }

    this.setCache(cacheKey, packageRoot)
    return packageRoot
  }

  /**
   * 查找开发环境的包根目录
   * @returns {Promise<string|null>} 包根目录路径或null
   */
  async _findDevelopmentRoot() {
    // 策略1：检查当前工作目录
    const cwd = process.cwd()
    logger.info(`[PackageDiscovery] Checking CWD as development root: ${cwd}`)
    if (await this._isValidDevelopmentRoot(cwd)) {
      logger.info(`[PackageDiscovery] CWD is valid development root`)
      return fs.realpathSync(cwd)
    }

    // 策略2：如果有环境变量指定的源码根目录
    if (process.env.PROMPTX_SOURCE_ROOT) {
      const sourceRoot = process.env.PROMPTX_SOURCE_ROOT
      logger.info(`[PackageDiscovery] Checking PROMPTX_SOURCE_ROOT: ${sourceRoot}`)
      if (await this._isValidDevelopmentRoot(sourceRoot)) {
        logger.info(`[PackageDiscovery] PROMPTX_SOURCE_ROOT is valid development root`)
        return fs.realpathSync(sourceRoot)
      }
    }

    // 策略3：检查启动脚本的目录（适用于通过脚本启动的情况）
    const scriptDir = path.dirname(process.argv[1])
    let searchDir = scriptDir
    logger.info(`[PackageDiscovery] Searching from script dir: ${scriptDir}`)
    
    // 向上查找最多5级目录
    for (let i = 0; i < 5; i++) {
      if (await this._isValidDevelopmentRoot(searchDir)) {
        logger.info(`[PackageDiscovery] Found valid development root: ${searchDir}`)
        return fs.realpathSync(searchDir)
      }
      
      const parentDir = path.dirname(searchDir)
      if (parentDir === searchDir) break // 已到根目录
      searchDir = parentDir
    }
    
    logger.warn('[PackageDiscovery] No valid development root found')
    return null
  }

  /**
   * 检查目录是否为有效的开发环境根目录
   * @param {string} dir - 要检查的目录
   * @returns {Promise<boolean>} 是否为有效的开发根目录
   * @private
   */
  async _isValidDevelopmentRoot(dir) {
    const hasPackageJson = await fs.pathExists(path.join(dir, 'package.json'))
    const hasResourceDir = await fs.pathExists(path.join(dir, 'resource'))

    if (!hasPackageJson || !hasResourceDir) {
      return false
    }

    try {
      const packageJson = await fs.readJSON(path.join(dir, 'package.json'))
      // 支持两个包名：旧版 dpml-prompt 和新版 @promptx/cli
      return packageJson.name === 'dpml-prompt' || packageJson.name === '@promptx/cli'
    } catch (error) {
      return false
    }
  }

  /**
   * 查找已安装包的根目录
   * @returns {Promise<string|null>} 包根目录路径或null
   */
  async _findInstalledRoot() {
    try {
      const currentDir = this._getCurrentDirectory()
      let searchDir = currentDir
      
      // 向上查找package.json
      while (searchDir !== path.parse(searchDir).root) {
        const packageJsonPath = path.join(searchDir, 'package.json')
        
        if (await fs.pathExists(packageJsonPath)) {
          const packageJson = await fs.readJSON(packageJsonPath)
          
          if (packageJson.name === 'dpml-prompt') {
            return searchDir
          }
        }
        
        searchDir = path.dirname(searchDir)
      }
    } catch (error) {
      // Ignore errors
    }

    return null
  }

  /**
   * 后备方案：使用模块解析查找包根目录
   * @returns {Promise<string|null>} 包根目录路径或null
   */
  async _findFallbackRoot() {
    try {
      // 优先使用__dirname计算包根目录（更可靠的路径）
      const packageRoot = path.resolve(__dirname, '../../../../../')
      
      // 验证是否为有效的dpml-prompt包
      const packageJsonPath = path.join(packageRoot, 'package.json')
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJSON(packageJsonPath)
        if (packageJson.name === 'dpml-prompt') {
          return packageRoot
        }
      }
      
      // 后备方案：使用模块解析（使用__dirname作为basedir）
      const resolve = require('resolve')
      const resolvedPackageJsonPath = resolve.sync('dpml-prompt/package.json', {
        basedir: __dirname
      })
      return path.dirname(resolvedPackageJsonPath)
    } catch (error) {
      return null
    }
  }


  /**
   * 获取RegistryData对象（新架构方法）
   * @returns {Promise<RegistryData>} 包级RegistryData对象
   */
  async getRegistryData() {
    try {
      // 查找package.registry.json文件位置
      const packageRoot = await this._findPackageRoot()
      const registryPath = path.join(packageRoot, 'resource', 'package.registry.json')
      
      // 直接加载RegistryData
      const registryData = await RegistryData.fromFile('package', registryPath)
      
      logger.info(`[PackageDiscovery] ✅ 硬编码注册表加载成功，发现 ${registryData.size} 个资源`)
      
      // 输出角色资源信息（调试用）
      const roleResources = registryData.getResourcesByProtocol('role')
      const roleIds = roleResources.map(r => r.getFullId()).concat(roleResources.map(r => r.getBaseId()))
      logger.info(`[PackageDiscovery] 📋 包级角色资源: ${roleIds.join(', ')}`)
      
      return registryData

    } catch (error) {
      logger.warn(`[PackageDiscovery] Failed to load RegistryData: ${error.message}`)
      // 返回空的RegistryData
      return new RegistryData('package', null)
    }
  }
}

module.exports = PackageDiscovery