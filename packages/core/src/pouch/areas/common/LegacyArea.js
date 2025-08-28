const BaseArea = require('../BaseArea')

/**
 * LegacyArea - 兼容旧命令的Area
 * 用于包装旧的getPurpose/getContent输出
 */
class LegacyArea extends BaseArea {
  constructor(purpose, content, pateoas) {
    super('LEGACY')
    this.purpose = purpose
    this.content = content
    this.pateoas = pateoas
  }

  async render() {
    // 直接返回内容，不再包装"锦囊"概念
    let output = this.content
    
    if (this.pateoas && this.pateoas.currentState) {
      output += `\n\n📍 当前状态：${this.pateoas.currentState}`
    }
    
    return output
  }

  format(content) {
    // LegacyArea不需要额外格式化，直接返回内容
    return content + '\n'
  }
}

module.exports = LegacyArea