// MindService - Mind体系的服务层
// 提供Mind的添加、连接、持久化等核心功能

const fs = require('fs-extra');
const path = require('path');
const v8 = require('v8');
const { WordCue } = require('./components/WordCue.js');
const { GraphSchema } = require('./components/GraphSchema.js');
const { NetworkSemantic } = require('./components/NetworkSemantic.js');
const { peggyMindmap } = require('./mindmap/PeggyMindmap.js');

class MindService {
  constructor() {
    this.storagePath = null;
    this.currentSemantic = null;  // 当前加载的语义网络
  }

  /**
   * 设置存储路径
   * @param {string} storagePath - 存储目录路径
   */
  setStoragePath(storagePath) {
    this.storagePath = storagePath;
  }

  /**
   * 添加Mind到Semantic容器
   * @param {Mind} mind - 任何类型的Mind（Cue/Schema/Semantic）
   * @param {Semantic} semantic - 目标Semantic容器 
   */
  async addMind(mind, semantic) {
    if (!mind || !semantic) {
      throw new Error('Mind and Semantic are required');
    }

    // 根据Mind类型调用相应的添加方法
    if (mind.getLayer() === 1) {
      // WordCue
      semantic.addCue(mind);
    } else if (mind.getLayer() === 2) {
      // GraphSchema
      semantic.addSchema(mind);
    } else if (mind.getLayer() === 3) {
      // NetworkSemantic - 使用connect建立嵌套关系
      semantic.connect(mind);
    } else {
      throw new Error(`Unknown Mind type with layer: ${mind.getLayer()}`);
    }
  }

  /**
   * 连接两个Mind
   * @param {Mind} mind1 - 源Mind
   * @param {Mind} mind2 - 目标Mind
   */
  async connectMinds(mind1, mind2) {
    if (!mind1 || !mind2) {
      throw new Error('Both minds are required for connection');
    }

    // 利用Mind的connect方法，层次主导原则会自动处理
    mind1.connect(mind2);
  }

  /**
   * 记忆新内容 - 解析 mindmap 并添加到语义网络
   * @param {string} mindmapText - Mermaid mindmap 格式的文本
   * @param {string} semanticName - 目标语义网络名称
   * @returns {Promise<NetworkSemantic>} 更新后的语义网络
   */
  async remember(mindmapText, semanticName = 'global-semantic') {
    if (!mindmapText || typeof mindmapText !== 'string') {
      throw new Error('Invalid mindmap text provided');
    }

    console.log('[MindService.remember] Processing mindmap for:', semanticName);

    // 1. 使用当前网络或加载新的
    if (!this.currentSemantic || this.currentSemantic.name !== semanticName) {
      this.currentSemantic = await NetworkSemantic.load(this.storagePath, semanticName);
    }
    const semantic = this.currentSemantic;
    
    // 2. 解析 mindmap 为 Schema
    const newSchema = peggyMindmap.parse(mindmapText);
    console.log('[MindService.remember] Parsed schema:', newSchema.name);
    
    // 3. 处理 Schema 合并
    const existingSchema = semantic.findSchema(newSchema.name);
    if (existingSchema) {
      // 合并 Cues
      console.log('[MindService.remember] Merging with existing schema');
      newSchema.getCues().forEach(cue => {
        if (!existingSchema.hasCue(cue)) {
          existingSchema.addCue(cue);
          // 同步新的 Cue 到全局 cueLayer
          semantic.cueLayer.set(cue.word, cue);
        }
      });
    } else {
      // 添加新 Schema
      console.log('[MindService.remember] Adding new schema');
      semantic.addSchema(newSchema);
    }
    
    // NetworkSemantic 会自动持久化
    return semantic;
  }

  /**
   * 导出语义网络为 mindmap - 用于可视化或调试
   * @param {string} semanticName - 语义网络名称
   * @returns {Promise<string>} Mermaid mindmap 格式的文本
   */
  async exportToMindmap(semanticName = 'global-semantic') {
    // 使用当前实例或加载新的
    if (!this.currentSemantic || this.currentSemantic.name !== semanticName) {
      this.currentSemantic = await NetworkSemantic.load(this.storagePath, semanticName);
    }
    const semantic = this.currentSemantic;
    
    const schemas = semantic.getAllSchemas();
    if (schemas.length === 0) {
      return `mindmap\n  ((${semantic.name}))`;
    }
    
    // 如果只有一个 Schema，直接序列化
    if (schemas.length === 1) {
      return peggyMindmap.serialize(schemas[0]);
    }
    
    // 多个 Schema，创建统一的 mindmap
    const lines = ['mindmap'];
    lines.push(`  ((${semantic.name}))`);
    
    // 每个 Schema 作为根节点的子节点
    schemas.forEach(schema => {
      lines.push(`    ${schema.name}`);
      
      // 获取所有 Cues 并按层级组织
      const cues = schema.getCues();
      const rootCues = [];
      const cueMap = new Map();
      
      // 创建 cue 映射
      cues.forEach(cue => {
        cueMap.set(cue.word, cue);
      });
      
      // 找出根节点（没有被其他节点连接的节点）
      const connectedCues = new Set();
      cues.forEach(cue => {
        cue.getConnections().forEach(connected => {
          connectedCues.add(connected);
        });
      });
      
      cues.forEach(cue => {
        // 排除与 schema 同名的根节点，避免重复
        if (!connectedCues.has(cue.word) && cue.word !== schema.name) {
          rootCues.push(cue);
        }
      });
      
      // 递归添加节点
      const addCue = (cue, indent) => {
        lines.push(`${' '.repeat(indent)}${cue.word}`);
        cue.getConnections().forEach(childWord => {
          const childCue = cueMap.get(childWord);
          if (childCue) {
            addCue(childCue, indent + 2);
          }
        });
      };
      
      // 添加所有根 Cues
      rootCues.forEach(cue => {
        addCue(cue, 6);
      });
      
      // 如果没有其他根节点，但有与 schema 同名的节点，则添加其子节点
      if (rootCues.length === 0) {
        const schemaCue = cueMap.get(schema.name);
        if (schemaCue) {
          schemaCue.getConnections().forEach(childWord => {
            const childCue = cueMap.get(childWord);
            if (childCue) {
              addCue(childCue, 6);
            }
          });
        }
      }
    });
    
    return lines.join('\n');
  }




  /**
   * Prime语义网络 - 加载语义网络并返回 mindmap 表示
   * @param {string} semanticName - 语义网络名称
   * @returns {Promise<string>} Mermaid mindmap 格式的字符串
   */
  async primeSemantic(semanticName = 'global-semantic') {
    console.log('[MindService.primeSemantic] Loading semantic:', semanticName);
    
    // 加载语义网络到内存（如果不存在会自动创建）
    this.currentSemantic = await NetworkSemantic.load(this.storagePath, semanticName);
    
    // 转换为 mindmap
    return this.exportToMindmap(semanticName);
  }

  /**
   * 添加Mind到指定语义网络
   * @param {Mind} mind - 要添加的Mind对象
   * @param {string} semanticName - 目标语义网络名称
   */
  async addMindToSemantic(mind, semanticName = 'global-semantic') {
    if (!mind) {
      throw new Error('Mind is required');
    }

    console.log('[MindService.addMindToSemantic] Processing mind:', mind.name || 'unnamed');

    // 加载语义网络
    const semantic = await NetworkSemantic.load(this.storagePath, semanticName);
    
    // 添加Mind到语义网络
    await this.addMind(mind, semantic);
    
    // NetworkSemantic 会自动持久化
  }

}

module.exports = { MindService };