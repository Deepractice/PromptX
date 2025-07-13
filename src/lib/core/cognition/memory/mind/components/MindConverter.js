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
    
    // 根据Mind类型进行不同的转换
    const layer = mind.getLayer();
    
    if (layer === 1) {
      // WordCue - 根节点
      return 'mindmap\n' + this._convertWordCueToMindmap(mind);
    } else if (layer === 2) {
      // GraphSchema - 分支结构
      return 'mindmap\n' + this._convertGraphSchemaToMindmap(mind);
    } else if (layer === 3) {
      // NetworkSemantic - 完整思维导图
      // 特殊处理：可能返回多个 mindmap
      return this._convertNetworkSemanticToMindmap(mind);
    } else {
      throw new Error(`Unsupported Mind layer: ${layer}`);
    }
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
    // 检测是否有 getConnectedSchemaGroups 方法
    if (semantic.getConnectedSchemaGroups) {
      // 获取所有连接的 Schema 组
      const schemaGroups = semantic.getConnectedSchemaGroups();
      
      // 如果有多个独立的组，分别生成 mindmap
      if (schemaGroups.length > 1) {
        return this._convertMultipleGroupsToMindmap(schemaGroups);
      } else if (schemaGroups.length === 1) {
        // 只有一个组，生成单个 mindmap
        return this._convertSchemaGroupToMindmap(schemaGroups[0]);
      }
    }
    
    // 降级到原有逻辑（向后兼容）
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
   * 转换多个独立的 Schema 组为多个 Mermaid mindmap
   * @param {Array<Array<Schema>>} schemaGroups - Schema 组数组
   * @returns {string} 多个 Mermaid mindmap 文本
   * @private
   */
  _convertMultipleGroupsToMindmap(schemaGroups) {
    let result = '';
    
    schemaGroups.forEach((group, index) => {
      if (index > 0) {
        // 在不同的 mindmap 之间添加空行分隔
        result += '\n';
      }
      result += 'mindmap\n';
      result += this._convertSchemaGroupToMindmap(group);
    });
    
    return result;
  }

  /**
   * 转换单个 Schema 组为 Mermaid mindmap
   * @param {Array<Schema>} schemas - Schema 数组
   * @returns {string} Mermaid mindmap 文本片段
   * @private
   */
  _convertSchemaGroupToMindmap(schemas) {
    let text = '';
    
    if (schemas.length === 1) {
      // 单个 Schema，以 Schema 名称作为根节点
      const schema = schemas[0];
      const schemaName = this._sanitizeNodeName(schema.name);
      text += `  root((${schemaName}))\n`;
      
      // 添加 Schema 的内容
      text += this._addSchemaContent(schema, '    ');
    } else {
      // 多个相关联的 Schema，找一个合适的根节点名称
      // 暂时使用第一个 Schema 的名称，未来可以优化
      const rootName = this._findCommonRootName(schemas);
      text += `  root((${rootName}))\n`;
      
      // 添加所有 Schema
      schemas.forEach(schema => {
        const schemaName = this._sanitizeNodeName(schema.name);
        text += `    ${schemaName}\n`;
        text += this._addSchemaContent(schema, '      ');
      });
    }
    
    return text;
  }

  /**
   * 添加 Schema 的内容（Cue 和连接）
   * @param {Schema} schema - Schema 实例
   * @param {string} indent - 缩进字符串
   * @returns {string} Schema 内容的 Mermaid 文本
   * @private
   */
  _addSchemaContent(schema, indent) {
    let text = '';
    const cues = schema.getCues();
    
    if (cues && cues.length > 0) {
      cues.forEach(cue => {
        const cueName = this._sanitizeNodeName(cue.word);
        text += `${indent}${cueName}\n`;
        
        // Cue 的连接
        const connections = cue.getConnections();
        if (connections && connections.length > 0) {
          connections.forEach(targetWord => {
            const sanitizedTarget = this._sanitizeNodeName(targetWord);
            text += `${indent}  ${sanitizedTarget}\n`;
          });
        }
      });
    }
    
    return text;
  }

  /**
   * 找出多个 Schema 的共同根节点名称
   * @param {Array<Schema>} schemas - Schema 数组
   * @returns {string} 根节点名称
   * @private
   */
  _findCommonRootName(schemas) {
    // 简单实现：返回所有 Schema 名称的组合
    // 未来可以通过分析共同 Cue 来找出更合适的名称
    if (schemas.length <= 3) {
      return schemas.map(s => s.name).join('-');
    }
    return `${schemas[0].name}-等${schemas.length}个主题`;
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