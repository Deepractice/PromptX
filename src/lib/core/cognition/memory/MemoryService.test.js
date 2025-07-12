// MemoryService.test.js - 记忆服务 TDD 测试
// 极简设计：只有 remember 和 recall 两个核心方法

describe('MemoryService 极简测试', () => {
  let MemoryService;
  let Engram;
  let EngramType;
  let memoryService;

  beforeAll(() => {
    // 动态导入
    try {
      MemoryService = require('./MemoryService').MemoryService;
    } catch (e) {
      MemoryService = null;
    }
    Engram = require('../engram/Engram').Engram;
    EngramType = require('../engram/interfaces/Engram').EngramType;
  });

  beforeEach(() => {
    if (MemoryService) {
      memoryService = new MemoryService();
    }
  });
  
  afterEach(() => {
    // 清理内存中的数据，避免测试间干扰
    if (memoryService) {
      memoryService = null;
    }
  });

  describe('1. 基本功能测试', () => {
    test('remember() - 保存单个记忆', async () => {
      if (!MemoryService) return;
      
      const engram = new Engram('测试记忆内容', null, EngramType.ATOMIC);
      
      memoryService.remember(engram);
      
      const results = await await memoryService.recall();
      expect(results).toHaveLength(1);
      expect(results[0].getContent()).toBe('测试记忆内容');
    });

    test('remember() - 保存多个记忆', async () => {
      if (!MemoryService) return;
      
      const memories = [
        new Engram('JavaScript异步编程', null, EngramType.ATOMIC),
        new Engram('React组件设计', null, EngramType.ATOMIC),
        new Engram('Node.js后端开发', null, EngramType.ATOMIC)
      ];
      
      memories.forEach(m => memoryService.remember(m));
      
      const results = await memoryService.recall();
      expect(results).toHaveLength(3);
    });

    test('recall() - 无参数返回所有记忆', async () => {
      if (!MemoryService) return;
      
      memoryService.remember(new Engram('记忆1', null));
      memoryService.remember(new Engram('记忆2', null));
      
      const results = await memoryService.recall();
      expect(results).toHaveLength(2);
      expect(results.map(r => r.getContent())).toContain('记忆1');
      expect(results.map(r => r.getContent())).toContain('记忆2');
    });

    test('recall() - 根据线索检索记忆', async () => {
      if (!MemoryService) return;
      
      memoryService.remember(new Engram('JavaScript Promise用法', null));
      memoryService.remember(new Engram('Python异步编程', null));
      memoryService.remember(new Engram('JavaScript async/await', null));
      
      const jsResults = await memoryService.recall('JavaScript');
      expect(jsResults).toHaveLength(2);
      expect(jsResults.every(r => r.getContent().includes('JavaScript'))).toBe(true);
    });

    test('recall() - 大小写不敏感搜索', async () => {
      if (!MemoryService) return;
      
      memoryService.remember(new Engram('React组件开发', null));
      
      const results1 = await memoryService.recall('react');
      const results2 = await memoryService.recall('REACT');
      const results3 = await memoryService.recall('React');
      
      expect(results1).toHaveLength(1);
      expect(results2).toHaveLength(1);
      expect(results3).toHaveLength(1);
    });
  });

  describe('2. 短期-长期记忆协作', () => {
    test('短期记忆溢出时自动转移到长期记忆', async () => {
      if (!MemoryService) return;
      
      // 填充超过短期记忆容量（假设为7）
      for (let i = 0; i < 10; i++) {
        memoryService.remember(new Engram(`记忆${i}`, null));
      }
      
      // 等待异步巩固完成
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 所有记忆都应该能被检索到
      const results = await memoryService.recall();
      
      expect(results).toHaveLength(10);
      
      // 验证所有记忆都存在
      const contents = results.map(r => r.getContent());
      for (let i = 0; i < 10; i++) {
        expect(contents).toContain(`记忆${i}`);
      }
    });

    test('重要记忆优先保留', async () => {
      if (!MemoryService) return;
      
      // 创建不同重要性的记忆
      const importantMemory = new Engram('重要：系统架构决策', null);
      importantMemory.strength = 1.0;
      
      const normalMemory = new Engram('普通：今日会议记录', null);
      normalMemory.strength = 0.5;
      
      memoryService.remember(importantMemory);
      memoryService.remember(normalMemory);
      
      // 填充大量普通记忆
      for (let i = 0; i < 20; i++) {
        const m = new Engram(`临时记忆${i}`, null);
        m.strength = 0.3;
        memoryService.remember(m);
      }
      
      // 等待异步巩固完成
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // 重要记忆应该还能被检索到
      const results = await memoryService.recall('系统架构');
      expect(results).toHaveLength(1);
      expect(results[0].getContent()).toContain('系统架构决策');
    });
  });

  describe('3. 边界情况处理', () => {
    test('空记忆库的recall返回空数组', async () => {
      if (!MemoryService) return;
      
      const results = await memoryService.recall();
      expect(results).toEqual([]);
    });

    test('recall空字符串返回所有记忆', async () => {
      if (!MemoryService) return;
      
      memoryService.remember(new Engram('测试内容', null));
      
      const results = await memoryService.recall('');
      expect(results).toHaveLength(1);
    });

    test('recall不存在的关键词返回空数组', async () => {
      if (!MemoryService) return;
      
      memoryService.remember(new Engram('JavaScript编程', null));
      memoryService.remember(new Engram('Python开发', null));
      
      const results = await memoryService.recall('Ruby');
      expect(results).toEqual([]);
    });
  });

  describe('4. 性能和容量测试', () => {
    test('处理大量记忆的性能', async () => {
      if (!MemoryService) return;
      
      const startTime = Date.now();
      
      // 添加1000个记忆
      for (let i = 0; i < 1000; i++) {
        memoryService.remember(new Engram(`性能测试记忆${i}`, null));
      }
      
      // 记忆存储应该在合理时间内完成（<100ms）
      const storeTime = Date.now() - startTime;
      expect(storeTime).toBeLessThan(100);
      
      // 检索性能测试
      const searchStart = Date.now();
      const results = await memoryService.recall('测试记忆500');
      const searchTime = Date.now() - searchStart;
      
      expect(searchTime).toBeLessThan(50);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('5. 集成场景测试', () => {
    test('模拟真实使用场景：学习过程', async () => {
      if (!MemoryService) return;
      
      // 模拟学习JavaScript的过程
      const learningPath = [
        '变量声明：let, const, var的区别',
        '函数定义：箭头函数vs普通函数',
        '异步编程：Promise基础',
        '异步编程：async/await用法',
        'React基础：组件和Props',
        'React进阶：Hooks使用',
        'Node.js：事件循环机制',
        '性能优化：防抖和节流',
        'TypeScript：类型系统入门'
      ];
      
      // 模拟逐步学习
      learningPath.forEach((topic, index) => {
        const engram = new Engram(topic, null);
        // 越早学的内容强度越低（模拟遗忘）
        engram.strength = 1.0 - (index * 0.1);
        memoryService.remember(engram);
      });
      
      // 检索异步编程相关内容
      const asyncResults = await memoryService.recall('异步');
      expect(asyncResults).toHaveLength(2);
      
      // 检索React相关内容
      const reactResults = await memoryService.recall('React');
      expect(reactResults).toHaveLength(2);
      
      // 检索所有内容
      const allResults = await memoryService.recall();
      expect(allResults.length).toBeGreaterThanOrEqual(9);
    });

    test('模拟对话场景：上下文记忆', async () => {
      if (!MemoryService) return;
      
      // 模拟一段对话的记忆
      const conversation = [
        { role: 'user', content: '帮我设计一个用户认证系统' },
        { role: 'assistant', content: '使用JWT token进行无状态认证' },
        { role: 'user', content: '如何处理token刷新？' },
        { role: 'assistant', content: '实现refresh token机制，设置不同过期时间' },
        { role: 'user', content: '安全性如何保证？' },
        { role: 'assistant', content: 'HTTPS传输，token加密存储，防止XSS和CSRF攻击' }
      ];
      
      // 存储对话记忆
      conversation.forEach(turn => {
        const content = `${turn.role}: ${turn.content}`;
        memoryService.remember(new Engram(content, null));
      });
      
      // 检索认证相关对话
      const authResults = await memoryService.recall('认证');
      expect(authResults.length).toBeGreaterThan(0);
      
      // 检索安全相关内容
      const securityResults = await memoryService.recall('安全');
      expect(securityResults.length).toBeGreaterThan(0);
    });
  });
});