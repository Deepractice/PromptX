// PeggyMindmap.js - 基于 Peggy 的 MindMap 实现
// 使用 Peggy 解析器实现 mermaid mindmap 格式支持

const peggy = require('peggy');
const fs = require('fs');
const path = require('path');
const { MindMap } = require('../interfaces/MindMap');
const { GraphSchema } = require('../components/GraphSchema');
const { WordCue } = require('../components/WordCue');

class PeggyMindmap extends MindMap {
  constructor() {
    super();
    
    // 加载并编译语法文件
    const grammarPath = path.join(__dirname, 'mindmap.pegjs');
    const grammar = fs.readFileSync(grammarPath, 'utf8');
    this.parser = peggy.generate(grammar);
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

    try {
      // 使用 Peggy 解析
      const ast = this.parser.parse(mindmapText);
      
      // 将 AST 转换为 Schema
      return this.astToSchema(ast);
    } catch (error) {
      throw new Error(`Parse error: ${error.message}`);
    }
  }

  /**
   * 将 AST 转换为 Schema
   * @private
   */
  astToSchema(node) {
    const schema = new GraphSchema(node.name);
    
    // 存储所有节点的映射
    const nodeMap = new Map();
    
    // 递归处理节点
    this.processNode(node, schema, nodeMap, null);
    
    return schema;
  }

  /**
   * 递归处理节点
   * @private
   */
  processNode(node, schema, nodeMap, parentCue) {
    // 创建当前节点的 Cue
    let cue = nodeMap.get(node.name);
    if (!cue) {
      cue = new WordCue(node.name);
      schema.addCue(cue);
      nodeMap.set(node.name, cue);
    }
    
    // 如果有父节点，建立单向连接（父->子）
    if (parentCue) {
      // 只建立父到子的连接，不建立双向连接
      if (!parentCue.getConnections().includes(cue.word)) {
        parentCue.connections.add(cue.word);
      }
      // 同时在 Schema 的内部图中建立连接
      schema.connectCues(parentCue, cue);
    }
    
    // 递归处理子节点
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        this.processNode(child, schema, nodeMap, cue);
      });
    }
  }

  /**
   * 将Schema对象序列化为mermaid mindmap字符串
   * @param {Schema} schema - 要序列化的Schema对象
   * @param {Object} options - 序列化选项
   * @param {number} options.indentSize - 缩进空格数，默认2
   * @returns {string} mermaid mindmap格式的字符串
   */
  serialize(schema, options = {}) {
    const { indentSize = 2 } = options;
    
    if (!schema) {
      throw new Error('Schema is required');
    }

    const lines = ['mindmap'];
    
    // 根节点使用圆形
    lines.push(`${' '.repeat(indentSize)}((${schema.name}))`);
    
    // 构建树结构
    const tree = this.buildTree(schema);
    
    // 序列化树
    this.serializeTree(tree, lines, indentSize, 2);
    
    return lines.join('\n');
  }

  /**
   * 构建树结构
   * @private
   */
  buildTree(schema) {
    const cues = schema.getCues();
    const processed = new Set();
    
    // 对于 mindmap，根节点是 Schema 名称对应的节点
    // 如果找不到，就选择第一个节点
    let rootCue = cues.find(cue => cue.word === schema.name);
    if (!rootCue && cues.length > 0) {
      rootCue = cues[0];
    }
    
    if (!rootCue) {
      return [];
    }
    
    return [this.buildSubtree(rootCue, cues, processed)];
  }

  /**
   * 构建子树
   * @private
   */
  buildSubtree(cue, allCues, processed) {
    if (processed.has(cue.word)) {
      return null;
    }
    
    processed.add(cue.word);
    
    const node = {
      name: cue.word,
      strength: cue.strength,  // 保存 strength 信息
      children: []
    };
    
    // 添加子节点
    cue.getConnections().forEach(connectedWord => {
      const connectedCue = allCues.find(c => c.word === connectedWord);
      if (connectedCue) {
        const child = this.buildSubtree(connectedCue, allCues, processed);
        if (child) {
          node.children.push(child);
        }
      }
    });
    
    return node;
  }

  /**
   * 序列化树
   * @private
   */
  serializeTree(nodes, lines, indentSize, level) {
    nodes.forEach(node => {
      // 添加 strength 信息 (如果存在)
      const strengthInfo = node.strength !== undefined ? ` [${node.strength.toFixed(2)}]` : '';
      lines.push(' '.repeat(indentSize * level) + node.name + strengthInfo);
      if (node.children.length > 0) {
        this.serializeTree(node.children, lines, indentSize, level + 1);
      }
    });
  }

  /**
   * 验证mermaid mindmap语法是否正确
   * @param {string} mindmapText - 要验证的mindmap文本
   * @returns {Object} 验证结果 {valid: boolean, errors: Array}
   */
  validate(mindmapText) {
    try {
      this.parse(mindmapText);
      return { valid: true, errors: [] };
    } catch (error) {
      return { valid: false, errors: [error.message] };
    }
  }

  /**
   * 合并多个mindmap文本
   * @param {string} existingText - 现有的mindmap文本
   * @param {string} newText - 要追加的新mindmap文本
   * @returns {string} 合并后的mindmap文本
   */
  merge(existingText, newText) {
    let existingSchema = null;
    let newSchema = null;
    
    // 解析现有文本
    if (existingText && existingText.trim()) {
      try {
        existingSchema = this.parse(existingText);
      } catch (error) {
        // 如果解析失败，创建新的
        existingSchema = new GraphSchema('Root');
      }
    } else {
      existingSchema = new GraphSchema('Root');
    }
    
    // 解析新文本
    try {
      newSchema = this.parse(newText);
    } catch (error) {
      // 如果新文本解析失败，返回原文本
      return existingText || '';
    }
    
    // 合并 Schema
    const newCues = newSchema.getCues();
    newCues.forEach(newCue => {
      // 检查是否已存在
      const existingCue = existingSchema.getCues().find(c => c.word === newCue.word);
      
      if (!existingCue) {
        // 添加新的 Cue
        existingSchema.addCue(newCue);
      } else {
        // 合并连接关系
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
    
    // 序列化合并后的 Schema
    return this.serialize(existingSchema);
  }
}

// 导出单例实例
const peggyMindmap = new PeggyMindmap();

module.exports = {
  PeggyMindmap,
  peggyMindmap
};