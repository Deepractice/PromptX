// SimpleMindmapParser.js - 简单的Mermaid Mindmap解析器
// 使用正则表达式和递归下降解析，不依赖复杂的解析库

const { GraphSchema } = require('../components/GraphSchema');
const { WordCue } = require('../components/WordCue');

class SimpleMindmapParser {
  /**
   * 解析mermaid mindmap文本
   * @param {string} text - mindmap文本
   * @returns {GraphSchema} 解析后的Schema对象
   */
  parse(text) {
    const lines = text.split('\n').map(line => line.trimEnd());
    
    // 验证第一行是否为 "mindmap"
    if (!lines[0] || lines[0].trim() !== 'mindmap') {
      throw new Error('Invalid mindmap: must start with "mindmap"');
    }
    
    // 解析根节点
    let rootName = 'Root';
    let rootLineIndex = 1;
    
    // 跳过空行
    while (rootLineIndex < lines.length && lines[rootLineIndex].trim() === '') {
      rootLineIndex++;
    }
    
    if (rootLineIndex < lines.length) {
      const rootLine = lines[rootLineIndex].trim();
      // 提取根节点名称 ((name))
      const circleMatch = rootLine.match(/^\(\((.+?)\)\)$/);
      const squareMatch = rootLine.match(/^\[\[(.+?)\]\]$/);
      const hexMatch = rootLine.match(/^\{\{(.+?)\}\}$/);
      
      if (circleMatch) {
        rootName = circleMatch[1].trim();
      } else if (squareMatch) {
        rootName = squareMatch[1].trim();
      } else if (hexMatch) {
        rootName = hexMatch[1].trim();
      } else if (rootLine) {
        rootName = rootLine;
      }
    }
    
    // 创建根Schema
    const rootSchema = new GraphSchema(rootName);
    
    // 解析子节点
    const nodeStack = [];
    let prevIndent = -1;
    
    for (let i = rootLineIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim() === '') continue;
      
      // 计算缩进级别（2个空格为一级）
      const indent = this.getIndentLevel(line);
      const nodeName = line.trim();
      
      if (nodeName) {
        // 创建新的Cue
        const cue = new WordCue(nodeName);
        rootSchema.addCue(cue);
        
        // 根据缩进级别确定父节点
        if (indent > prevIndent) {
          // 子节点
          if (nodeStack.length > 0) {
            const parent = nodeStack[nodeStack.length - 1];
            parent.cue.connect(cue);
          }
        } else if (indent < prevIndent) {
          // 回到上级
          const levelDiff = prevIndent - indent;
          for (let j = 0; j < levelDiff; j++) {
            nodeStack.pop();
          }
          if (nodeStack.length > 0) {
            const parent = nodeStack[nodeStack.length - 1];
            parent.cue.connect(cue);
          }
        } else {
          // 同级节点
          nodeStack.pop();
          if (nodeStack.length > 0) {
            const parent = nodeStack[nodeStack.length - 1];
            parent.cue.connect(cue);
          }
        }
        
        // 将当前节点加入栈
        nodeStack.push({ cue, indent });
        prevIndent = indent;
      }
    }
    
    return rootSchema;
  }
  
  /**
   * 计算缩进级别
   * @param {string} line - 文本行
   * @returns {number} 缩进级别
   */
  getIndentLevel(line) {
    const match = line.match(/^(\s*)/);
    return match ? Math.floor(match[1].length / 2) : 0;
  }
  
  /**
   * 将Schema序列化为mermaid mindmap格式
   * @param {GraphSchema} schema - Schema对象
   * @returns {string} mermaid mindmap文本
   */
  serialize(schema) {
    const lines = ['mindmap'];
    
    // 添加根节点
    lines.push(`  ((${schema.name}))`);
    
    // 获取所有Cue并构建树结构
    const cues = schema.getCues();
    const tree = this.buildTree(cues);
    
    // 递归序列化树
    this.serializeTree(tree, lines, 2);
    
    return lines.join('\n');
  }
  
  /**
   * 构建Cue树结构
   * @param {Array<WordCue>} cues - 所有Cue
   * @returns {Array} 树结构
   */
  buildTree(cues) {
    const roots = [];
    const processed = new Set();
    
    // 找出根节点（没有被其他节点连接的）
    cues.forEach(cue => {
      let isRoot = true;
      cues.forEach(otherCue => {
        if (otherCue !== cue && otherCue.getConnections().includes(cue.word)) {
          isRoot = false;
        }
      });
      if (isRoot && !processed.has(cue.word)) {
        roots.push(this.buildSubtree(cue, cues, processed));
      }
    });
    
    return roots;
  }
  
  /**
   * 递归构建子树
   * @param {WordCue} cue - 当前节点
   * @param {Array<WordCue>} allCues - 所有Cue
   * @param {Set} processed - 已处理的节点
   * @returns {Object} 子树
   */
  buildSubtree(cue, allCues, processed) {
    if (processed.has(cue.word)) {
      return null;
    }
    
    processed.add(cue.word);
    
    const node = {
      name: cue.word,
      children: []
    };
    
    // 添加子节点
    cue.getConnections().forEach(connectedWord => {
      const connectedCue = allCues.find(c => c.word === connectedWord);
      if (connectedCue && !processed.has(connectedWord)) {
        const child = this.buildSubtree(connectedCue, allCues, processed);
        if (child) {
          node.children.push(child);
        }
      }
    });
    
    return node;
  }
  
  /**
   * 递归序列化树结构
   * @param {Array} nodes - 节点数组
   * @param {Array} lines - 输出行
   * @param {number} indent - 缩进级别
   */
  serializeTree(nodes, lines, indent) {
    nodes.forEach(node => {
      lines.push(' '.repeat(indent * 2) + node.name);
      if (node.children.length > 0) {
        this.serializeTree(node.children, lines, indent + 1);
      }
    });
  }
}