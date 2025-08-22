// MindMap - Mermaid Mindmap格式转换接口
// 负责string格式的mermaid mindmap与Schema对象之间的相互转换
//
// 核心职责：
// 1. parse: 将mermaid mindmap语法字符串解析为Schema对象
// 2. serialize: 将Schema对象序列化为mermaid mindmap语法字符串
//
// 设计原则：
// 1. 完全兼容mermaid mindmap语法规范
// 2. 支持增量更新（追加式存储）
// 3. 保持人类可读性和git友好性
// 4. 使用Chevrotain作为解析器实现
//
// Mermaid Mindmap语法示例：
// ```
// mindmap
//   root((mindmap))
//     Origins
//       Long history
//       ::icon(fa fa-book)
//       Popularisation
//         British popular psychology author Tony Buzan
//     Research
//       On effectiveness<br/>and features
//       On Automatic creation
//         Uses
//           Creative techniques
//           Strategic planning
//           Argument mapping
// ```

class MindMap {
  /**
   * 解析mermaid mindmap字符串为Schema对象
   * @param {string} mindmapText - mermaid mindmap格式的字符串
   * @returns {Schema} 解析后的Schema对象
   * @throws {Error} 解析失败时抛出错误
   */
  parse(mindmapText) {
    throw new Error('MindMap.parse() must be implemented');
  }

  /**
   * 将Schema对象序列化为mermaid mindmap字符串
   * @param {Schema} schema - 要序列化的Schema对象
   * @param {Object} options - 序列化选项
   * @param {number} options.indentSize - 缩进空格数，默认2
   * @param {boolean} options.includeIcons - 是否包含图标，默认false
   * @returns {string} mermaid mindmap格式的字符串
   */
  serialize(schema, options = {}) {
    throw new Error('MindMap.serialize() must be implemented');
  }

  /**
   * 验证mermaid mindmap语法是否正确
   * @param {string} mindmapText - 要验证的mindmap文本
   * @returns {Object} 验证结果 {valid: boolean, errors: Array}
   */
  validate(mindmapText) {
    throw new Error('MindMap.validate() must be implemented');
  }

  /**
   * 合并多个mindmap文本
   * 用于增量更新场景，避免覆盖问题
   * @param {string} existingText - 现有的mindmap文本
   * @param {string} newText - 要追加的新mindmap文本
   * @returns {string} 合并后的mindmap文本
   */
  merge(existingText, newText) {
    throw new Error('MindMap.merge() must be implemented');
  }
}

module.exports = { MindMap };