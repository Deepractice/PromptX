const path = require('path')
const fs = require('fs-extra')
const os = require('os')
const logger = require('@promptx/logger')

/**
 * RolexBridge - 核心桥接模块
 *
 * 单例模式，懒初始化。负责管理 RoleX V2 角色系统的生命周期。
 * 由于 @promptx/core 是 CommonJS，而 RoleX 是 ESM，
 * 所有 RoleX 导入必须使用 await import() 动态导入。
 */
class RolexBridge {
  constructor () {
    this.platform = null
    this.rolex = null
    this.initialized = false
    this.initializing = null
    this.currentRoleName = null
    this.rolexRoot = path.join(os.homedir(), '.promptx', 'rolex')
  }

  /**
   * 懒初始化 - 首次使用时动态导入 RoleX ESM 模块
   */
  async ensureInitialized () {
    if (this.initialized) return
    if (this.initializing) return this.initializing

    this.initializing = this._doInit()
    await this.initializing
    this.initializing = null
  }

  async _doInit () {
    try {
      logger.info('[RolexBridge] Initializing RoleX...')
      await fs.ensureDir(this.rolexRoot)

      const { LocalPlatform } = await import('@rolexjs/local-platform')
      const { Rolex } = await import('@rolexjs/core')

      this.platform = new LocalPlatform({ root: this.rolexRoot })
      this.rolex = new Rolex(this.platform)

      // Bootstrap: 确保种子角色（Nuwa）存在
      await this.rolex.bootstrap()

      this.initialized = true
      logger.info('[RolexBridge] RoleX initialized successfully')
    } catch (error) {
      logger.warn('[RolexBridge] RoleX initialization failed:', error.message)
      throw error
    }
  }

  /**
   * 检查指定角色是否为 V2 角色
   * 通过检查 ~/.promptx/rolex/<roleId>/identity/persona.identity.feature 是否存在
   */
  async isV2Role (roleId) {
    const featurePath = path.join(
      this.rolexRoot, roleId, 'identity', 'persona.identity.feature'
    )
    return fs.pathExists(featurePath)
  }

  /**
   * 激活 V2 角色 - 返回渲染后的 Gherkin 文本
   */
  async activate (roleId) {
    await this.ensureInitialized()
    const result = await this.rolex.identity(roleId)
    this.currentRoleName = roleId
    return result
  }

  /**
   * 创建新角色 (born)
   */
  async born (name, source) {
    await this.ensureInitialized()
    return this.rolex.born(name, source)
  }

  /**
   * 查看角色身份信息
   */
  async identity (roleId) {
    await this.ensureInitialized()
    return this.rolex.identity(roleId || this.currentRoleName)
  }

  /**
   * 创建目标 (want)
   */
  async want (name, source, options = {}) {
    await this.ensureInitialized()
    const role = this.currentRoleName
    if (!role) throw new Error('No active V2 role. Activate a role first.')
    return this.rolex.want(role, name, source, options)
  }

  /**
   * 制定计划 (plan)
   */
  async plan () {
    await this.ensureInitialized()
    const role = this.currentRoleName
    if (!role) throw new Error('No active V2 role. Activate a role first.')
    return this.rolex.plan(role)
  }

  /**
   * 创建任务 (todo)
   */
  async todo (name, source, options = {}) {
    await this.ensureInitialized()
    const role = this.currentRoleName
    if (!role) throw new Error('No active V2 role. Activate a role first.')
    return this.rolex.todo(role, name, source, options)
  }

  /**
   * 完成任务 (finish)
   */
  async finish () {
    await this.ensureInitialized()
    const role = this.currentRoleName
    if (!role) throw new Error('No active V2 role. Activate a role first.')
    return this.rolex.finish(role)
  }

  /**
   * 达成目标 (achieve)
   */
  async achieve (experience) {
    await this.ensureInitialized()
    const role = this.currentRoleName
    if (!role) throw new Error('No active V2 role. Activate a role first.')
    return this.rolex.achieve(role, experience)
  }

  /**
   * 放弃目标 (abandon)
   */
  async abandon (experience) {
    await this.ensureInitialized()
    const role = this.currentRoleName
    if (!role) throw new Error('No active V2 role. Activate a role first.')
    return this.rolex.abandon(role, experience)
  }

  /**
   * 聚焦查看 (focus)
   */
  async focus (name) {
    await this.ensureInitialized()
    const role = this.currentRoleName
    if (!role) throw new Error('No active V2 role. Activate a role first.')
    return this.rolex.focus(role, name)
  }

  /**
   * 成长 (growup)
   */
  async growup (name, source, type) {
    await this.ensureInitialized()
    const role = this.currentRoleName
    if (!role) throw new Error('No active V2 role. Activate a role first.')
    return this.rolex.growup(role, name, source, type)
  }

  /**
   * 列出所有 V2 角色（供 discover 使用）
   */
  async listV2Roles () {
    try {
      await this.ensureInitialized()
      const entries = await fs.readdir(this.rolexRoot, { withFileTypes: true })
      const roles = []

      for (const entry of entries) {
        if (!entry.isDirectory()) continue
        const featurePath = path.join(
          this.rolexRoot, entry.name, 'identity', 'persona.identity.feature'
        )
        if (await fs.pathExists(featurePath)) {
          roles.push({
            id: entry.name,
            name: entry.name,
            source: 'rolex',
            version: 'v2',
            protocol: 'role'
          })
        }
      }

      return roles
    } catch (error) {
      logger.warn('[RolexBridge] Failed to list V2 roles:', error.message)
      return []
    }
  }
}

// 单例
let instance = null

function getRolexBridge () {
  if (!instance) {
    instance = new RolexBridge()
  }
  return instance
}

module.exports = { RolexBridge, getRolexBridge }
