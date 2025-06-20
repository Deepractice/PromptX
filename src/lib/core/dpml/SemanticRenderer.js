/**
 * SemanticRenderer - DPML语义渲染器
 * 
 * 核心理念：@引用 = 语义占位符
 * 在标签的原始位置插入引用内容，保持完整的语义流程
 */
class SemanticRenderer {
  /**
   * 语义占位符渲染：将@引用替换为实际内容
   * @param {Object} tagSemantics - 标签语义结构
   * @param {string} tagSemantics.fullSemantics - 完整的语义内容
   * @param {Array} tagSemantics.references - 引用列表
   * @param {ResourceManager} resourceManager - 资源管理器
   * @returns {string} 完整融合的语义内容
   */
  async renderSemanticContent(tagSemantics, resourceManager) {
    if (!tagSemantics || !tagSemantics.fullSemantics) {
      return ''
    }

    let content = tagSemantics.fullSemantics
    
    if (!tagSemantics.references || tagSemantics.references.length === 0) {
      return content.trim()
    }

    // 按出现顺序处理每个@引用（保持位置语义）
    // 需要按位置排序确保正确的替换顺序
    const sortedReferences = [...tagSemantics.references].sort((a, b) => a.position - b.position)
    
    for (const ref of sortedReferences) {
      try {
        // 解析引用内容
        const result = await resourceManager.resolve(ref.fullMatch)
        
        // 检查解析是否成功
        if (result.success) {
          // 提取标签内容（去掉外层DPML标签）
          const cleanContent = this.extractTagInnerContent(result.content, ref.protocol)
          // 用<reference>标签包装引用内容，标明这是占位符渲染
          const wrappedContent = `<reference protocol="${ref.protocol}" resource="${ref.resource}">\n${cleanContent}\n</reference>`
          // 在原始位置替换@引用为实际内容
          const refIndex = content.indexOf(ref.fullMatch)
          if (refIndex !== -1) {
            content = content.substring(0, refIndex) + wrappedContent + content.substring(refIndex + ref.fullMatch.length)
          } else {
            content = content.replace(ref.fullMatch, wrappedContent)
          }
        } else {
          // 解析失败时的优雅降级
          content = content.replace(ref.fullMatch, `<!-- 引用解析失败: ${ref.fullMatch} - ${result.error?.message || 'Unknown error'} -->`)
        }
      } catch (error) {
        // 引用解析失败时的优雅降级
        content = content.replace(ref.fullMatch, `<!-- 引用解析失败: ${ref.fullMatch} - ${error.message} -->`)
      }
    }
    
    return content.trim()
  }

  /**
   * 提取DPML标签内的内容
   * @param {string} content - 包含DPML标签的完整内容
   * @param {string} protocol - 协议名称（thought, execution等）
   * @returns {string} 标签内的纯内容
   */
  extractTagInnerContent(content, protocol) {
    // 根据协议类型确定标签名
    const tagName = protocol
    const regex = new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, 'i')
    const match = content.match(regex)
    
    if (match && match[1]) {
      return match[1].trim()
    }
    
    // 如果没有匹配到标签，返回原内容（可能已经是纯内容）
    return content.trim()
  }
}

module.exports = SemanticRenderer