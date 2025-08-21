const BasePouchCommand = require('../BasePouchCommand')
const CognitionArea = require('../areas/action/CognitionArea')
const RoleArea = require('../areas/action/RoleArea')
const StateArea = require('../areas/common/StateArea')
const { COMMANDS } = require('../../../../constants')
const { getGlobalResourceManager } = require('../../resource')
const DPMLContentParser = require('../../dpml/DPMLContentParser')
const SemanticRenderer = require('../../dpml/SemanticRenderer')
const { CognitionManager } = require('../../cognition/CognitionManager')
const ProjectManager = require('../../../utils/ProjectManager')
const { getGlobalProjectManager } = require('../../../utils/ProjectManager')
const logger = require('../../../utils/logger')

/**
 * ActionCommand - 角色激活命令
 * 使用Area架构组装输出
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
   * 组装Areas
   */
  async assembleAreas(args) {
    const [roleId] = args

    if (!roleId) {
      // 错误情况：创建一个简单的StateArea
      this.registerArea(new StateArea(
        'error',
        ['使用 MCP PromptX 工具的 action 功能激活角色', '使用 MCP PromptX 工具的 welcome 功能查看可用角色']
      ))
      return
    }

    try {
      logger.debug(`[ActionCommand] 开始激活角色: ${roleId}`)
      
      // 初始化 ResourceManager
      if (!this.resourceManager.initialized) {
        await this.resourceManager.initializeWithNewArchitecture()
      }
      
      // 获取角色信息
      const roleInfo = await this.getRoleInfo(roleId)
      logger.debug(`[ActionCommand] getRoleInfo结果:`, roleInfo)
      
      if (!roleInfo) {
        logger.warn(`[ActionCommand] 角色 "${roleId}" 不存在！`)
        this.registerArea(new StateArea(
          `error: 角色 "${roleId}" 不存在`,
          ['使用 welcome 功能查看所有可用角色', '使用正确的角色ID重试']
        ))
        return
      }

      // 分析角色依赖
      const dependencies = await this.analyzeRoleDependencies(roleInfo)

      // 1. 创建认知区域
      const memories = await this.loadMemories(roleId)
      logger.debug(`[ActionCommand] 加载的memories:`, {
        hasMemories: !!memories,
        keys: memories ? Object.keys(memories) : [],
        semanticNetwork: memories?.semanticNetwork ? 'exists' : 'missing',
        proceduralPatterns: memories?.proceduralPatterns ? 'exists' : 'missing'
      })
      const cognitionArea = new CognitionArea(memories, roleId, 'action')
      this.registerArea(cognitionArea)

      // 2. 创建角色区域
      const roleArea = new RoleArea(
        roleId,
        roleInfo.semantics,
        this.semanticRenderer,
        this.resourceManager,
        dependencies.thoughts,
        dependencies.executions,
        roleInfo.metadata?.title || roleId
      )
      this.registerArea(roleArea)

      // 3. 创建状态区域
      const stateArea = new StateArea('role_activated')
      this.registerArea(stateArea)

    } catch (error) {
      logger.error('Action command error:', error)
      this.registerArea(new StateArea(
        `error: ${error.message}`,
        ['查看可用角色：使用 welcome 功能', '确认角色名称后重试']
      ))
    }
  }

  /**
   * 获取角色信息
   */
  async getRoleInfo(roleId) {
    logger.debug(`[ActionCommand] getRoleInfo调用，角色ID: ${roleId}`)
    
    try {
      logger.debug(`[ActionCommand] 调用loadResource前，ResourceManager状态:`, {
        initialized: this.resourceManager.initialized
      })
      
      const result = await this.resourceManager.loadResource(`@role://${roleId}`)
      
      logger.debug(`[ActionCommand] loadResource返回:`, result)
      
      if (!result || !result.success) {
        logger.warn(`[ActionCommand] 未找到角色资源: @role://${roleId}`)
        return null
      }

      const content = result.content
      if (!content) {
        logger.warn(`[ActionCommand] 角色资源内容为空: @role://${roleId}`)
        return null
      }

      const parsed = this.dpmlParser.parseRoleDocument(content)
      return {
        id: roleId,
        semantics: parsed,
        metadata: result.metadata || {}
      }
    } catch (error) {
      logger.error(`[ActionCommand] 获取角色信息失败:`, {
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

  /**
   * 加载记忆数据 - 从认知系统获取语义网络和程序模式
   */
  async loadMemories(roleId) {
    try {
      logger.debug(`[ActionCommand] 开始加载角色 ${roleId} 的认知数据`)
      
      // 使用 CognitionManager 获取认知数据
      const cognitionManager = new CognitionManager(this.resourceManager)
      
      // 获取语义网络（mindmap格式）
      const mindmapText = await cognitionManager.prime(roleId)
      logger.debug(`[ActionCommand] 获取到的mindmap长度: ${mindmapText?.length || 0}`)
      
      // 解析mindmap为语义网络结构
      const semanticNetwork = this.parseMindmapToSemanticNetwork(mindmapText)
      
      // TODO: 获取程序模式 - 暂时返回空数组
      const proceduralPatterns = []
      
      const memories = {
        semanticNetwork,
        proceduralPatterns
      }
      
      logger.debug(`[ActionCommand] 加载的memories结构:`, {
        hasSemanticNetwork: !!semanticNetwork,
        conceptsCount: semanticNetwork?.concepts ? Object.keys(semanticNetwork.concepts).length : 0,
        patternsCount: proceduralPatterns.length
      })
      
      return memories
    } catch (error) {
      logger.warn(`[ActionCommand] 加载角色 ${roleId} 的认知数据失败:`, error)
      return {}
    }
  }
  
  /**
   * 解析mindmap文本为语义网络结构
   */
  parseMindmapToSemanticNetwork(mindmapText) {
    if (!mindmapText) return null
    
    const lines = mindmapText.split('\n')
    const concepts = {}
    const stack = []
    
    for (const line of lines) {
      if (line.trim() === 'mindmap' || line.trim().startsWith('((') || !line.trim()) {
        continue
      }
      
      // 计算缩进级别
      const indent = line.match(/^(\s*)/)[1].length
      const level = Math.floor(indent / 2)
      
      // 提取概念名称和强度
      const match = line.trim().match(/^(.+?)(?:\s*\[(\d+\.\d+)\])?$/)
      if (!match) continue
      
      const concept = match[1].trim()
      const strength = match[2] ? parseFloat(match[2]) : 0.5
      
      // 构建层级结构
      stack.length = level
      stack[level] = concept
      
      // 创建概念节点
      let current = concepts
      for (let i = 0; i <= level; i++) {
        if (!stack[i]) continue
        
        if (i === level) {
          // 当前层级：创建或更新节点
          if (!current[stack[i]]) {
            current[stack[i]] = {
              strength: strength,
              children: {}
            }
          } else {
            // 更新强度值（如果节点已存在）
            current[stack[i]].strength = strength
          }
        } else {
          // 父层级：确保节点存在但不修改strength
          if (!current[stack[i]]) {
            current[stack[i]] = {
              strength: 0.5,  // 默认值，将被后续正确的值覆盖
              children: {}
            }
          }
          current = current[stack[i]].children
        }
      }
    }
    
    return { concepts }
  }
}

module.exports = ActionCommand