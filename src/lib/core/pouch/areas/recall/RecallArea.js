const BaseArea = require('../BaseArea')

/**
 * RecallArea - 记忆检索区域
 * 负责渲染 Mind 对象（认知激活状态）
 */
class RecallArea extends BaseArea {
  constructor(mind, query, role) {
    super('RECALL_AREA')
    this.mind = mind
    this.query = query
    this.role = role
  }

  async render() {
    if (!this.mind || this.mind.activatedCues.size === 0) {
      return this.renderEmptyResult()
    }

    let content = `🧠 **认知检索结果** - 角色: ${this.role}\n`
    
    if (this.query) {
      content += `🔍 查询: "${this.query}"\n`
    } else {
      content += `📊 全局认知概览\n`
    }
    
    content += `\n## 激活的认知网络\n`
    
    // 渲染 Mindmap
    content += '```mermaid\n'
    content += this.mind.toMermaid()
    content += '\n```\n\n'
    
    content += '\n💡 **使用建议**：\n'
    if (this.query) {
      content += `- 激活的概念都与 "${this.query}" 相关\n`
      content += '- 可以基于这些关联概念深入探索\n'
      content += '- 使用 remember 工具保存新学到的知识\n'
    } else {
      content += '- 这是角色的核心认知结构\n'
      content += '- 可以选择任意概念进行深入检索\n'
      content += '- 通过实践不断强化重要连接\n'
    }
    
    return content
  }

  renderEmptyResult() {
    if (this.query) {
      return `🔍 **记忆检索结果**：未找到匹配"${this.query}"的相关记忆

📌 **可能的原因**：
1. 该概念尚未被记录到认知系统中
2. 查询词拼写或格式不正确
3. 该角色的认知系统中没有相关记忆

💡 **建议操作**：
1. 使用不带查询词的 recall 查看全部认知网络
2. 尝试使用相关的其他概念进行检索
3. 如果是新知识，使用 remember 工具进行记录`
    } else {
      return `🧠 **认知系统暂无内容** - 角色: ${this.role}

💡 该角色尚未建立认知网络。请通过以下方式积累知识：
1. 使用 remember 工具保存重要概念和关系
2. 在实践中不断学习和记录
3. 定期整理和优化知识结构`
    }
  }

}

module.exports = RecallArea