const ResourceProtocol = require('./ResourceProtocol')
const path = require('path')
const fs = require('fs').promises
const { glob } = require('glob')
const { promisify } = require('util')

/**
 * PromptX内置提示词资源协议实现
 * 实现@prompt://协议，用于访问PromptX内置的提示词资源
 */
class PromptProtocol extends ResourceProtocol {
  constructor (options = {}) {
    super('prompt', options)

    // PromptX 内置资源注册表
    this.registry = new Map([
      ['protocols', '@package://resource/protocol/**/*.md'],
      ['core', '@package://resource/core/**/*.md'],
      ['role', '@package://resource/role/**/*.md'],
      ['resource', '@package://resource/resource/**/*.md'],
      ['bootstrap', '@package://bootstrap.md']
    ])

    // 依赖的其他协议
    this.packageProtocol = null
  }

  /**
   * 设置依赖的协议
   * @param {PackageProtocol} packageProtocol - 包协议实例
   */
  setPackageProtocol (packageProtocol) {
    this.packageProtocol = packageProtocol
  }

  /**
   * 设置注册表
   */
  setRegistry (registry) {
    if (!registry) {
      this.registry = new Map()
      return
    }

    // 如果传入的是普通对象，转换为Map
    if (registry instanceof Map) {
      this.registry = registry
    } else {
      // 从普通对象创建Map
      this.registry = new Map(Object.entries(registry))
    }
  }

  /**
   * 获取协议信息
   */
  getProtocolInfo () {
    return {
      name: 'prompt',
      description: 'PromptX内置提示词资源协议',
      location: 'prompt://{resource_id}',
      examples: [
        'prompt://protocols',
        'prompt://core',
        'prompt://role',
        'prompt://bootstrap'
      ],
      availableResources: Array.from(this.registry.keys()),
      params: this.getSupportedParams()
    }
  }

  /**
   * 支持的查询参数
   */
  getSupportedParams () {
    return {
      ...super.getSupportedParams(),
      merge: 'boolean - 是否合并多个文件内容',
      separator: 'string - 文件间分隔符',
      include_filename: 'boolean - 是否包含文件名标题'
    }
  }

  /**
   * 验证资源路径
   */
  validatePath (resourcePath) {
    if (!super.validatePath(resourcePath)) {
      return false
    }

    // 检查是否在注册表中
    return this.registry.has(resourcePath)
  }

  /**
   * 解析资源路径
   */
  async resolvePath (resourcePath, queryParams) {
    // 验证资源是否存在
    if (!this.registry.has(resourcePath)) {
      throw new Error(`未找到 prompt 资源: ${resourcePath}。可用资源: ${Array.from(this.registry.keys()).join(', ')}`)
    }

    // 获取对应的包路径
    const packagePath = this.registry.get(resourcePath)
    return packagePath
  }

  /**
   * 加载资源内容
   */
  async loadContent (packagePath, queryParams) {
    // 确保有包协议依赖
    if (!this.packageProtocol) {
      throw new Error('PromptProtocol 需要 PackageProtocol 依赖')
    }

    // 检查是否是通配符路径
    if (packagePath.includes('**') || packagePath.includes('*')) {
      return await this.loadMultipleFiles(packagePath, queryParams)
    } else {
      return await this.loadSingleFile(packagePath, queryParams)
    }
  }

  /**
   * 加载单个文件
   */
  async loadSingleFile (packagePath, queryParams) {
    try {
      // 移除协议前缀
      const cleanPath = packagePath.replace('@package://', '')
      const result = await this.packageProtocol.loadContent(cleanPath, queryParams)
      return result.content || result
    } catch (error) {
      throw new Error(`加载单个文件失败 ${packagePath}: ${error.message}`)
    }
  }

  /**
   * 加载多个文件（通配符支持）
   */
  async loadMultipleFiles (packagePath, queryParams) {
    try {
      // 获取包根目录
      const packageRoot = await this.packageProtocol.getPackageRoot()

      // 移除协议前缀并构建搜索路径
      const cleanPath = packagePath.replace('@package://', '')
      const searchPattern = path.join(packageRoot, cleanPath)

      // 使用 glob 查找匹配的文件
      const files = await glob(searchPattern, {
        ignore: ['**/node_modules/**', '**/.git/**'],
        absolute: true
      })

      if (files.length === 0) {
        throw new Error(`没有找到匹配的文件: ${packagePath}`)
      }

      // 读取所有文件内容
      const contents = []
      for (const filePath of files.sort()) {
        try {
          const content = await fs.readFile(filePath, 'utf8')
          const relativePath = path.relative(packageRoot, filePath)

          contents.push({
            path: relativePath,
            content
          })
        } catch (error) {
          console.warn(`警告: 无法读取文件 ${filePath}: ${error.message}`)
        }
      }

      // 合并内容
      return this.mergeContents(contents, queryParams)
    } catch (error) {
      throw new Error(`加载多个文件失败 ${packagePath}: ${error.message}`)
    }
  }

  /**
   * 合并多个文件内容
   */
  mergeContents (contents, queryParams) {
    const merge = queryParams?.get('merge') !== 'false' // 默认合并
    const separator = queryParams?.get('separator') || '\n\n---\n\n'
    const includeFilename = queryParams?.get('include_filename') !== 'false' // 默认包含文件名

    if (!merge) {
      // 不合并，返回 JSON 格式
      return JSON.stringify(contents, null, 2)
    }

    // 合并所有内容
    const mergedParts = contents.map(({ path, content }) => {
      let part = ''

      if (includeFilename) {
        part += `# ${path}\n\n`
      }

      part += content

      return part
    })

    return mergedParts.join(separator)
  }

  /**
   * 检查资源是否存在
   */
  async exists (resourcePath, queryParams) {
    try {
      const packagePath = await this.resolvePath(resourcePath, queryParams)

      if (packagePath.includes('**') || packagePath.includes('*')) {
        // 通配符路径：检查是否有匹配的文件
        const packageRoot = await this.packageProtocol.getPackageRoot()
        const cleanPath = packagePath.replace('@package://', '')
        const searchPattern = path.join(packageRoot, cleanPath)
        const files = await glob(searchPattern, {
          ignore: ['**/node_modules/**', '**/.git/**']
        })
        return files.length > 0
      } else {
        // 单个文件：检查文件是否存在
        const cleanPath = packagePath.replace('@package://', '')
        return await this.packageProtocol.exists(cleanPath, queryParams)
      }
    } catch (error) {
      return false
    }
  }

  /**
   * 列出所有可用资源
   */
  listResources () {
    return Array.from(this.registry.entries()).map(([key, value]) => ({
      id: key,
      path: value,
      description: this.getResourceDescription(key)
    }))
  }

  /**
   * 获取资源描述
   */
  getResourceDescription (resourceId) {
    const descriptions = {
      protocols: 'DPML协议规范文档',
      core: '核心思维和执行模式',
      role: '角色定义和专家能力',
      resource: '资源管理和路径解析',
      bootstrap: 'PromptX启动引导文件'
    }

    return descriptions[resourceId] || '未知资源'
  }
}

module.exports = PromptProtocol
