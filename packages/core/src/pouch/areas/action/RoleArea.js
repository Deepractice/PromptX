const BaseArea = require('../BaseArea')

/**
 * RoleArea - 角色定义区域
 * 负责渲染角色相关内容：人格特征、行为原则、专业知识
 */
class RoleArea extends BaseArea {
  constructor(roleId, roleSemantics, semanticRenderer, resourceManager, thoughts, executions, roleName, sectionFilter) {
    super('ROLE_AREA')
    this.roleId = roleId
    this.roleName = roleName || roleId
    this.roleSemantics = roleSemantics
    this.semanticRenderer = semanticRenderer
    this.resourceManager = resourceManager
    this.thoughts = thoughts || []
    this.executions = executions || []
    // Default (undefined): personality only
    this.sectionFilter = sectionFilter
  }

  /**
   * 渲染角色区域内容
   */
  async render() {
    let content = ''

    const filter = this.sectionFilter
    const loadPersonality = !filter || filter === 'personality' || filter === 'all'
    const loadPrinciple = filter === 'principle' || filter === 'all'
    const loadKnowledge = filter === 'knowledge' || filter === 'all'

    // 角色激活标题
    const loaded = []
    if (loadPersonality) loaded.push('人格特征')
    if (loadPrinciple) loaded.push('行为原则')
    if (loadKnowledge) loaded.push('专业知识')
    content += `🎭 **角色激活：\`${this.roleId}\` (${this.roleName})** - 已加载：${loaded.join('、')}\n`

    // 提示可按需加载的部分
    const hints = []
    if (!loadPrinciple && this.roleSemantics?.principle) hints.push('执行工具或任务前，先加载「行为原则」获取工作流和方法论：roleResources: "principle"')
    if (!loadKnowledge && this.roleSemantics?.knowledge) hints.push('遇到不确定的专业问题时，先加载「专业知识」获取领域知识：roleResources: "knowledge"')
    if (hints.length > 0) {
      content += `💡 按需加载提示：\n`
      for (const hint of hints) {
        content += `  - ${hint}\n`
      }
    }
    content += '\n'

    // 1. 人格特征
    if (loadPersonality) {
      const personalityContent = await this.renderPersonality()
      if (personalityContent) {
        content += personalityContent + '\n'
      }
    }

    // 2. 行为原则
    if (loadPrinciple) {
      const principleContent = await this.renderPrinciple()
      if (principleContent) {
        content += principleContent + '\n'
      }
    }

    // 3. 专业知识
    if (loadKnowledge) {
      const knowledgeContent = await this.renderKnowledge()
      if (knowledgeContent) {
        content += knowledgeContent + '\n'
      }
    }

    // 4. 激活总结
    content += this.renderSummary()

    return content
  }

  /**
   * 渲染人格特征
   */
  async renderPersonality() {
    if (!this.roleSemantics?.personality) {
      return ''
    }
    
    let content = '# 👤 角色人格特征\n'

    const rendered = await this.semanticRenderer.renderSemanticContent(
      this.roleSemantics.personality,
      this.resourceManager
    )

    content += rendered
    
    // 添加思维资源
    if (this.thoughts.length > 0) {
      content += '\n---\n'
      for (const thought of this.thoughts) {
        const thoughtContent = await this.semanticRenderer.renderSemanticContent(
          thought,
          this.resourceManager
        )
        if (thoughtContent) {
          content += thoughtContent + '\n'
        }
      }
    }
    
    return content
  }

  /**
   * 渲染行为原则
   */
  async renderPrinciple() {
    if (!this.roleSemantics?.principle) {
      return ''
    }
    
    let content = '# ⚖️ 角色行为原则\n'

    const rendered = await this.semanticRenderer.renderSemanticContent(
      this.roleSemantics.principle,
      this.resourceManager
    )

    content += rendered
    
    // 添加执行资源
    if (this.executions.length > 0) {
      content += '\n---\n'
      for (const execution of this.executions) {
        const execContent = await this.semanticRenderer.renderSemanticContent(
          execution,
          this.resourceManager
        )
        if (execContent) {
          content += execContent + '\n'
        }
      }
    }
    
    return content
  }

  /**
   * 渲染专业知识
   */
  async renderKnowledge() {
    if (!this.roleSemantics?.knowledge) {
      return ''
    }
    
    let content = '# 📚 专业知识体系\n'

    const rendered = await this.semanticRenderer.renderSemanticContent(
      this.roleSemantics.knowledge,
      this.resourceManager
    )

    content += rendered
    
    return content
  }

  /**
   * 渲染激活总结
   */
  renderSummary() {
    const filter = this.sectionFilter
    const loadPersonality = !filter || filter === 'personality' || filter === 'all'
    const loadPrinciple = filter === 'principle' || filter === 'all'
    const loadKnowledge = filter === 'knowledge' || filter === 'all'

    let content = '---\n'
    content += '# 🎯 角色激活总结\n'
    content += `✅ **\`${this.roleId}\` 角色已激活**\n`
    content += '📋 **已加载能力**：\n'

    const components = []
    if (loadPersonality && this.roleSemantics?.personality) components.push('👤 人格特征')
    if (loadPrinciple && this.roleSemantics?.principle) components.push('⚖️ 行为原则')
    if (loadKnowledge && this.roleSemantics?.knowledge) components.push('📚 专业知识')

    content += `- 🎭 角色组件：${components.join(', ')}\n`

    if (this.thoughts.length > 0) {
      content += `- 🧠 思维模式：${this.thoughts.length}个专业思维模式已加载\n`
    }

    if (this.executions.length > 0) {
      content += `- ⚡ 执行技能：${this.executions.length}个执行技能已激活\n`
    }

    content += `💡 **现在可以立即开始以 \`${this.roleId}\` 身份提供专业服务！**\n`

    return content
  }
}

module.exports = RoleArea