// LongTerm - 长期记忆具体实现
// 基于NeDB的持久化存储，支持通过Schema中的任何Cue检索

const { LongTermMemory } = require('../interfaces/LongTermMemory.js');
const path = require('path');
const fs = require('fs-extra');

// 临时的内存实现，等nedb安装后替换
class InMemoryDatastore {
  constructor(options) {
    this.filename = options.filename;
    this.data = new Map();
    this.indexes = new Map();
    
    // 如果有文件，尝试加载
    if (this.filename && fs.existsSync(this.filename)) {
      try {
        const content = fs.readFileSync(this.filename, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());
        lines.forEach(line => {
          const doc = JSON.parse(line);
          this.data.set(doc._id, doc);
        });
      } catch (e) {
        // 忽略加载错误
      }
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
    const result = {
      sort() { return this; },
      exec(callback) {
        let docs = Array.from(self.data.values());
        
        // 简单查询实现
        if (query.cues && query.cues.$in) {
          const searchCues = query.cues.$in;
          docs = docs.filter(doc => 
            doc.cues.some(cue => searchCues.includes(cue))
          );
        }
        
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
        console.warn('Failed to persist memory:', e.message);
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
      const doc = {
        _id: engram.getId(),
        content: engram.getContent(),
        type: engram.getType(),
        timestamp: engram.timestamp || new Date(),
        strength: engram.getStrength(),
        cues: this.extractCuesFromEngram(engram),  // 索引数组
        engram: this.serializeEngram(engram)       // 序列化的完整对象
      };
      
      // 使用upsert确保不重复
      this.db.update(
        { _id: doc._id },
        doc,
        { upsert: true },
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  recall(cue) {
    return new Promise((resolve) => {
      if (!cue || typeof cue !== 'string') {
        // 无线索时返回所有记忆
        this.db.find({}).sort({ timestamp: -1 }).exec((err, docs) => {
          if (err) {
            resolve([]);
          } else {
            resolve(docs.map(doc => this.deserializeEngram(doc.engram)));
          }
        });
      } else {
        // 基于cue查询：在cues数组中查找（不区分大小写）
        const lowercaseCue = cue.toLowerCase();
        this.db.find({}).exec((err, docs) => {
          if (err) {
            resolve([]);
          } else {
            // 手动过滤，因为我们的内存实现的查询功能有限
            const filtered = docs.filter(doc => {
              return doc.cues && doc.cues.some(c => c.toLowerCase().includes(lowercaseCue));
            });
            
            // 按strength和timestamp排序
            filtered.sort((a, b) => {
              // 先按strength降序
              if (b.strength !== a.strength) {
                return b.strength - a.strength;
              }
              // strength相同则按timestamp降序
              return new Date(b.timestamp) - new Date(a.timestamp);
            });
            
            resolve(filtered.map(doc => this.deserializeEngram(doc.engram)));
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
    
    // 1. 从content中提取关键词（简单分词）
    if (engram.getContent()) {
      const words = engram.getContent()
        .toLowerCase()
        .split(/[\s,，。.!！?？;；:：、]+/)  // 更完善的分词
        .filter(word => word.length > 1);     // 过滤掉单字符
      
      words.forEach(word => cues.add(word));
    }
    
    // 2. 从Schema中提取Cue（schema 是 Mermaid 格式字符串）
    if (engram.schema) {
      // 简单提取 Mermaid 中的词汇
      const mermaidWords = engram.schema
        .split(/[\n\s]+/)
        .filter(word => word && !word.startsWith('mindmap') && word.length > 1)
        .map(word => word.replace(/[)(}\]{[]/g, '').toLowerCase());
      mermaidWords.forEach(word => cues.add(word));
    }
    
    return Array.from(cues);
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
      // Schema可能需要特殊处理
      schema: engram.schema ? {
        name: engram.schema.name || null,
        // 其他需要序列化的schema属性
      } : null
    };
  }

  /**
   * 反序列化存储的对象为Engram
   * @private
   */
  deserializeEngram(data) {
    // 为了测试，返回一个包含必要属性的对象
    // 实际使用时需要重建真正的Engram对象
    return {
      id: data.id,
      content: data.content,
      type: data.type,
      strength: data.strength,
      timestamp: data.timestamp,
      schema: data.schema,
      // getter方法
      getId: () => data.id,
      getContent: () => data.content,
      getType: () => data.type,
      getStrength: () => data.strength
    };
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