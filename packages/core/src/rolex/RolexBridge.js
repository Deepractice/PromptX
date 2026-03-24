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
      const { Rolex } = await import('rolexjs')

      // 版本检测：rolexjs 更新时强制重建 SEED 角色（在创建 platform 之前）
      logger.info('[RolexBridge] Syncing SEED roles...')
      await this._syncSeedRoles()

      // 创建 platform（在 SEED 同步之后，确保读到最新的文件状态）
      // RoleX 1.1.0: localPlatform 是工厂函数，不是构造函数
      logger.info('[RolexBridge] Creating platform...')
      this.platform = localPlatform({
        dataDir: this.rolexRoot,
        bootstrap: ['npm:@rolexjs/genesis']  // 注册 Genesis 原型
      })
      logger.info('[RolexBridge] Creating Rolex instance...')
      // RoleX 1.1.0: 使用 Rolex.create() 而不是 new Rolex()
      this.rolex = await Rolex.create(this.platform)

      // RoleX 1.1.0: 调用 genesis() 初始化世界（首次运行时创建基础结构）
      logger.info('[RolexBridge] Running genesis...')
      await this.rolex.genesis()

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
  /**
   * 检查角色是否为 V2 角色
   * RoleX 1.1.0: 查询数据库而不是文件系统
   */
  async isV2Role (roleId) {
    if (process.env.PROMPTX_ENABLE_V2 === '0') return false
    try {
      await this.ensureInitialized()
      // 使用 census.list 查询数据库中是否存在该角色
      const censusResult = await this.rolex.direct('!census.list', { type: 'individual' })
      if (typeof censusResult === 'string' && censusResult) {
        const lines = censusResult.split('\n').filter(l => l.trim())
        for (const line of lines) {
          const match = line.match(/^([^\s(#]+)/)
          if (match && match[1] === roleId) {
            return true
          }
        }
      }
      return false
    } catch (error) {
      logger.warn('[RolexBridge] isV2Role check failed:', error)
      return false
    }
  }

  /**
   * 激活 V2 角色 - 返回渲染后的状态文本
   * RoleX 1.1.0: 使用 rolex.activate(roleId) 返回 Role 实例
   */
  async activate (roleId) {
    await this.ensureInitialized()
    const role = await this.rolex.activate(roleId)
    this.currentRoleName = roleId
    return role.project()
  }

  /**
   * 创建新角色 (born)
   * RoleX 1.1.0: 使用 rolex.direct('!individual.born', ...)
   */
  async born (name, source) {
    await this.ensureInitialized()
    await this.rolex.direct('!individual.born', { id: name, content: source })
    return `Individual "${name}" born.`
  }

  /**
   * 查看角色身份信息
   * RoleX 1.1.0: 使用 rolex.activate() + role.project()
   */
  async identity (roleId) {
    await this.ensureInitialized()
    const targetId = roleId || this.currentRoleName
    if (!targetId) throw new Error('No role specified')
    const role = await this.rolex.activate(targetId)
    return role.project()
  }

  /**
   * 创建目标 (want)
   * RoleX 1.1.0: role.want(goal, id)
   */
  async want (name, source, options = {}) {
    await this.ensureInitialized()
    const roleId = this._requireActiveRole()
    const role = await this.rolex.activate(roleId)
    return role.want(source, name)
  }

  /**
   * 制定计划 (plan)
   * RoleX 1.3.0: role.plan(plan, id, after, fallback)
   */
  async plan (source, id, after, fallback) {
    await this.ensureInitialized()
    const roleId = this._requireActiveRole()
    const role = await this.rolex.activate(roleId)
    return role.plan(source, id, after, fallback)
  }

  /**
   * 创建任务 (todo)
   * RoleX 1.1.0: role.todo(task, id)
   */
  async todo (name, source, options = {}) {
    await this.ensureInitialized()
    const roleId = this._requireActiveRole()
    const role = await this.rolex.activate(roleId)
    return role.todo(source, name)
  }

  /**
   * 完成任务 (finish)
   * RoleX 1.1.0: role.finish(task)
   */
  async finish (name) {
    await this.ensureInitialized()
    const roleId = this._requireActiveRole()
    const role = await this.rolex.activate(roleId)
    return role.finish(name)
  }

  /**
   * 达成目标/完成计划 (achieve → complete)
   * RoleX 1.1.0: role.complete()
   */
  async achieve (experience) {
    await this.ensureInitialized()
    const roleId = this._requireActiveRole()
    const role = await this.rolex.activate(roleId)
    return role.complete(undefined, experience)
  }

  /**
   * 放弃目标/计划 (abandon)
   * RoleX 1.1.0: role.abandon()
   */
  async abandon (experience) {
    await this.ensureInitialized()
    const roleId = this._requireActiveRole()
    const role = await this.rolex.activate(roleId)
    return role.abandon(undefined, experience)
  }

  /**
   * 聚焦查看 (focus)
   * RoleX 1.1.0: role.focus(goal)
   */
  async focus (name) {
    await this.ensureInitialized()
    const roleId = this._requireActiveRole()
    const role = await this.rolex.activate(roleId)
    return role.focus(name)
  }

  /**
   * 综合 (synthesize) - 向角色注入知识
   * RoleX 1.1.0: 使用 rolex.direct('!individual.teach', ...)
   * @param {string} name - 知识名称
   * @param {string} source - Gherkin 源码
   * @param {string} type - 类型 (knowledge/experience/voice)
   * @param {string} [targetRole] - 目标角色，如果不指定则使用当前激活角色
   */
  async synthesize (name, source, type, targetRole) {
    await this.ensureInitialized()
    const role = targetRole || this._requireActiveRole()
    await this.rolex.direct('!individual.teach', { individual: role, id: name, content: source })
    return `Knowledge "${name}" synthesized for "${role}".`
  }

  /**
   * @deprecated 使用 synthesize() 替代。growup 已重命名为 synthesize 以符合康德认识论语义
   */
  async growup (name, source, type, targetRole) {
    return this.synthesize(name, source, type, targetRole)
  }

  /**
   * 创建组织 (found)
   * RoleX 1.1.0: rolex.direct('!org.found', ...)
   */
  async found (name, source, parent) {
    await this.ensureInitialized()
    await this.rolex.direct('!org.found', { id: name, content: source })
    return `Organization "${name}" founded.`
  }

  /**
   * 创建职位 (establish)
   * RoleX 1.1.0: rolex.direct('!position.establish', ...)
   */
  async establish (positionName, source, orgName) {
    await this.ensureInitialized()
    await this.rolex.direct('!position.establish', { id: positionName, content: source })
    return `Position "${positionName}" established in "${orgName}".`
  }

  /**
   * 雇佣角色到组织 (hire)
   * RoleX 1.1.0: rolex.direct('!org.hire', ...)
   */
  async hire (roleName, orgName) {
    await this.ensureInitialized()
    await this.rolex.direct('!org.hire', { org: orgName, individual: roleName })
    return `Role "${roleName}" hired into "${orgName}".`
  }

  /**
   * 解雇角色 (fire)
   * RoleX 1.1.0: rolex.direct('!org.fire', ...)
   */
  async fire (roleName, orgName) {
    await this.ensureInitialized()
    await this.rolex.direct('!org.fire', { org: orgName, individual: roleName })
    return `Role "${roleName}" fired from "${orgName}".`
  }

  /**
   * 任命角色到职位 (appoint)
   * RoleX 1.1.0: rolex.direct('!position.appoint', ...)
   */
  async appoint (roleName, positionName, orgName) {
    await this.ensureInitialized()
    await this.rolex.direct('!position.appoint', { position: positionName, individual: roleName })
    return `Role "${roleName}" appointed to "${positionName}".`
  }

  /**
   * 免职 (dismiss)
   * RoleX 1.1.0: rolex.direct('!position.dismiss', ...)
   */
  async dismiss (roleName, orgName) {
    await this.ensureInitialized()
    await this.rolex.direct('!position.dismiss', { position: orgName, individual: roleName })
    return `Role "${roleName}" dismissed.`
  }

  /**
   * 社会目录 (directory)
   * RoleX 1.1.0: 使用 census.list 返回所有实体列表（字符串格式）
   * 返回结构化的 JSON 数据
   */
  async directory () {
    await this.ensureInitialized()
    const textOutput = await this.rolex.direct('!census.list')

    console.log('[RolexBridge] census.list raw output:')
    console.log(textOutput)
    console.log('[RolexBridge] census.list raw output END')

    // 解析文本输出为结构化数据
    return this._parseCensusOutput(textOutput)
  }

  /**
   * 解析 census.list 的文本输出
   * @private
   */
  _parseCensusOutput (text) {
    const result = {
      roles: [],
      organizations: []
    }

    if (!text || typeof text !== 'string') {
      return result
    }

    const lines = text.split('\n').filter(l => l.trim() && !l.includes('---') && !l.includes('📅') && !l.includes('📊') && !l.includes('Powered by'))

    let currentOrg = null

    for (const line of lines) {
      const trimmed = line.trim()

      // 跳过空行
      if (!trimmed) continue

      // 检测组织行（没有缩进，可能包含括号）
      if (!line.startsWith(' ')) {
        // 跳过 ─── unaffiliated ─── 等分隔行，将其下的角色视为无组织
        if (trimmed.includes('unaffiliated') || /^[─—-]{3,}/.test(trimmed)) {
          currentOrg = '__unaffiliated__'
          continue
        }
        // 这是一个组织名称
        currentOrg = trimmed
        if (!result.organizations.find(o => o.name === currentOrg)) {
          result.organizations.push({
            name: currentOrg,
            members: [],
            positions: []
          })
        }
      }
      // 检测缩进行（角色/个体成员）
      else if (line.startsWith('  ') && currentOrg) {
        const match = trimmed.match(/^([^\s—]+)(?:\s*\([^)]+\))?\s*—\s*(.+)$/)
        console.log('[_parseCensus] indented line:', JSON.stringify(trimmed), 'match:', match ? `name=${match[1]}, desc=${match[2]}` : 'NO MATCH')
        if (match) {
          const name = match[1].trim()
          const description = match[2].trim()

          // census.list 缩进行全部是个体（成员），不是职位定义
          // description 是该成员所任职的职位列表（逗号分隔）
          const positions = description.split(',').map(p => p.trim())

          // 添加到 roles 列表（unaffiliated 的角色 org 为空）
          const isUnaffiliated = currentOrg === '__unaffiliated__'
          result.roles.push({
            name: name,
            org: isUnaffiliated ? undefined : currentOrg,
            position: positions[0]
          })

          // 添加到组织的成员列表（unaffiliated 不添加）
          if (!isUnaffiliated) {
            const org = result.organizations.find(o => o.name === currentOrg)
            if (org) {
              org.members.push({
                name: name,
                position: positions[0]
              })
            }
          }
        }
      }
    }

    return result
  }

  /**
   * 反思经历 (reflect)
   * RoleX 1.1.0: role.reflect(encounters, experience)
   */
  async reflect (encounters, experience, id) {
    await this.ensureInitialized()
    const roleId = this._requireActiveRole()
    const role = await this.rolex.activate(roleId)
    return role.reflect(encounters, experience, id)
  }

  /**
   * 掌握原则 (realize)
   * RoleX 1.1.0: role.realize(experiences, principle)
   */
  async realize (experiences, principle, id) {
    await this.ensureInitialized()
    const roleId = this._requireActiveRole()
    const role = await this.rolex.activate(roleId)
    return role.realize(experiences, principle, id)
  }

  /**
   * 掌握程序/技能 (master)
   * RoleX 1.1.0: role.master(procedure, id, experiences)
   */
  async master (procedure, id, experiences) {
    await this.ensureInitialized()
    const roleId = this._requireActiveRole()
    const role = await this.rolex.activate(roleId)
    return role.master(procedure, id, experiences)
  }

  /**
   * 遗忘知识 (forget)
   * RoleX 1.1.0: role.forget(nodeId)
   */
  async forget (nodeId) {
    await this.ensureInitialized()
    const roleId = this._requireActiveRole()
    const role = await this.rolex.activate(roleId)
    return role.forget(nodeId)
  }

  /**
   * 加载技能 (skill)
   * RoleX 1.1.0: role.skill(locator)
   */
  async skill (locator) {
    await this.ensureInitialized()
    const roleId = this._requireActiveRole()
    const role = await this.rolex.activate(roleId)
    return role.skill(locator)
  }

  /**
   * 退休个体 (retire)
   * RoleX 1.1.0: rolex.direct('!individual.retire', ...)
   */
  async retire (individualId) {
    await this.ensureInitialized()
    await this.rolex.direct('!individual.retire', { individual: individualId })
    return `Individual "${individualId}" retired.`
  }

  /**
   * 删除个体 (die)
   * RoleX 1.1.0: rolex.direct('!individual.die', ...)
   */
  async die (individualId) {
    await this.ensureInitialized()
    await this.rolex.direct('!individual.die', { individual: individualId })
    return `Individual "${individualId}" deleted.`
  }

  /**
   * 恢复个体 (rehire)
   * RoleX 1.1.0: rolex.direct('!individual.rehire', ...)
   */
  async rehire (individualId) {
    await this.ensureInitialized()
    await this.rolex.direct('!individual.rehire', { individual: individualId })
    return `Individual "${individualId}" rehired.`
  }

  /**
   * 注入技能 (train)
   * RoleX 1.1.0: rolex.direct('!individual.train', ...)
   */
  async train (individualId, skillId, content) {
    await this.ensureInitialized()
    await this.rolex.direct('!individual.train', { individual: individualId, id: skillId, content })
    return `Skill "${skillId}" trained for "${individualId}".`
  }

  /**
   * 定义组织章程 (charter)
   * RoleX 1.1.0: rolex.direct('!org.charter', ...)
   */
  async charter (orgName, content) {
    await this.ensureInitialized()
    await this.rolex.direct('!org.charter', { org: orgName, content })
    return `Charter defined for organization "${orgName}".`
  }

  /**
   * 解散组织 (dissolve)
   * RoleX 1.1.0: rolex.direct('!org.dissolve', ...)
   */
  async dissolve (orgName) {
    await this.ensureInitialized()
    await this.rolex.direct('!org.dissolve', { org: orgName })
    return `Organization "${orgName}" dissolved.`
  }

  /**
   * 赋予职位职责 (charge)
   * RoleX 1.1.0: rolex.direct('!position.charge', ...)
   */
  async charge (positionName, content) {
    await this.ensureInitialized()
    await this.rolex.direct('!position.charge', { position: positionName, content })
    return `Responsibilities charged to position "${positionName}".`
  }

  /**
   * 声明职位技能要求 (require)
   * RoleX 1.1.0: rolex.direct('!position.require', ...)
   */
  async require (positionName, skillId) {
    await this.ensureInitialized()
    await this.rolex.direct('!position.require', { position: positionName, skill: skillId })
    return `Skill "${skillId}" required for position "${positionName}".`
  }

  /**
   * 废除职位 (abolish)
   * RoleX 1.1.0: rolex.direct('!position.abolish', ...)
   */
  async abolish (positionName) {
    await this.ensureInitialized()
    await this.rolex.direct('!position.abolish', { position: positionName })
    return `Position "${positionName}" abolished.`
  }

  /**
   * 列出所有 V2 角色（供 discover 使用）
   */
  async listV2Roles () {
    if (process.env.PROMPTX_ENABLE_V2 === '0') return []
    try {
      await this.ensureInitialized()

      // RoleX 1.1.0: census.list 返回渲染后的字符串，不是数组
      // 使用 type='individual' 参数获取纯文本个体列表
      const roles = []

      try {
        const censusResult = await this.rolex.direct('!census.list', { type: 'individual' })
        logger.info('[RolexBridge] Census individual result:', censusResult)

        if (typeof censusResult === 'string' && censusResult && !censusResult.startsWith('No ')) {
          // 格式: "id (alias1, alias2) #tag" 或仅 "id"，每行一个
          const lines = censusResult.split('\n').filter(l => l.trim())
          for (const line of lines) {
            // 提取 ID：第一个空格、'(' 或 '#' 之前的内容
            const match = line.match(/^([^\s(#]+)/)
            if (match) {
              const id = match[1].trim()
              if (id) {
                const isSeed = RolexBridge.SEED_ROLES.includes(id)
                roles.push({
                  id,
                  name: id,
                  description: '',
                  source: isSeed ? 'system' : 'rolex',
                  version: 'v2',
                  protocol: 'role'
                })
              }
            }
          }
        } else {
          logger.info('[RolexBridge] Census returned empty or no individuals:', censusResult)
        }
      } catch (censusError) {
        logger.warn('[RolexBridge] Census query failed:', censusError)
      }

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
