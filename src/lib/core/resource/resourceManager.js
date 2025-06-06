const ResourceProtocolParser = require('./resourceProtocolParser')
const ResourceRegistry = require('./resourceRegistry')
const { ResourceResult } = require('./types')
const logger = require('../../utils/logger')
const fs = require('fs-extra')
const path = require('path')

// 导入协议实现
const PackageProtocol = require('./protocols/PackageProtocol')
const ProjectProtocol = require('./protocols/ProjectProtocol')
const UserProtocol = require('./protocols/UserProtocol')
const PromptProtocol = require('./protocols/PromptProtocol')

/**
 * 资源管理器 - 统一管理各种协议的资源加载
 */
class ResourceManager {
  constructor () {
    this.protocolHandlers = new Map()
    this.registry = null
    this.initialized = false
  }

  /**
   * 初始化资源管理器
   */
  async initialize () {
    if (this.initialized) return

    try {
      // 从统一注册表加载所有协议信息
      await this.loadUnifiedRegistry()

      // 注册协议处理器
      await this.registerProtocolHandlers()

      this.initialized = true
    } catch (error) {
      throw new Error(`ResourceManager初始化失败: ${error.message}`)
    }
  }

  /**
   * 加载统一资源注册表
   */
  async loadUnifiedRegistry () {
    const registryPath = path.resolve(__dirname, '../../../resource.registry.json')

    if (!await fs.pathExists(registryPath)) {
      throw new Error(`统一资源注册表文件不存在: ${registryPath}`)
    }

    const registryContent = await fs.readJSON(registryPath)
    this.registry = registryContent
  }

  /**
   * 注册协议处理器
   */
  async registerProtocolHandlers () {
    // 动态导入协议处理器
    const protocolsDir = path.join(__dirname, 'protocols')
    const protocolFiles = await fs.readdir(protocolsDir)

    // 首先创建所有协议处理器实例
    const handlers = new Map()

    for (const file of protocolFiles) {
      if (file.endsWith('.js') && file !== 'ResourceProtocol.js') {
        // 将文件名映射到协议名：ExecutionProtocol.js -> execution
        const protocolName = file.replace('Protocol.js', '').toLowerCase()
        const ProtocolClass = require(path.join(protocolsDir, file))
        const protocolHandler = new ProtocolClass()

        // 从统一注册表获取协议配置
        const protocolConfig = this.registry.protocols[protocolName]
        if (protocolConfig && protocolConfig.registry) {
          protocolHandler.setRegistry(protocolConfig.registry)
        }

        handlers.set(protocolName, protocolHandler)
      }
    }

    // 设置协议依赖关系
    const packageProtocol = handlers.get('package')
    const promptProtocol = handlers.get('prompt')
    const roleProtocol = handlers.get('role')
    const thoughtProtocol = handlers.get('thought')
    const executionProtocol = handlers.get('execution')

    if (promptProtocol && packageProtocol) {
      promptProtocol.setPackageProtocol(packageProtocol)
    }

    if (roleProtocol && packageProtocol) {
      roleProtocol.setPackageProtocol(packageProtocol)
    }

    if (thoughtProtocol && packageProtocol) {
      thoughtProtocol.setPackageProtocol(packageProtocol)
    }

    if (executionProtocol && packageProtocol) {
      executionProtocol.setPackageProtocol(packageProtocol)
    }

    // 将所有处理器注册到管理器
    this.protocolHandlers = handlers
  }

  /**
   * 解析资源路径并获取内容
   */
  async resolveResource (resourceUrl) {
    await this.initialize()

    try {
      // 支持DPML资源引用语法: @protocol://path, @!protocol://path, @?protocol://path
      // 同时向后兼容标准URL格式: protocol://path
      const urlMatch = resourceUrl.match(/^(@[!?]?)?([a-zA-Z][a-zA-Z0-9_-]*):\/\/(.+)$/)
      if (!urlMatch) {
        throw new Error(`无效的资源URL格式: ${resourceUrl}。支持格式: @protocol://path, @!protocol://path, @?protocol://path`)
      }

      const [, loadingSemantic, protocol, resourcePath] = urlMatch
      const handler = this.protocolHandlers.get(protocol)

      if (!handler) {
        throw new Error(`未注册的协议: ${protocol}`)
      }

      // 解析查询参数（如果有的话）
      const { QueryParams, ResourceResult } = require('./types')
      let path = resourcePath
      const queryParams = new QueryParams()

      if (resourcePath.includes('?')) {
        const [pathPart, queryString] = resourcePath.split('?', 2)
        path = pathPart

        // 解析查询字符串
        const params = new URLSearchParams(queryString)
        for (const [key, value] of params) {
          queryParams.set(key, value)
        }
      }

      // 将加载语义信息添加到查询参数中（如果有的话）
      if (loadingSemantic) {
        queryParams.set('loadingSemantic', loadingSemantic)
      }

      const content = await handler.resolve(path, queryParams)

      // 返回ResourceResult格式
      return ResourceResult.success(content, {
        protocol,
        path,
        loadingSemantic,
        loadTime: Date.now()
      })
    } catch (error) {
      // 返回错误结果
      const { ResourceResult } = require('./types')
      return ResourceResult.error(error, {
        resourceUrl,
        loadTime: Date.now()
      })
    }
  }

  /**
   * resolve方法的别名，保持向后兼容
   */
  async resolve (resourceUrl) {
    return await this.resolveResource(resourceUrl)
  }

  /**
   * 获取协议的注册表信息
   */
  getProtocolRegistry (protocol) {
    if (!this.registry) {
      throw new Error('ResourceManager未初始化')
    }

    const protocolConfig = this.registry.protocols[protocol]
    return protocolConfig ? protocolConfig.registry : null
  }

  /**
   * 获取所有已注册的协议
   */
  getAvailableProtocols () {
    return this.registry ? Object.keys(this.registry.protocols) : []
  }

  /**
   * 获取协议的描述信息
   */
  getProtocolInfo (protocol) {
    if (!this.registry) {
      throw new Error('ResourceManager未初始化')
    }

    return this.registry.protocols[protocol]
  }
}

module.exports = ResourceManager
