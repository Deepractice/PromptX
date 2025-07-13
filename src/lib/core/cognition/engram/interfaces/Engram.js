// Engram Interface - 记忆痕迹接口
// 记忆痕迹的概念定义

const EngramType = {
  ATOMIC: 'ATOMIC',     // 原子记忆
  LINK: 'LINK',         // 关联记忆
  PATTERN: 'PATTERN'    // 模式记忆
};

class Engram {
  constructor(content, schema, type = EngramType.ATOMIC) {
    throw new Error('Engram is an interface, use concrete implementation');
  }

  getId() {
    throw new Error('Engram.getId() must be implemented');
  }

  getContent() {
    throw new Error('Engram.getContent() must be implemented');
  }

  getType() {
    throw new Error('Engram.getType() must be implemented');
  }

  getStrength() {
    throw new Error('Engram.getStrength() must be implemented');
  }

  getSchema() {
    throw new Error('Engram.getSchema() must be implemented');
  }
}

module.exports = { Engram, EngramType };