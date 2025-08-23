const BaseArea = require('./BaseArea')
const logger = require('../../../utils/logger')

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
    // 空网络处理
    if (!this.mind || !this.mind.activatedCues || this.mind.activatedCues.size === 0) {
      return this.renderEmptyMind()
    }

    let content = ''
    
    // 根据操作类型设置标题
    switch(this.operationType) {
      case 'prime':
        content += '## 🧠 认知网络全景 (Prime)\n'
        content += `角色 **${this.roleId}** 的完整认知网络：\n\n`
        break
        
      case 'recall':
        content += '## 🔍 记忆检索结果 (Recall)\n'
        if (this.metadata.query) {
          content += `查询词: **${this.metadata.query}**\n`
        }
        content += `激活的认知子网络：\n\n`
        break
        
      case 'remember':
        content += '## 💾 记忆存储确认 (Remember)\n'
        content += `新增的认知节点：\n\n`
        break
        
      default:
        content += '## 🧠 认知网络\n\n'
    }
    
    // 渲染mindmap
    try {
      content += '```mermaid\n'
      content += this.mind.toMermaid()
      content += '\n```\n\n'
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
    let content = '🧠 认知循环引导：\n'
    
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
    return `你已激活专业角色，获得了强大的能力。

⚠️ 还记得吗？每个mindmap词都是潜在宝藏！
现在不recall，后面可能会后悔...
`
  }

  /**
   * Recall模式引导
   */
  renderRecallGuide() {
    const query = this.metadata.query || '未知'
    const nodeCount = this.mind?.activatedCues?.size || 0
    
    return `成功检索到 ${nodeCount} 个相关概念！

🔍 **检索词**: "${query}"
💡 **使用建议**：
- 激活的概念都与 "${query}" 相关
- 可以基于这些关联概念深入探索
- 使用 remember 工具保存新学到的知识
`
  }

  /**
   * Remember模式引导
   */
  renderRememberGuide() {
    const engramCount = this.metadata.engramCount || 0
    
    return `✅ **记忆保存成功！**

📝 **已保存到角色 \`${this.roleId}\` 的记忆体系**
📊 **保存数量**：${engramCount} 条记忆

💡 **后续建议**：
1. 🔍 使用 recall 工具验证记忆是否正确保存
2. 📊 定期整理和优化记忆体系
3. 🎯 在实践中不断强化重要记忆
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
    // 根据操作类型返回不同的简短提示
    switch(this.operationType) {
      case 'prime':
        return `💡 **下一步**: recall("${this.roleId}", "关键词") 激活相关记忆`
      case 'recall':
        return `💡 **下一步**: 基于激活的概念继续探索或 remember 新知识`
      case 'remember':
        return `💡 **下一步**: recall 验证记忆是否正确保存`
      default:
        return ''
    }
  }


  /**
   * 空认知网络提示
   */
  renderEmptyMind() {
    switch(this.operationType) {
      case 'prime':
        return `## 📭 认知网络为空

当前角色 **${this.roleId}** 还没有存储的记忆。

🎯 **开始构建认知网络**：
1. 使用 \`remember()\` 存储第一条记忆
2. 逐步建立知识关联
3. 形成个人认知体系
`
      
      case 'recall': {
        const query = this.metadata.query || '未知'
        return `## 🔍 未找到相关记忆

查询词 **"${query}"** 没有匹配的记忆。

💡 **可能的原因**：
1. 该概念尚未被记录到认知系统中
2. 查询词拼写或格式不正确
3. 该角色的认知系统中没有相关记忆

🎯 **建议操作**：
1. 尝试使用相关的其他概念进行检索
2. 如果是新知识，使用 remember 工具进行记录
`
      }
      
      case 'remember':
        return `## ⚠️ 存储失败

未能成功保存记忆到认知网络。

🔧 **请检查**：
1. 记忆格式是否正确
2. 角色是否已正确激活
3. 存储路径是否可写
`
      
      default:
        return ''
    }
  }
}

module.exports = CognitionArea