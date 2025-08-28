// LongTerm - 长期记忆具体实现
// 基于NeDB的持久化存储，支持通过Schema中的任何Cue检索

const { LongTermMemory } = require('../interfaces/LongTermMemory.js');
const path = require('path');
const fs = require('fs-extra');
const logger = require('../../../../utils/logger.js');
const { peggyMindmap } = require('../mind/mindmap/PeggyMindmap.js');

// 临时的内存实现，等nedb安装后替换
class InMemoryDatastore {
  constructor(options) {
    this.filename = options.filename;
    this.data = new Map();
    this.indexes = new Map();
    
    logger.info('[InMemoryDatastore] Initializing, file path:', this.filename);
    
    // 如果有文件，尝试加载
    if (this.filename && fs.existsSync(this.filename)) {
      try {
        const content = fs.readFileSync(this.filename, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());
        logger.info('[InMemoryDatastore] Loading data from file, lines:', lines.length);
        
        lines.forEach((line, index) => {
          const doc = JSON.parse(line);
          this.data.set(doc._id, doc);
          logger.debug(`[InMemoryDatastore] Loaded record ${index + 1}:`, {
            id: doc._id,
            type: doc.type,
            cues: doc.cues?.slice(0, 3) // 只显示前3个cues
          });
        });
        
        logger.info('[InMemoryDatastore] Data loaded, total records:', this.data.size);
      } catch (e) {
        logger.error('[InMemoryDatastore] Failed to load data:', e.message);
      }
    } else {
      logger.info('[InMemoryDatastore] File not exists or path is empty, using empty database');
    }
  }
  
  ensureIndex(options) {
    // 简单记录索引字段
    this.indexes.set(options.fieldName, true);
  }
  
  update(query, doc, options, callback) {
    const id = query._id;
    if (options.upsert) {
      this.data.set(id, doc);
      this.persist();
    }
    callback(null);
  }
  
  find(query) {
    const self = this;
    logger.info('[InMemoryDatastore.find] Query:', JSON.stringify(query));
    logger.info('[InMemoryDatastore.find] Current data size:', self.data.size);
    
    const result = {
      sort() { return this; },
      exec(callback) {
        let docs = Array.from(self.data.values());
        logger.info('[InMemoryDatastore.find.exec] Total docs before filter:', docs.length);
        
        // 简单查询实现
        if (query.cues && query.cues.$in) {
          const searchCues = query.cues.$in;
          logger.info('[InMemoryDatastore.find.exec] Searching with cues:', searchCues);
          docs = docs.filter(doc => 
            doc.cues.some(cue => searchCues.includes(cue))
          );
          logger.info('[InMemoryDatastore.find.exec] Docs after cues filter:', docs.length);
        }
        
        logger.info('[InMemoryDatastore.find.exec] Returning docs:', docs.length);
        callback(null, docs);
      }
    };
    return result;
  }
  
  count(query, callback) {
    callback(null, this.data.size);
  }
  
  persist() {
    if (this.filename) {
      try {
        // 确保目录存在
        fs.ensureDirSync(path.dirname(this.filename));
        const lines = Array.from(this.data.values())
          .map(doc => JSON.stringify(doc))
          .join('\n');
        fs.writeFileSync(this.filename, lines);
      } catch (e) {
        // 忽略持久化错误，继续在内存中运行
        logger.warn('[InMemoryDatastore] Failed to persist memory:', e.message);
      }
    }
  }
  
  persistence = {
    compactDatafile: () => {}
  };
}

class LongTerm extends LongTermMemory {
  constructor(options = {}) {
    super();
    
    // 支持options参数或旧的dbPath参数
    if (typeof options === 'string') {
      options = { dbPath: options };
    }
    
    // 如果是纯内存模式，不使用文件路径
    let dbPath;
    if (options.inMemoryOnly) {
      dbPath = null;
    } else {
      // 默认存储路径
      const defaultPath = path.join(__dirname, '../../../../../../../.promptx/memory/longterm.db');
      dbPath = options.dbPath || process.env.LONG_TERM_DB_PATH || defaultPath;
    }
    
    // 初始化存储（临时使用内存实现）
    this.db = new InMemoryDatastore({ 
      filename: dbPath,
      autoload: true 
    });
    
    // 创建索引：支持数组字段的高效查询
    this.db.ensureIndex({ fieldName: 'cues' });
    this.db.ensureIndex({ fieldName: 'type' });
    this.db.ensureIndex({ fieldName: 'timestamp' });
  }

  remember(engram) {
    return new Promise((resolve, reject) => {
      logger.info('[LongTerm.remember] Storing engram:', {
        id: engram.getId(),
        type: engram.getType(),
        content: engram.getContent()?.substring(0, 50) + '...'
      });
      
      const doc = {
        _id: engram.getId(),
        content: engram.getContent(),
        type: engram.getType(),
        timestamp: engram.timestamp || new Date(),
        strength: engram.getStrength(),
        cues: this.extractCuesFromEngram(engram),  // 索引数组
        engram: this.serializeEngram(engram)       // 序列化的完整对象
      };
      
      logger.info('[LongTerm.remember] Extracted cues:', doc.cues);
      
      // 使用upsert确保不重复
      this.db.update(
        { _id: doc._id },
        doc,
        { upsert: true },
        (err) => {
          if (err) {
            logger.error('[LongTerm.remember] Failed to store:', err.message);
            reject(err);
          } else {
            logger.success('[LongTerm.remember] Successfully stored engram:', doc._id);
            resolve();
          }
        }
      );
    });
  }

  recall(cue) {
    return new Promise((resolve) => {
      logger.info('[LongTerm.recall] Starting recall with cue:', cue);
      
      if (!cue || typeof cue !== 'string') {
        logger.info('[LongTerm.recall] No cue provided, returning all memories');
        // 无线索时返回所有记忆
        this.db.find({}).sort({ timestamp: -1 }).exec((err, docs) => {
          if (err) {
            logger.error('[LongTerm.recall] Error finding all docs:', err.message);
            resolve([]);
          } else {
            logger.info('[LongTerm.recall] Found all docs:', docs.length);
            resolve(docs.map(doc => this.deserializeEngram(doc.engram)));
          }
        });
      } else {
        // 基于cue查询：在cues数组中查找（不区分大小写）
        const lowercaseCue = cue.toLowerCase();
        logger.info('[LongTerm.recall] Searching with lowercase cue:', lowercaseCue);
        
        this.db.find({}).exec((err, docs) => {
          if (err) {
            logger.error('[LongTerm.recall] Error finding docs:', err.message);
            resolve([]);
          } else {
            logger.info('[LongTerm.recall] Total docs found:', docs.length);
            
            // 手动过滤，因为我们的内存实现的查询功能有限
            const filtered = docs.filter(doc => {
              const hasCues = doc.cues && Array.isArray(doc.cues);
              if (!hasCues) {
                logger.debug('[LongTerm.recall] Doc missing cues:', doc._id);
                return false;
              }
              
              const matches = doc.cues.some(c => {
                const cueStr = String(c).toLowerCase();
                const isMatch = cueStr.includes(lowercaseCue);
                if (isMatch) {
                  logger.debug('[LongTerm.recall] Match found - cue:', c, 'search:', lowercaseCue);
                }
                return isMatch;
              });
              
              return matches;
            });
            
            logger.info('[LongTerm.recall] Filtered results:', filtered.length);
            
            // 按strength和timestamp排序
            filtered.sort((a, b) => {
              // 先按strength降序
              if (b.strength !== a.strength) {
                return b.strength - a.strength;
              }
              // strength相同则按timestamp降序
              return new Date(b.timestamp) - new Date(a.timestamp);
            });
            
            const engrams = filtered.map(doc => this.deserializeEngram(doc.engram));
            logger.info('[LongTerm.recall] Returning engrams:', engrams.length);
            resolve(engrams);
          }
        });
      }
    });
  }

  /**
   * 从Engram中提取所有Cue用于索引
   * @private
   */
  extractCuesFromEngram(engram) {
    const cues = new Set();
    
    // 1. 保留完整content作为cue（用于精确匹配）
    if (engram.getContent()) {
      const content = engram.getContent();
      // 添加完整内容
      cues.add(content.toLowerCase());
      
      // 基础分词作为补充（用于模糊匹配）
      const words = content
        .toLowerCase()
        .split(/[\s,，。.!！?？;；:：、]+/)
        .filter(word => word.length > 1);
      words.forEach(word => cues.add(word));
    }
    
    // 2. 使用 PeggyMindmap 解析 schema，提取每个节点作为完整的cue
    if (engram.schema) {
      try {
        // 规范化 mindmap 格式
        let normalizedSchema = engram.schema.trim();
        if (!normalizedSchema.startsWith('mindmap')) {
          normalizedSchema = `mindmap\n${normalizedSchema}`;
        }
        
        // 解析得到 GraphSchema 对象
        const schema = peggyMindmap.parse(normalizedSchema);
        
        // 从 GraphSchema 提取所有节点
        if (schema.name) {
          cues.add(schema.name.toLowerCase());
        }
        
        // 从 internalGraph 提取所有节点
        if (schema.internalGraph && schema.internalGraph.nodes) {
          schema.internalGraph.nodes.forEach(node => {
            if (node.key) {
              cues.add(node.key.toLowerCase());
            }
          });
        }
        
        logger.debug('[LongTerm.extractCues] Extracted nodes from schema:', Array.from(cues).slice(-5));
        
      } catch (e) {
        // 如果解析失败，降级到简单处理
        logger.warn('[LongTerm.extractCues] Failed to parse schema, using fallback:', e.message);
        // 改进的降级方案：每行都是一个完整的节点
        const lines = engram.schema.split('\n');
        lines.forEach(line => {
          // 保留原始行，只移除前后空格
          const trimmedLine = line.trim();
          
          // 跳过空行和 mindmap 声明
          if (!trimmedLine || trimmedLine === 'mindmap') {
            return;
          }
          
          // 处理 root((xxx)) 格式
          if (trimmedLine.includes('root((')) {
            const match = trimmedLine.match(/root\(\((.+?)\)\)/);
            if (match) {
              cues.add(match[1].toLowerCase());
            }
            // 不 return，root 行本身也可能包含其他信息
          }
          
          // 整行作为一个节点（移除缩进但保留内容）
          const nodeContent = trimmedLine.replace(/^[\s\t]+/, '');
          if (nodeContent && nodeContent.length > 1 && !nodeContent.startsWith('root((')) {
            cues.add(nodeContent.toLowerCase());
          }
        });
      }
    }
    
    const cuesArray = Array.from(cues);
    logger.info('[LongTerm.extractCues] Total cues extracted:', cuesArray.length, 'Sample:', cuesArray.slice(0, 5));
    return cuesArray;
  }

  /**
   * 序列化Engram对象以便存储
   * @private
   */
  serializeEngram(engram) {
    return {
      id: engram.getId(),
      content: engram.getContent(),
      type: engram.getType(),
      strength: engram.getStrength(),
      timestamp: engram.timestamp,
      // Schema 是 Mermaid 格式字符串，直接保存
      schema: engram.schema || null
    };
  }

  /**
   * 反序列化存储的对象为Engram
   * @private
   */
  deserializeEngram(data) {
    // 重建真正的 Engram 实例
    const { Engram } = require('../../engram/Engram.js');
    const engram = new Engram(data.content, data.schema, data.type);
    
    // 恢复其他属性
    engram.id = data.id;
    engram.strength = data.strength;
    engram.timestamp = new Date(data.timestamp);
    
    return engram;
  }

  /**
   * 获取存储的记忆总数
   */
  size() {
    return new Promise((resolve) => {
      this.db.count({}, (err, count) => {
        resolve(err ? 0 : count);
      });
    });
  }

  /**
   * 压缩数据库文件
   */
  compact() {
    this.db.persistence.compactDatafile();
  }
}

module.exports = { LongTerm };