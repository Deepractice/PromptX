const BaseArea = require('../BaseArea')
const logger = require('../../../../utils/logger')

/**
 * ToolListArea - 工具列表展示区域
 */
class ToolListArea extends BaseArea {
  constructor(toolCategories) {
    super('TOOL_LIST_AREA')
    this.toolCategories = toolCategories
  }

  async render() {
    let content = ''
    
    // 渲染各个来源的工具
    for (const [source, tools] of Object.entries(this.toolCategories)) {
      if (tools.length === 0) continue
      
      const sourceIcon = this.getSourceIcon(source)
      const sourceTitle = this.getSourceTitle(source)
      
      content += `\n${sourceIcon} **${sourceTitle}** (${tools.length}个)\n`
      
      // 按ID排序
      tools.sort((a, b) => a.id.localeCompare(b.id))
      
      tools.forEach(tool => {
        const manualCommand = `learn("@manual://${tool.id}")`
        const toolCommand = `toolx("@tool://${tool.id}", parameters)`
        
        content += `- \`${tool.id}\`: ${tool.name || tool.title || '未命名工具'}\n`
        content += `  - 📖 查看使用手册: ${manualCommand}\n`
        content += `  - 🔧 执行工具: ${toolCommand}\n`
      })
    }
    
    return content || '暂无可用工具'
  }
  
  getSourceIcon(source) {
    const icons = {
      'system': '📦',
      'project': '🏗️',
      'user': '👤'
    }
    return icons[source] || '📄'
  }
  
  getSourceTitle(source) {
    const titles = {
      'system': '系统工具',
      'project': '项目工具',
      'user': '用户工具'
    }
    return titles[source] || '其他工具'
  }
}

module.exports = ToolListArea