const BaseArea = require('../BaseArea')

/**
 * RoleArea - 角色定义区域
 * 负责渲染角色相关内容：人格特征、行为原则、专业知识
 */
class RoleArea extends BaseArea {
  constructor(roleId, roleSemantics, semanticRenderer, resourceManager, thoughts, executions, roleName) {
    super('ROLE_AREA')
    this.roleId = roleId
    this.roleName = roleName || roleId
    this.roleSemantics = roleSemantics
    this.semanticRenderer = semanticRenderer
    this.resourceManager = resourceManager
    this.thoughts = thoughts || []
    this.executions = executions || []
  }

  /**
   * 渲染角色区域内容
   */
  async render() {
    let content = ''
    
    // 角色激活标题
    content += `🎭 **角色激活完成：\`${this.roleId}\` (${this.roleName})** - 所有技能已自动加载\n\n`
    
    // 1. 人格特征
    const personalityContent = await this.renderPersonality()
    if (personalityContent) {
      content += personalityContent + '\n'
    }
    
    // 2. 行为原则
    const principleContent = await this.renderPrinciple()
    if (principleContent) {
      content += principleContent + '\n'
    }
    
    // 3. 专业知识
    const knowledgeContent = await this.renderKnowledge()
    if (knowledgeContent) {
      content += knowledgeContent + '\n'
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
    
    content += `## ✅ 👤 人格特征：${this.roleId}\n`
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
    
    content += `## ✅ ⚖️ 行为原则：${this.roleId}\n`
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
    
    content += `## ✅ 📚 知识体系：${this.roleId}-knowledge\n`
    content += rendered
    
    return content
  }

  /**
   * 渲染激活总结
   */
  renderSummary() {
    let content = '---\n'
    content += '# 🎯 角色激活总结\n'
    content += `✅ **\`${this.roleId}\` 角色已完全激活！**\n`
    content += '📋 **已获得能力**：\n'
    
    const components = []
    if (this.roleSemantics?.personality) components.push('👤 人格特征')
    if (this.roleSemantics?.principle) components.push('⚖️ 行为原则')
    if (this.roleSemantics?.knowledge) components.push('📚 专业知识')
    
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