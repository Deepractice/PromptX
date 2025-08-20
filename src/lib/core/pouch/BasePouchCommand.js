const BaseArea = require('./areas/BaseArea')
const LegacyArea = require('./areas/common/LegacyArea')

/**
 * BasePouchCommand - 基于Area架构的命令基类
 * 
 * 架构设计：
 * - Command负责组装Areas
 * - 每个Area自治管理自己的渲染
 * - 统一的渲染管道处理所有Areas
 */
class BasePouchCommand {
  constructor() {
    this.context = {
      currentPouch: '',
      history: [],
      userProfile: {},
      sessionData: {},
      domainContext: {}
    }
    this.outputFormat = 'human'
    this.areas = []
  }

  /**
   * 注册一个Area
   * @param {BaseArea} area - Area实例
   */
  registerArea(area) {
    if (!(area instanceof BaseArea)) {
      throw new Error('Area must extend BaseArea')
    }
    
    // 检查名称唯一性
    if (this.areas.some(a => a.getName() === area.getName())) {
      throw new Error(`Area with name '${area.getName()}' already registered`)
    }
    
    this.areas.push(area)
  }

  /**
   * 清空所有Areas
   */
  clearAreas() {
    this.areas = []
  }

  /**
   * 组装Areas（子类可重写）
   * @param {Array} args - 命令参数
   * @returns {Promise<void>}
   */
  async assembleAreas(args) {
    // 检查是否有旧的getPurpose/getContent方法
    if (typeof this.getPurpose === 'function' && typeof this.getContent === 'function') {
      // 兼容模式：使用LegacyArea包装旧命令
      const purpose = this.getPurpose()
      const content = await this.getContent(args)
      const pateoas = typeof this.getPATEOAS === 'function' ? this.getPATEOAS(args) : null
      
      const legacyArea = new LegacyArea(purpose, content, pateoas)
      this.registerArea(legacyArea)
    } else {
      // 新架构的命令必须自己实现assembleAreas
      throw new Error('Subclass must implement assembleAreas() or provide getPurpose()/getContent()')
    }
  }

  /**
   * 验证所有Areas
   * @returns {boolean}
   */
  validateAreas() {
    return this.areas.every(area => area.validate())
  }

  /**
   * 渲染所有Areas
   * @returns {Promise<string>}
   */
  async renderAreas() {
    const contents = []
    
    for (const area of this.areas) {
      const content = await area.render()
      if (content) {
        contents.push(area.format(content))
      }
    }
    
    return contents.join('')
  }

  /**
   * 执行命令
   * @param {Array} args - 命令参数
   * @returns {Promise<Object|string>}
   */
  async execute(args = []) {
    // 清空之前的Areas
    this.clearAreas()
    
    // 组装Areas
    await this.assembleAreas(args)
    
    // 验证Areas
    if (!this.validateAreas()) {
      throw new Error('Area validation failed')
    }
    
    // 渲染Areas
    const content = await this.renderAreas()
    
    // 格式化输出
    return this.formatOutput(content)
  }

  /**
   * 格式化最终输出
   * @param {string} content - 渲染的内容
   * @returns {Object|string}
   */
  formatOutput(content) {
    if (this.outputFormat === 'json') {
      return {
        content,
        areas: this.areas.map(a => a.getMetadata()),
        context: this.context,
        format: this.outputFormat
      }
    }
    
    // 人类可读格式
    const output = {
      content,
      context: this.context,
      format: this.outputFormat
    }
    
    return {
      ...output,
      toString() {
        return content
      }
    }
  }

  /**
   * 设置状态上下文
   * @param {Object} context - 状态上下文
   */
  setContext(context) {
    this.context = { ...this.context, ...context }
  }

  /**
   * 设置输出格式
   * @param {'human'|'json'} format - 输出格式
   */
  setOutputFormat(format) {
    this.outputFormat = format
  }
}

module.exports = BasePouchCommand