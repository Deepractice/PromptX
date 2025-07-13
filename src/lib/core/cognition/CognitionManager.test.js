const { CognitionManager } = require('./CognitionManager');
const { Cognition } = require('./Cognition');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

// Mock ResourceManager
const mockResourceManager = {
  initialized: true,
  protocols: new Map([
    ['user', {
      resolvePath: async (relativePath) => {
        return path.join(os.homedir(), relativePath);
      }
    }]
  ])
};

describe('CognitionManager', () => {
  let cognitionManager;
  let testDir;

  beforeEach(async () => {
    // 创建 CognitionManager
    cognitionManager = new CognitionManager(mockResourceManager);
    
    // 设置测试目录
    testDir = path.join(os.homedir(), '.promptx/cognition/test-role');
    
    // 清理测试目录
    await fs.remove(testDir);
  });

  afterEach(async () => {
    // 清理所有认知实例
    cognitionManager.clearAll();
    
    // 清理测试目录
    await fs.remove(testDir);
  });

  describe('基础功能', () => {
    test('应该创建角色的认知实例', async () => {
      const cognition = await cognitionManager.getCognition('test-role');
      
      expect(cognition).toBeDefined();
      expect(cognition.constructor.name).toBe('Cognition');
      
      // 验证配置路径
      const config = cognition.getConfig();
      expect(config.longTermPath).toContain('test-role/longterm');
      expect(config.semanticPath).toContain('test-role/semantic');
    });

    test('应该复用已存在的认知实例', async () => {
      const cognition1 = await cognitionManager.getCognition('test-role');
      const cognition2 = await cognitionManager.getCognition('test-role');
      
      expect(cognition1).toBe(cognition2); // 同一个实例
    });

    test('不同角色应该有独立的认知实例', async () => {
      const cognition1 = await cognitionManager.getCognition('role1');
      const cognition2 = await cognitionManager.getCognition('role2');
      
      expect(cognition1).not.toBe(cognition2);
      
      // 验证配置路径不同
      const config1 = cognition1.getConfig();
      const config2 = cognition2.getConfig();
      expect(config1.longTermPath).toContain('role1');
      expect(config2.longTermPath).toContain('role2');
    });
  });

  describe('记忆管理', () => {
    test('应该为角色保存记忆', async () => {
      await cognitionManager.remember('test-role', '这是一条测试记忆', null, 1.0);
      
      const memories = await cognitionManager.recall('test-role', '测试');
      expect(memories.length).toBeGreaterThan(0);
      expect(memories[0].content).toBe('这是一条测试记忆');
    });

    test('不同角色的记忆应该隔离', async () => {
      // 为不同角色保存记忆
      await cognitionManager.remember('role1', '角色1的记忆', null, 0.8);
      await cognitionManager.remember('role2', '角色2的记忆', null, 0.9);
      
      // 检索角色1的记忆
      const memories1 = await cognitionManager.recall('role1', '');
      expect(memories1.length).toBe(1);
      expect(memories1[0].content).toBe('角色1的记忆');
      
      // 检索角色2的记忆
      const memories2 = await cognitionManager.recall('role2', '');
      expect(memories2.length).toBe(1);
      expect(memories2[0].content).toBe('角色2的记忆');
    });

    test('应该支持带结构的记忆', async () => {
      const schema = `mindmap
  root((测试))
    分支1
    分支2`;
      
      await cognitionManager.remember('test-role', '结构化记忆', schema, 0.9);
      
      const memories = await cognitionManager.recall('test-role', '结构化');
      expect(memories.length).toBe(1);
      
      // 由于 schema 在存储时可能被转换，我们只检查内容和强度
      expect(memories[0].content).toBe('结构化记忆');
      expect(memories[0].strength).toBe(0.9);
      
      // schema 可能是对象或字符串，取决于存储实现
      expect(memories[0].schema).toBeDefined();
    });
  });

  describe('语义网络', () => {
    test('应该支持语义网络启动效应', async () => {
      // 先添加一些带结构的记忆
      const schema = `mindmap
  root((核心概念))
    概念A
    概念B`;
      
      await cognitionManager.remember('test-role', '测试概念', schema, 0.7);
      
      // 测试启动效应
      const mermaid = await cognitionManager.prime('test-role');
      expect(mermaid).toBeDefined();
      expect(typeof mermaid).toBe('string');
    });
  });

  describe('实例管理', () => {
    test('应该获取所有活跃的认知实例', async () => {
      await cognitionManager.getCognition('role1');
      await cognitionManager.getCognition('role2');
      
      const activeCognitions = cognitionManager.getActiveCognitions();
      expect(activeCognitions.size).toBe(2);
      expect(activeCognitions.has('role1')).toBe(true);
      expect(activeCognitions.has('role2')).toBe(true);
    });

    test('应该清理指定角色的认知实例', async () => {
      await cognitionManager.getCognition('test-role');
      expect(cognitionManager.getActiveCognitions().size).toBe(1);
      
      cognitionManager.clearCognition('test-role');
      expect(cognitionManager.getActiveCognitions().size).toBe(0);
    });

    test('应该清理所有认知实例', async () => {
      await cognitionManager.getCognition('role1');
      await cognitionManager.getCognition('role2');
      expect(cognitionManager.getActiveCognitions().size).toBe(2);
      
      cognitionManager.clearAll();
      expect(cognitionManager.getActiveCognitions().size).toBe(0);
    });
  });


  describe('错误处理', () => {
    test('应该处理无效的角色名', async () => {
      // 空字符串应该抛出错误
      await expect(cognitionManager.getCognition(''))
        .rejects
        .toThrow();
    });
  });
});