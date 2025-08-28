const BaseArea = require('../areas/BaseArea')

/**
 * BaseLayer - Layer架构的抽象基类
 * 
 * 架构设计：
 * - 三层架构：ConsciousnessLayer → CognitionLayer → RoleLayer
 * - 每个Layer可包含多个Area
 * - Layer负责组织和协调其内部Areas的渲染
 * 
 * 设计原则：
 * 1. 层次化：Layer是Area的容器，提供更高层次的组织
 * 2. 单一职责：每个Layer负责特定的认知层面
 * 3. 组合模式：Layer组合多个Area形成功能单元
 * 
 * 不变式：
 * - 每个Layer有唯一的name和priority
 * - priority决定渲染顺序（数字越小优先级越高）
 * - Layer内的Areas按注册顺序渲染
 */
class BaseLayer {
  /**
   * @param {string} name - Layer的唯一标识名
   * @param {number} priority - 渲染优先级（越小越优先）
   * @param {Object} options - 配置选项
   */
  constructor(name, priority = 100, options = {}) {
    if (!name) {
      throw new Error('Layer name is required')
    }
    
    this.name = name
    this.priority = priority
    this.options = options
    this.areas = []
    this.enabled = true
  }

  /**
   * 获取Layer名称
   * @returns {string}
   */
  getName() {
    return this.name
  }

  /**
   * 获取渲染优先级
   * @returns {number}
   */
  getPriority() {
    return this.priority
  }

  /**
   * 启用/禁用Layer
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled
  }

  /**
   * 检查Layer是否启用
   * @returns {boolean}
   */
  isEnabled() {
    return this.enabled
  }

  /**
   * 注册一个Area到该Layer
   * @param {BaseArea} area - Area实例
   */
  registerArea(area) {
    if (!(area instanceof BaseArea)) {
      throw new Error('Area must extend BaseArea')
    }
    
    // 检查名称唯一性
    if (this.areas.some(a => a.getName() === area.getName())) {
      throw new Error(`Area with name '${area.getName()}' already registered in layer '${this.name}'`)
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
   * 获取所有Areas
   * @returns {Array<BaseArea>}
   */
  getAreas() {
    return this.areas
  }

  /**
   * 组装Areas（子类可重写）
   * 在渲染前调用，用于动态组装Areas
   * @param {Object} context - 渲染上下文
   * @returns {Promise<void>}
   */
  async assembleAreas(context) {
    // 子类实现具体的Area组装逻辑
  }

  /**
   * 验证Layer是否可以渲染
   * @returns {boolean}
   */
  validate() {
    if (!this.enabled) {
      return false
    }
    
    // 验证所有Areas
    return this.areas.every(area => area.validate())
  }

  /**
   * 渲染前的准备工作
   * @param {Object} context - 渲染上下文
   * @returns {Promise<void>}
   */
  async beforeRender(context) {
    // 子类可重写，用于渲染前的准备
  }

  /**
   * 渲染后的清理工作
   * @param {Object} context - 渲染上下文
   * @returns {Promise<void>}
   */
  async afterRender(context) {
    // 子类可重写，用于渲染后的清理
  }

  /**
   * 渲染Layer
   * @param {Object} context - 渲染上下文
   * @returns {Promise<string>}
   */
  async render(context = {}) {
    if (!this.enabled) {
      return ''
    }
    
    // 渲染前准备
    await this.beforeRender(context)
    
    // 组装Areas
    await this.assembleAreas(context)
    
    // 验证
    if (!this.validate()) {
      return ''
    }
    
    // 渲染所有Areas
    const contents = []
    
    for (const area of this.areas) {
      const content = await area.render()
      if (content) {
        // Layer可以选择是否使用Area的格式化
        const formatted = this.formatAreaContent(area, content)
        if (formatted) {
          contents.push(formatted)
        }
      }
    }
    
    // 组合Layer内容
    const layerContent = this.combineAreaContents(contents)
    
    // 渲染后清理
    await this.afterRender(context)
    
    return layerContent
  }

  /**
   * 格式化单个Area的内容
   * 子类可重写以自定义格式化方式
   * @param {BaseArea} area - Area实例
   * @param {string} content - Area内容
   * @returns {string}
   */
  formatAreaContent(area, content) {
    // 默认使用Area自己的格式化
    return area.format(content)
  }

  /**
   * 组合所有Area的内容
   * 子类可重写以自定义组合方式
   * @param {Array<string>} contents - 所有Area的内容
   * @returns {string}
   */
  combineAreaContents(contents) {
    return contents.join('')
  }

  /**
   * 获取Layer元信息
   * @returns {Object}
   */
  getMetadata() {
    return {
      name: this.name,
      type: this.constructor.name,
      priority: this.priority,
      enabled: this.enabled,
      areaCount: this.areas.length,
      areas: this.areas.map(a => a.getMetadata())
    }
  }
}

module.exports = BaseLayer