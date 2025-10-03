const BaseDiscovery = require('./BaseDiscovery')
const logger = require('@promptx/logger')
const fs = require('fs-extra')
const path = require('path')
const CrossPlatformFileScanner = require('./CrossPlatformFileScanner')
const RegistryData = require('../RegistryData')
const ResourceData = require('../ResourceData')

/**
 * FilePatternDiscovery - 基于文件模式的资源发现基类
 * 
 * 统一的文件模式识别逻辑，支持：
 * - *.role.md (角色资源)
 * - *.thought.md (思维模式)
 * - *.execution.md (执行模式)  
 * - *.knowledge.md (知识资源)
 * - *.tool.js (工具资源)
 * 
 * 子类只需要重写 _getBaseDirectory() 方法指定扫描目录
 */
class FilePatternDiscovery extends BaseDiscovery {
  constructor(source, priority) {
    super(source, priority)
    this.fileScanner = new CrossPlatformFileScanner()
    
    // 定义资源类型及其文件模式（遵循ResourceProtocol标准）
    this.resourcePatterns = {
      'role': {
        extensions: ['.role.md'],
        validator: this._validateRoleFile.bind(this)
      },
      'thought': {
        extensions: ['.thought.md'],
        validator: this._validateThoughtFile.bind(this)
      },
      'execution': {
        extensions: ['.execution.md'],
        validator: this._validateExecutionFile.bind(this)
      },
      'knowledge': {
        extensions: ['.knowledge.md'],
        validator: this._validateKnowledgeFile.bind(this)
      },
      'tool': {
        extensions: ['.tool.js'],
        validator: this._validateToolFile.bind(this)
      },
      'manual': {
        extensions: ['.manual.md'],
        validator: this._validateManualFile.bind(this)
      }
    }
  }

  /**
   * 抽象方法：获取扫描基础目录
   * 子类必须实现此方法来指定各自的扫描根目录
   * @returns {Promise<string>} 扫描基础目录路径
   */
  async _getBaseDirectory() {
    throw new Error('Subclass must implement _getBaseDirectory() method')
  }

  /**
   * 统一的资源扫描逻辑
   * @param {RegistryData} registryData - 注册表数据对象
   * @returns {Promise<void>}
   */
  async _scanResourcesByFilePattern(registryData) {
    const baseDirectory = await this._getBaseDirectory()
    
    if (!await fs.pathExists(baseDirectory)) {
      logger.debug(`[${this.source}] 扫描目录不存在: ${baseDirectory}`)
      return
    }

    logger.debug(`[${this.source}] 开始扫描目录: ${baseDirectory}`)

    // 并行扫描所有资源类型
    const resourceTypes = Object.keys(this.resourcePatterns)
    
    for (const resourceType of resourceTypes) {
      try {
        const pattern = this.resourcePatterns[resourceType]
        const files = await this._scanResourceFiles(baseDirectory, resourceType, pattern.extensions)
        
        for (const filePath of files) {
          await this._processResourceFile(filePath, resourceType, registryData, baseDirectory, pattern.validator)
        }
        
        logger.debug(`[${this.source}] ${resourceType} 类型扫描完成，发现 ${files.length} 个文件`)
        
      } catch (error) {
        logger.warn(`[${this.source}] 扫描 ${resourceType} 类型失败: ${error.message}`)
      }
    }
  }

  /**
   * 扫描特定类型的资源文件
   * @param {string} baseDirectory - 基础目录
   * @param {string} resourceType - 资源类型
   * @param {Array<string>} extensions - 文件扩展名列表
   * @returns {Promise<Array<string>>} 匹配的文件路径列表
   */
  async _scanResourceFiles(baseDirectory, resourceType, extensions) {
    const allFiles = []
    
    for (const extension of extensions) {
      try {
        // 使用现有的CrossPlatformFileScanner但扩展支持任意扩展名
        const files = await this.fileScanner.scanFiles(baseDirectory, {
          extensions: [extension],
          recursive: true,
          maxDepth: 10
        })
        allFiles.push(...files)
      } catch (error) {
        logger.warn(`[${this.source}] 扫描 ${extension} 文件失败: ${error.message}`)
      }
    }
    
    return allFiles
  }

  /**
   * 处理单个资源文件
   * @param {string} filePath - 文件路径
   * @param {string} resourceType - 资源类型
   * @param {RegistryData} registryData - 注册表数据
   * @param {string} baseDirectory - 基础目录
   * @param {Function} validator - 文件验证器
   */
  async _processResourceFile(filePath, resourceType, registryData, baseDirectory, validator) {
    try {
      // 1. 验证文件内容
      const isValid = await validator(filePath)
      if (!isValid) {
        logger.debug(`[${this.source}] 文件验证失败，跳过: ${filePath}`)
        return
      }

      // 2. 提取资源ID（遵循ResourceProtocol命名标准）
      const resourceId = this._extractResourceId(filePath, resourceType)
      if (!resourceId) {
        logger.warn(`[${this.source}] 无法提取资源ID: ${filePath}`)
        return
      }

      // 3. 生成引用路径
      const reference = this._generateReference(filePath, baseDirectory)

      // 4. 创建ResourceData对象
      const resourceData = new ResourceData({
        id: resourceId,
        source: this.source.toLowerCase(),
        protocol: resourceType,
        name: ResourceData._generateDefaultName(resourceId, resourceType),
        description: ResourceData._generateDefaultDescription(resourceId, resourceType),
        reference: reference,
        metadata: {
          scannedAt: new Date().toISOString(),
          path: path.relative(baseDirectory, filePath).replace(/\\/g, '/'),
          fileType: resourceType
        }
      })

      // 5. 添加到注册表
      registryData.addResource(resourceData)
      
      logger.debug(`[${this.source}] 成功处理资源: ${resourceId} -> ${reference}`)

    } catch (error) {
      logger.warn(`[${this.source}] 处理资源文件失败: ${filePath} - ${error.message}`)
    }
  }

  /**
   * 提取资源ID（遵循ResourceProtocol标准）
   * @param {string} filePath - 文件路径
   * @param {string} resourceType - 资源类型
   * @returns {string|null} 资源ID
   */
  _extractResourceId(filePath, resourceType) {
    const fileName = path.basename(filePath)
    const pattern = this.resourcePatterns[resourceType]
    
    if (!pattern) {
      return null
    }

    // 尝试匹配扩展名
    for (const extension of pattern.extensions) {
      if (fileName.endsWith(extension)) {
        const baseName = fileName.slice(0, -extension.length)
        
        // 所有资源类型都直接返回基础名称，不添加前缀
        // 协议信息已经在resource对象的protocol字段中
        return baseName
      }
    }

    return null
  }

  /**
   * 生成资源引用路径
   * @param {string} filePath - 文件绝对路径
   * @param {string} baseDirectory - 基础目录
   * @returns {string} 资源引用路径
   */
  _generateReference(filePath, baseDirectory) {
    const relativePath = path.relative(baseDirectory, filePath)
    const protocolPrefix = this.source.toLowerCase() === 'project' ? '@project://' : '@package://'
    
    // 对于project源，添加.promptx/resource前缀
    if (this.source.toLowerCase() === 'project') {
      return `${protocolPrefix}.promptx/resource/${relativePath.replace(/\\/g, '/')}`
    } else {
      return `${protocolPrefix}resource/${relativePath.replace(/\\/g, '/')}`
    }
  }

  // ==================== 文件验证器 ====================

  /**
   * 验证Role文件
   * @param {string} filePath - 文件路径
   * @returns {Promise<boolean>} 是否有效
   */
  async _validateRoleFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8')
      const trimmedContent = content.trim()

      if (trimmedContent.length === 0) {
        return false
      }

      // 检查DPML标签（支持带属性的标签）
      return /<role[\s>]/.test(trimmedContent) && trimmedContent.includes('</role>')
    } catch (error) {
      return false
    }
  }

  /**
   * 验证Thought文件
   * @param {string} filePath - 文件路径
   * @returns {Promise<boolean>} 是否有效
   */
  async _validateThoughtFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8')
      const trimmedContent = content.trim()

      if (trimmedContent.length === 0) {
        return false
      }

      return /<thought[\s>]/.test(trimmedContent) && trimmedContent.includes('</thought>')
    } catch (error) {
      return false
    }
  }

  /**
   * 验证Execution文件
   * @param {string} filePath - 文件路径
   * @returns {Promise<boolean>} 是否有效
   */
  async _validateExecutionFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8')
      const trimmedContent = content.trim()

      if (trimmedContent.length === 0) {
        return false
      }

      return /<execution[\s>]/.test(trimmedContent) && trimmedContent.includes('</execution>')
    } catch (error) {
      return false
    }
  }

  /**
   * 验证Knowledge文件
   * @param {string} filePath - 文件路径
   * @returns {Promise<boolean>} 是否有效
   */
  async _validateKnowledgeFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8')
      const trimmedContent = content.trim()
      
      // knowledge文件比较灵活，只要有内容就认为有效
      return trimmedContent.length > 0
    } catch (error) {
      return false
    }
  }

  /**
   * 验证Tool文件（遵循ResourceProtocol标准）
   * @param {string} filePath - 文件路径
   * @returns {Promise<boolean>} 是否有效
   */
  async _validateToolFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8')
      
      // 1. 检查JavaScript语法
      new Function(content)
      
      // 2. 检查CommonJS导出
      if (!content.includes('module.exports')) {
        return false
      }
      
      // 3. 检查必需的方法（遵循ResourceProtocol标准）
      const requiredMethods = ['getMetadata', 'execute']
      const hasRequiredMethods = requiredMethods.some(method => 
        content.includes(method)
      )
      
      return hasRequiredMethods
      
    } catch (error) {
      return false
    }
  }

  /**
   * 验证Manual文件
   * @param {string} filePath - 文件路径
   * @returns {Promise<boolean>} 是否有效
   */
  async _validateManualFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8')
      const trimmedContent = content.trim()

      if (trimmedContent.length === 0) {
        return false
      }

      // Manual文件应该包含<manual>标签（支持带属性的标签）或者至少有一定的内容
      return /<manual[\s>]/.test(trimmedContent) || trimmedContent.length > 50
    } catch (error) {
      return false
    }
  }

  /**
   * 生成注册表（通用方法）
   * @param {string} baseDirectory - 扫描基础目录
   * @returns {Promise<RegistryData>} 生成的注册表数据
   */
  async generateRegistry(baseDirectory) {
    const registryPath = await this._getRegistryPath()
    const registryData = RegistryData.createEmpty(this.source.toLowerCase(), registryPath)
    
    logger.info(`[${this.source}] 开始生成注册表，扫描目录: ${baseDirectory}`)
    
    try {
      await this._scanResourcesByFilePattern(registryData)
      
      // 保存注册表文件
      if (registryPath) {
        await registryData.save()
      }
      
      logger.info(`[${this.source}]  注册表生成完成，共发现 ${registryData.size} 个资源`)
      return registryData
      
    } catch (error) {
      logger.error(`[${this.source}]  注册表生成失败: ${error.message}`)
      throw error
    }
  }

  /**
   * 获取注册表文件路径（子类可以重写）
   * @returns {Promise<string|null>} 注册表文件路径
   */
  async _getRegistryPath() {
    // 默认返回null，子类可以重写
    return null
  }

  /**
   * 文件系统存在性检查
   * @param {string} filePath - 文件路径
   * @returns {Promise<boolean>} 文件是否存在
   */
  async _fsExists(filePath) {
    return await fs.pathExists(filePath)
  }
}

module.exports = FilePatternDiscovery