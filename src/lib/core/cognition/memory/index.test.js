// 测试 memory/index.js 全局导出

const { memoryService, MemoryService } = require('./index');

describe('Memory Global Export', () => {
  test('should export memoryService singleton', () => {
    expect(memoryService).toBeDefined();
    expect(memoryService).toBeInstanceOf(MemoryService);
  });

  test('memoryService should have all methods', () => {
    expect(typeof memoryService.remember).toBe('function');
    expect(typeof memoryService.recall).toBe('function');
    expect(typeof memoryService.prime).toBe('function');
    expect(typeof memoryService.getSemantic).toBe('function');
  });

  test('singleton pattern - always returns same instance', () => {
    const { memoryService: service1 } = require('./index');
    const { memoryService: service2 } = require('./index');
    expect(service1).toBe(service2);
  });
});