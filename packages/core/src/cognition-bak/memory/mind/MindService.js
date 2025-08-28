// MindService - Mind体系的服务层
// 提供Mind的添加、连接、持久化等核心功能

const fs = require('fs-extra');
const path = require('path');
const v8 = require('v8');
const { WordCue } = require('./components/WordCue.js');
const { GraphSchema } = require('./components/GraphSchema.js');
const { NetworkSemantic } = require('./components/NetworkSemantic.js');
const { peggyMindmap } = require('./mindmap/PeggyMindmap.js');
const logger = require('../../../../utils/logger.js');

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
   * @param {Object} engram - 可选的engram对象，包含强度值等元信息
   * @returns {Promise<NetworkSemantic>} 更新后的语义网络
   */
  async remember(mindmapText, semanticName = 'global-semantic', engram = null) {
    if (!mindmapText || typeof mindmapText !== 'string') {
      throw new Error('Invalid mindmap text provided');
    }

    console.log('[MindService.remember] Processing mindmap for:', semanticName);

    // 1. 使用当前网络或加载新的
    if (!this.currentSemantic || this.currentSemantic.name !== semanticName) {
      this.currentSemantic = await NetworkSemantic.load(this.storagePath, semanticName);
    }
    const semantic = this.currentSemantic;
    
    // 2. 规范化 mindmap 格式
    let normalizedMindmap = mindmapText.trim();
    if (!normalizedMindmap.startsWith('mindmap')) {
      console.log('[MindService.remember] Auto-fixing mindmap format: adding "mindmap" prefix');
      normalizedMindmap = `mindmap\n${normalizedMindmap}`;
    }
    
    // 3. 解析 mindmap 为 Schema
    const newSchema = peggyMindmap.parse(normalizedMindmap);
    console.log('[MindService.remember] Parsed schema:', newSchema.name);
    
    // 3.5 如果有engram，将强度值应用到所有Cue
    if (engram && engram.strength !== undefined) {
      console.log('[MindService.remember] Applying engram strength:', engram.strength);
      newSchema.getCues().forEach(cue => {
        cue.strength = engram.strength;
      });
    }
    
    // 4. 语义等价性检测和 Schema 合并
    const semanticEquivalents = this._findSemanticEquivalents(semantic, newSchema.name);
    const existingSchema = semantic.findSchema(newSchema.name) || semanticEquivalents[0];
    if (existingSchema) {
      // 使用 Mind 接口的 connect 方法进行合并
      console.log('[MindService.remember] Merging with existing schema using connect');
      existingSchema.connect(newSchema);
      // 同步合并后的 Cues 到全局 cueLayer
      existingSchema.getCues().forEach(cue => {
        semantic.cueLayer.set(cue.word, cue);
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
   * 通知节点被访问（用于更新权重）
   * @param {string} cue - 被访问的概念
   * @param {string} semanticName - 语义网络名称
   */
  async notifyAccess(cue, semanticName = 'global-semantic') {
    if (!cue) return;
    
    logger.info(`[MindService.notifyAccess] Notifying access for cue: "${cue}"`);
    
    // 使用缓存的实例或加载新的
    if (!this.currentSemantic || this.currentSemantic.name !== semanticName) {
      logger.info('[MindService.notifyAccess] Loading semantic network from storage');
      this.currentSemantic = await NetworkSemantic.load(this.storagePath, semanticName);
    }
    const semantic = this.currentSemantic;
    
    // 直接从全局 cueLayer 查找节点（避免重复处理）
    const cueNode = semantic.cueLayer.get(cue);
    
    if (cueNode) {
      logger.info(`[MindService.notifyAccess] Found cue "${cue}" with strength: ${cueNode.strength}`);
      
      // 触发 onAccess
      if (semantic.interceptor && semantic.interceptor.onAccess) {
        logger.info('[MindService.notifyAccess] Calling interceptor.onAccess');
        semantic.interceptor.onAccess(cueNode, 'recall');
        logger.info(`[MindService.notifyAccess] After onAccess, strength: ${cueNode.strength}`);
      } else {
        logger.warn('[MindService.notifyAccess] No interceptor or onAccess method found');
      }
    } else {
      logger.info(`[MindService.notifyAccess] Cue "${cue}" not found in semantic network`);
    }
    
    // 保存更新
    logger.info('[MindService.notifyAccess] Persisting semantic network');
    await semantic.persist();
  }

  /**
   * 导出语义网络为 mindmap - 用于可视化或调试
   * @param {string} semanticName - 语义网络名称
   * @returns {Promise<string>} Mermaid mindmap 格式的文本
   */
  async exportToMindmap(semanticName = 'global-semantic') {
    logger.info('[MindService.exportToMindmap] Starting export:', { semanticName });
    
    // 使用当前实例或加载新的
    if (!this.currentSemantic || this.currentSemantic.name !== semanticName) {
      this.currentSemantic = await NetworkSemantic.load(this.storagePath, semanticName);
    }
    const semantic = this.currentSemantic;
    
    const schemas = semantic.getAllSchemas();
    logger.info('[MindService.exportToMindmap] Schemas found:', {
      count: schemas.length,
      names: schemas.map(s => s.name),
      cueLayerSize: semantic.cueLayer?.size || 0,
      schemaLayerSize: semantic.schemaLayer?.size || 0
    });
    
    // 统一使用 'mind' 作为虚拟根节点
    const rootNodeName = 'mind';
    
    if (schemas.length === 0) {
      logger.warn('[MindService.exportToMindmap] No schemas found, returning empty mindmap');
      return `mindmap\n  ((${rootNodeName}))`;
    }
    
    // 始终创建统一的 mindmap 结构，即使只有一个 Schema
    const lines = ['mindmap'];
    lines.push(`  ((${rootNodeName}))`);
    
    // 如果只有一个 Schema，特殊处理以保持层级结构
    if (schemas.length === 1) {
      const schema = schemas[0];
      lines.push(`    ${schema.name}`);
      
      // 从 PeggyMindmap 序列化获取子节点
      const serialized = peggyMindmap.serialize(schema);
      const serializedLines = serialized.split('\n');
      
      // 跳过 mindmap 声明和根节点，只保留子节点
      let inContent = false;
      serializedLines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed === 'mindmap') return;
        if (trimmed.startsWith('((') && trimmed.endsWith('))')) {
          inContent = true;
          return;
        }
        if (inContent && trimmed) {
          // 增加缩进层级
          const leadingSpaces = line.match(/^(\s*)/)[1].length;
          lines.push(`      ${line.substring(leadingSpaces)}`);
        }
      });
      
      // 应用拦截器的 onPrime 处理
      let mindmap = lines.join('\n');
      if (semantic.interceptor && semantic.interceptor.onPrime) {
        mindmap = semantic.interceptor.onPrime(mindmap);
      }
      return mindmap;
    }
    
    // 多个 Schema 时的处理
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
        // 添加 strength 信息 (如果存在)
        logger.info(`[MindService.exportToMindmap] Processing cue: ${cue.word}, strength: ${cue.strength}, type: ${typeof cue.strength}`);
        const strengthInfo = cue.strength !== undefined ? ` [${cue.strength.toFixed(2)}]` : '';
        lines.push(`${' '.repeat(indent)}${cue.word}${strengthInfo}`);
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
    
    // 生成最终的 mindmap 字符串
    let mindmap = lines.join('\n');
    
    // 应用拦截器的 onPrime 处理
    if (semantic.interceptor && semantic.interceptor.onPrime) {
      mindmap = semantic.interceptor.onPrime(mindmap);
    }
    
    return mindmap;
  }




  /**
   * Prime语义网络 - 加载语义网络并返回 mindmap 表示
   * @param {string} semanticName - 语义网络名称
   * @returns {Promise<string>} Mermaid mindmap 格式的字符串
   */
  async primeSemantic(semanticName = 'global-semantic') {
    console.log('[MindService.primeSemantic] Loading semantic:', semanticName);
    logger.info('[MindService.primeSemantic] Starting prime for:', { 
      semanticName, 
      storagePath: this.storagePath,
      hasCached: !!this.currentSemantic,
      cachedName: this.currentSemantic?.name 
    });
    
    // 优先使用缓存的实例，只有在没有缓存或名称不同时才重新加载
    if (!this.currentSemantic || this.currentSemantic.name !== semanticName) {
      logger.info('[MindService.primeSemantic] Loading from storage');
      this.currentSemantic = await NetworkSemantic.load(this.storagePath, semanticName);
      logger.info('[MindService.primeSemantic] Loaded semantic:', {
        name: this.currentSemantic.name,
        schemasCount: this.currentSemantic.getAllSchemas().length,
        cueLayerSize: this.currentSemantic.cueLayer?.size || 0,
        schemaLayerSize: this.currentSemantic.schemaLayer?.size || 0
      });
    } else {
      logger.info('[MindService.primeSemantic] Using cached semantic network');
    }
    
    // 转换为 mindmap
    const mindmap = await this.exportToMindmap(semanticName);
    logger.info('[MindService.primeSemantic] Generated mindmap:', {
      length: mindmap.length,
      preview: mindmap.substring(0, 200)
    });
    return mindmap;
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

  /**
   * 查找语义等价的Schema
   * @param {NetworkSemantic} semantic - 语义网络
   * @param {string} schemaName - 待查找的Schema名称
   * @returns {Array<GraphSchema>} 语义等价的Schema列表
   * @private
   */
  _findSemanticEquivalents(semantic, schemaName) {
    // 简单的语义映射表 - 后续可以升级为更智能的方案
    const semanticMappings = {
      '个人生活': ['personal-life', 'personal-lifestyle', 'life-style'],
      'personal-life': ['个人生活', 'personal-lifestyle', 'life-style'],
      '饮食偏好': ['food-preferences', 'dietary-preferences'],
      'food-preferences': ['饮食偏好', 'dietary-preferences'],
      '蔬菜': ['vegetables', 'veggies'],
      'vegetables': ['蔬菜', 'veggies'],
      '西红柿': ['tomato', 'tomatoes'],
      'tomato': ['西红柿', 'tomatoes']
    };

    console.log(`[MindService.remember] Checking semantic equivalents for: ${schemaName}`);
    console.log(`[MindService.remember] Available schemas in semantic:`, semantic.getAllSchemas().map(s => s.name));
    
    const equivalentNames = semanticMappings[schemaName] || [];
    console.log(`[MindService.remember] Equivalent names to check:`, equivalentNames);
    
    const equivalentSchemas = [];

    for (const name of equivalentNames) {
      const schema = semantic.findSchema(name);
      if (schema) {
        console.log(`[MindService.remember] Found semantic equivalent: ${schemaName} ≈ ${name}`);
        equivalentSchemas.push(schema);
      } else {
        console.log(`[MindService.remember] No schema found for equivalent name: ${name}`);
      }
    }

    return equivalentSchemas;
  }

}

module.exports = { MindService };