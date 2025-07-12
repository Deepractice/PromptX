// MindService - Mind体系的服务层
// 提供Mind的添加、连接、持久化等核心功能

const fs = require('fs-extra');
const path = require('path');
const { WordCue } = require('./components/WordCue.js');
const { GraphSchema } = require('./components/GraphSchema.js');
const { NetworkSemantic } = require('./components/NetworkSemantic.js');
const { MindConverter } = require('./components/MindConverter.js');

class MindService {
  constructor() {
    this.storagePath = null;
    this.converter = new MindConverter();
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
   * 持久化Semantic及其所有内容
   * @param {Semantic} semantic - 要持久化的Semantic
   */
  async persistSemantic(semantic) {
    if (!semantic) {
      throw new Error('Semantic is required for persistence');
    }

    if (!this.storagePath) {
      throw new Error('Storage path not set. Call setStoragePath() first.');
    }

    // 确保存储目录存在
    await fs.ensureDir(this.storagePath);

    // 序列化Semantic
    const serializedData = this._serializeSemantic(semantic);

    // 写入文件
    const filePath = path.join(this.storagePath, `${semantic.name}.json`);
    await fs.writeJson(filePath, serializedData, { spaces: 2 });
  }

  /**
   * 从持久化文件加载Semantic
   * @param {string} semanticName - Semantic名称
   * @returns {Semantic} 加载的Semantic实例
   */
  async loadSemantic(semanticName) {
    if (!semanticName) {
      throw new Error('Semantic name is required for loading');
    }

    if (!this.storagePath) {
      throw new Error('Storage path not set. Call setStoragePath() first.');
    }

    const filePath = path.join(this.storagePath, `${semanticName}.json`);
    
    if (!await fs.pathExists(filePath)) {
      throw new Error(`Semantic file not found: ${filePath}`);
    }

    // 读取并反序列化
    const serializedData = await fs.readJson(filePath);
    return this._deserializeSemantic(serializedData);
  }

  /**
   * 序列化Semantic为JSON格式
   * @param {Semantic} semantic - 要序列化的Semantic
   * @returns {Object} 序列化后的数据
   * @private
   */
  _serializeSemantic(semantic) {
    const data = {
      name: semantic.name,
      type: 'NetworkSemantic',
      created: new Date().toISOString(),
      cues: [],
      schemas: [],
      connections: {
        cueConnections: {},
        schemaConnections: {},
        externalConnections: []
      }
    };

    // 序列化所有Cue
    const allCues = semantic.getAllCues();
    allCues.forEach(cue => {
      data.cues.push({
        word: cue.word,
        connections: cue.getConnections()
      });
      
      // 记录Cue的连接关系
      data.connections.cueConnections[cue.word] = cue.getConnections();
    });

    // 序列化所有Schema
    const allSchemas = semantic.getAllSchemas();
    allSchemas.forEach(schema => {
      data.schemas.push({
        name: schema.name,
        cues: schema.getCues().map(cue => cue.word),
        connections: schema.getExternalConnections()
      });

      // 记录Schema的连接关系
      data.connections.schemaConnections[schema.name] = schema.getExternalConnections();
    });

    // 记录Semantic级别的外部连接
    data.connections.externalConnections = semantic.getExternalConnections();

    return data;
  }

  /**
   * 反序列化JSON数据为Semantic实例
   * @param {Object} data - 序列化的数据
   * @returns {Semantic} 反序列化后的Semantic实例
   * @private
   */
  _deserializeSemantic(data) {
    // 创建Semantic实例
    const semantic = new NetworkSemantic(data.name);

    // 重建Cue实例
    const cueMap = new Map();
    data.cues.forEach(cueData => {
      const cue = new WordCue(cueData.word);
      cueMap.set(cueData.word, cue);
      semantic.addCue(cue);
    });

    // 重建Schema实例
    const schemaMap = new Map();
    data.schemas.forEach(schemaData => {
      const schema = new GraphSchema(schemaData.name);
      
      // 添加Schema包含的Cue
      schemaData.cues.forEach(cueWord => {
        const cue = cueMap.get(cueWord);
        if (cue) {
          schema.addCue(cue);
        }
      });
      
      schemaMap.set(schemaData.name, schema);
      semantic.addSchema(schema);
    });

    // 重建Cue之间的连接
    Object.entries(data.connections.cueConnections).forEach(([cueWord, connections]) => {
      const sourceCue = cueMap.get(cueWord);
      if (sourceCue) {
        connections.forEach(targetWord => {
          const targetCue = cueMap.get(targetWord);
          if (targetCue) {
            // 重建连接关系（避免重复连接）
            if (!sourceCue.getConnections().includes(targetWord)) {
              sourceCue.connect(targetCue);
            }
          }
        });
      }
    });

    // 重建Schema之间的连接
    Object.entries(data.connections.schemaConnections).forEach(([schemaName, connections]) => {
      const sourceSchema = schemaMap.get(schemaName);
      if (sourceSchema) {
        connections.forEach(targetName => {
          const targetSchema = schemaMap.get(targetName);
          if (targetSchema) {
            // 重建连接关系（避免重复连接）
            if (!sourceSchema.isConnectedTo(targetSchema)) {
              sourceSchema.connect(targetSchema);
            }
          }
        });
      }
    });

    return semantic;
  }

  // ============ Mermaid字符串版本API ============

  /**
   * 将Mind转换为Mermaid字符串
   * @param {Mind} mind - 要转换的Mind对象
   * @param {Object} options - 转换选项
   * @returns {string} Mermaid图形文本
   */
  convertMindToMermaid(mind, options = {}) {
    return this.converter.convertMindToMermaid(mind, options);
  }

  /**
   * 持久化Mind为Mermaid文件
   * @param {Mind} mind - 要持久化的Mind
   * @param {string} filename - 文件名（不含扩展名）
   * @param {Object} options - 转换选项
   */
  async persistMindAsMermaid(mind, filename, options = {}) {
    if (!mind || !filename) {
      throw new Error('Mind and filename are required');
    }

    if (!this.storagePath) {
      throw new Error('Storage path not set. Call setStoragePath() first.');
    }

    // 确保存储目录存在
    await fs.ensureDir(this.storagePath);

    // 转换为Mermaid文本
    const mermaidText = this.converter.convertMindToMermaid(mind, options);

    // 写入.mmd文件
    const filePath = path.join(this.storagePath, `${filename}.mmd`);
    await fs.writeFile(filePath, mermaidText, 'utf8');

    return filePath;
  }

  /**
   * 从Mermaid文件读取文本
   * @param {string} filename - 文件名（不含扩展名）
   * @returns {string} Mermaid文本内容
   */
  async loadMermaidText(filename) {
    if (!filename) {
      throw new Error('Filename is required');
    }

    if (!this.storagePath) {
      throw new Error('Storage path not set. Call setStoragePath() first.');
    }

    const filePath = path.join(this.storagePath, `${filename}.mmd`);
    
    if (!await fs.pathExists(filePath)) {
      throw new Error(`Mermaid file not found: ${filePath}`);
    }

    return await fs.readFile(filePath, 'utf8');
  }

  /**
   * 复合操作：持久化Semantic为JSON和Mermaid两种格式
   * @param {Semantic} semantic - 要持久化的Semantic
   * @param {Object} options - 转换选项
   * @returns {Object} 包含两个文件路径的对象
   */
  async persistSemanticBoth(semantic, options = {}) {
    if (!semantic) {
      throw new Error('Semantic is required for persistence');
    }

    // 并行持久化JSON和Mermaid
    const [jsonResult, mermaidPath] = await Promise.all([
      this.persistSemantic(semantic),
      this.persistMindAsMermaid(semantic, semantic.name, options)
    ]);

    return {
      jsonPath: path.join(this.storagePath, `${semantic.name}.json`),
      mermaidPath: mermaidPath
    };
  }
}

module.exports = { MindService };