// Cognition 配置和执行入口测试

const { Cognition } = require('./Cognition');
const { Engram } = require('./engram/Engram');

describe('Cognition - 认知配置中心', () => {
  let cognition;
  
  beforeEach(() => {
    cognition = new Cognition();
  });
  
  describe('配置管理', () => {
    test('应该有默认配置', () => {
      const config = cognition.getConfig();
      
      expect(config.longTermPath).toBe('./.cognition/longterm');
      expect(config.semanticPath).toBe('./.cognition/semantic');
    });
    
    test('应该能够自定义配置', () => {
      const customConfig = {
        longTermPath: './data/memory/longterm',
        semanticPath: './data/memory/semantic'
      };
      
      const customCognition = new Cognition(customConfig);
      const config = customCognition.getConfig();
      
      // 自定义的值应该被使用
      expect(config.longTermPath).toBe('./data/memory/longterm');
      expect(config.semanticPath).toBe('./data/memory/semantic');
    });
    
    test('应该能够更新配置', () => {
      const newConfig = {
        longTermPath: './new/path/longterm'
      };
      
      cognition.updateConfig(newConfig);
      const config = cognition.getConfig();
      
      expect(config.longTermPath).toBe('./new/path/longterm');
      // 其他配置应该保持不变
      expect(config.semanticPath).toBe('./.cognition/semantic');
    });
  });
  
  describe('核心功能', () => {
    test('应该能够记住和回忆', async () => {
      const engram = new Engram(
        'test response content',  // content
        null                      // schema (可选)
      );
      
      cognition.remember(engram);
      const recalled = await cognition.recall('test');
      
      expect(recalled).toHaveLength(1);
      expect(recalled[0].getContent()).toBe('test response content');
    });
    
    test('应该能够使用 prime 功能', async () => {
      // prime 方法应该存在并可调用
      expect(typeof cognition.prime).toBe('function');
      
      // prime 功能存在即可，不测试具体加载
      // 因为会尝试加载文件系统中的语义网络
    });
    
    test('应该能够获取语义网络', () => {
      const semantic = cognition.getSemantic();
      expect(semantic).toBeDefined();
      expect(semantic.constructor.name).toBe('NetworkSemantic');
    });
  });
  
  describe('向后兼容性', () => {
    test('应该暴露 memoryService', () => {
      expect(cognition.memoryService).toBeDefined();
      expect(typeof cognition.memoryService.remember).toBe('function');
      expect(typeof cognition.memoryService.recall).toBe('function');
    });
  });
});