/**
 * 资源数据类
 * 描述单个资源的完整元信息
 */
class ResourceData {
  /**
   * @param {Object} options - 资源配置选项
   * @param {string} options.id - 资源唯一标识
   * @param {string} options.source - 资源来源 ('package' | 'project' | 'user')
   * @param {string} options.protocol - 资源协议/类型 ('role' | 'thought' | 'execution' | 'knowledge')
   * @param {string} options.name - 资源名称
   * @param {string} options.description - 资源描述
   * @param {string} options.reference - 资源引用路径
   * @param {Object} options.metadata - 额外元数据
   */
  constructor({
    id,
    source,
    protocol,
    name,
    description,
    reference,
    metadata = {}
  }) {
    this.id = id
    this.source = source
    this.protocol = protocol
    this.name = name
    this.description = description
    this.reference = reference
    this.metadata = {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...metadata
    }
  }

  /**
   * 从原始数据创建ResourceData实例
   * @param {Object} rawData - 原始数据
   * @returns {ResourceData} ResourceData实例
   */
  static fromRawData(rawData) {
    return new ResourceData(rawData)
  }

  /**
   * 从文件路径和协议推断创建ResourceData
   * @param {string} filePath - 文件路径（仅用于提取ID，不保存）
   * @param {string} source - 资源来源
   * @param {string} protocol - 资源协议
   * @param {string} reference - 资源引用
   * @returns {ResourceData} ResourceData实例
   */
  static fromFilePath(filePath, source, protocol, reference) {
    const path = require('path')
    const fileName = path.basename(filePath, `.${protocol}.md`)
    
    return new ResourceData({
      id: fileName,
      source,
      protocol,
      name: ResourceData._generateDefaultName(fileName, protocol),
      description: ResourceData._generateDefaultDescription(fileName, protocol),
      reference,
      metadata: {
        inferredFromFile: true
      }
    })
  }

  /**
   * 生成默认名称
   * @param {string} id - 资源ID
   * @param {string} protocol - 资源协议
   * @returns {string} 默认名称
   * @private
   */
  static _generateDefaultName(id, protocol) {
    const nameMap = {
      'role': '角色',
      'thought': '思维模式',
      'execution': '执行模式',
      'knowledge': '知识库'
    }
    
    // 将kebab-case转换为可读名称
    const readableName = id
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    
    return `${readableName} ${nameMap[protocol] || protocol}`
  }

  /**
   * 生成默认描述
   * @param {string} id - 资源ID
   * @param {string} protocol - 资源协议
   * @returns {string} 默认描述
   * @private
   */
  static _generateDefaultDescription(id, protocol) {
    const descMap = {
      'role': '专业角色，提供特定领域的专业能力',
      'thought': '思维模式，指导AI的思考方式',
      'execution': '执行模式，定义具体的行为模式',
      'knowledge': '知识库，提供专业知识和信息'
    }
    
    return descMap[protocol] || `${protocol}类型的资源`
  }

  /**
   * 获取完整的资源ID（包含来源前缀）
   * @returns {string} 完整资源ID
   */
  getFullId() {
    // role类型不需要协议前缀，其他类型需要
    const baseId = this.protocol === 'role' ? this.id : `${this.protocol}:${this.id}`
    return `${this.source}:${baseId}`
  }

  /**
   * 获取基础资源ID（不包含来源前缀）
   * @returns {string} 基础资源ID
   */
  getBaseId() {
    return this.protocol === 'role' ? this.id : `${this.protocol}:${this.id}`
  }

  /**
   * 检查是否匹配指定的过滤条件
   * @param {Object} filters - 过滤条件
   * @returns {boolean} 是否匹配
   */
  matches(filters = {}) {
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          if (!value.includes(this[key])) return false
        } else {
          if (this[key] !== value) return false
        }
      }
    }
    return true
  }

  /**
   * 更新资源元数据
   * @param {Object} updates - 更新数据
   */
  update(updates) {
    Object.assign(this, updates)
    this.metadata.updatedAt = new Date().toISOString()
  }

  /**
   * 转换为JSON对象
   * @returns {Object} JSON对象
   */
  toJSON() {
    return {
      id: this.id,
      source: this.source,
      protocol: this.protocol,
      name: this.name,
      description: this.description,
      reference: this.reference,
      metadata: this.metadata
    }
  }

  /**
   * 转换为简化的显示格式
   * @returns {Object} 简化格式
   */
  toDisplayFormat() {
    return {
      id: this.id,
      fullId: this.getFullId(),
      baseId: this.getBaseId(),
      name: this.name,
      description: this.description,
      source: this.source,
      protocol: this.protocol
    }
  }

  /**
   * 动态获取文件路径
   * 通过解析 reference 动态计算实际的文件路径
   * @returns {Promise<string>} 文件路径
   */
  async getFilePath() {
    const ProtocolResolver = require('./ProtocolResolver')
    const resolver = new ProtocolResolver()
    
    try {
      const resolvedPath = await resolver.resolve(this.reference)
      return resolvedPath
    } catch (error) {
      throw new Error(`无法解析资源路径 ${this.reference}: ${error.message}`)
    }
  }

  /**
   * 克隆资源数据
   * @returns {ResourceData} 克隆的实例
   */
  clone() {
    return new ResourceData(this.toJSON())
  }
}

module.exports = ResourceData 