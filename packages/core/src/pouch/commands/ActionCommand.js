const BasePouchCommand = require('../BasePouchCommand')
const RoleArea = require('../areas/action/RoleArea')
const StateArea = require('../areas/common/StateArea')
const RoleLayer = require('../layers/RoleLayer')
const { COMMANDS } = require('~/constants')
const { getGlobalResourceManager } = require('../../resource')
const DPMLContentParser = require('../../dpml/DPMLContentParser')
const SemanticRenderer = require('../../dpml/SemanticRenderer')
const ProjectManager = require('~/project/ProjectManager')
const { getGlobalProjectManager } = require('~/project/ProjectManager')
const logger = require('@promptx/logger')

/**
 * ActionCommand - 角色激活命令
 * 专注于角色激活和提示词展示，不进行记忆加载
 * 记忆探索由 AI 通过 recall 工具主动进行
 */
class ActionCommand extends BasePouchCommand {
  constructor() {
    super()
    this.resourceManager = getGlobalResourceManager()
    this.dpmlParser = new DPMLContentParser()
    this.semanticRenderer = new SemanticRenderer()
    this.projectManager = getGlobalProjectManager()
  }

  /**
   * 组装Layers - 使用新的三层架构
   */
  async assembleLayers(args) {
    const [roleId] = args

    if (!roleId) {
      // 错误情况：只创建角色层显示错误
      const roleLayer = new RoleLayer()
      roleLayer.addRoleArea(new StateArea(
        'error',
        ['使用 MCP PromptX 工具的 action 功能激活角色', '使用 MCP PromptX 工具的 discover 功能查看可用角色']
      ))
      this.registerLayer(roleLayer)
      return
    }

    try {
      logger.debug(`[ActionCommand] Starting to activate role: ${roleId}`)
      
      // 初始化 ResourceManager
      if (!this.resourceManager.initialized) {
        await this.resourceManager.initializeWithNewArchitecture()
      }
      
      // 获取角色信息
      const roleInfo = await this.getRoleInfo(roleId)
      logger.debug(`[ActionCommand] getRoleInfo result:`, roleInfo)
      
      if (!roleInfo) {
        logger.warn(`[ActionCommand] Role "${roleId}" does not exist!`)
        const roleLayer = new RoleLayer()
        roleLayer.addRoleArea(new StateArea(
          `error: 角色 "${roleId}" 不存在`,
          ['使用 discover 功能查看所有可用角色', '使用正确的角色ID重试']
        ))
        this.registerLayer(roleLayer)
        return
      }

      // 分析角色依赖
      const dependencies = await this.analyzeRoleDependencies(roleInfo)

      // 设置上下文
      this.context.roleId = roleId
      this.context.roleInfo = roleInfo

      // 创建角色层
      const roleLayer = new RoleLayer({ roleId, roleInfo })
      
      // 添加角色区域
      const roleArea = new RoleArea(
        roleId,
        roleInfo.semantics,
        this.semanticRenderer,
        this.resourceManager,
        dependencies.thoughts,
        dependencies.executions,
        roleInfo.metadata?.title || roleId
      )
      roleLayer.addRoleArea(roleArea)
      
      // 添加状态区域
      const stateArea = new StateArea('role_activated')
      roleLayer.addRoleArea(stateArea)
      
      this.registerLayer(roleLayer)

    } catch (error) {
      logger.error('Action command error:', error)
      const roleLayer = new RoleLayer()
      roleLayer.addRoleArea(new StateArea(
        `error: ${error.message}`,
        ['查看可用角色：使用 discover 功能', '确认角色名称后重试']
      ))
      this.registerLayer(roleLayer)
    }
  }


  /**
   * 获取角色信息
   */
  async getRoleInfo(roleId) {
    logger.debug(`[ActionCommand] getRoleInfo called, role ID: ${roleId}`)
    
    try {
      logger.debug(`[ActionCommand] ResourceManager state before loadResource call:`, {
        initialized: this.resourceManager.initialized
      })
      
      const result = await this.resourceManager.loadResource(`@role://${roleId}`)
      
      logger.debug(`[ActionCommand] loadResource returned:`, result)
      
      if (!result || !result.success) {
        logger.warn(`[ActionCommand] Role resource not found: @role://${roleId}`)
        return null
      }

      const content = result.content
      if (!content) {
        logger.warn(`[ActionCommand] Role resource content is empty: @role://${roleId}`)
        return null
      }

      const parsed = this.dpmlParser.parseRoleDocument(content)
      return {
        id: roleId,
        semantics: parsed,
        metadata: result.metadata || {}
      }
    } catch (error) {
      logger.error(`[ActionCommand] Failed to get role information:`, {
        message: error.message,
        stack: error.stack,
        name: error.name,
        toString: error.toString()
      })
      return null
    }
  }

  /**
   * 分析角色依赖
   */
  async analyzeRoleDependencies(roleInfo) {
    const dependencies = {
      thoughts: [],
      executions: [],
      knowledges: []
    }

    if (!roleInfo || !roleInfo.semantics) {
      return dependencies
    }

    const extractReferences = (component) => {
      const refs = []
      if (!component) return refs

      const extractFromNode = (node) => {
        if (typeof node === 'string') {
          const matches = node.matchAll(/<reference[^>]*protocol="([^"]+)"[^>]*resource="([^"]+)"[^>]*>/g)
          for (const match of matches) {
            refs.push({
              protocol: match[1],
              resource: match[2]
            })
          }
        } else if (Array.isArray(node)) {
          node.forEach(extractFromNode)
        } else if (typeof node === 'object' && node !== null) {
          Object.values(node).forEach(extractFromNode)
        }
      }

      extractFromNode(component)
      return refs
    }

    // 提取所有引用
    const allRefs = [
      ...extractReferences(roleInfo.semantics.personality),
      ...extractReferences(roleInfo.semantics.principle),
      ...extractReferences(roleInfo.semantics.knowledge)
    ]

    // 分类并加载资源
    for (const ref of allRefs) {
      try {
        const resourceUrl = `@${ref.protocol}://${ref.resource}`
        const result = await this.resourceManager.loadResource(resourceUrl)
        
        if (result && result.success) {
          const content = result.content
          if (ref.protocol === 'thought') {
            dependencies.thoughts.push(content)
          } else if (ref.protocol === 'execution') {
            dependencies.executions.push(content)
          } else if (ref.protocol === 'knowledge') {
            dependencies.knowledges.push(content)
          }
        }
      } catch (error) {
        logger.warn(`Failed to load reference: @${ref.protocol}://${ref.resource}`, error)
      }
    }

    return dependencies
  }
}

module.exports = ActionCommand