const BaseLayer = require('./BaseLayer')
const logger = require('../../../utils/logger')

/**
 * RoleLayer - 角色层
 * 
 * 架构地位：
 * - 三层架构的底层，处理与世界的实际交互
 * - 包含原有系统的所有Area（RoleArea、StateArea等）
 * - 定义注意力的边界和交互方式
 * 
 * 核心职责：
 * 1. 管理角色相关的所有Areas
 * 2. 处理角色的具体功能展示
 * 3. 提供与环境交互的接口
 * 
 * 设计特点：
 * - 优先级最低（priority=100）
 * - 包含多种类型的Area
 * - 保持与原有系统的兼容性
 */
class RoleLayer extends BaseLayer {
  constructor(options = {}) {
    super('role', 100, options) // 最低优先级
    
    // 角色层配置
    this.roleId = options.roleId || null
    this.roleInfo = options.roleInfo || null
  }

  /**
   * 设置角色上下文
   */
  setRoleContext(roleId, roleInfo = null) {
    this.roleId = roleId
    this.roleInfo = roleInfo
    
    logger.debug('[RoleLayer] Role context updated', {
      roleId,
      hasRoleInfo: !!roleInfo
    })
  }

  /**
   * 组装Areas
   * 角色层不自动组装Areas，而是由外部（Command）添加
   * 这保持了与原有系统的兼容性
   */
  async assembleAreas(context) {
    // RoleLayer的Areas由Command直接注册
    // 这里可以做一些预处理或验证
    
    logger.debug('[RoleLayer] Areas assembly delegated to command', {
      currentAreaCount: this.areas.length,
      roleId: context.roleId || this.roleId
    })
  }

  /**
   * 添加角色相关的Area
   * 提供便捷方法供Command使用
   */
  addRoleArea(area) {
    this.registerArea(area)
    logger.debug(`[RoleLayer] Added ${area.getName()} area`)
  }

  /**
   * 批量添加Areas
   */
  addRoleAreas(areas) {
    areas.forEach(area => this.addRoleArea(area))
  }

  /**
   * 验证角色层
   */
  validate() {
    // 角色层可以没有Areas（某些情况下）
    if (this.areas.length === 0) {
      logger.debug('[RoleLayer] No areas to validate')
      return true
    }
    
    return super.validate()
  }

  /**
   * 渲染角色层
   */
  async render(context = {}) {
    // 合并context
    const renderContext = {
      ...context,
      roleId: context.roleId || this.roleId,
      roleInfo: context.roleInfo || this.roleInfo
    }
    
    // 如果没有Areas，返回空
    if (this.areas.length === 0) {
      logger.debug('[RoleLayer] No areas to render')
      return ''
    }
    
    return super.render(renderContext)
  }

  /**
   * 格式化Area内容
   * 保持原有的格式化方式
   */
  formatAreaContent(area, content) {
    // 使用Area自己的格式化
    return area.format(content)
  }

  /**
   * 组合Area内容
   * 角色层的Areas之间使用短横线分隔
   */
  combineAreaContents(contents) {
    if (contents.length <= 1) {
      // 只有一个或没有Area时，不需要分隔符
      return contents.join('')
    }
    // 多个Areas之间使用短横线分隔
    return contents.join('\n\n')
  }

  /**
   * 渲染前准备
   */
  async beforeRender(context) {
    logger.debug('[RoleLayer] Preparing to render', {
      roleId: context.roleId || this.roleId,
      areaCount: this.areas.length,
      areaTypes: this.areas.map(a => a.getName())
    })
  }

  /**
   * 渲染后清理
   */
  async afterRender(context) {
    logger.debug('[RoleLayer] Render completed')
  }

  /**
   * 获取元信息
   */
  getMetadata() {
    return {
      ...super.getMetadata(),
      roleId: this.roleId,
      hasRoleInfo: !!this.roleInfo,
      areaTypes: this.areas.map(a => a.constructor.name)
    }
  }

  /**
   * 检查是否包含特定类型的Area
   */
  hasAreaType(areaClassName) {
    return this.areas.some(area => area.constructor.name === areaClassName)
  }

  /**
   * 获取特定类型的Area
   */
  getAreaByType(areaClassName) {
    return this.areas.find(area => area.constructor.name === areaClassName)
  }

  /**
   * 静态工厂方法：创建带基本Areas的角色层
   */
  static createWithBasicAreas(roleId, roleArea, stateArea) {
    const layer = new RoleLayer({ roleId })
    
    if (roleArea) {
      layer.addRoleArea(roleArea)
    }
    
    if (stateArea) {
      layer.addRoleArea(stateArea)
    }
    
    return layer
  }
}

module.exports = RoleLayer