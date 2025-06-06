const BasePouchCommand = require('../BasePouchCommand')
const fs = require('fs-extra')
const path = require('path')
const { buildCommand } = require('../../../../constants')
const ResourceManager = require('../../resource/resourceManager')

/**
 * 角色发现锦囊命令
 * 负责展示可用的AI角色和领域专家
 * 基于奥卡姆剃刀原则：注册表为主，文件系统为辅
 */
class HelloCommand extends BasePouchCommand {
  constructor () {
    super()
    this.resourceManager = new ResourceManager()
  }

  getPurpose () {
    return '为AI提供可用角色信息，以便AI向主人汇报专业服务选项'
  }

  /**
   * 简化的角色发现机制 - 注册表为主，文件系统为辅
   * 约定：优先使用注册表，补充本地发现的角色
   */
  async discoverAllRoles () {
    const allRoles = {}

    try {
      // 1. 加载注册表中的角色（主要数据源）
      await this.resourceManager.initialize()
      
      if (this.resourceManager.registry?.protocols?.role?.registry) {
        const registeredRoles = this.resourceManager.registry.protocols.role.registry
        
        // 验证注册表中的角色文件存在性
        for (const [roleId, roleInfo] of Object.entries(registeredRoles)) {
          if (await this.validateRoleFile(roleInfo.file)) {
            allRoles[roleId] = roleInfo
          }
        }
      }

      // 2. 补充本地发现的角色（仅添加注册表中没有的）
      const localRoles = await this.scanLocalRoles()
      Object.entries(localRoles).forEach(([roleId, roleInfo]) => {
        if (!allRoles[roleId]) {
          allRoles[roleId] = roleInfo
        }
      })

      // 3. 确保至少有一个可用角色
      if (Object.keys(allRoles).length === 0) {
        const defaultRoles = this.getDefaultRoles()
        Object.assign(allRoles, defaultRoles)
      }

      return allRoles

    } catch (error) {
      console.warn('角色发现失败，使用默认角色:', error.message)
      return this.getDefaultRoles()
    }
  }

  /**
   * 扫描本地角色文件
   */
  async scanLocalRoles () {
    const domainPath = './prompt/domain'
    const roles = {}

    try {
      if (!await fs.pathExists(domainPath)) {
        return roles
      }

      const entries = await fs.readdir(domainPath, { withFileTypes: true })
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const roleId = entry.name
          const roleFile = path.join(domainPath, roleId, `${roleId}.role.md`)
          
          if (await fs.pathExists(roleFile)) {
            roles[roleId] = this.createRoleMetadata(roleId, roleFile)
          }
        }
      }

      return roles
    } catch (error) {
      console.warn('本地角色扫描失败:', error.message)
      return {}
    }
  }

  /**
   * 创建角色元数据（基于约定的默认值）
   */
  createRoleMetadata (roleId, roleFile) {
    return {
      file: roleFile,
      name: `🎭 ${roleId}`,
      description: `${roleId}专业服务`
    }
  }

  /**
   * 获取默认角色
   */
  getDefaultRoles () {
    return {
      assistant: {
        file: '@package://prompt/domain/assistant/assistant.role.md',
        name: '🙋 智能助手',
        description: '通用助理角色，提供基础的助理服务和记忆支持'
      }
    }
  }

  /**
   * 获取所有角色（简化版本）
   */
  async getAllRoles () {
    const roles = await this.discoverAllRoles()
    
    return Object.keys(roles).map(roleId => ({
      id: roleId,
      name: roles[roleId].name,
      description: roles[roleId].description,
      file: roles[roleId].file,
      source: roles[roleId].file.startsWith('@package://') ? 'registry' : 'local'
    }))
  }

  async getContent (args) {
    const allRoles = await this.getAllRoles()
    const totalRoles = allRoles.length

    let content = `🤖 **AI专业角色服务清单** (共 ${totalRoles} 个专业角色可供选择)

> 💡 **重要说明**：以下是可激活的AI专业角色。每个角色都有唯一的ID，使用action命令激活。

## 📋 可用角色列表

`

    // 清楚显示角色ID和激活命令
    allRoles.forEach((role, index) => {
      content += `### ${index + 1}. ${role.name} 
**角色ID**: \`${role.id}\`  
**专业能力**: ${role.description}  
**激活命令**: \`${buildCommand.action(role.id)}\`

---

`
    })

    content += `
## 🎯 **角色激活指南**

### 🔧 激活步骤
1. **选择角色**: 从上述列表中选择需要的专业角色
2. **使用角色ID**: 复制对应的角色ID（如：\`${allRoles[0]?.id || 'assistant'}\`）
3. **执行命令**: 运行 \`${buildCommand.action('<角色ID>')}\`

### 📝 激活示例
\`\`\`bash
# 激活智能助手角色
${buildCommand.action(allRoles[0]?.id || 'assistant')}
\`\`\`

### ⚡ 激活后效果
- ✅ **获得专业能力** - AI将具备该角色的专业技能
- ✅ **学习技能组合** - 自动学习角色需要的思维和行为模式
- ✅ **即时专业化** - 立即可以提供该领域的专业服务

---

⚠️ **AI执行指令**：
📢 **向主人汇报角色选项，明确说明使用方法："请选择角色ID，然后我将执行对应的action命令"**
🎯 **等待主人指定具体的角色ID后，立即执行 \`${buildCommand.action('<角色ID>')}\`**
💡 **强调：action命令需要具体的角色ID，不是角色名称**
`

    return content
  }

  async getPATEOAS (args) {
    const allRoles = await this.getAllRoles()
    const availableRoles = allRoles.map(role => ({
      roleId: role.id,
      name: role.name,
      actionCommand: buildCommand.action(role.id)
    }))

    return {
      currentState: 'role_discovery',
      availableTransitions: ['action', 'learn', 'init', 'recall'],
      nextActions: [
        {
          name: '向主人汇报服务选项',
          description: '将上述专业服务清单告知主人，并询问需求',
          command: '等待主人选择后使用: ' + buildCommand.action('<选择的角色ID>'),
          priority: 'critical',
          instruction: '必须先询问主人需求，不要自主选择角色'
        }
      ],
      metadata: {
        totalRoles: allRoles.length,
        availableRoles,
        dataSource: 'registry + local filesystem',
        systemVersion: '锦囊串联状态机 v1.0',
        designPhilosophy: 'AI use CLI get prompt for AI'
      }
    }
  }

  /**
   * 验证角色文件是否存在（支持@package://协议）
   */
  async validateRoleFile (filePath) {
    try {
      if (filePath.startsWith('@package://')) {
        const PackageProtocol = require('../../resource/protocols/PackageProtocol')
        const packageProtocol = new PackageProtocol()
        const packageRoot = await packageProtocol.getPackageRoot()
        const actualPath = path.join(packageRoot, filePath.replace('@package://', ''))
        return await fs.pathExists(actualPath)
      }
      return await fs.pathExists(filePath)
    } catch (error) {
      return false
    }
  }

  /**
   * 获取角色信息（提供给其他命令使用）
   */
  async getRoleInfo (roleId) {
    const roles = await this.discoverAllRoles()
    const roleData = roles[roleId]

    if (!roleData) {
      return null
    }

    return {
      id: roleId,
      name: roleData.name,
      description: roleData.description,
      file: roleData.file
    }
  }

  /**
   * 获取可用领域（简化版本）
   */
  async discoverAvailableDomains () {
    const allRoles = await this.getAllRoles()
    return allRoles.map(role => role.id)
  }
}

module.exports = HelloCommand
