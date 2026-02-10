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
    this.rolexRoot = path.join(os.homedir(), '.rolex')
    this._renderFeature = null
    this._renderFeatures = null
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
      const { Rolex, bootstrap, renderFeature, renderFeatures } = await import('rolexjs')

      this.platform = new LocalPlatform(this.rolexRoot)
      this.rolex = new Rolex(this.platform)
      this._renderFeature = renderFeature
      this._renderFeatures = renderFeatures

      // Bootstrap: 确保种子角色（Nuwa）存在
      bootstrap(this.platform)

      this.initialized = true
      logger.info('[RolexBridge] RoleX initialized successfully')
    } catch (error) {
      logger.warn('[RolexBridge] RoleX initialization failed:', error.message)
      throw error
    }
  }

  /**
   * 检查指定角色是否为 V2 角色
   * 通过检查 ~/.promptx/rolex/roles/<roleId>/identity/persona.identity.feature 是否存在
   */
  async isV2Role (roleId) {
    await this.ensureInitialized()
    const featurePath = path.join(
      this.rolexRoot, 'roles', roleId, 'identity', 'persona.identity.feature'
    )
    return fs.pathExists(featurePath)
  }

  /**
   * 激活 V2 角色 - 返回渲染后的 Gherkin 文本
   */
  async activate (roleId) {
    await this.ensureInitialized()
    const features = this.rolex.role(roleId).identity()
    this.currentRoleName = roleId
    return this._renderFeatures(features)
  }

  /**
   * 创建新角色 (born)
   */
  async born (name, source) {
    await this.ensureInitialized()
    const feature = this.rolex.born(name, source)
    return this._renderFeature(feature)
  }

  /**
   * 查看角色身份信息
   */
  async identity (roleId) {
    await this.ensureInitialized()
    const features = this.rolex.role(roleId || this.currentRoleName).identity()
    return this._renderFeatures(features)
  }

  /**
   * 创建目标 (want)
   */
  async want (name, source, options = {}) {
    await this.ensureInitialized()
    const role = this._requireActiveRole()
    return this.rolex.role(role).want(name, source, options.testable)
  }

  /**
   * 制定计划 (plan)
   */
  async plan (source) {
    await this.ensureInitialized()
    const role = this._requireActiveRole()
    return this.rolex.role(role).plan(source)
  }

  /**
   * 创建任务 (todo)
   */
  async todo (name, source, options = {}) {
    await this.ensureInitialized()
    const role = this._requireActiveRole()
    return this.rolex.role(role).todo(name, source, options.testable)
  }

  /**
   * 完成任务 (finish)
   */
  async finish (name) {
    await this.ensureInitialized()
    const role = this._requireActiveRole()
    this.rolex.role(role).finish(name)
    return `Task "${name}" finished.`
  }

  /**
   * 达成目标 (achieve)
   */
  async achieve (experience) {
    await this.ensureInitialized()
    const role = this._requireActiveRole()
    this.rolex.role(role).achieve(experience)
    return 'Goal achieved.'
  }

  /**
   * 放弃目标 (abandon)
   */
  async abandon (experience) {
    await this.ensureInitialized()
    const role = this._requireActiveRole()
    this.rolex.role(role).abandon(experience)
    return 'Goal abandoned.'
  }

  /**
   * 聚焦查看 (focus)
   */
  async focus (name) {
    await this.ensureInitialized()
    const role = this._requireActiveRole()
    return this.rolex.role(role).focus(name)
  }

  /**
   * 成长 (growup) - 映射到 rolex.teach()
   */
  async growup (name, source, type) {
    await this.ensureInitialized()
    const role = this._requireActiveRole()
    const feature = this.rolex.teach(role, type, name, source)
    return this._renderFeature(feature)
  }

  /**
   * 创建组织 (found)
   */
  async found (name, source, parent) {
    await this.ensureInitialized()
    this.rolex.found(name, source, parent)
    return `Organization "${name}" founded.`
  }

  /**
   * 创建职位 (establish)
   */
  async establish (positionName, source, orgName) {
    await this.ensureInitialized()
    this.rolex.establish(positionName, source, orgName)
    return `Position "${positionName}" established in "${orgName}".`
  }

  /**
   * 雇佣角色到组织 (hire)
   */
  async hire (roleName, orgName) {
    await this.ensureInitialized()
    const { Organization } = await import('rolexjs')
    const org = new Organization(this.platform, orgName)
    org.hire(roleName)
    return `Role "${roleName}" hired into "${orgName}".`
  }

  /**
   * 解雇角色 (fire)
   */
  async fire (roleName, orgName) {
    await this.ensureInitialized()
    const { Organization } = await import('rolexjs')
    const org = new Organization(this.platform, orgName)
    org.fire(roleName)
    return `Role "${roleName}" fired from "${orgName}".`
  }

  /**
   * 任命角色到职位 (appoint)
   */
  async appoint (roleName, positionName, orgName) {
    await this.ensureInitialized()
    const { Organization } = await import('rolexjs')
    const org = new Organization(this.platform, orgName)
    org.appoint(roleName, positionName)
    return `Role "${roleName}" appointed to "${positionName}".`
  }

  /**
   * 免职 (dismiss)
   */
  async dismiss (roleName, orgName) {
    await this.ensureInitialized()
    const { Organization } = await import('rolexjs')
    const org = new Organization(this.platform, orgName)
    org.dismiss(roleName)
    return `Role "${roleName}" dismissed.`
  }

  /**
   * 社会目录 (directory)
   */
  async directory () {
    await this.ensureInitialized()
    const dir = this.rolex.directory()
    return JSON.stringify(dir, null, 2)
  }

  /**
   * 列出所有 V2 角色（供 discover 使用）
   */
  async listV2Roles () {
    try {
      await this.ensureInitialized()
      const rolesDir = path.join(this.rolexRoot, 'roles')
      if (!await fs.pathExists(rolesDir)) return []
      const entries = await fs.readdir(rolesDir, { withFileTypes: true })
      const roles = []

      for (const entry of entries) {
        if (!entry.isDirectory()) continue
        const featurePath = path.join(
          rolesDir, entry.name, 'identity', 'persona.identity.feature'
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

  _requireActiveRole () {
    if (!this.currentRoleName) {
      throw new Error('No active V2 role. Activate a role first.')
    }
    return this.currentRoleName
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
