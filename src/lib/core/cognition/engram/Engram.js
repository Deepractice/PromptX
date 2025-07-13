// MemoryEngram - 记忆痕迹具体实现
// 包含自然语言内容和结构化认知

const { EngramType } = require('./interfaces/Engram.js');

// 用于生成唯一ID的计数器
let idCounter = 0;

class Engram {
  constructor(content, schema, type = EngramType.ATOMIC) {
    // 生成唯一ID：时间戳+计数器
    this.id = `${Date.now()}-${idCounter++}`;
    this.content = content;      // 自然语言内容
    this.schema = schema;        // 结构化认知 (Mermaid mindmap 格式的字符串)
    this.type = type;           
    this.timestamp = new Date();
    this.strength = 1.0;
  }

  getId() {
    return this.id;
  }

  getContent() {
    return this.content;
  }

  getType() {
    return this.type;
  }

  getStrength() {
    return this.strength;
  }

  getSchema() {
    return this.schema;
  }
}

module.exports = { Engram, EngramType };