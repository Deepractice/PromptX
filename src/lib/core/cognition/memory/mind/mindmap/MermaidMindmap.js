// MermaidMindmap.js - MindMap接口的Mermaid实现
// 使用Chevrotain解析器实现完整的mermaid mindmap格式支持

const { MindMap } = require('../interfaces/MindMap');
const { MindmapLexer } = require('./MindmapLexer');
const { mindmapParser } = require('./MindmapParser');
const { mindmapVisitor } = require('./MindmapVisitor');
const { NetworkSemantic } = require('../components/NetworkSemantic');

class MermaidMindmap extends MindMap {
  constructor() {
    super();
    this.lexer = MindmapLexer;
    this.parser = mindmapParser;
    this.visitor = mindmapVisitor;
  }

  /**
   * 解析mermaid mindmap字符串为Schema对象
   * @param {string} mindmapText - mermaid mindmap格式的字符串
   * @returns {Schema} 解析后的Schema对象
   * @throws {Error} 解析失败时抛出错误
   */
  parse(mindmapText) {
    if (!mindmapText || typeof mindmapText !== 'string') {
      throw new Error('Invalid mindmap text');
    }

    // 1. 词法分析
    const lexResult = this.lexer.tokenize(mindmapText);
    
    if (lexResult.errors.length > 0) {
      const error = lexResult.errors[0];
      throw new Error(`Lexer error at line ${error.line}, column ${error.column}: ${error.message}`);
    }

    // 2. 语法分析
    this.parser.input = lexResult.tokens;
    const cst = this.parser.mindmapDocument();
    
    if (this.parser.errors.length > 0) {
      const error = this.parser.errors[0];
      throw new Error(`Parser error: ${error.message}`);
    }

    // 3. AST转换
    const schema = this.visitor.visit(cst);
    
    return schema;
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
    const { indentSize = 2, includeIcons = false } = options;
    
    if (!schema) {
      throw new Error('Schema is required');
    }

    const lines = ['mindmap'];
    
    // 根节点使用圆形
    lines.push(`${' '.repeat(indentSize)}((${schema.name}))`);
    
    // 获取所有Cue并构建层次结构
    const cues = schema.getCues();
    const processed = new Set();
    const rootCues = [];

    // 找出根级别的Cue（没有被其他Cue连接的）
    cues.forEach(cue => {
      let isRoot = true;
      cues.forEach(otherCue => {
        if (otherCue !== cue && otherCue.getConnections().includes(cue.word)) {
          isRoot = false;
        }
      });
      if (isRoot) {
        rootCues.push(cue);
      }
    });

    // 递归序列化每个根Cue及其子节点
    rootCues.forEach(rootCue => {
      this._serializeCue(lines, rootCue, cues, processed, indentSize, 2);
    });

    return lines.join('\n');
  }

  /**
   * 递归序列化Cue
   * @private
   */
  _serializeCue(lines, cue, allCues, processed, indentSize, level) {
    if (processed.has(cue.word)) {
      return;
    }
    
    processed.add(cue.word);
    
    // 添加当前节点
    lines.push(`${' '.repeat(indentSize * level)}${cue.word}`);
    
    // 处理连接的子节点
    const connections = cue.getConnections();
    connections.forEach(connectedWord => {
      const connectedCue = allCues.find(c => c.word === connectedWord);
      if (connectedCue) {
        this._serializeCue(lines, connectedCue, allCues, processed, indentSize, level + 1);
      }
    });
  }

  /**
   * 验证mermaid mindmap语法是否正确
   * @param {string} mindmapText - 要验证的mindmap文本
   * @returns {Object} 验证结果 {valid: boolean, errors: Array}
   */
  validate(mindmapText) {
    const errors = [];
    
    try {
      // 尝试解析
      this.parse(mindmapText);
      return { valid: true, errors: [] };
    } catch (error) {
      errors.push(error.message);
      return { valid: false, errors };
    }
  }

  /**
   * 合并多个mindmap文本
   * 用于增量更新场景，避免覆盖问题
   * @param {string} existingText - 现有的mindmap文本
   * @param {string} newText - 要追加的新mindmap文本
   * @returns {string} 合并后的mindmap文本
   */
  merge(existingText, newText) {
    // 解析现有文本
    let existingSchema = null;
    if (existingText && existingText.trim()) {
      try {
        existingSchema = this.parse(existingText);
      } catch (error) {
        // 如果解析失败，创建新的
        existingSchema = new NetworkSemantic('merged');
      }
    } else {
      existingSchema = new NetworkSemantic('merged');
    }

    // 解析新文本
    let newSchema = null;
    try {
      newSchema = this.parse(newText);
    } catch (error) {
      // 如果新文本解析失败，返回原文本
      return existingText || '';
    }

    // 合并Schema
    // 将新Schema的所有Cue添加到现有Schema
    const newCues = newSchema.getCues();
    newCues.forEach(newCue => {
      // 检查是否已存在同名Cue
      const existingCue = existingSchema.getCues().find(c => c.word === newCue.word);
      
      if (!existingCue) {
        // 不存在则添加
        existingSchema.addCue(newCue);
      } else {
        // 存在则合并连接关系
        newCue.getConnections().forEach(connection => {
          if (!existingCue.getConnections().includes(connection)) {
            const targetCue = existingSchema.getCues().find(c => c.word === connection);
            if (targetCue) {
              existingCue.connect(targetCue);
            }
          }
        });
      }
    });

    // 序列化合并后的Schema
    return this.serialize(existingSchema);
  }
}

// 导出单例实例
const mermaidMindmap = new MermaidMindmap();

module.exports = {
  MermaidMindmap,
  mermaidMindmap
};