const BasePouchCommand = require('../BasePouchCommand')
const fs = require('fs-extra')
const path = require('path')
const PackageProtocol = require('../../resource/protocols/PackageProtocol')
const { getGlobalResourceManager } = require('../../resource')
const { getDirectoryService } = require('../../../utils/DirectoryService')

/**
 * 角色注册锦囊命令
 * 负责将新创建的角色注册到系统中
 */
class RegisterCommand extends BasePouchCommand {
  constructor () {
    super()
    this.packageProtocol = new PackageProtocol()
    // 复用ActionCommand的ResourceManager方式
    this.resourceManager = getGlobalResourceManager()
  }

  getPurpose () {
    return '注册新创建的角色到系统中，使其可以被发现和激活'
  }

  async getContent (args) {
    const [roleId] = args

    if (!roleId) {
      return `❌ 请指定要注册的角色ID

🔍 使用方法：
通过 MCP PromptX register 工具注册角色

💡 例如：
注册角色ID: 'my-custom-role'`
    }

    try {
      // 1. 检查角色文件是否存在
      const roleExists = await this.checkRoleExists(roleId)
      if (!roleExists) {
        return `❌ 角色 ${roleId} 不存在！

💡 您可以使用女娲来创建角色：
使用 MCP PromptX action 工具激活 'nuwa' 角色`
      }

      // 2. 提取角色元数据
      const roleMetadata = await this.extractRoleMetadata(roleId)

      // 3. 注册角色到系统
      const registrationResult = await this.registerRole(roleId, roleMetadata)

      if (registrationResult.success) {
        return `✅ 角色 "${roleId}" 注册成功！

📋 **注册信息**：
- 名称：${roleMetadata.name}
- 描述：${roleMetadata.description}
- 文件路径：${roleMetadata.filePath}

🎯 **下一步操作**：
使用 MCP PromptX action 工具激活角色: ${roleId}

💡 现在您可以激活这个角色了！`
      } else {
        return `❌ 角色注册失败：${registrationResult.error}

🔍 请检查：
- 角色文件格式是否正确
- 是否有写入权限
- 注册表文件是否可访问`
      }
    } catch (error) {
      console.error('Register command error:', error)
      return `❌ 注册角色 "${roleId}" 时发生错误：${error.message}

💡 请确保角色文件存在且格式正确。`
    }
  }

  /**
   * 检查角色是否存在（通过ResourceManager注册表）
   */
  async checkRoleExists (roleId) {
    try {
      // 确保ResourceManager已初始化
      if (!this.resourceManager.initialized) {
        await this.resourceManager.initializeWithNewArchitecture()
      }
      
      // 直接通过ResourceManager查找角色（不依赖硬编码路径）
      const roleResource = await this.resourceManager.loadResource(`@role://${roleId}`)
      return roleResource.success
    } catch (error) {
      return false
    }
  }

  /**
   * 提取角色元数据（通过ResourceManager）
   */
  async extractRoleMetadata (roleId) {
    // 通过ResourceManager加载角色内容（不依赖硬编码路径）
    const roleResource = await this.resourceManager.loadResource(`@role://${roleId}`)
    if (!roleResource.success) {
      throw new Error(`角色 ${roleId} 不存在`)
    }
    
    const content = roleResource.content
    const relativePath = roleResource.metadata?.filePath || `role/${roleId}/${roleId}.role.md`
    
    // 提取元数据
    let name = `🎭 ${roleId}`
    let description = '用户自定义角色'
    
    // 从注释中提取元数据（支持多行）
    const nameMatch = content.match(/name:\s*(.+?)(?:\n|$)/i)
    if (nameMatch) {
      name = nameMatch[1].trim()
    }
    
    const descMatch = content.match(/description:\s*(.+?)(?:\n|$)/i)
    if (descMatch) {
      description = descMatch[1].trim()
    }
    
    // 如果没有找到注释，尝试从文件内容推断
    if (name === `🎭 ${roleId}` && description === '用户自定义角色') {
      // 可以根据角色内容进行更智能的推断
      if (content.includes('产品')) {
        name = `📊 ${roleId}`
      } else if (content.includes('开发') || content.includes('代码')) {
        name = `💻 ${roleId}`
      } else if (content.includes('设计')) {
        name = `🎨 ${roleId}`
      }
    }
    
    return {
      name,
      description,
      filePath: `@package://${relativePath}`
    }
  }

  /**
   * 注册角色到系统（使用DirectoryService统一路径获取）
   */
  async registerRole (roleId, metadata) {
    try {
      // 🚀 新架构：通过ProjectPathResolver获取注册表路径
      const { getGlobalProjectPathResolver } = require('../../../utils/ProjectPathResolver')
      const pathResolver = getGlobalProjectPathResolver()
      const registryPath = pathResolver.getRegistryPath()
      
      // 读取当前注册表
      const registry = await fs.readJson(registryPath)
      
      // 添加新角色
      if (!registry.protocols.role.registry) {
        registry.protocols.role.registry = {}
      }
      
      registry.protocols.role.registry[roleId] = {
        file: metadata.filePath,
        name: metadata.name,
        description: metadata.description
      }
      
      // 写回注册表
      await fs.writeJson(registryPath, registry, { spaces: 2 })
      
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * 获取项目路径（复用ActionCommand逻辑）
   */
  async getProjectPath() {
    // 使用DirectoryService统一获取项目路径（与InitCommand保持一致）
    // 🚀 新架构：直接使用ProjectManager获取当前项目路径
    const ProjectManager = require('../../../utils/ProjectManager')
    return ProjectManager.getCurrentProjectPath()
  }

  getPATEOAS (args) {
    const [roleId] = args

    if (!roleId) {
      return {
        currentState: 'register_awaiting_role',
        availableTransitions: ['welcome', 'action'],
        nextActions: [
          {
            name: '查看可用角色',
            description: '查看已注册的角色',
            method: 'MCP PromptX welcome 工具',
            priority: 'medium'
          },
          {
            name: '创建新角色',
            description: '使用女娲创建新角色',
            method: 'MCP PromptX action 工具 (nuwa)',
            priority: 'high'
          }
        ],
        metadata: {
          message: '需要指定角色ID'
        }
      }
    }

    return {
      currentState: 'register_completed',
      availableTransitions: ['action', 'welcome'],
      nextActions: [
        {
          name: '激活角色',
          description: '激活刚注册的角色',
          method: `MCP PromptX action 工具 (${roleId})`,
          priority: 'high'
        },
        {
          name: '查看所有角色',
          description: '查看角色列表',
          method: 'MCP PromptX welcome 工具',
          priority: 'medium'
        }
      ],
      metadata: {
        registeredRole: roleId,
        systemVersion: '锦囊串联状态机 v1.0'
      }
    }
  }
}

module.exports = RegisterCommand 