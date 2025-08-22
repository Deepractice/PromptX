// ShortTerm.test.js - 短期记忆 TDD 测试
// 验证基于队列的短期记忆实现，容量限制7±2，自动巩固机制

describe('ShortTerm 短期记忆测试', () => {
  let ShortTerm;
  let Engram;
  let EngramType;
  let shortTerm;
  let mockEvaluator;
  let mockConsolidator;

  beforeAll(() => {
    // 动态导入
    ShortTerm = require('./ShortTerm').ShortTerm;
    Engram = require('../../engram/Engram').Engram;
    EngramType = require('../../engram/interfaces/Engram').EngramType;
  });

  beforeEach(() => {
    // Mock评估器
    mockEvaluator = {
      evaluate: jest.fn()
    };
    
    // Mock巩固器
    mockConsolidator = {
      consolidate: jest.fn()
    };
    
    // 创建ShortTerm实例，默认容量7
    shortTerm = new ShortTerm(mockEvaluator, mockConsolidator);
  });

  describe('1. 基本记忆操作', () => {
    test('remember() - 保存单个记忆', () => {
      const engram = new Engram('测试记忆内容', null, EngramType.ATOMIC);
      
      shortTerm.remember(engram);
      
      expect(shortTerm.size()).toBe(1);
      const recalled = shortTerm.recall();
      expect(recalled).toHaveLength(1);
      expect(recalled[0].getContent()).toBe('测试记忆内容');
    });

    test('remember() - 保存多个记忆', () => {
      const engrams = [
        new Engram('记忆1', null, EngramType.ATOMIC),
        new Engram('记忆2', null, EngramType.ATOMIC),
        new Engram('记忆3', null, EngramType.ATOMIC)
      ];
      
      engrams.forEach(e => shortTerm.remember(e));
      
      expect(shortTerm.size()).toBe(3);
      const recalled = shortTerm.recall();
      expect(recalled).toHaveLength(3);
    });

    test('recall() - 无线索返回所有记忆', () => {
      const engrams = [
        new Engram('JavaScript函数', null, EngramType.ATOMIC),
        new Engram('React组件', null, EngramType.ATOMIC)
      ];
      
      engrams.forEach(e => shortTerm.remember(e));
      
      const recalled = shortTerm.recall();
      expect(recalled).toHaveLength(2);
      expect(recalled[0].getContent()).toBe('JavaScript函数');
      expect(recalled[1].getContent()).toBe('React组件');
    });

    test('recall() - 根据线索检索记忆', () => {
      const engrams = [
        new Engram('JavaScript异步编程', null, EngramType.ATOMIC),
        new Engram('Python数据分析', null, EngramType.ATOMIC),
        new Engram('JavaScript Promise', null, EngramType.ATOMIC)
      ];
      
      engrams.forEach(e => shortTerm.remember(e));
      
      const jsMemories = shortTerm.recall('JavaScript');
      expect(jsMemories).toHaveLength(2);
      expect(jsMemories[0].getContent()).toContain('JavaScript');
      expect(jsMemories[1].getContent()).toContain('JavaScript');
    });

    test('recall() - 大小写不敏感搜索', () => {
      shortTerm.remember(new Engram('JavaScript编程', null, EngramType.ATOMIC));
      
      const results1 = shortTerm.recall('javascript');
      const results2 = shortTerm.recall('JAVASCRIPT');
      
      expect(results1).toHaveLength(1);
      expect(results2).toHaveLength(1);
    });
  });

  describe('2. 队列管理和容量限制', () => {
    test('容量默认为7', () => {
      expect(shortTerm.capacity).toBe(7);
    });

    test('自定义容量初始化', () => {
      const customShortTerm = new ShortTerm(mockEvaluator, mockConsolidator, 5);
      expect(customShortTerm.capacity).toBe(5);
    });

    test('isFull() - 检查队列是否已满', () => {
      expect(shortTerm.isFull()).toBe(false);
      
      // 填充到容量
      for (let i = 0; i < 7; i++) {
        shortTerm.remember(new Engram(`记忆${i}`, null, EngramType.ATOMIC));
      }
      
      expect(shortTerm.isFull()).toBe(true);
    });

    test('FIFO - 先进先出顺序', () => {
      // 填充到容量
      for (let i = 0; i < 7; i++) {
        shortTerm.remember(new Engram(`记忆${i}`, null, EngramType.ATOMIC));
      }
      
      // 记住队列顺序
      const beforeOverflow = shortTerm.recall();
      expect(beforeOverflow[0].getContent()).toBe('记忆0'); // 最老的在前
      
      // 添加第8个记忆，触发容量溢出
      mockEvaluator.evaluate.mockReturnValue(false);
      shortTerm.remember(new Engram('记忆7', null, EngramType.ATOMIC));
      
      // 验证最老的记忆被移除
      const afterOverflow = shortTerm.recall();
      expect(afterOverflow).toHaveLength(7);
      expect(afterOverflow[0].getContent()).toBe('记忆1'); // 记忆0被移除
      expect(afterOverflow[6].getContent()).toBe('记忆7'); // 新记忆在最后
    });
  });

  describe('3. 自动巩固流程', () => {
    test('容量满时触发processOldestMemory', () => {
      // 填充到容量
      for (let i = 0; i < 7; i++) {
        shortTerm.remember(new Engram(`记忆${i}`, null, EngramType.ATOMIC));
      }
      
      // 设置评估器返回true（需要巩固）
      mockEvaluator.evaluate.mockReturnValue(true);
      
      // 添加第8个记忆
      shortTerm.remember(new Engram('新记忆', null, EngramType.ATOMIC));
      
      // 验证评估器被调用
      expect(mockEvaluator.evaluate).toHaveBeenCalledTimes(1);
      expect(mockEvaluator.evaluate).toHaveBeenCalledWith(
        expect.objectContaining({ content: '记忆0' })
      );
    });

    test('值得巩固的记忆交给consolidator', () => {
      // 填充到容量
      for (let i = 0; i < 7; i++) {
        shortTerm.remember(new Engram(`记忆${i}`, null, EngramType.ATOMIC));
      }
      
      // 设置评估器返回true
      mockEvaluator.evaluate.mockReturnValue(true);
      
      // 添加新记忆触发巩固
      shortTerm.remember(new Engram('新记忆', null, EngramType.ATOMIC));
      
      // 验证巩固器被调用
      expect(mockConsolidator.consolidate).toHaveBeenCalledTimes(1);
      expect(mockConsolidator.consolidate).toHaveBeenCalledWith(
        expect.objectContaining({ content: '记忆0' })
      );
    });

    test('不值得巩固的记忆直接丢弃', () => {
      // 填充到容量
      for (let i = 0; i < 7; i++) {
        shortTerm.remember(new Engram(`记忆${i}`, null, EngramType.ATOMIC));
      }
      
      // 设置评估器返回false
      mockEvaluator.evaluate.mockReturnValue(false);
      
      // 添加新记忆
      shortTerm.remember(new Engram('新记忆', null, EngramType.ATOMIC));
      
      // 验证巩固器未被调用
      expect(mockConsolidator.consolidate).not.toHaveBeenCalled();
      
      // 验证旧记忆被丢弃
      const remaining = shortTerm.recall();
      expect(remaining.find(e => e.getContent() === '记忆0')).toBeUndefined();
    });

    test('多次溢出的连续处理', () => {
      // 填充到容量
      for (let i = 0; i < 7; i++) {
        shortTerm.remember(new Engram(`记忆${i}`, null, EngramType.ATOMIC));
      }
      
      // 交替设置巩固决策
      mockEvaluator.evaluate
        .mockReturnValueOnce(true)   // 记忆0 - 巩固
        .mockReturnValueOnce(false)  // 记忆1 - 丢弃
        .mockReturnValueOnce(true);  // 记忆2 - 巩固
      
      // 添加3个新记忆
      for (let i = 7; i < 10; i++) {
        shortTerm.remember(new Engram(`记忆${i}`, null, EngramType.ATOMIC));
      }
      
      // 验证评估器调用3次
      expect(mockEvaluator.evaluate).toHaveBeenCalledTimes(3);
      
      // 验证巩固器调用2次（记忆0和记忆2）
      expect(mockConsolidator.consolidate).toHaveBeenCalledTimes(2);
      expect(mockConsolidator.consolidate).toHaveBeenNthCalledWith(1,
        expect.objectContaining({ content: '记忆0' })
      );
      expect(mockConsolidator.consolidate).toHaveBeenNthCalledWith(2,
        expect.objectContaining({ content: '记忆2' })
      );
    });
  });

  describe('4. 边界情况和错误处理', () => {
    test('空队列的recall返回空数组', () => {
      const results = shortTerm.recall();
      expect(results).toEqual([]);
    });

    test('空队列的size返回0', () => {
      expect(shortTerm.size()).toBe(0);
    });

    test('recall空字符串线索', () => {
      shortTerm.remember(new Engram('测试内容', null, EngramType.ATOMIC));
      
      const results = shortTerm.recall('');
      expect(results).toHaveLength(1); // 空字符串匹配所有内容
    });

    test('容量为1的极限情况', () => {
      const tinyShortTerm = new ShortTerm(mockEvaluator, mockConsolidator, 1);
      
      mockEvaluator.evaluate.mockReturnValue(false);
      
      tinyShortTerm.remember(new Engram('第一个', null, EngramType.ATOMIC));
      expect(tinyShortTerm.size()).toBe(1);
      
      tinyShortTerm.remember(new Engram('第二个', null, EngramType.ATOMIC));
      expect(tinyShortTerm.size()).toBe(1);
      expect(tinyShortTerm.recall()[0].getContent()).toBe('第二个');
    });
  });

  describe('5. 集成场景测试', () => {
    test('模拟真实记忆流：连续输入和选择性巩固', () => {
      // 模拟评估策略：重要性大于0.5的巩固
      mockEvaluator.evaluate.mockImplementation((engram) => {
        return engram.getContent().includes('重要');
      });
      
      // 模拟一系列记忆输入
      const memories = [
        '普通信息1',
        '重要概念：认知心理学',
        '临时数据',
        '重要原则：奥卡姆剃刀',
        '日常记录',
        '普通信息2',
        '重要理论：矛盾分析法',
        '新的普通信息', // 第8个，触发巩固
        '另一个信息'     // 第9个
      ];
      
      memories.forEach(content => {
        shortTerm.remember(new Engram(content, null, EngramType.ATOMIC));
      });
      
      // 验证巩固器被调用正确次数
      const consolidateCalls = mockConsolidator.consolidate.mock.calls;
      expect(consolidateCalls).toHaveLength(1); // 只有"重要概念：认知心理学"被巩固
      expect(consolidateCalls[0][0].getContent()).toBe('重要概念：认知心理学');
      
      // 验证当前队列内容
      const current = shortTerm.recall();
      expect(current).toHaveLength(7);
      expect(current[0].getContent()).toBe('临时数据'); // 最老的未巩固记忆
    });
  });
});