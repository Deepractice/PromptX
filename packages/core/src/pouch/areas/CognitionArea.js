const BaseArea = require('./BaseArea')
const logger = require('@promptx/logger')
const CognitivePrompts = require('../../cognition/CognitivePrompts')

/**
 * CognitionArea - 统一的认知区域
 * 
 * 负责展示Mind对象和提供认知操作引导
 * 根据操作类型（prime/recall/remember）展示不同内容
 * 
 * 架构设计：
 * - Mind展示区：根据操作类型展示认知网络
 * - 提示引导区：提供操作相关的引导和说明
 * 
 * 状态机：State ∈ {prime, recall, remember}
 * 
 * 不变式：
 * - 每个状态对应特定的Mind展示方式
 * - 每个状态对应特定的引导提示
 */
class CognitionArea extends BaseArea {
  constructor(operationType, mind, roleId, metadata = {}) {
    super('COGNITION_AREA')
    
    // 核心状态
    this.operationType = operationType // prime | recall | remember
    this.mind = mind
    this.roleId = roleId
    this.metadata = metadata // 额外信息，如query词、新增节点等
    
    logger.debug('[CognitionArea] Created', {
      operationType,
      roleId,
      hasMind: !!mind,
      mindSize: mind?.activatedCues?.size || 0,
      metadata
    })
  }

  /**
   * 渲染认知区域
   */
  async render() {
    // 对于 remember 操作，特殊处理
    if (this.operationType === 'remember') {
      return this.renderRememberResult()
    }

    let content = ''

    // 区域1: Mind展示区
    const mindSection = await this.renderMindSection()
    if (mindSection) {
      content += mindSection
    }

    // 分隔线
    content += '\n---\n'

    // 区域2: 提示引导区
    content += await this.renderGuideSection()

    return content
  }

  /**
   * Mind展示区 - 根据操作类型展示不同内容
   */
  async renderMindSection() {
    // 对于 remember 操作，不在这里渲染任何内容
    // 统一在 renderGuideSection 中处理
    if (this.operationType === 'remember') {
      return ''
    }

    // 空网络处理
    if (!this.mind || !this.mind.activatedCues || this.mind.activatedCues.size === 0) {
      return this.renderEmptyMind()
    }

    let content = ''

    // 根据操作类型设置标题
    switch(this.operationType) {
      case 'prime':
        content += '## 📊 记忆网络图\n'
        content += `当前角色：**${this.roleId}**\n`
        content += `网络状态：已激活\n`

        // 如果是 fallback 到 DMN，添加提示
        if (this.metadata.fallbackToDMN) {
          content += `\n⚠️ **查询词未找到，已自动切换到 DMN 模式**\n`
          content += `原查询词："${this.metadata.originalQuery}"\n`
          content += `下方显示完整记忆网络，请从中选择相关关键词重新搜索\n`
        }
        content += '\n'
        break

      case 'recall':
        content += '## 🔍 记忆搜索结果\n'
        if (this.metadata.query) {
          content += `搜索关键词：**${this.metadata.query}**\n`
        }
        content += `找到的相关记忆：\n\n`
        break

      default:
        content += '## 🧠 认知网络\n\n'
    }
    
    // 渲染mindmap
    try {
      content += '```mermaid\n'
      content += this.mind.toMermaid()
      content += '\n```\n\n'

      // 添加关键提示
      if (this.operationType === 'prime' || this.operationType === 'recall') {
        const nodeCount = this.mind?.activatedCues?.size || 0
        content += `💡 **使用提示**：\n`
        content += `- 上方网络图显示了 ${nodeCount} 个记忆关键词\n`
        content += `- **每个关键词都可以用于recall搜索相关记忆**\n`
        content += `- 例如：recall("${this.roleId}", "网络图中的任意关键词")\n\n`
      }
    } catch (error) {
      logger.error('[CognitionArea] Failed to render mermaid', error)
      content += '⚠️ 无法渲染认知网络图\n\n'
    }

    return content
  }

  /**
   * 提示引导区 - 根据操作类型提供不同引导
   */
  async renderGuideSection() {
    let content = ''
    
    // 操作特定引导
    switch(this.operationType) {
      case 'prime':
        content += this.renderPrimeGuide()
        break
        
      case 'recall':
        content += this.renderRecallGuide()
        break
        
      case 'remember':
        content += this.renderRememberGuide()
        break
        
      default:
        content += this.renderDefaultGuide()
    }
    
    // 通用认知循环提示
    content += '\n'
    content += this.renderCognitionCycle()
    
    return content
  }

  /**
   * Prime模式引导
   */
  renderPrimeGuide() {
    const nodeCount = this.mind?.activatedCues?.size || 0
    return `✅ **角色激活成功**

📊 记忆网络规模：${nodeCount} 个关键词

${CognitivePrompts.getPrimeGuideHint()}
`
  }

  /**
   * Recall模式引导
   */
  renderRecallGuide() {
    const query = this.metadata.query || '未知'
    const nodeCount = this.mind?.activatedCues?.size || 0

    // Debug logging for mind structure
    logger.info('[CognitionArea] DEBUG - renderRecallGuide mind structure:', {
      hasMind: !!this.mind,
      mindKeys: this.mind ? Object.keys(this.mind) : null,
      hasEngrams: !!this.mind?.engrams,
      engramsLength: this.mind?.engrams?.length,
      engramsType: typeof this.mind?.engrams,
      mindType: typeof this.mind,
      activatedCuesSize: this.mind?.activatedCues?.size,
      roleId: this.roleId,
      query: query
    })

    // Deep debug: log actual mind object structure
    if (this.mind) {
      logger.debug('[CognitionArea] DEBUG - Full mind object:', JSON.stringify(this.mind, null, 2))
    }

    let content = `✅ **找到 ${nodeCount} 个相关记忆**

搜索关键词："${query}"
${nodeCount > 0 ? '\n📗 **认知状态**：经验模式 - 基于历史记忆回答\n' : ''}
`
    
    // 展示engrams内容（如果存在）
    if (this.mind?.engrams && this.mind.engrams.length > 0) {
      content += '\n\n🔥 **涌现的记忆内容**：\n\n'
      
      for (const engram of this.mind.engrams) {
        // 时间格式化
        const timeAgo = this.formatTimeAgo(engram.timestamp)
        
        // 根据type显示不同的emoji和标签
        const typeEmoji = {
          'PATTERN': '🎯',
          'LINK': '🔗',
          'ATOMIC': '💡'
        }
        const typeLabel = {
          'PATTERN': '模式',
          'LINK': '关系',
          'ATOMIC': '原子'
        }
        const emoji = typeEmoji[engram.type] || '💭'
        const label = typeLabel[engram.type] || engram.type || '未分类'

        content += `${emoji} **记忆片段** [${label}] (强度: ${engram.strength}) • ⏰ ${timeAgo}\n`
        content += `   *"${engram.content}"*\n\n`
        
        // 展示schema概念结构
        if (engram.schema) {
          const schemaString = Array.isArray(engram.schema) ? engram.schema.join('\n') : String(engram.schema)
          const schemaWords = schemaString.split('\n').filter(w => w.trim())
          content += `   🏷️ **概念结构**: ${schemaWords.join(' → ')}\n\n`
        }
      }
    }

    // 添加认知循环提示
    if (nodeCount > 0) {
      content += '\n' + CognitivePrompts.getRecallFoundHint() + '\n'
    }

    return content
  }

  /**
   * Remember模式引导
   */
  renderRememberGuide() {
    const engramCount = this.metadata.engramCount || 0

    return `✅ **保存成功**

- 已保存 ${engramCount} 条新记忆
- 记忆网络已更新

${CognitivePrompts.getRememberSuccessHint()}
`
  }

  /**
   * Remember操作的统一渲染方法
   */
  renderRememberResult() {
    const engramCount = this.metadata.engramCount || 0

    // 如果有错误信息，显示错误
    if (this.metadata.error) {
      return `## ⚠️ 存储失败

未能成功保存记忆到认知网络。

**错误信息**：${this.metadata.error}

🔧 **请检查**：
1. 记忆格式是否正确
2. 角色是否已正确激活
3. 存储路径是否可写

---
`
    }

    // 否则显示成功信息
    return `${this.renderRememberGuide()}

---
`
  }

  /**
   * 默认引导
   */
  renderDefaultGuide() {
    return `认知系统已就绪。

💡 **可用操作**：
- recall: 检索相关记忆
- remember: 存储新知识
`
  }

  /**
   * 认知循环提示 - 精简版
   */
  renderCognitionCycle() {
    // 简化的操作状态提示
    return ''
  }


  /**
   * 时间格式化 - 显示相对时间
   */
  formatTimeAgo(timestamp) {
    const now = Date.now()
    const diff = now - timestamp
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    return `${days}天前`
  }

  /**
   * 空认知网络提示
   */
  renderEmptyMind() {
    switch(this.operationType) {
      case 'prime':
        return `## 📭 记忆网络初始状态

当前角色：**${this.roleId}**
网络状态：空白，等待第一条记忆

这是初始状态：
- 角色刚被激活，还没有积累记忆
- 每个新的经验都将成为记忆网络的节点
- 通过recall和remember构建记忆网络
`

      case 'recall': {
        const query = this.metadata.query || '未知'
        return `## 🔍 未找到相关记忆

查询词 **"${query}"** 没有匹配的记忆。

💡 **可能的原因**：
1. 该概念尚未被记录到认知系统中
2. 查询词拼写或格式不正确
3. 该角色的认知系统中没有相关记忆

${CognitivePrompts.getRecallEmptyHint(this.roleId)}
`
      }

      case 'remember':
        // remember 操作时，空的 mind 不代表失败
        // 因为可能是第一次保存或者保存后网络还未重新加载
        // 实际的成功/失败状态会在 renderRememberGuide 中显示
        return ``
      
      default:
        return ''
    }
  }
}

module.exports = CognitionArea