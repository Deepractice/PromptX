const BasePouchCommand = require('../BasePouchCommand')
const CognitionArea = require('../areas/CognitionArea')
const StateArea = require('../areas/common/StateArea')
// const ConsciousnessLayer = require('../layers/ConsciousnessLayer') // 已移除意识层
const CognitionLayer = require('../layers/CognitionLayer')
const RoleLayer = require('../layers/RoleLayer')
const { getGlobalResourceManager } = require('../../resource')
const CognitionManager = require('../../cognition/CognitionManager')
const logger = require('@promptx/logger')

/**
 * 记忆保存命令 - 基于认知体系
 * 使用 CognitionManager 保存角色专属记忆
 * 使用Layer架构组装输出
 */
class RememberCommand extends BasePouchCommand {
  constructor () {
    super()
    this.resourceManager = getGlobalResourceManager()
    this.cognitionManager = CognitionManager.getInstance(this.resourceManager)
  }

  /**
   * 组装Layers - 使用两层架构
   */
  async assembleLayers(args) {
    // 解析参数：role 和 engrams数组
    const { role, engrams } = this.parseArgs(args)

    if (!role || !engrams) {
      // 错误情况：只创建角色层显示错误
      const roleLayer = new RoleLayer()
      roleLayer.addRoleArea(new StateArea(
        'error: 缺少必填参数',
        [this.getUsageHelp()]
      ))
      this.registerLayer(roleLayer)
      return
    }

    // 检查是否为 V2 角色
    try {
      const { getRolexBridge } = require('../../rolex')
      const bridge = getRolexBridge()
      const isV2 = await bridge.isV2Role(role)
      if (isV2) {
        const roleLayer = new RoleLayer()
        roleLayer.addRoleArea(new StateArea(
          'error: V2 角色不支持 remember 命令',
          [
            'V2 角色使用 RoleX 记忆系统，请使用以下命令：',
            '- reflect: 反思经历并形成经验',
            '- realize: 从经验中掌握原则',
            '- master: 掌握程序/技能',
            '',
            '传统的 remember/recall 命令仅适用于 V1 角色'
          ]
        ))
        this.registerLayer(roleLayer)
        return
      }
    } catch (error) {
      logger.warn('[RememberCommand] Failed to check V2 role:', error)
      // 如果检查失败，继续执行（向后兼容）
    }

    try {
      logger.info('🧠 [RememberCommand] 开始批量记忆保存流程')
      logger.info(` [RememberCommand] 批量保存 ${engrams.length} 个Engram`)
      
      // 使用 CognitionManager 批量保存记忆
      await this.cognitionManager.remember(role, engrams)
      logger.info(' [RememberCommand] 批量记忆保存完成')
      
      // 获取更新后的认知网络
      const mind = await this.cognitionManager.prime(role)
      
      // 设置上下文
      this.context.roleId = role
      this.context.engrams = engrams
      this.context.mind = mind

      // 1. 创建认知层 (最高优先级)
      const cognitionLayer = CognitionLayer.createForRemember(mind, role, engrams.length)
      this.registerLayer(cognitionLayer)

      // 2. 创建角色层 (次优先级)
      const roleLayer = new RoleLayer({ roleId: role })
      const stateArea = new StateArea('remember_completed', {
        role,
        count: engrams.length
      })
      roleLayer.addRoleArea(stateArea)
      this.registerLayer(roleLayer)
      
    } catch (error) {
      logger.error(` [RememberCommand] 记忆保存失败: ${error.message}`)
      logger.debug(` [RememberCommand] 错误堆栈: ${error.stack}`)

      // 错误情况：创建带错误信息的认知层
      const cognitionLayer = CognitionLayer.createForRemember(null, role, 0)
      cognitionLayer.metadata.error = error.message
      this.registerLayer(cognitionLayer)

      // 同时创建角色层显示状态
      const roleLayer = new RoleLayer({ roleId: role })
      roleLayer.addRoleArea(new StateArea('remember_failed', {
        error: error.message
      }))
      this.registerLayer(roleLayer)
    }
  }

  /**
   * 解析命令参数
   * @param {Array} args - 命令参数
   * @returns {Object} 解析后的参数对象
   */
  parseArgs(args) {
    if (!args || args.length === 0) {
      return {}
    }

    // 如果第一个参数是对象（从MCP工具调用）
    if (typeof args[0] === 'object') {
      return args[0]
    }

    // 命令行格式暂不支持
    return {}
  }

  /**
   * 获取使用帮助
   * @returns {string} 使用说明文本
   */
  getUsageHelp() {
    return `❌ 错误：缺少必填参数

🎯 **使用方法**：
remember 工具需要两个参数：
1. role - 角色ID
2. engrams - 记忆数组

📋 **Engram结构**：
{
  content: "要记住的内容",
  schema: "知识结构（用缩进表示层级）",
  strength: 0.8,  // 0-1之间，表示重要程度
  type: "ATOMIC"  // ATOMIC|LINK|PATTERN
}

💡 **记忆类型说明**：
- ATOMIC: 原子概念（名词、定义）
- LINK: 关联关系（动词、连接）
- PATTERN: 行为模式（流程、方法）`
  }
}

module.exports = RememberCommand