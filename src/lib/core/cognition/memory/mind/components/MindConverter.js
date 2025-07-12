// MindConverter.js - Mind转Mermaid字符串转换器

class MindConverter {
  /**
   * 将Mind对象转换为Mermaid思维导图文本
   * @param {Mind} mind - 要转换的Mind对象（Cue/Schema/Semantic）
   * @param {Object} options - 转换选项（保留扩展性）
   * @returns {string} Mermaid mindmap文本
   */
  convertMindToMermaid(mind, options = {}) {
    if (!mind) {
      throw new Error('Mind is required');
    }

    // 默认转换为mindmap格式，更符合认知结构表达
    let mermaidText = 'mindmap\n';
    
    // 根据Mind类型进行不同的转换
    const layer = mind.getLayer();
    
    if (layer === 1) {
      // WordCue - 根节点
      mermaidText += this._convertWordCueToMindmap(mind);
    } else if (layer === 2) {
      // GraphSchema - 分支结构
      mermaidText += this._convertGraphSchemaToMindmap(mind);
    } else if (layer === 3) {
      // NetworkSemantic - 完整思维导图
      mermaidText += this._convertNetworkSemanticToMindmap(mind);
    } else {
      throw new Error(`Unsupported Mind layer: ${layer}`);
    }

    return mermaidText;
  }

  /**
   * 转换WordCue为Mermaid思维导图根节点
   * @param {WordCue} cue - WordCue实例
   * @returns {string} Mermaid mindmap文本片段
   * @private
   */
  _convertWordCueToMindmap(cue) {
    const word = this._sanitizeNodeName(cue.word);
    let text = `  root)${word})\n`;
    
    // 添加连接的词汇作为子节点
    const connections = cue.getConnections();
    if (connections && connections.length > 0) {
      connections.forEach(targetWord => {
        const sanitizedTarget = this._sanitizeNodeName(targetWord);
        text += `    ${sanitizedTarget}\n`;
      });
    }
    
    return text;
  }

  /**
   * 转换GraphSchema为Mermaid思维导图分支
   * @param {GraphSchema} schema - GraphSchema实例
   * @returns {string} Mermaid mindmap文本片段
   * @private
   */
  _convertGraphSchemaToMindmap(schema) {
    const schemaName = this._sanitizeNodeName(schema.name);
    let text = `  root)${schemaName})\n`;
    
    // 获取Schema中的所有Cue作为子节点
    const cues = schema.getCues();
    if (cues && cues.length > 0) {
      cues.forEach(cue => {
        const cueName = this._sanitizeNodeName(cue.word);
        text += `    ${cueName}\n`;
        
        // 如果Cue有连接，作为下一级子节点
        const connections = cue.getConnections();
        if (connections && connections.length > 0) {
          connections.forEach(targetWord => {
            const sanitizedTarget = this._sanitizeNodeName(targetWord);
            text += `      ${sanitizedTarget}\n`;
          });
        }
      });
    }
    
    return text;
  }

  /**
   * 转换NetworkSemantic为Mermaid完整思维导图
   * @param {NetworkSemantic} semantic - NetworkSemantic实例
   * @returns {string} Mermaid mindmap文本片段
   * @private
   */
  _convertNetworkSemanticToMindmap(semantic) {
    const semanticName = this._sanitizeNodeName(semantic.name);
    let text = `  root)${semanticName})\n`;
    
    // 处理所有Schema作为主要分支
    const schemas = semantic.getAllSchemas();
    if (schemas && schemas.length > 0) {
      schemas.forEach(schema => {
        const schemaName = this._sanitizeNodeName(schema.name);
        text += `    ${schemaName}\n`;
        
        // Schema中的Cue作为子分支
        const cues = schema.getCues();
        if (cues && cues.length > 0) {
          cues.forEach(cue => {
            const cueName = this._sanitizeNodeName(cue.word);
            text += `      ${cueName}\n`;
            
            // Cue的连接作为叶子节点
            const connections = cue.getConnections();
            if (connections && connections.length > 0) {
              connections.forEach(targetWord => {
                const sanitizedTarget = this._sanitizeNodeName(targetWord);
                text += `        ${sanitizedTarget}\n`;
              });
            }
          });
        }
      });
    }
    
    // 处理独立的Cue（不属于任何Schema的）
    const allCues = semantic.getAllCues();
    if (allCues && allCues.length > 0) {
      const schemasCues = new Set();
      
      // 收集所有Schema中的Cue
      if (schemas) {
        schemas.forEach(schema => {
          const schemaCues = schema.getCues();
          if (schemaCues) {
            schemaCues.forEach(cue => schemasCues.add(cue.word));
          }
        });
      }
      
      // 处理独立的Cue
      const independentCues = allCues.filter(cue => !schemasCues.has(cue.word));
      if (independentCues.length > 0) {
        independentCues.forEach(cue => {
          const cueName = this._sanitizeNodeName(cue.word);
          text += `    ${cueName}\n`;
          
          // 独立Cue的连接
          const connections = cue.getConnections();
          if (connections && connections.length > 0) {
            connections.forEach(targetWord => {
              const sanitizedTarget = this._sanitizeNodeName(targetWord);
              text += `      ${sanitizedTarget}\n`;
            });
          }
        });
      }
    }
    
    // 如果没有任何内容，显示空的根节点
    if (text.trim() === `  root)${semanticName})`) {
      text += `    (Empty)\n`;
    }
    
    return text;
  }

  /**
   * 将 Mermaid mindmap 字符串转换为 GraphSchema
   * 注意：这是一个简化实现，专门用于 mindmap 格式
   * @param {string} mermaidText - Mermaid mindmap 格式的文本
   * @returns {GraphSchema|null} 转换后的 Schema，如果输入为空则返回 null
   */
  convertMermaidToSchema(mermaidText) {
    if (!mermaidText || typeof mermaidText !== 'string') {
      return null;
    }

    // 导入需要的组件
    const { WordCue } = require('./WordCue.js');
    const { GraphSchema } = require('./GraphSchema.js');

    // 移除 mindmap 声明行
    const lines = mermaidText
      .split('\n')
      .filter(line => !line.trim().startsWith('mindmap') && line.trim());

    if (lines.length === 0) {
      return null;
    }

    // 创建 Schema，使用第一个节点内容作为名称
    const firstLine = lines[0];
    const schemaName = this._extractMindmapContent(firstLine) || 'converted-schema';
    const schema = new GraphSchema(schemaName);
    
    // 解析节点和层级关系
    const nodes = [];
    const baseIndent = this._getIndentLevel(lines[0]);
    
    lines.forEach((line, index) => {
      const indent = this._getIndentLevel(line);
      const level = Math.floor((indent - baseIndent) / 2); // 假设每级缩进2个空格
      const content = this._extractMindmapContent(line);
      
      if (content) {
        nodes.push({ level, content, index });
      }
    });

    // 构建 Schema：将所有节点作为 Cue 添加
    const cueMap = new Map();
    
    nodes.forEach(node => {
      const cue = new WordCue(node.content);
      schema.connect(cue);
      cueMap.set(node.index, { cue, level: node.level, content: node.content });
    });

    // 建立层级连接关系
    for (let i = 0; i < nodes.length; i++) {
      const currentNode = nodes[i];
      const currentCueInfo = cueMap.get(currentNode.index);
      
      // 找到所有直接子节点
      for (let j = i + 1; j < nodes.length; j++) {
        const nextNode = nodes[j];
        
        // 如果遇到同级或更高级节点，停止搜索
        if (nextNode.level <= currentNode.level) {
          break;
        }
        
        // 如果是直接子节点，建立连接
        if (nextNode.level === currentNode.level + 1) {
          const childCueInfo = cueMap.get(nextNode.index);
          if (currentCueInfo && childCueInfo) {
            currentCueInfo.cue.connect(childCueInfo.cue);
          }
        }
      }
    }

    return schema;
  }

  /**
   * 提取 mindmap 节点的内容
   * @private
   */
  _extractMindmapContent(line) {
    const trimmed = line.trim();
    
    // 处理 root)content) 格式
    const rootMatch = trimmed.match(/^root\)(.+)\)$/);
    if (rootMatch) {
      return rootMatch[1];
    }
    
    // 处理 root((content)) 格式
    const rootDoubleMatch = trimmed.match(/^root\(\((.+)\)\)$/);
    if (rootDoubleMatch) {
      return rootDoubleMatch[1];
    }
    
    // 处理双括号格式：{{content}}
    const doubleCurlyMatch = trimmed.match(/^\{\{(.+)\}\}$/);
    if (doubleCurlyMatch) {
      return doubleCurlyMatch[1];
    }
    
    // 处理其他括号格式：[content]、(content)、{content} 等
    const bracketMatch = trimmed.match(/^[\[({](.+)[\])}]$/);
    if (bracketMatch) {
      return bracketMatch[1];
    }
    
    // 如果没有特殊格式，返回整行内容（去除缩进）
    return trimmed;
  }

  /**
   * 获取行的缩进级别（空格数）
   * @private
   */
  _getIndentLevel(line) {
    const match = line.match(/^(\s*)/);
    return match ? match[1].length : 0;
  }


  /**
   * 清理节点名称，确保Mermaid兼容性
   * @param {string} name - 原始名称
   * @returns {string} 清理后的名称
   * @private
   */
  _sanitizeNodeName(name) {
    if (!name) return 'unnamed';
    
    // 保留中文字符，只替换空格为下划线
    return name
      .replace(/\s+/g, '_')
      .trim();
  }
}

module.exports = { MindConverter };