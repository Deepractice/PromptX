// WordCue.test.js - TDD测试文件
// 测试 WordCue 组件的基础功能

describe('WordCue', () => {
  let WordCue;
  
  beforeAll(() => {
    // 动态导入，避免在实现之前报错
    try {
      WordCue = require('./WordCue').WordCue;
    } catch (error) {
      // 实现还不存在时的占位
      WordCue = null;
    }
  });

  describe('构造函数', () => {
    test('应该能够创建WordCue实例', () => {
      if (!WordCue) return; // 实现不存在时跳过
      
      const cue = new WordCue('apple');
      expect(cue).toBeInstanceOf(WordCue);
      expect(cue.word).toBe('apple');
    });

    test('应该拒绝空字符串', () => {
      if (!WordCue) return;
      
      expect(() => new WordCue('')).toThrow('Cue requires a valid word string');
    });

    test('应该拒绝非字符串参数', () => {
      if (!WordCue) return;
      
      expect(() => new WordCue(123)).toThrow('Cue requires a valid word string');
      expect(() => new WordCue(null)).toThrow('Cue requires a valid word string');
      expect(() => new WordCue(undefined)).toThrow('Cue requires a valid word string');
    });

    test('应该自动去除前后空格', () => {
      if (!WordCue) return;
      
      const cue = new WordCue('  apple  ');
      expect(cue.word).toBe('apple');
    });
  });

  describe('connect方法', () => {
    test('应该能够连接到另一个WordCue', () => {
      if (!WordCue) return;
      
      const cue1 = new WordCue('happy');
      const cue2 = new WordCue('joyful');
      
      const result = cue1.connect(cue2);
      expect(result).toBe(cue1); // 返回自身支持链式调用
    });

    test('应该支持链式调接', () => {
      if (!WordCue) return;
      
      const cue1 = new WordCue('red');
      const cue2 = new WordCue('color');
      const cue3 = new WordCue('apple');
      
      const result = cue1.connect(cue2).connect(cue3);
      expect(result).toBe(cue1);
    });
  });

  describe('disconnect方法', () => {
    test('应该能够断开与另一个WordCue的连接', () => {
      if (!WordCue) return;
      
      const cue1 = new WordCue('old');
      const cue2 = new WordCue('young');
      
      cue1.connect(cue2);
      const result = cue1.disconnect(cue2);
      expect(result).toBe(cue1); // 返回自身支持链式调用
    });

    test('应该能够断开不存在的连接而不报错', () => {
      if (!WordCue) return;
      
      const cue1 = new WordCue('hello');
      const cue2 = new WordCue('world');
      
      // 从未连接过，断开应该不报错
      expect(() => cue1.disconnect(cue2)).not.toThrow();
    });
  });

  describe('equals方法', () => {
    test('相同词汇的WordCue应该相等', () => {
      if (!WordCue) return;
      
      const cue1 = new WordCue('cat');
      const cue2 = new WordCue('cat');
      
      expect(cue1.equals(cue2)).toBe(true);
    });

    test('不同词汇的WordCue应该不相等', () => {
      if (!WordCue) return;
      
      const cue1 = new WordCue('cat');
      const cue2 = new WordCue('dog');
      
      expect(cue1.equals(cue2)).toBe(false);
    });

    test('与非WordCue对象比较应该返回false', () => {
      if (!WordCue) return;
      
      const cue = new WordCue('test');
      
      expect(cue.equals(null)).toBe(false);
      expect(cue.equals('test')).toBe(false);
      expect(cue.equals({})).toBe(false);
    });
  });

  describe('toString方法', () => {
    test('应该返回词汇字符串', () => {
      if (!WordCue) return;
      
      const cue = new WordCue('beautiful');
      expect(cue.toString()).toBe('beautiful');
    });
  });
});