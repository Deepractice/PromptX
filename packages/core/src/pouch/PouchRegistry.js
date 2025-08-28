/**
 * 锦囊命令注册器
 * 负责管理和注册所有锦囊命令
 */
class PouchRegistry {
  constructor () {
    this.commands = new Map()
  }

  /**
   * 注册锦囊命令
   * @param {string} name - 命令名称
   * @param {BasePouchCommand} command - 命令实例
   */
  register (name, command) {
    if (!name || typeof name !== 'string') {
      throw new Error('命令名称必须是非空字符串')
    }

    if (!command || typeof command.execute !== 'function') {
      throw new Error('命令必须实现 execute 方法')
    }

    this.commands.set(name.toLowerCase(), command)
  }

  /**
   * 获取锦囊命令
   * @param {string} name - 命令名称
   * @returns {BasePouchCommand} 命令实例
   */
  get (name) {
    return this.commands.get(name.toLowerCase())
  }

  /**
   * 列出所有已注册的命令
   * @returns {string[]} 命令名称列表
   */
  list () {
    return Array.from(this.commands.keys())
  }

  /**
   * 验证命令是否存在
   * @param {string} name - 命令名称
   * @returns {boolean} 是否存在
   */
  validate (name) {
    return this.commands.has(name.toLowerCase())
  }

  /**
   * 获取命令详情
   * @returns {Object[]} 命令详情列表
   */
  getCommandDetails () {
    const details = []

    for (const [name, command] of this.commands) {
      details.push({
        name,
        purpose: command.getPurpose ? command.getPurpose() : '未定义',
        className: command.constructor.name
      })
    }

    return details
  }

  /**
   * 清空注册器
   */
  clear () {
    this.commands.clear()
  }

  /**
   * 批量注册命令
   * @param {Object} commandMap - 命令映射对象
   */
  registerBatch (commandMap) {
    for (const [name, CommandClass] of Object.entries(commandMap)) {
      if (typeof CommandClass === 'function') {
        this.register(name.toLowerCase(), new CommandClass())
      }
    }
  }
}

module.exports = PouchRegistry
