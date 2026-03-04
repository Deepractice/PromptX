const path = require('path')
const fs = require('fs-extra')
const os = require('os')
const logger = require('@promptx/logger')

/**
 * 从 Gherkin Feature 文件内容中提取 Feature 名称
 */
function extractFeatureName (content) {
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.startsWith('Feature:')) {
      return trimmed.replace(/^Feature:\s*/, '').trim()
    }
  }
  return ''
}

/**
 * 从 Gherkin Feature 文件内容中提取描述（Feature 名称后、第一个 Scenario 前的文本）
 */
function extractFeatureDescription (content) {
  const lines = content.split('\n')
  let inFeature = false
  const descLines = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('Feature:')) { inFeature = true; continue }
    if (inFeature) {
      if (/^(Scenario|Background|Given|When|Then|And|But|@|\|)/.test(trimmed)) break
      if (trimmed && !trimmed.startsWith('#')) descLines.push(trimmed)
    }
  }
  return descLines.join(' ').trim()
}

/**
 * RolexBridge - 核心桥接模块
 *
 * 单例模式，懒初始化。负责管理 RoleX V2 角色系统的生命周期。
 * 由于 @promptx/core 是 CommonJS，而 RoleX 是 ESM，
 * 所有 RoleX 导入必须使用 await import() 动态导入。
 */
class RolexBridge {
  static SEED_ROLES = ['nuwa', 'waiter', 'jiangziya']

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

      logger.info('[RolexBridge] Importing @rolexjs/local-platform...')
      const { localPlatform } = await import('@rolexjs/local-platform')
      logger.info('[RolexBridge] Importing rolexjs...')
      const { Rolex, renderState } = await import('rolexjs')

      // RoleX 1.1.0: 使用 renderState 替代 renderFeature/renderFeatures
      this._renderFeature = (feature) => renderState({ features: [feature] })
      this._renderFeatures = (features) => renderState({ features })

      // 版本检测：rolexjs 更新时强制重建 SEED 角色（在创建 platform 之前）
      logger.info('[RolexBridge] Syncing SEED roles...')
      await this._syncSeedRoles()

      // 创建 platform（在 SEED 同步之后，确保读到最新的文件状态）
      // RoleX 1.1.0: localPlatform 是工厂函数，不是构造函数
      logger.info('[RolexBridge] Creating platform...')
      this.platform = localPlatform(this.rolexRoot)
      logger.info('[RolexBridge] Creating Rolex instance...')
      this.rolex = new Rolex(this.platform)

      // RoleX 1.1.0: 不再需要 bootstrap，SEED 角色通过 _syncSeedRoles 管理

      this.initialized = true
      logger.info('[RolexBridge] RoleX initialized successfully')
    } catch (error) {
      logger.error('[RolexBridge] RoleX initialization failed:', error)
      throw error
    }
  }

  /**
   * 同步 SEED 角色版本标记
   * RoleX 1.1.0: 不再自动管理 SEED 角色，只记录版本
   */
  async _syncSeedRoles () {
    const versionFile = path.join(this.rolexRoot, '.seed-version')

    // 读取 rolexjs 当前版本
    let currentVersion = 'unknown'
    try {
      const rolexjsDir = path.dirname(require.resolve('rolexjs'))
      const pkg = await fs.readJson(path.join(rolexjsDir, '..', 'package.json'))
      currentVersion = pkg.version
    } catch {
      currentVersion = Date.now().toString()
    }

    // 对比已记录的版本
    let savedVersion = ''
    try {
      savedVersion = (await fs.readFile(versionFile, 'utf-8')).trim()
    } catch {
      // 无版本文件 = 首次运行
    }

    if (savedVersion !== currentVersion) {
      logger.info(`[RolexBridge] RoleX version: ${savedVersion || 'none'} → ${currentVersion}`)
      await fs.writeFile(versionFile, currentVersion)
    }
  }

  /**
   * 检查指定角色是否为 V2 角色
   * 通过检查 ~/.promptx/rolex/roles/<roleId>/identity/persona.identity.feature 是否存在
   */
  async isV2Role (roleId) {
    if (process.env.PROMPTX_ENABLE_V2 === '0') return false
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
   * 综合 (synthesize) - 从经验中学习 (a posteriori learning)
   * 映射到 rolex.synthesize()
   * @param {string} name - 知识名称
   * @param {string} source - Gherkin 源码
   * @param {string} type - 类型 (knowledge/experience/voice)
   * @param {string} [targetRole] - 目标角色，如果不指定则使用当前激活角色
   */
  async synthesize (name, source, type, targetRole) {
    await this.ensureInitialized()
    const role = targetRole || this._requireActiveRole()
    const feature = this.rolex.teach(role, type, name, source)
    return this._renderFeature(feature)
  }

  /**
   * @deprecated 使用 synthesize() 替代。growup 已重命名为 synthesize 以符合康德认识论语义
   */
  async growup (name, source, type, targetRole) {
    return this.synthesize(name, source, type, targetRole)
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
    if (process.env.PROMPTX_ENABLE_V2 === '0') return []
    try {
      await this.ensureInitialized()

      // RoleX 1.1.0: 从数据库查询所有 individuals
      // 使用 platform 的 runtime 来查询图数据库
      const runtime = this.platform.runtime
      const roles = []

      // 遍历所有节点，查找 type 为 'individual' 的节点
      runtime.forEachNode((node, attrs) => {
        if (attrs.type === 'individual') {
          // 获取 identity 子节点来提取角色信息
          let name = attrs.id || 'Unknown'
          let description = ''

          // 尝试从 identity 特征中提取信息
          try {
            const identityNode = runtime.findNode((n, a) =>
              a.type === 'identity' && runtime.hasEdge(attrs.id, n)
            )
            if (identityNode) {
              const identityAttrs = runtime.getNodeAttributes(identityNode)
              if (identityAttrs.source) {
                name = extractFeatureName(identityAttrs.source) || name
                description = extractFeatureDescription(identityAttrs.source)
              }
            }
          } catch { /* ignore */ }

          // 判断是否为 SEED 角色
          const isSeed = RolexBridge.SEED_ROLES.includes(attrs.id)

          roles.push({
            id: attrs.id,
            name,
            description,
            source: isSeed ? 'system' : 'rolex',
            version: 'v2',
            protocol: 'role'
          })
        }
      })

      logger.info(`[RolexBridge] Found ${roles.length} V2 roles from database`)
      return roles
    } catch (error) {
      logger.error('[RolexBridge] Failed to list V2 roles:', error)
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
