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
      case 'synthesize':
        return this._synthesize(args)
      case 'growup':
        // 向后兼容：growup 已重命名为 synthesize
        return this._synthesize(args)
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
      // 新增：学习循环操作
      case 'reflect':
        return this._reflect(args)
      case 'realize':
        return this._realize(args)
      case 'master':
        return this._master(args)
      case 'forget':
        return this._forget(args)
      case 'skill':
        return this._skill(args)
      // 新增：个体生命周期
      case 'retire':
        return this._retire(args)
      case 'die':
        return this._die(args)
      case 'rehire':
        return this._rehire(args)
      case 'train':
        return this._train(args)
      // 新增：组织管理
      case 'charter':
        return this._charter(args)
      case 'dissolve':
        return this._dissolve(args)
      // 新增：职位管理
      case 'charge':
        return this._charge(args)
      case 'require':
        return this._require(args)
      case 'abolish':
        return this._abolish(args)
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
    return this.bridge.plan(args.source, args.id, args.after, args.fallback)
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

  async _synthesize (args) {
    if (!args.name) throw new Error('name is required for synthesize operation')
    return this.bridge.synthesize(args.name, args.source, args.type, args.role)
  }

  // 向后兼容：保留 _growup 方法
  async _growup (args) {
    return this._synthesize(args)
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

  // ---- 学习循环操作 ----

  async _reflect (args) {
    if (!args.encounters) throw new Error('encounters is required for reflect')
    return this.bridge.reflect(args.encounters, args.experience, args.id)
  }

  async _realize (args) {
    if (!args.experiences) throw new Error('experiences is required for realize')
    return this.bridge.realize(args.experiences, args.principle, args.id)
  }

  async _master (args) {
    if (!args.procedure) throw new Error('procedure is required for master')
    return this.bridge.master(args.procedure, args.id, args.experiences)
  }

  async _forget (args) {
    if (!args.nodeId) throw new Error('nodeId is required for forget')
    return this.bridge.forget(args.nodeId)
  }

  async _skill (args) {
    if (!args.locator) throw new Error('locator is required for skill')
    return this.bridge.skill(args.locator)
  }

  // ---- 个体生命周期 ----

  async _retire (args) {
    if (!args.individual) throw new Error('individual is required for retire')
    return this.bridge.retire(args.individual)
  }

  async _die (args) {
    if (!args.individual) throw new Error('individual is required for die')
    return this.bridge.die(args.individual)
  }

  async _rehire (args) {
    if (!args.individual) throw new Error('individual is required for rehire')
    return this.bridge.rehire(args.individual)
  }

  async _train (args) {
    if (!args.individual) throw new Error('individual is required for train')
    if (!args.skillId) throw new Error('skillId is required for train')
    return this.bridge.train(args.individual, args.skillId, args.content)
  }

  // ---- 组织管理 ----

  async _charter (args) {
    if (!args.org) throw new Error('org is required for charter')
    if (!args.content) throw new Error('content is required for charter')
    return this.bridge.charter(args.org, args.content)
  }

  async _dissolve (args) {
    if (!args.org) throw new Error('org is required for dissolve')
    return this.bridge.dissolve(args.org)
  }

  // ---- 职位管理 ----

  async _charge (args) {
    if (!args.position) throw new Error('position is required for charge')
    if (!args.content) throw new Error('content is required for charge')
    return this.bridge.charge(args.position, args.content)
  }

  async _require (args) {
    if (!args.position) throw new Error('position is required for require')
    if (!args.skill) throw new Error('skill is required for require')
    return this.bridge.require(args.position, args.skill)
  }

  async _abolish (args) {
    if (!args.position) throw new Error('position is required for abolish')
    return this.bridge.abolish(args.position)
  }

  /**
   * 检查指定角色是否为 V2 角色
   */
  async isV2Role (roleId) {
    return this.bridge.isV2Role(roleId)
  }
}

module.exports = { RolexActionDispatcher }
