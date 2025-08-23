const BaseLayer = require('./BaseLayer')
const CognitionArea = require('../areas/CognitionArea')
const logger = require('../../../utils/logger')

/**
 * CognitionLayer - 认知层
 * 
 * 架构地位：
 * - 三层架构的中间层，管理注意力分配系统
 * - 包含CognitionArea，展示海马体网络和记忆操作
 * - 连接意识层和角色层的桥梁
 * 
 * 核心职责：
 * 1. 管理记忆的编码和提取（remember/recall）
 * 2. 展示海马体网络的激活状态
 * 3. 提供认知循环的操作引导
 * 
 * 设计特点：
 * - 优先级中等（priority=50）
 * - 包含CognitionArea作为主要展示组件
 * - 根据操作类型（prime/recall/remember）动态调整内容
 */
class CognitionLayer extends BaseLayer {
  constructor(options = {}) {
    super('cognition', 50, options) // 中等优先级
    
    // 认知层配置
    this.operationType = options.operationType || null // prime | recall | remember | null
    this.mind = options.mind || null // Mind对象
    this.roleId = options.roleId || null
    this.metadata = options.metadata || {} // 额外信息
  }

  /**
   * 设置认知操作上下文
   */
  setContext(operationType, mind, roleId, metadata = {}) {
    this.operationType = operationType
    this.mind = mind
    this.roleId = roleId
    this.metadata = metadata
    
    logger.debug('[CognitionLayer] Context updated', {
      operationType,
      roleId,
      hasMind: !!mind,
      metadata
    })
  }

  /**
   * 组装Areas
   */
  async assembleAreas(context) {
    this.clearAreas()
    
    // 如果没有认知操作，不创建Area
    if (!this.operationType) {
      logger.debug('[CognitionLayer] No operation type, skipping area assembly')
      return
    }
    
    // 从context中获取或使用已设置的值
    const operationType = context.operationType || this.operationType
    const mind = context.mind || this.mind
    const roleId = context.roleId || this.roleId
    const metadata = { ...this.metadata, ...context.metadata }
    
    // 创建CognitionArea
    const cognitionArea = new CognitionArea(
      operationType,
      mind,
      roleId,
      metadata
    )
    
    this.registerArea(cognitionArea)
    
    logger.debug('[CognitionLayer] CognitionArea assembled', {
      operationType,
      roleId,
      hasMind: !!mind
    })
  }

  /**
   * 验证认知层是否可以渲染
   */
  validate() {
    // 如果没有操作类型，认知层可以不渲染
    if (!this.operationType && this.areas.length === 0) {
      return true
    }
    
    return super.validate()
  }

  /**
   * 渲染认知层
   */
  async render(context = {}) {
    // 合并context和已有设置
    const renderContext = {
      ...context,
      operationType: context.operationType || this.operationType,
      mind: context.mind || this.mind,
      roleId: context.roleId || this.roleId,
      metadata: { ...this.metadata, ...context.metadata }
    }
    
    // 如果没有认知操作，返回空
    if (!renderContext.operationType) {
      return ''
    }
    
    return super.render(renderContext)
  }

  /**
   * 格式化Area内容
   * 认知层的Area不需要额外的格式化边框
   */
  formatAreaContent(area, content) {
    // CognitionArea自己管理格式，不需要额外包装
    return content
  }

  /**
   * 渲染前准备
   */
  async beforeRender(context) {
    logger.debug('[CognitionLayer] Preparing to render', {
      operationType: context.operationType || this.operationType,
      roleId: context.roleId || this.roleId
    })
  }

  /**
   * 渲染后清理
   */
  async afterRender(context) {
    logger.debug('[CognitionLayer] Render completed')
  }

  /**
   * 获取元信息
   */
  getMetadata() {
    return {
      ...super.getMetadata(),
      operationType: this.operationType,
      roleId: this.roleId,
      hasMind: !!this.mind,
      metadata: this.metadata
    }
  }

  /**
   * 静态工厂方法：创建Prime操作的认知层
   */
  static createForPrime(mind, roleId) {
    return new CognitionLayer({
      operationType: 'prime',
      mind,
      roleId
    })
  }

  /**
   * 静态工厂方法：创建Recall操作的认知层
   */
  static createForRecall(mind, roleId, query) {
    return new CognitionLayer({
      operationType: 'recall',
      mind,
      roleId,
      metadata: { query }
    })
  }

  /**
   * 静态工厂方法：创建Remember操作的认知层
   */
  static createForRemember(mind, roleId, engramCount) {
    return new CognitionLayer({
      operationType: 'remember',
      mind,
      roleId,
      metadata: { engramCount }
    })
  }
}

module.exports = CognitionLayer