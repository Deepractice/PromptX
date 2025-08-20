const BasePouchCommand = require('../BasePouchCommand')
const RecallArea = require('../areas/recall/RecallArea')
const StateArea = require('../areas/common/StateArea')
const { getGlobalResourceManager } = require('../../resource')
const { CognitionManager } = require('../../cognition/CognitionManager')
const logger = require('../../../utils/logger')

/**
 * 记忆检索命令 - 基于认知体系
 * 使用 CognitionManager 进行智能语义检索
 * 使用Area架构组装输出
 */
class RecallCommand extends BasePouchCommand {
  constructor () {
    super()
    this.lastSearchCount = 0
    this.resourceManager = getGlobalResourceManager()
    this.cognitionManager = new CognitionManager(this.resourceManager)
  }

  /**
   * 组装Areas
   */
  async assembleAreas(args) {
    // 解析参数：--role, query
    const { role, query } = this.parseArgs(args)

    if (!role) {
      // 错误提示Area
      const errorArea = new RecallArea([], null)
      errorArea.render = async () => `❌ 错误：缺少必填参数 role

🎯 **使用方法**：
recall 角色ID [查询关键词]

📋 **示例**：
recall java-developer "React Hooks"
recall product-manager  # 查看所有产品经理记忆
recall copywriter "A/B测试"

💡 **可用角色ID**：通过 welcome 工具查看所有可用角色`
      this.registerArea(errorArea)
      return
    }

    logger.step('🧠 [RecallCommand] 开始记忆检索流程 (基于认知体系)')
    logger.info(`🔍 [RecallCommand] 角色: ${role}, 查询内容: ${query ? `"${query}"` : '全部记忆'}`)

    try {
      // 使用CognitionManager进行检索
      const memories = await this.cognitionManager.recall(role, query || '')
      this.lastSearchCount = memories.length
      logger.success(`✅ [RecallCommand] 认知检索完成 - 找到 ${memories.length} 条匹配记忆`)

      // 注册RecallArea
      const recallArea = new RecallArea(memories, query)
      this.registerArea(recallArea)

      // 注册StateArea
      const stateArea = new StateArea('recall_completed', {
        role,
        query,
        count: memories.length
      })
      this.registerArea(stateArea)

    } catch (error) {
      logger.error(`❌ [RecallCommand] 记忆检索失败: ${error.message}`)
      logger.debug(`🐛 [RecallCommand] 错误堆栈: ${error.stack}`)
      
      // 错误Area
      const errorArea = new RecallArea([], null)
      errorArea.render = async () => `❌ 检索记忆时出错：${error.message}

💡 **可能的原因**：
- 角色ID不正确
- 认知系统初始化失败
- 记忆存储路径问题

🔧 **建议操作**：
1. 检查角色ID是否正确
2. 重试检索操作
3. 如持续失败，查看日志详情`
      this.registerArea(errorArea)
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