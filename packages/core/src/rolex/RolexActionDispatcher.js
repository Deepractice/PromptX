const { getRolexBridge } = require('./RolexBridge')
const logger = require('@promptx/logger')

/**
 * RolexActionDispatcher - 操作路由
 *
 * 将 MCP action 工具的 operation 参数映射到 RolexBridge 的对应方法。
 * 负责参数校验和错误处理。
 */
class RolexActionDispatcher {
  constructor () {
    this.bridge = getRolexBridge()
  }

  /**
   * 分发操作到对应的 RolexBridge 方法
   * @param {string} operation - 操作类型
   * @param {object} args - 操作参数
   * @returns {Promise<object>} 操作结果
   */
  async dispatch (operation, args = {}) {
    logger.info(`[RolexActionDispatcher] Dispatching: ${operation}`)

    switch (operation) {
      case 'activate':
        return this._activate(args)
      case 'born':
        return this._born(args)
      case 'identity':
        return this._identity(args)
      case 'want':
        return this._want(args)
      case 'plan':
        return this._plan(args)
      case 'todo':
        return this._todo(args)
      case 'finish':
        return this._finish(args)
      case 'achieve':
        return this._achieve(args)
      case 'abandon':
        return this._abandon(args)
      case 'focus':
        return this._focus(args)
      case 'growup':
        return this._growup(args)
      case 'found':
        return this._found(args)
      case 'establish':
        return this._establish(args)
      case 'hire':
        return this._hire(args)
      case 'fire':
        return this._fire(args)
      case 'appoint':
        return this._appoint(args)
      case 'dismiss':
        return this._dismiss(args)
      case 'directory':
        return this._directory(args)
      default:
        throw new Error(`Unknown RoleX operation: ${operation}`)
    }
  }

  async _activate (args) {
    if (!args.role) throw new Error('role is required for activate operation')
    return this.bridge.activate(args.role)
  }

  async _born (args) {
    if (!args.name) throw new Error('name is required for born operation')
    return this.bridge.born(args.name, args.source)
  }

  async _identity (args) {
    return this.bridge.identity(args.role)
  }

  async _want (args) {
    if (!args.name) throw new Error('name is required for want operation')
    return this.bridge.want(args.name, args.source, {
      testable: args.testable
    })
  }

  async _plan (args) {
    return this.bridge.plan(args.source)
  }

  async _todo (args) {
    if (!args.name) throw new Error('name is required for todo operation')
    return this.bridge.todo(args.name, args.source, {
      testable: args.testable
    })
  }

  async _finish (args) {
    return this.bridge.finish(args.name)
  }

  async _achieve (args) {
    return this.bridge.achieve(args.experience)
  }

  async _abandon (args) {
    return this.bridge.abandon(args.experience)
  }

  async _focus (args) {
    return this.bridge.focus(args.name)
  }

  async _growup (args) {
    if (!args.name) throw new Error('name is required for growup operation')
    return this.bridge.growup(args.name, args.source, args.type)
  }

  async _found (args) {
    if (!args.name) throw new Error('name is required for found')
    return this.bridge.found(args.name, args.source, args.parent)
  }

  async _establish (args) {
    if (!args.name) throw new Error('name is required for establish')
    if (!args.source) throw new Error('source is required for establish')
    if (!args.org) throw new Error('org is required for establish')
    return this.bridge.establish(args.name, args.source, args.org)
  }

  async _hire (args) {
    if (!args.name) throw new Error('name is required for hire')
    if (!args.org) throw new Error('org is required for hire')
    return this.bridge.hire(args.name, args.org)
  }

  async _fire (args) {
    if (!args.name) throw new Error('name is required for fire')
    if (!args.org) throw new Error('org is required for fire')
    return this.bridge.fire(args.name, args.org)
  }

  async _appoint (args) {
    if (!args.name) throw new Error('name is required for appoint')
    if (!args.position) throw new Error('position is required for appoint')
    if (!args.org) throw new Error('org is required for appoint')
    return this.bridge.appoint(args.name, args.position, args.org)
  }

  async _dismiss (args) {
    if (!args.name) throw new Error('name is required for dismiss')
    if (!args.org) throw new Error('org is required for dismiss')
    return this.bridge.dismiss(args.name, args.org)
  }

  async _directory (args) {
    return this.bridge.directory()
  }

  /**
   * 检查指定角色是否为 V2 角色
   */
  async isV2Role (roleId) {
    return this.bridge.isV2Role(roleId)
  }
}

module.exports = { RolexActionDispatcher }
