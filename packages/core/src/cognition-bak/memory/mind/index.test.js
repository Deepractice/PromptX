// index.test.js - Mind模块导出测试

const mindModule = require('./index.js');

describe('Mind模块导出', () => {
  test('应该导出全局单例mindService', () => {
    expect(mindModule.mindService).toBeDefined();
    expect(typeof mindModule.mindService.addMind).toBe('function');
    expect(typeof mindModule.mindService.convertMindToMermaid).toBe('function');
  });

  test('应该导出所有必要的类', () => {
    expect(mindModule.MindService).toBeDefined();
    expect(mindModule.WordCue).toBeDefined();
    expect(mindModule.GraphSchema).toBeDefined();
    expect(mindModule.NetworkSemantic).toBeDefined();
    expect(mindModule.MindConverter).toBeDefined();
  });

  test('全局单例应该是MindService实例', () => {
    expect(mindModule.mindService).toBeInstanceOf(mindModule.MindService);
  });

  test('多次引入应该返回同一个单例', () => {
    // 重新require应该返回同一个实例
    const mindModule2 = require('./index.js');
    expect(mindModule2.mindService).toBe(mindModule.mindService);
  });

  test('全局单例应该具备完整功能', async () => {
    const { mindService, WordCue, NetworkSemantic } = mindModule;
    
    // 创建测试数据
    const semantic = new NetworkSemantic('test');
    const cue = new WordCue('hello');
    
    // 测试基本功能
    await mindService.addMind(cue, semantic);
    const mermaidText = mindService.convertMindToMermaid(semantic);
    
    expect(mermaidText).toContain('hello');
    expect(mermaidText).toContain('mindmap');
  });

  test('应该能够创建新的MindService实例用于特殊场景', () => {
    const { MindService } = mindModule;
    const newInstance = new MindService();
    
    expect(newInstance).toBeInstanceOf(MindService);
    expect(newInstance).not.toBe(mindModule.mindService);
  });
});