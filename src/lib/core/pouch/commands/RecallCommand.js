const BasePouchCommand = require('../BasePouchCommand')
const CognitionArea = require('../areas/CognitionArea')
const StateArea = require('../areas/common/StateArea')
// const ConsciousnessLayer = require('../layers/ConsciousnessLayer') // 已移除意识层
const CognitionLayer = require('../layers/CognitionLayer')
const RoleLayer = require('../layers/RoleLayer')
const { getGlobalResourceManager } = require('../../resource')
const CognitionManager = require('../../cognition/CognitionManager')
const logger = require('../../../utils/logger')

/**
 * 记忆检索命令 - 基于认知体系
 * 使用 CognitionManager 进行智能语义检索
 * 使用Layer架构组装输出
 */
class RecallCommand extends BasePouchCommand {
  constructor () {
    super()
    this.lastSearchCount = 0
    this.resourceManager = getGlobalResourceManager()
    this.cognitionManager = CognitionManager.getInstance(this.resourceManager)
  }

  /**
   * 组装Layers - 使用两层架构
   */
  async assembleLayers(args) {
    // 解析参数：--role, query
    const { role, query } = this.parseArgs(args)

    if (!role) {
      // 错误情况：只创建角色层显示错误
      const roleLayer = new RoleLayer()
      roleLayer.addRoleArea(new StateArea(
        'error: 缺少必填参数 role',
        ['使用方法：recall 角色ID [查询关键词]',
         '示例：recall java-developer "React Hooks"',
         '通过 welcome 工具查看所有可用角色']
      ))
      this.registerLayer(roleLayer)
      return
    }

    logger.step('🧠 [RecallCommand] 开始记忆检索流程 (基于认知体系)')
    logger.info(`🔍 [RecallCommand] 角色: ${role}, 查询内容: ${query ? `"${query}"` : '全部记忆'}`)

    try {
      let mind = null
      if (query) {
        // 有查询词时，执行 recall
        mind = await this.cognitionManager.recall(role, query)
      } else {
        // 无查询词时，执行 prime 获取全局概览
        mind = await this.cognitionManager.prime(role)
      }
      
      if (!mind) {
        logger.warn(`[RecallCommand] No mind returned for role: ${role}, query: ${query}`)
      }
      
      const nodeCount = mind ? mind.activatedCues.size : 0
      logger.success(`✅ [RecallCommand] 认知检索完成 - 激活 ${nodeCount} 个节点`)

      // 设置上下文
      this.context.roleId = role
      this.context.query = query
      this.context.mind = mind

      // 1. 创建认知层 (最高优先级)
      const operationType = query ? 'recall' : 'prime'
      const cognitionLayer = query 
        ? CognitionLayer.createForRecall(mind, role, query)
        : CognitionLayer.createForPrime(mind, role)
      this.registerLayer(cognitionLayer)

      // 2. 创建角色层 (次优先级)
      const roleLayer = new RoleLayer({ roleId: role })
      const stateArea = new StateArea('recall_completed', {
        role,
        query,
        count: nodeCount
      })
      roleLayer.addRoleArea(stateArea)
      this.registerLayer(roleLayer)

    } catch (error) {
      logger.error(`❌ [RecallCommand] 记忆检索失败: ${error.message}`)
      logger.debug(`🐛 [RecallCommand] 错误堆栈: ${error.stack}`)
      
      // 错误情况：只创建角色层显示错误
      const roleLayer = new RoleLayer()
      const errorArea = new StateArea(
        `error: ${error.message}`,
        ['检查角色ID是否正确', '重试检索操作', '如持续失败，查看日志详情']
      )
      roleLayer.addRoleArea(errorArea)
      this.registerLayer(roleLayer)
    }
  }

  /**
   * 解析命令参数
   * @param {Array} args - 命令参数
   * @returns {Object} 解析后的参数对象
   */
  parseArgs (args) {
    if (!args || args.length === 0) {
      return {}
    }

    // 如果第一个参数是对象（从MCP工具调用）
    if (typeof args[0] === 'object') {
      return args[0]
    }

    // 命令行格式：recall role [query]
    const role = args[0]
    const query = args.slice(1).join(' ')

    return { role, query }
  }
}

module.exports = RecallCommand