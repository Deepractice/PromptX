/**
 * SemanticRenderer - DPML语义渲染器
 *
 * 核心理念：@引用 = 语义占位符
 * 在标签的原始位置插入引用内容，保持完整的语义流程
 *
 * 渲染模式：
 * - xml: 保留XML标签（用于调试）
 * - semantic: 转换为自然语言格式（默认）
 */
class SemanticRenderer {
  constructor(options = {}) {
    this.renderMode = options.renderMode || 'semantic';
  }

  /**
   * 根据协议类型生成语义化的引用包装
   */
  wrapReferenceContent(protocol, resource, content) {
    if (this.renderMode === 'xml') {
      // 保留原始 XML 格式（用于调试）
      return `<reference protocol="${protocol}" resource="${resource}">\n${content}\n</reference>`;
    }

    // 语义化包装：根据不同协议使用不同的语义标记
    const semanticHeaders = {
      'thought': `\n## ✅ 💭 思维模式：${resource}`,
      'execution': `\n## ✅ ⚖️ 行为原则：${resource}`,
      'knowledge': `\n## ✅ 📚 知识体系：${resource}`,
      'role': `\n## 🎭 组合角色：${resource}`
    };

    const header = semanticHeaders[protocol] || `\n## ✅ 📎 引用：${resource}`;

    // 对内容进行语义化处理
    const semanticContent = this.semanticizeContent(content);

    return `${header}\n${semanticContent}`;
  }

  /**
   * 将 XML 标签语义化为自然语言
   */
  semanticizeContent(content) {
    if (this.renderMode === 'xml') {
      return content;
    }

    let result = content;

    // 思维层标签语义化
    result = result.replace(/<exploration>([\s\S]*?)<\/exploration>/gi,
      '\n### 🔍 探索与发现\n$1');
    result = result.replace(/<reasoning>([\s\S]*?)<\/reasoning>/gi,
      '\n### 💡 逻辑推理\n$1');
    result = result.replace(/<challenge>([\s\S]*?)<\/challenge>/gi,
      '\n### ⚡ 挑战与权衡\n$1');
    result = result.replace(/<plan>([\s\S]*?)<\/plan>/gi,
      '\n### 📋 实施计划\n$1');

    // 执行层标签语义化
    result = result.replace(/<constraint>([\s\S]*?)<\/constraint>/gi,
      '\n### ⚖️ 约束条件\n$1');
    result = result.replace(/<rule>([\s\S]*?)<\/rule>/gi,
      '\n### 📏 执行规则\n$1');
    result = result.replace(/<guideline>([\s\S]*?)<\/guideline>/gi,
      '\n### 📖 实践指南\n$1');
    result = result.replace(/<process>([\s\S]*?)<\/process>/gi,
      '\n### 🔄 工作流程\n$1');
    result = result.replace(/<criteria>([\s\S]*?)<\/criteria>/gi,
      '\n### ✅ 成功标准\n$1');

    // 移除多余的空行
    result = result.replace(/\n{3,}/g, '\n\n');

    return result;
  }

  /**
   * 语义占位符渲染：将@引用替换为实际内容
   * @param {Object} tagSemantics - 标签语义结构
   * @param {string} tagSemantics.fullSemantics - 完整的语义内容
   * @param {Array} tagSemantics.references - 引用列表
   * @param {ResourceManager} resourceManager - 资源管理器
   * @param {Set} visitedRoles - 已访问的角色集合（用于循环引用检测）
   * @returns {string} 完整融合的语义内容
   */
  async renderSemanticContent(tagSemantics, resourceManager, visitedRoles = new Set()) {
    if (!tagSemantics || !tagSemantics.fullSemantics) {
      return ''
    }

    let content = tagSemantics.fullSemantics

    if (!tagSemantics.references || tagSemantics.references.length === 0) {
      // 即使没有引用，也要语义化现有内容
      if (this.renderMode === 'semantic') {
        content = this.semanticizeContent(content);
      }
      return content.trim()
    }

    // 按出现顺序处理每个@引用（保持位置语义）
    // 需要按位置排序确保正确的替换顺序
    const sortedReferences = [...tagSemantics.references].sort((a, b) => a.position - b.position)

    for (const ref of sortedReferences) {
      try {
        // 解析引用内容
        let logger
        try {
          logger = require('@promptx/logger')
        } catch (e) {
          // logger is optional in test environment
          logger = { debug: () => {} }
        }
        logger.debug(`[SemanticRenderer] 正在解析引用: ${ref.fullMatch}`)

        // 角色协议的循环引用检测
        if (ref.protocol === 'role') {
          if (visitedRoles.has(ref.resource)) {
            const cycleChain = [...visitedRoles, ref.resource].join(' -> ')
            const errorMsg = this.renderMode === 'semantic'
              ? `\n⚠️ 检测到循环引用：${cycleChain}\n`
              : `<!-- 循环引用检测: ${cycleChain} -->`;
            content = content.replace(ref.fullMatch, errorMsg)
            continue
          }
          visitedRoles.add(ref.resource)
        }

        const result = await resourceManager.resolve(ref.fullMatch)
        logger.debug(`[SemanticRenderer] 解析结果:`, { success: result.success, error: result.error?.message })

        // 检查解析是否成功
        if (result.success) {
          let wrappedContent

          // 对于角色协议，需要递归解析角色内部的引用
          if (ref.protocol === 'role') {
            wrappedContent = await this.renderRoleContent(result.content, ref.resource, resourceManager, visitedRoles)
          } else {
            // 提取标签内容（去掉外层DPML标签）
            const cleanContent = this.extractTagInnerContent(result.content, ref.protocol)
            // 使用新的语义化包装方法
            wrappedContent = this.wrapReferenceContent(ref.protocol, ref.resource, cleanContent)
          }

          // 在原始位置替换@引用为实际内容
          const refIndex = content.indexOf(ref.fullMatch)
          if (refIndex !== -1) {
            content = content.substring(0, refIndex) + wrappedContent + content.substring(refIndex + ref.fullMatch.length)
          } else {
            content = content.replace(ref.fullMatch, wrappedContent)
          }
        } else {
          // 解析失败时也语义化
          const errorMsg = this.renderMode === 'semantic'
            ? `\n⚠️ 引用加载失败：${ref.resource} - ${result.error?.message || '未知错误'}\n`
            : `<!-- 引用解析失败: ${ref.fullMatch} - ${result.error?.message || 'Unknown error'} -->`;
          content = content.replace(ref.fullMatch, errorMsg)
        }
      } catch (error) {
        // 引用解析失败时的优雅降级
        const errorMsg = this.renderMode === 'semantic'
          ? `\n⚠️ 引用解析异常：${ref.resource} - ${error.message}\n`
          : `<!-- 引用解析失败: ${ref.fullMatch} - ${error.message} -->`;
        content = content.replace(ref.fullMatch, errorMsg)
      }
    }

    // 最后对整体内容进行语义化处理
    if (this.renderMode === 'semantic') {
      content = this.semanticizeContent(content);
    }

    return content.trim()
  }

  /**
   * 递归渲染角色内容
   * @param {string} roleContent - 角色文件的原始内容
   * @param {string} roleName - 角色名称
   * @param {ResourceManager} resourceManager - 资源管理器
   * @param {Set} visitedRoles - 已访问的角色集合
   * @returns {string} 渲染后的角色内容
   */
  async renderRoleContent(roleContent, roleName, resourceManager, visitedRoles) {
    const DPMLContentParser = require('./DPMLContentParser')
    const parser = new DPMLContentParser()

    // 解析角色文档的各个标签
    const roleSemantics = parser.parseRoleDocument(roleContent)

    // 构建渲染后的角色内容
    const renderedParts = []

    // 添加角色头
    renderedParts.push(`\n## 🎭 组合角色：${roleName}`)

    // 递归渲染每个标签
    const tagHeaders = {
      'personality': '💭 思维模式',
      'principle': '⚖️ 行为原则',
      'knowledge': '📚 知识体系'
    }

    for (const [tagName, header] of Object.entries(tagHeaders)) {
      if (roleSemantics[tagName]) {
        // 递归渲染标签内容（可能包含更多引用）
        const renderedContent = await this.renderSemanticContent(
          roleSemantics[tagName],
          resourceManager,
          new Set(visitedRoles) // 传递副本，避免影响其他分支
        )
        if (renderedContent) {
          renderedParts.push(`\n### ${header}\n${renderedContent}`)
        }
      }
    }

    return renderedParts.join('\n')
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