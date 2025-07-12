// 简化的LongTerm测试 - 用于调试

const { LongTerm } = require('./LongTerm.js');
const { EngramType } = require('../../engram/interfaces/Engram.js');
const fs = require('fs-extra');
const path = require('path');

// 测试用的Engram实现
class TestEngram {
  constructor(content, schema, type = EngramType.ATOMIC, id = null) {
    this.id = id || Date.now().toString() + Math.random();
    this.content = content;
    this.schema = schema;
    this.type = type;
    this.timestamp = new Date();
    this.strength = 1.0;
  }
  
  getId() { return this.id; }
  getContent() { return this.content; }
  getType() { return this.type; }
  getStrength() { return this.strength; }
}

describe('LongTerm 简化测试', () => {
  let longTerm;
  let testDir;
  
  beforeEach(async () => {
    testDir = path.join(process.cwd(), 'test-output', 'simple-test');
    await fs.ensureDir(testDir);
    const dbPath = path.join(testDir, 'test.db');
    longTerm = new LongTerm(dbPath);
  });
  
  afterEach(async () => {
    if (testDir && await fs.pathExists(testDir)) {
      await fs.remove(testDir);
    }
  });

  test('基本的存储和检索', async () => {
    console.log('=== 开始测试 ===');
    
    // 准备
    const engram = new TestEngram('学习JavaScript异步编程', null, EngramType.ATOMIC);
    console.log('创建的Engram:', {
      id: engram.getId(),
      content: engram.getContent(),
      type: engram.getType()
    });
    
    // 执行存储
    await longTerm.remember(engram);
    console.log('存储完成');
    
    // 执行检索
    console.log('开始检索: "JavaScript"');
    const results = await longTerm.recall('JavaScript');
    console.log('检索结果:', results);
    console.log('结果数量:', results.length);
    
    // 验证
    expect(results.length).toBe(1);
    expect(results[0].content).toBe('学习JavaScript异步编程');
  });
});