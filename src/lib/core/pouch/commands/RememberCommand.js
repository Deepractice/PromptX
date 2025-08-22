const BasePouchCommand = require('../BasePouchCommand')
const RememberArea = require('../areas/remember/RememberArea')
const StateArea = require('../areas/common/StateArea')
const { getGlobalResourceManager } = require('../../resource')
const CognitionManager = require('../../cognition/CognitionManager')
const logger = require('../../../utils/logger')

/**
 * 记忆保存命令 - 基于认知体系
 * 使用 CognitionManager 保存角色专属记忆
 * 使用Area架构组装输出
 */
class RememberCommand extends BasePouchCommand {
  constructor () {
    super()
    this.resourceManager = getGlobalResourceManager()
    this.cognitionManager = new CognitionManager(this.resourceManager)
  }

  /**
   * 组装Areas
   */
  async assembleAreas(args) {
    // 解析参数：role 和 engrams数组
    const { role, engrams } = this.parseArgs(args)

    if (!role || !engrams) {
      // 错误提示Area
      const errorArea = new RememberArea([], null)
      errorArea.render = async () => this.getUsageHelp()
      this.registerArea(errorArea)
      return
    }

    try {
      logger.step('🧠 [RememberCommand] 开始批量记忆保存流程')
      logger.info(`📝 [RememberCommand] 批量保存 ${engrams.length} 个Engram`)
      
      // 使用 CognitionManager 批量保存记忆
      await this.cognitionManager.remember(role, engrams)
      logger.success('✅ [RememberCommand] 批量记忆保存完成')
      
      // 注册RememberArea
      const rememberArea = new RememberArea(engrams, role)
      this.registerArea(rememberArea)
      
      // 注册StateArea
      const stateArea = new StateArea('remember_completed', {
        role,
        count: engrams.length
      })
      this.registerArea(stateArea)
      
    } catch (error) {
      logger.error(`❌ [RememberCommand] 记忆保存失败: ${error.message}`)
      logger.debug(`🐛 [RememberCommand] 错误堆栈: ${error.stack}`)
      
      // 错误Area
      const errorArea = new RememberArea([], null)
      errorArea.render = async () => `❌ 记忆保存失败：${error.message}

💡 **可能的原因**：
- 角色ID不正确
- 记忆内容格式问题
- 认知系统初始化失败

🔧 **建议操作**：
1. 检查角色ID是否正确
2. 验证记忆格式是否符合要求
3. 重试保存操作`
      this.registerArea(errorArea)
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