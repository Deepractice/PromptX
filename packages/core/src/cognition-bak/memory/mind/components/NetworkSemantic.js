// NetworkSemantic - 基于网络的全局级实现
// 层次主导理论：作为最高层认知容器，永远主导所有连接

const { Semantic } = require('../interfaces/Semantic.js');
const Graph = require('graphology');
const v8 = require('v8');
const fs = require('fs').promises;
const path = require('path');
const { WeightedSemanticInterceptor } = require('../interceptors/WeightedSemanticInterceptor.js');

// 定义持久化方法
function addPersistableMethods(instance) {
  instance._storagePath = null;
  instance._autoPersist = true;
  
  instance.setStoragePath = function(path) {
    this._storagePath = path;
  };
  
  instance.setAutoPersist = function(enabled) {
    this._autoPersist = enabled;
  };
  
  instance.persist = async function() {
    if (!this._storagePath) return;
    
    const filePath = path.join(this._storagePath, 'semantic.bin');
    
    // 准备数据
    let data = {
      name: this.name,
      cueLayer: Array.from(this.cueLayer.entries()),
      schemaLayer: Array.from(this.schemaLayer.entries()),
      externalConnections: Array.from(this.externalConnections),
      _storagePath: this._storagePath,
      _autoPersist: this._autoPersist
    };
    
    // 应用拦截器的 beforePersist
    if (this.interceptor) {
      data = this.interceptor.beforePersist(data);
    }
    
    // 创建一个干净的对象用于序列化
    const cleanObject = {
      name: data.name,
      // 处理排序后的 cueLayer
      cueLayer: data.cueLayer.map(([word, cue]) => {
        const logger = require('../../../../../utils/logger.js');
        logger.info(`[NetworkSemantic.persist] Saving cue: ${word}, strength: ${cue.strength}`);
        return {
          word: word,
          connections: cue.getConnections ? cue.getConnections() : [],
          strength: cue.strength || 0.5
        };
      }),
      // 处理排序后的 schemaLayer
      schemaLayer: data.schemaLayer.map(([name, schema]) => ({
        name: name,
        cues: schema.getCues ? schema.getCues().map(cue => ({
          word: cue.word,
          connections: cue.getConnections ? cue.getConnections() : [],
          strength: cue.strength || 0.5
        })) : [],
        externalConnections: schema.externalConnections ? Array.from(schema.externalConnections) : []
      })),
      // 将 Set 转换为数组
      externalConnections: Array.from(this.externalConnections),
      _storagePath: this._storagePath,
      _autoPersist: this._autoPersist
    };
    
    const buffer = v8.serialize(cleanObject);
    
    // 确保目录存在
    await fs.mkdir(this._storagePath, { recursive: true });
    await fs.writeFile(filePath, buffer);
  };
  
  instance._triggerPersist = async function() {
    if (this._autoPersist) {
      // 异步持久化，不阻塞主流程
      setImmediate(() => this.persist().catch(console.error));
    }
  };
}

class NetworkSemantic extends Semantic {
  /**
   * 构造Semantic实例
   * @param {string} name - Semantic名称，默认为'GlobalSemantic'
   */
  constructor(name = 'GlobalSemantic') {
    super(name); // 调用Semantic接口的构造函数
    
    // 全局认知网络图 - 统一管理所有Mind节点和连接
    this.globalGraph = new Graph();
    
    // 分层映射 - 快速查找不同类型的Mind
    this.cueLayer = new Map();     // word -> WordCue，词汇层
    this.schemaLayer = new Map();  // name -> Schema，事件层
    
    // 外部连接：与其他Semantic的连接关系（认知网络的合并）
    this.externalConnections = new Set();
    
    // 添加持久化方法
    addPersistableMethods(this);
    
    // 创建权重拦截器实例
    this.interceptor = new WeightedSemanticInterceptor();
  }


  /**
   * Semantic的具体连接实现
   * 
   * **层次主导原则应用**：
   * - 作为最高层，永远主导所有连接
   * - 包含WordCue：直接加入全局词汇层
   * - 包含Schema：加入全局事件层
   * - 与Semantic连接：合并两个认知网络
   * 
   * @param {Mind} other - 目标Mind节点
   * @returns {Semantic} 永远返回自身（最高层主导）
   * @protected
   */
  _doConnect(other) {
    const otherLayer = other.getLayer();
    
    if (otherLayer === 1) {
      // 包含WordCue：加入全局词汇层
      this.addCue(other);
    } else if (otherLayer === 2) {
      // 包含Schema：加入全局事件层
      this.addSchema(other);
    } else if (otherLayer === 3) {
      // 合并Semantic：认知网络的融合
      if (other instanceof NetworkSemantic) {
        this.externalConnections.add(other.name);
        other.externalConnections.add(this.name);
      }
    }
    
    return this; // 永远返回自身，体现最高层主导
  }

  /**
   * Semantic的具体断联实现
   * 
   * **层次主导原则应用**：
   * - 作为最高层，主导所有断联决策
   * - 移除WordCue：从全局词汇层移除
   * - 移除Schema：从全局事件层移除
   * - 与Semantic断联：分离认知网络
   * 
   * @param {Mind} other - 目标Mind节点
   * @returns {Semantic} 永远返回自身（最高层主导）
   * @protected
   */
  _doDisconnect(other) {
    const otherLayer = other.getLayer();
    
    if (otherLayer === 1) {
      // 移除WordCue：从全局词汇层移除
      this.removeCue(other);
    } else if (otherLayer === 2) {
      // 移除Schema：从全局事件层移除
      this.removeSchema(other);
    } else if (otherLayer === 3) {
      // 分离Semantic：认知网络的分离
      if (other instanceof NetworkSemantic) {
        this.externalConnections.delete(other.name);
        other.externalConnections.delete(this.name);
      }
    }
    
    return this; // 永远返回自身，体现最高层主导
  }

  /**
   * 添加WordCue到全局认知网络
   * @param {WordCue} cue - 要添加的WordCue
   * @param {Object} engram - 可选的engram，用于初始化强度
   * @returns {Semantic} 返回自身，支持链式调用
   */
  addCue(cue, engram = null) {
    if (!cue || !cue.word) {
      throw new Error('Invalid cue provided');
    }
    
    // 检查是否已存在
    if (this.cueLayer.has(cue.word)) {
      const existingCue = this.cueLayer.get(cue.word);
      
      // 调用拦截器的合并策略
      if (this.interceptor && engram) {
        this.interceptor.onAddNode(existingCue, { merge: true, engram });
      }
      
      return this; // 返回已存在的情况
    }
    
    // 新 Cue：设置初始强度
    if (this.interceptor) {
      this.interceptor.onCreate(cue, { engram });
    }
    
    // 添加到全局图中
    const nodeId = `cue:${cue.word}`;
    if (!this.globalGraph.hasNode(nodeId)) {
      this.globalGraph.addNode(nodeId, { 
        type: 'cue', 
        mind: cue,
        layer: 1
      });
    }
    
    // 添加到快速查找映射
    this.cueLayer.set(cue.word, cue);
    
    // 触发自动持久化
    this._triggerPersist();
    
    return this;
  }

  /**
   * 从全局认知网络移除WordCue
   * @param {WordCue} cue - 要移除的WordCue
   * @returns {Semantic} 返回自身，支持链式调用
   */
  removeCue(cue) {
    if (!cue || !cue.word) return this;
    
    this.cueLayer.delete(cue.word);
    return this;
  }

  /**
   * 检查是否包含指定的WordCue
   * @param {WordCue} cue - 要检查的WordCue
   * @returns {boolean} 是否包含
   */
  hasCue(cue) {
    if (!cue || !cue.word) return false;
    return this.cueLayer.has(cue.word);
  }

  /**
   * 添加Schema到全局认知网络
   * @param {Schema} schema - 要添加的Schema
   * @returns {Semantic} 返回自身，支持链式调用
   */
  addSchema(schema) {
    if (!schema || !schema.name) {
      throw new Error('Invalid schema provided');
    }
    
    this.schemaLayer.set(schema.name, schema);
    
    // 同步 Schema 中的所有 Cues 到全局 cueLayer
    if (schema.getCues) {
      schema.getCues().forEach(cue => {
        // 如果cue已存在且新cue有更高强度，更新强度
        const existingCue = this.cueLayer.get(cue.word);
        if (existingCue && cue.strength > existingCue.strength) {
          existingCue.strength = cue.strength;
        } else if (!existingCue) {
          this.cueLayer.set(cue.word, cue);
        }
      });
    }
    
    // 触发自动持久化
    this._triggerPersist();
    
    return this;
  }

  /**
   * 从全局认知网络移除Schema
   * @param {Schema} schema - 要移除的Schema
   * @returns {Semantic} 返回自身，支持链式调用
   */
  removeSchema(schema) {
    if (!schema || !schema.name) return this;
    
    this.schemaLayer.delete(schema.name);
    return this;
  }

  /**
   * 检查是否包含指定的Schema
   * @param {Schema} schema - 要检查的Schema
   * @returns {boolean} 是否包含
   */
  hasSchema(schema) {
    if (!schema || !schema.name) return false;
    return this.schemaLayer.has(schema.name);
  }

  /**
   * 获取全局认知网络中的所有WordCue
   * @returns {Array<WordCue>} WordCue数组
   */
  getAllCues() {
    return Array.from(this.cueLayer.values());
  }

  /**
   * 获取全局认知网络中的所有Schema
   * @returns {Array<Schema>} Schema数组
   */
  getAllSchemas() {
    return Array.from(this.schemaLayer.values());
  }

  /**
   * 检查是否与另一个Semantic连接
   * @param {Semantic} other - 要检查的Semantic
   * @returns {boolean} 是否连接
   */
  isConnectedTo(other) {
    if (!(other instanceof NetworkSemantic)) return false;
    return this.externalConnections.has(other.name);
  }

  /**
   * 获取所有外部连接的Semantic名称
   * @returns {Array<string>} Semantic名称数组
   */
  getExternalConnections() {
    return Array.from(this.externalConnections);
  }

  /**
   * 获取连接的 Schema 组
   * 通过共享 Cue 或直接连接关系来判断 Schema 是否相连
   * @returns {Array<Array<Schema>>} Schema 组数组，每个组内的 Schema 相互连接
   */
  getConnectedSchemaGroups() {
    const schemas = this.getAllSchemas();
    const groups = [];
    const visited = new Set();
    
    schemas.forEach(schema => {
      if (!visited.has(schema.name)) {
        // 深度优先搜索找出所有连接的 schema
        const connectedGroup = this._findConnectedSchemas(schema, visited);
        groups.push(connectedGroup);
      }
    });
    
    return groups;
  }

  /**
   * 深度优先搜索找出与给定 Schema 连接的所有 Schema
   * @param {Schema} startSchema - 起始 Schema
   * @param {Set} visited - 已访问的 Schema 名称集合
   * @returns {Array<Schema>} 连接的 Schema 数组
   * @private
   */
  _findConnectedSchemas(startSchema, visited) {
    const group = [startSchema];
    visited.add(startSchema.name);
    
    // 获取起始 Schema 的所有 Cue
    const startCues = new Set(startSchema.getCues().map(cue => cue.word));
    
    this.getAllSchemas().forEach(otherSchema => {
      if (!visited.has(otherSchema.name)) {
        // 检查是否有共同的 Cue
        const otherCues = otherSchema.getCues();
        const hasSharedCue = otherCues.some(cue => startCues.has(cue.word));
        
        // 检查是否有直接连接（通过 externalConnections）
        const hasDirectConnection = startSchema.isConnectedTo && startSchema.isConnectedTo(otherSchema);
        
        if (hasSharedCue || hasDirectConnection) {
          // 递归查找连接的 Schema
          group.push(...this._findConnectedSchemas(otherSchema, visited));
        }
      }
    });
    
    return group;
  }

  /**
   * 检查是否与另一个Semantic相等
   * @param {Semantic} other - 对比的Semantic
   * @returns {boolean} 是否相等
   */
  equals(other) {
    return other instanceof NetworkSemantic && this.name === other.name;
  }

  /**
   * 返回Semantic的字符串表示
   * @returns {string} Semantic名称
   */
  toString() {
    return this.name;
  }

  /**
   * 获取全局认知网络的统计信息（调试用）
   * @returns {Object} 统计信息
   */
  getNetworkStats() {
    return {
      name: this.name,
      cueCount: this.cueLayer.size,
      schemaCount: this.schemaLayer.size,
      externalConnectionCount: this.externalConnections.size,
      totalMinds: this.cueLayer.size + this.schemaLayer.size
    };
  }

  /**
   * 全局搜索WordCue（根据词汇）
   * @param {string} word - 要搜索的词汇
   * @returns {WordCue|null} 找到的WordCue或null
   */
  findCue(word) {
    return this.cueLayer.get(word) || null;
  }

  /**
   * 全局搜索Schema（根据名称）
   * @param {string} name - 要搜索的Schema名称
   * @returns {Schema|null} 找到的Schema或null
   */
  findSchema(name) {
    return this.schemaLayer.get(name) || null;
  }
}

// 静态加载方法
NetworkSemantic.load = async function(storagePath, semanticName) {
  const filePath = path.join(storagePath, 'semantic.bin');
  
  try {
    const buffer = await fs.readFile(filePath);
    const data = v8.deserialize(buffer);
    
    // 重建 NetworkSemantic 实例
    const semantic = new NetworkSemantic(data.name);
    
    // 恢复 WordCue 对象
    const { WordCue } = require('./WordCue.js');
    const logger = require('../../../../../utils/logger.js');
    const cueMap = new Map();
    logger.info(`[NetworkSemantic.load] Loading ${data.cueLayer.length} cues from storage`);
    data.cueLayer.forEach(cueData => {
      logger.info(`[NetworkSemantic.load] Loading cue: ${cueData.word}, strength from data: ${cueData.strength}`);
      const cue = new WordCue(cueData.word, cueData.strength || 0.5);
      logger.info(`[NetworkSemantic.load] Created WordCue: ${cue.word}, strength: ${cue.strength}`);
      cueData.connections.forEach(conn => {
        cue.connections.add(conn);
      });
      cueMap.set(cueData.word, cue);
      semantic.cueLayer.set(cueData.word, cue);
    });
    
    // 恢复 GraphSchema 对象
    const { GraphSchema } = require('./GraphSchema.js');
    data.schemaLayer.forEach(schemaData => {
      const schema = new GraphSchema(schemaData.name);
      
      // 添加 Cues 到 Schema
      schemaData.cues.forEach(cueData => {
        let cue = cueMap.get(cueData.word);
        if (!cue) {
          cue = new WordCue(cueData.word, cueData.strength || 0.5);
          cueData.connections.forEach(conn => {
            cue.connections.add(conn);
          });
        }
        schema.addCue(cue);
      });
      
      // 恢复外部连接
      schema.externalConnections = new Set(schemaData.externalConnections);
      
      semantic.schemaLayer.set(schemaData.name, schema);
    });
    
    // 从数组恢复 Set
    semantic.externalConnections = new Set(data.externalConnections);
    
    // 设置存储路径
    semantic.setStoragePath(storagePath);
    semantic.setAutoPersist(data._autoPersist !== false);
    
    return semantic;
  } catch (error) {
    // 文件不存在，创建新的
    const semantic = new NetworkSemantic(semanticName);
    semantic.setStoragePath(storagePath);
    return semantic;
  }
};

module.exports = { NetworkSemantic };