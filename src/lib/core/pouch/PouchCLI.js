const PouchStateMachine = require('./state/PouchStateMachine')
const PouchRegistry = require('./PouchRegistry')
const commands = require('./commands')
const { COMMANDS } = require('../../../constants')
const logger = require('../../utils/logger')

/**
 * 锦囊CLI主入口
 * 提供命令行接口和统一的执行入口
 */
class PouchCLI {
  constructor () {
    this.stateMachine = new PouchStateMachine()
    this.registry = new PouchRegistry()
    this.initialized = false
  }

  /**
   * 初始化CLI
   */
  async initialize () {
    if (this.initialized) {
      return
    }

    // 批量注册所有命令
    this.registry.registerBatch({
      init: commands.InitCommand,
      welcome: commands.WelcomeCommand,
      action: commands.ActionCommand,
      learn: commands.LearnCommand,
      recall: commands.RecallCommand,
      remember: commands.RememberCommand,
      think: commands.ThinkCommand,
      toolx: commands.ToolCommand
    })

    // 将命令注册到状态机
    for (const name of this.registry.list()) {
      const command = this.registry.get(name)
      this.stateMachine.registerCommand(name, command)
    }

    // 加载历史状态
    await this.stateMachine.loadState()

    this.initialized = true
  }

  /**
   * 执行命令
   * @param {string} commandName - 命令名称
   * @param {Array} args - 命令参数
   * @param {boolean} silent - 静默模式，不输出到console（用于MCP）
   * @returns {Promise<PouchOutput>} 执行结果
   */
  async execute (commandName, args = [], silent = false) {
    // 确保已初始化
    if (!this.initialized) {
      await this.initialize()
    }

    // 验证命令是否存在
    if (!this.registry.validate(commandName)) {
      throw new Error(`未知命令: ${commandName}\n使用 '${COMMANDS.HELP}' 查看可用命令`)
    }

    try {
      // 通过状态机执行命令
      const result = await this.stateMachine.transition(commandName, args)

      // 只在非静默模式下输出（避免干扰MCP协议）
      if (!silent) {
        // 如果结果有 toString 方法，打印人类可读格式
        if (result && result.toString && typeof result.toString === 'function') {
          logger.log(result.toString())
        } else {
          logger.log(JSON.stringify(result, null, 2))
        }
      }

      return result
    } catch (error) {
      // 错误输出始终使用stderr，不干扰MCP协议
      if (!silent) {
        logger.error(`执行命令出错: ${error.message}`)
      }
      throw error
    }
  }

  /**
   * 获取帮助信息
   * @returns {string} 帮助文本
   */
  getHelp () {
    const commands = this.registry.getCommandDetails()
    const currentState = this.stateMachine.getCurrentState()
    const availableTransitions = this.stateMachine.getAvailableTransitions()

    let help = `
🎯 PromptX 锦囊系统帮助
========================

当前状态: ${currentState}
可用转换: ${availableTransitions.join(', ')}

📋 可用命令:
`

    for (const cmd of commands) {
      help += `\n  ${cmd.name.padEnd(12)} - ${cmd.purpose}`
    }

    help += `

💡 使用示例:
        ${COMMANDS.INIT}              # 初始化工作环境
        ${COMMANDS.WELCOME}           # 发现可用角色
        ${COMMANDS.ACTION} copywriter # 激活文案专家
        ${COMMANDS.LEARN} scrum       # 学习敏捷知识
        ${COMMANDS.RECALL} frontend   # 检索前端记忆

🔄 PATEOAS 导航:
每个命令执行后都会提供下一步的建议操作，
按照提示即可完成完整的工作流程。

📚 更多信息请访问: https://github.com/yourusername/promptx
`

    return help
  }

  /**
   * 获取当前状态信息
   * @returns {StateContext} 状态上下文
   */
  getStatus () {
    return {
      currentState: this.stateMachine.getCurrentState(),
      availableCommands: this.registry.list(),
      availableTransitions: this.stateMachine.getAvailableTransitions(),
      context: this.stateMachine.context,
      initialized: this.initialized
    }
  }

  /**
   * 解析命令行输入
   * @param {string} input - 用户输入
   * @returns {Object} 解析结果
   */
  parseCommand (input) {
    const parts = input.trim().split(/\s+/)
    const command = parts[0]
    const args = parts.slice(1)

    return {
      command,
      args
    }
  }

  /**
   * 运行交互式CLI
   */
  async runInteractive () {
    logger.info('🎯 欢迎使用 PromptX 锦囊系统！')
    logger.info('输入 "help" 查看帮助，"exit" 退出\n')

    const readline = require('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'promptx> '
    })

    rl.prompt()

    rl.on('line', async (line) => {
      const input = line.trim()

      if (input === 'exit' || input === 'quit') {
        logger.info('再见！')
        rl.close()
        return
      }

      if (input === 'help') {
        logger.info(this.getHelp())
      } else if (input === 'status') {
        logger.info(JSON.stringify(this.getStatus(), null, 2))
      } else if (input) {
        const { command, args } = this.parseCommand(input)
        try {
          await this.execute(command, args)
        } catch (error) {
          logger.error(error.message)
        }
      }

      rl.prompt()
    })

    rl.on('close', () => {
      process.exit(0)
    })
  }
}

module.exports = PouchCLI
