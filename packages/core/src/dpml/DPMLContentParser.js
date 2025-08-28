/**
 * DPML内容解析器
 * 统一处理DPML标签内的混合内容（@引用 + 直接内容）
 * 确保标签语义完整性
 */
class DPMLContentParser {
  /**
   * 解析DPML标签的完整语义内容
   * @param {string} content - 标签内的原始内容
   * @param {string} tagName - 标签名称
   * @returns {Object} 完整的语义结构
   */
  parseTagContent(content, tagName) {
    if (!content || !content.trim()) {
      return {
        fullSemantics: '',
        references: [],
        directContent: '',
        metadata: {
          tagName,
          hasReferences: false,
          hasDirectContent: false,
          contentType: 'empty'
        }
      }
    }

    const cleanContent = content.trim()
    const references = this.extractReferencesWithPosition(cleanContent)
    const directContent = this.extractDirectContent(cleanContent)

    return {
      // 完整语义内容（用户看到的最终效果）
      fullSemantics: cleanContent,
      
      // 引用部分（需要解析和加载的资源）
      references,
      
      // 直接部分（用户原创内容）
      directContent,
      
      // 元数据
      metadata: {
        tagName,
        hasReferences: references.length > 0,
        hasDirectContent: directContent.length > 0,
        contentType: this.determineContentType(cleanContent)
      }
    }
  }

  /**
   * 提取所有@引用
   * @param {string} content - 内容
   * @returns {Array} 引用数组
   */
  extractReferences(content) {
    // 使用新的位置信息方法，但保持向下兼容
    return this.extractReferencesWithPosition(content).map(ref => ({
      fullMatch: ref.fullMatch,
      priority: ref.priority,
      protocol: ref.protocol,
      resource: ref.resource,
      isRequired: ref.isRequired,
      isOptional: ref.isOptional
    }))
  }

  /**
   * 新增：获取引用的位置信息
   * @param {string} content - 内容
   * @returns {Array} 包含位置信息的引用数组
   */
  extractReferencesWithPosition(content) {
    if (!content) {
      return []
    }

    const resourceRegex = /@([!?]?)([a-zA-Z][a-zA-Z0-9_-]*):\/\/([a-zA-Z0-9_\/.,-]+?)(?=[\s\)\],]|$)/g
    const matches = []
    let match
    
    while ((match = resourceRegex.exec(content)) !== null) {
      matches.push({
        fullMatch: match[0],
        priority: match[1],
        protocol: match[2],
        resource: match[3],
        position: match.index, // 位置信息
        isRequired: match[1] === '!',
        isOptional: match[1] === '?'
      })
    }
    
    return matches.sort((a, b) => a.position - b.position) // 按位置排序
  }

  /**
   * 提取直接内容（移除@引用后的剩余内容）
   * @param {string} content - 内容
   * @returns {string} 直接内容
   */
  extractDirectContent(content) {
    // 移除所有@引用行，保留其他内容
    const withoutReferences = content.replace(/^.*@[!?]?[a-zA-Z][a-zA-Z0-9_-]*:\/\/.*$/gm, '')
    
    // 清理多余的空行
    const cleaned = withoutReferences.replace(/\n{3,}/g, '\n\n').trim()
    
    return cleaned
  }

  /**
   * 检查是否包含引用
   * @param {string} content - 内容
   * @returns {boolean}
   */
  hasReferences(content) {
    return /@[!?]?[a-zA-Z][a-zA-Z0-9_-]*:\/\//.test(content)
  }

  /**
   * 检查是否包含直接内容
   * @param {string} content - 内容
   * @returns {boolean}
   */
  hasDirectContent(content) {
    const withoutReferences = this.extractDirectContent(content)
    return withoutReferences.length > 0
  }

  /**
   * 确定内容类型
   * @param {string} content - 内容
   * @returns {string} 内容类型
   */
  determineContentType(content) {
    const hasRefs = this.hasReferences(content)
    const hasDirect = this.hasDirectContent(content)
    
    if (hasRefs && hasDirect) return 'mixed'
    if (hasRefs) return 'references-only'
    if (hasDirect) return 'direct-only'
    return 'empty'
  }

  /**
   * 从DPML文档中提取指定标签的内容
   * @param {string} dpmlContent - 完整的DPML文档内容
   * @param {string} tagName - 标签名称
   * @returns {string} 标签内容
   */
  extractTagContent(dpmlContent, tagName) {
    const regex = new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, 'i')
    const match = dpmlContent.match(regex)
    return match ? match[1] : ''
  }

  /**
   * 解析完整的DPML角色文档
   * @param {string} roleContent - 角色文档内容
   * @returns {Object} 解析后的角色语义结构
   */
  parseRoleDocument(roleContent) {
    const dpmlTags = ['personality', 'principle', 'knowledge']
    const roleSemantics = {}
    
    dpmlTags.forEach(tagName => {
      const tagContent = this.extractTagContent(roleContent, tagName)
      if (tagContent) {
        roleSemantics[tagName] = this.parseTagContent(tagContent, tagName)
      }
    })
    
    return roleSemantics
  }
}

module.exports = DPMLContentParser