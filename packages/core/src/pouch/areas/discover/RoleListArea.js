const BaseArea = require('../BaseArea')
const logger = require('@promptx/logger')

/**
 * RoleListArea - 角色列表展示区域
 */
class RoleListArea extends BaseArea {
  constructor(roleCategories, directoryData = null) {
    super('ROLE_LIST_AREA')
    this.roleCategories = roleCategories
    this.directoryData = directoryData || { roles: [], organizations: [] }
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
        if (role.version === 'v2') {
          const command = `action({ operation: "activate", role: "${role.id}" })`
          const orgInfo = this.getOrganizationInfo(role.id)
          if (orgInfo) {
            content += `- \`${role.id}\` [V2]: ${role.name || '未命名角色'} (${orgInfo.org} - ${orgInfo.position}) → ${command}\n`
          } else {
            content += `- \`${role.id}\` [V2]: ${role.name || '未命名角色'} → ${command}\n`
          }
        } else {
          const command = `action("${role.id}")`
          content += `- \`${role.id}\`: ${role.name || role.title || '未命名角色'} → ${command}\n`
        }
      })
    }

    return content || '暂无可用角色'
  }

  /**
   * 获取角色的组织和岗位信息
   * @param {string} roleId - 角色ID
   * @returns {Object|null} { org: string, position: string } 或 null
   */
  getOrganizationInfo(roleId) {
    if (!this.directoryData || !this.directoryData.roles) {
      return null
    }

    const roleData = this.directoryData.roles.find(r => r.name === roleId)
    if (roleData && roleData.org && roleData.position) {
      return {
        org: roleData.org,
        position: roleData.position
      }
    }
    return null
  }
  
  getSourceIcon(source) {
    const icons = {
      'system': '📦',
      'project': '🏗️',
      'user': '👤',
      'rolex': '🎭'
    }
    return icons[source] || '📄'
  }
  
  getSourceTitle(source) {
    const titles = {
      'system': '系统角色',
      'project': '项目角色',
      'user': '用户角色',
      'rolex': 'V2角色 (RoleX)'
    }
    return titles[source] || '其他角色'
  }
}

module.exports = RoleListArea