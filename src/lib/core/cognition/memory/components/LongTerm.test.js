// LongTerm 测试
// 测试基于NeDB的长期记忆实现

const { LongTerm } = require('./LongTerm.js');
const { EngramType } = require('../../engram/interfaces/Engram.js');
const fs = require('fs-extra');
const path = require('path');

describe('LongTerm 长期记忆测试', () => {
  let longTerm;
  let testDir;
  
  beforeEach(async () => {
    // 使用PromptX项目根目录的统一测试输出目录
    const projectRoot = path.resolve(process.cwd(), '..');
    testDir = path.join(projectRoot, 'test-output', 'long-term', Date.now().toString());
    await fs.ensureDir(testDir);
    
    const dbPath = path.join(testDir, 'test.db');
    longTerm = new LongTerm(dbPath);
  });
  
  afterEach(async () => {
    // 清理测试目录
    if (testDir && await fs.pathExists(testDir)) {
      await fs.remove(testDir);
    }
  });

  describe('remember 功能测试', () => {
    test('应该能存储基本的Engram', async () => {
      // 准备
      const engram = new TestEngram('学习JavaScript异步编程', null, EngramType.ATOMIC);
      
      // 执行
      await longTerm.remember(engram);
      
      // 验证 - 通过recall来验证存储成功
      const results = await longTerm.recall('JavaScript');
      expect(results.length).toBe(1);
      expect(results[0].content).toBe('学习JavaScript异步编程');
    });

    test('应该能更新已存在的Engram（upsert）', async () => {
      // 准备 - 相同ID的engram
      const id = 'test-id-123';
      const engram1 = new TestEngram('原始内容', null, EngramType.ATOMIC, id);
      const engram2 = new TestEngram('更新后的内容', null, EngramType.ATOMIC, id);
      
      // 执行
      await longTerm.remember(engram1);
      await longTerm.remember(engram2);
      
      // 验证 - 应该只有一条记录，且内容已更新
      const results = await longTerm.recall('内容');
      expect(results.length).toBe(1);
      expect(results[0].content).toBe('更新后的内容');
    });

    test('应该正确提取和索引cues', async () => {
      // 准备
      const engram = new TestEngram(
        'React组件的性能优化技巧',
        null,
        EngramType.ATOMIC
      );
      
      // 执行
      await longTerm.remember(engram);
      
      // 验证 - 每个关键词都能检索到
      const reactResults = await longTerm.recall('react');
      const componentResults = await longTerm.recall('组件');
      const performanceResults = await longTerm.recall('性能');
      
      expect(reactResults.length).toBe(1);
      expect(componentResults.length).toBe(1);
      expect(performanceResults.length).toBe(1);
    });
  });

  describe('recall 功能测试', () => {
    beforeEach(async () => {
      // 准备测试数据
      await longTerm.remember(new TestEngram('前端框架React学习', null, EngramType.ATOMIC));
      await longTerm.remember(new TestEngram('Vue组件开发实践', null, EngramType.ATOMIC));
      await longTerm.remember(new TestEngram('Angular性能优化', null, EngramType.ATOMIC));
    });

    test('无cue时应返回所有记忆', async () => {
      // 执行
      const results = await longTerm.recall();
      
      // 验证
      expect(results.length).toBe(3);
    });

    test('基于cue应返回匹配的记忆', async () => {
      // 执行
      const results = await longTerm.recall('react');
      
      // 验证
      expect(results.length).toBe(1);
      expect(results[0].content).toContain('React');
    });

    test('应该按strength和timestamp排序', async () => {
      // 创建新的LongTerm实例，避免受beforeEach影响
      const testDir2 = path.join(process.cwd(), '..', 'test-output', 'sort-test');
      await fs.ensureDir(testDir2);
      const longTerm2 = new LongTerm(path.join(testDir2, 'test.db'));
      
      // 准备 - 添加不同strength的记忆
      const strongEngram = new TestEngram('重要的React知识', null, EngramType.ATOMIC);
      strongEngram.strength = 0.9;
      
      const weakEngram = new TestEngram('次要的React细节', null, EngramType.ATOMIC);
      weakEngram.strength = 0.3;
      
      await longTerm2.remember(strongEngram);
      await longTerm2.remember(weakEngram);
      
      // 执行
      const results = await longTerm2.recall('react');
      
      // 验证 - 强度高的应该排在前面
      expect(results.length).toBe(2);
      expect(results[0].content).toContain('重要的');
      expect(results[0].strength).toBe(0.9);
      
      // 清理
      await fs.remove(testDir2);
    });

    test('应该支持中文分词', async () => {
      // 准备
      await longTerm.remember(new TestEngram('深度学习与神经网络', null, EngramType.ATOMIC));
      
      // 执行
      const results = await longTerm.recall('神经网络');
      
      // 验证
      expect(results.length).toBe(1);
    });
  });

  describe('持久化测试', () => {
    test('重启后应该能恢复数据', async () => {
      // 准备
      const dbPath = path.join(testDir, 'persist.db');
      const longTerm1 = new LongTerm(dbPath);
      
      // 第一次写入
      await longTerm1.remember(new TestEngram('持久化测试数据', null, EngramType.ATOMIC));
      
      // 创建新实例（模拟重启）
      const longTerm2 = new LongTerm(dbPath);
      
      // 验证数据仍然存在
      const results = await longTerm2.recall('持久化');
      expect(results.length).toBe(1);
      expect(results[0].content).toBe('持久化测试数据');
    });
  });

  describe('size 功能测试', () => {
    test('应该正确返回记忆数量', async () => {
      // 初始为0
      expect(await longTerm.size()).toBe(0);
      
      // 添加记忆
      await longTerm.remember(new TestEngram('测试1', null));
      await longTerm.remember(new TestEngram('测试2', null));
      
      // 验证
      expect(await longTerm.size()).toBe(2);
    });
  });
});

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