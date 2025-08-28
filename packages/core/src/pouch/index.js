/**
 * 锦囊框架 (PATEOAS Framework)
 * Prompt as the Engine of Application State
 *
 * 这是一个革命性的AI-First CLI框架，通过锦囊串联实现AI的状态管理。
 * 每个锦囊都是独立的专家知识单元，通过PATEOAS导航实现状态转换。
 */

const PouchCLI = require('./PouchCLI')
const PouchRegistry = require('./PouchRegistry')
const PouchStateMachine = require('./state/PouchStateMachine')
const BasePouchCommand = require('./BasePouchCommand')
const commands = require('./commands')

// 创建全局CLI实例
const cli = new PouchCLI()

module.exports = {
  // 主要导出
  PouchCLI,
  cli,

  // 框架组件
  PouchRegistry,
  PouchStateMachine,
  BasePouchCommand,

  // 内置命令
  commands,

  // 便捷方法
  execute: async (commandName, args) => {
    return await cli.execute(commandName, args)
  },

  help: () => {
    return cli.getHelp()
  },

  status: () => {
    return cli.getStatus()
  }
}
