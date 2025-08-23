const BaseArea = require('../BaseArea')
const logger = require('../../../../utils/logger')

/**
 * RoleListArea - 角色列表展示区域
 */
class RoleListArea extends BaseArea {
  constructor(roleCategories) {
    super('ROLE_LIST_AREA')
    this.roleCategories = roleCategories
  }

  async render() {
    let content = ''
    
    // 渲染各个来源的角色
    for (const [source, roles] of Object.entries(this.roleCategories)) {
      if (roles.length === 0) continue
      
      const sourceIcon = this.getSourceIcon(source)
      const sourceTitle = this.getSourceTitle(source)
      
      content += `\n${sourceIcon} **${sourceTitle}** (${roles.length}个)\n`
      
      // 按ID排序
      roles.sort((a, b) => a.id.localeCompare(b.id))
      
      roles.forEach(role => {
        const command = `action("${role.id}")`
        content += `- \`${role.id}\`: ${role.name || role.title || '未命名角色'} → ${command}\n`
      })
    }
    
    return content || '暂无可用角色'
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
      'system': '系统角色',
      'project': '项目角色',
      'user': '用户角色'
    }
    return titles[source] || '其他角色'
  }
}

module.exports = RoleListArea