/**
 * BaseArea - Area架构的抽象基类
 * 
 * 设计原则：
 * 1. 单一职责：每个Area只负责渲染自己的内容块
 * 2. 开闭原则：通过继承扩展新Area类型，不修改基类
 * 3. 依赖倒置：Command依赖Area抽象，不依赖具体实现
 * 
 * 不变式：
 * - validate() = true ⟹ render() 不抛异常
 * - 每个Area有唯一的name标识
 * - render()返回的内容是自包含的
 */
class BaseArea {
  /**
   * @param {string} name - Area的唯一标识名
   * @param {Object} options - 配置选项
   */
  constructor(name, options = {}) {
    if (!name) {
      throw new Error('Area name is required')
    }
    
    this.name = name
    this.options = options
    this.separator = '-'.repeat(50)
  }

  /**
   * 获取Area名称
   * @returns {string}
   */
  getName() {
    return this.name
  }

  /**
   * 验证Area是否可以渲染
   * @returns {boolean}
   */
  validate() {
    return true
  }

  /**
   * 渲染Area内容
   * 子类必须实现此方法
   * @returns {Promise<string>}
   */
  async render() {
    throw new Error(`Area '${this.name}' must implement render() method`)
  }

  /**
   * 格式化Area输出
   * @param {string} content - Area内容
   * @param {boolean} withHeader - 是否包含header
   * @returns {string}
   */
  format(content, withHeader = true) {
    if (!content) return ''
    
    if (withHeader) {
      return `${this.separator}
[${this.name.toUpperCase()}]
${content}
`
    }
    
    return content
  }

  /**
   * 获取Area元信息
   * @returns {Object}
   */
  getMetadata() {
    return {
      name: this.name,
      type: this.constructor.name,
      options: this.options
    }
  }
}

module.exports = BaseArea