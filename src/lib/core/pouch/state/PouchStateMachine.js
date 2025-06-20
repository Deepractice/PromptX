const fs = require('fs-extra')
const path = require('path')

/**
 * 锦囊状态机管理器
 * 负责管理锦囊之间的状态转换
 */
class PouchStateMachine {
  constructor () {
    this.currentState = 'initial'
    this.stateHistory = []
    this.context = {
      currentPouch: '',
      history: [],
      userProfile: {},
      sessionData: {},
      domainContext: {}
    }
    this.commands = new Map()
  }

  /**
   * 注册锦囊命令
   * @param {string} name - 命令名称
   * @param {BasePouchCommand} command - 命令实例
   */
  registerCommand (name, command) {
    this.commands.set(name, command)
  }

  /**
   * 执行状态转换
   * @param {string} commandName - 命令名称
   * @param {Array} args - 命令参数
   * @returns {Promise<PouchOutput>} 执行结果
   */
  async transition (commandName, args = []) {
    // 获取命令对应的锦囊
    const command = this.commands.get(commandName)
    if (!command) {
      throw new Error(`未找到命令: ${commandName}`)
    }

    // 记录历史
    this.stateHistory.push({
      from: this.currentState,
      command: commandName,
      timestamp: new Date().toISOString(),
      args
    })

    // 更新上下文
    this.context.currentPouch = commandName
    this.context.history = this.stateHistory.map(h => h.command || h.to)

    // 设置命令上下文
    command.setContext(this.context)

    // 执行命令
    const result = await command.execute(args)

    // 根据PATEOAS导航更新状态
    if (result && result.pateoas && result.pateoas.currentState) {
      this.currentState = result.pateoas.currentState
    }

    // 保存状态
    await this.saveState()

    return result
  }

  /**
   * 获取当前状态
   * @returns {string} 当前状态
   */
  getCurrentState () {
    return this.currentState
  }

  /**
   * 获取可用的状态转换
   * @returns {string[]} 可转换的状态列表
   */
  getAvailableTransitions () {
    const transitions = {
      initial: ['init', 'welcome'],
      initialized: ['welcome', 'action', 'learn'],
      discovering: ['action', 'learn', 'init'],
      activated: ['learn', 'recall', 'welcome'],
      learned: ['action', 'recall', 'welcome'],
      recalled: ['action', 'learn', 'remember']
    }

    // 根据当前状态的前缀匹配
    for (const [statePrefix, availableStates] of Object.entries(transitions)) {
      if (this.currentState.startsWith(statePrefix)) {
        return availableStates
      }
    }

    // 默认可转换状态
    return ['welcome', 'init']
  }

  /**
   * 保存状态到文件
   */
  async saveState () {
    const { getDirectoryService } = require('../../../utils/DirectoryService')
    const directoryService = getDirectoryService()
    const promptxDir = await directoryService.getPromptXDirectory()
    const configPath = path.join(promptxDir, 'pouch.json')

    try {
      // 确保 .promptx 目录存在
      await fs.ensureDir(promptxDir)

      let config = {}
      if (await fs.pathExists(configPath)) {
        config = await fs.readJson(configPath)
      }

      config.currentState = this.currentState
      config.stateHistory = this.stateHistory.slice(-50) // 只保留最近50条记录
      config.lastUpdated = new Date().toISOString()

      await fs.writeJson(configPath, config, { spaces: 2 })
    } catch (error) {
      console.error('保存状态失败:', error)
    }
  }

  /**
   * 从文件加载状态
   */
  async loadState () {
    const { getDirectoryService } = require('../../../utils/DirectoryService')
    const directoryService = getDirectoryService()
    const promptxDir = await directoryService.getPromptXDirectory()
    const configPath = path.join(promptxDir, 'pouch.json')

    try {
      if (await fs.pathExists(configPath)) {
        const config = await fs.readJson(configPath)

        if (config.currentState) {
          this.currentState = config.currentState
        }

        if (config.stateHistory) {
          this.stateHistory = config.stateHistory
        }
      }
    } catch (error) {
      console.error('加载状态失败:', error)
    }
  }

  /**
   * 重置状态机
   */
  reset () {
    this.currentState = 'initial'
    this.stateHistory = []
    this.context = {
      currentPouch: '',
      history: [],
      userProfile: {},
      sessionData: {},
      domainContext: {}
    }
  }
}

module.exports = PouchStateMachine
