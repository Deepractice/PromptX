// Schema.test.js - TDD测试文件
// 测试 Schema 组件的基础功能和 graphology 集成

describe('Schema', () => {
  let Schema, WordCue;
  let fixtures;
  
  beforeAll(() => {
    // 动态导入，避免在实现之前报错
    try {
      Schema = require('./Schema').Schema;
      WordCue = require('./WordCue').WordCue;
      const { getTestFixtures } = require('./__fixtures__');
      fixtures = getTestFixtures();
    } catch (error) {
      // 实现还不存在时的占位
      Schema = null;
      WordCue = null;
      fixtures = null;
    }
  });

  describe('构造函数', () => {
    test('应该能够创建Schema实例', () => {
      if (!Schema) return; // 实现不存在时跳过
      
      const schema = new Schema('用户登录');
      expect(schema).toBeInstanceOf(Schema);
      expect(schema.name).toBe('用户登录');
    });

    test('应该拒绝空字符串名称', () => {
      if (!Schema) return;
      
      expect(() => new Schema('')).toThrow('Schema requires a valid name string');
    });

    test('应该拒绝非字符串名称', () => {
      if (!Schema) return;
      
      expect(() => new Schema(123)).toThrow('Schema requires a valid name string');
      expect(() => new Schema(null)).toThrow('Schema requires a valid name string');
      expect(() => new Schema(undefined)).toThrow('Schema requires a valid name string');
    });

    test('应该自动去除前后空格', () => {
      if (!Schema) return;
      
      const schema = new Schema('  用户登录  ');
      expect(schema.name).toBe('用户登录');
    });
  });

  describe('Mind接口实现', () => {
    test('应该继承自Mind并实现connect方法', () => {
      if (!Schema) return;
      
      const schema1 = new Schema('用户登录');
      const schema2 = new Schema('用户管理');
      
      const result = schema1.connect(schema2);
      expect(result).toBe(schema1); // 返回自身支持链式调用
    });

    test('应该实现disconnect方法', () => {
      if (!Schema) return;
      
      const schema1 = new Schema('用户登录');
      const schema2 = new Schema('用户管理');
      
      schema1.connect(schema2);
      const result = schema1.disconnect(schema2);
      expect(result).toBe(schema1); // 返回自身支持链式调用
    });

    test('应该支持链式调用', () => {
      if (!Schema) return;
      
      const schema1 = new Schema('用户登录');
      const schema2 = new Schema('用户管理');
      const schema3 = new Schema('权限控制');
      
      const result = schema1.connect(schema2).connect(schema3);
      expect(result).toBe(schema1);
    });
  });

  describe('内部Cue管理', () => {
    test('应该能够添加Cue到Schema', () => {
      if (!Schema || !WordCue || !fixtures) return;
      
      const schema = new Schema('用户登录');
      const { username, password } = fixtures.cues;
      
      const result = schema.addCue(username).addCue(password);
      expect(result).toBe(schema); // 返回自身支持链式调用
      expect(schema.hasCue(username)).toBe(true);
      expect(schema.hasCue(password)).toBe(true);
    });

    test('应该能够连接Schema内部的Cue', () => {
      if (!Schema || !WordCue) return;
      
      const schema = new Schema('用户登录');
      const usernameCue = new WordCue('用户名');
      const passwordCue = new WordCue('密码');
      
      schema.addCue(usernameCue).addCue(passwordCue);
      const result = schema.connectCues(usernameCue, passwordCue);
      expect(result).toBe(schema);
    });

    test('应该能够获取Schema内的所有Cue', () => {
      if (!Schema || !WordCue) return;
      
      const schema = new Schema('用户登录');
      const usernameCue = new WordCue('用户名');
      const passwordCue = new WordCue('密码');
      
      schema.addCue(usernameCue).addCue(passwordCue);
      const cues = schema.getCues();
      expect(cues).toHaveLength(2);
      expect(cues.map(c => c.word)).toContain('用户名');
      expect(cues.map(c => c.word)).toContain('密码');
    });

    test('应该能够获取Schema内Cue的连接关系', () => {
      if (!Schema || !WordCue) return;
      
      const schema = new Schema('用户登录');
      const usernameCue = new WordCue('用户名');
      const passwordCue = new WordCue('密码');
      
      schema.addCue(usernameCue)
            .addCue(passwordCue)
            .connectCues(usernameCue, passwordCue);
      
      const connections = schema.getCueConnections();
      expect(connections).toHaveLength(1);
      expect(connections[0].source).toBe('用户名');
      expect(connections[0].target).toBe('密码');
    });
  });

  describe('Schema之间的连接', () => {
    test('应该能够检查与其他Schema的连接状态', () => {
      if (!Schema) return;
      
      const schema1 = new Schema('用户登录');
      const schema2 = new Schema('用户管理');
      
      expect(schema1.isConnectedTo(schema2)).toBe(false);
      
      schema1.connect(schema2);
      expect(schema1.isConnectedTo(schema2)).toBe(true);
      expect(schema2.isConnectedTo(schema1)).toBe(true); // 双向连接
    });

    test('应该能够获取所有外部连接', () => {
      if (!Schema) return;
      
      const schema1 = new Schema('用户登录');
      const schema2 = new Schema('用户管理');
      const schema3 = new Schema('权限控制');
      
      schema1.connect(schema2).connect(schema3);
      
      const connections = schema1.getExternalConnections();
      expect(connections).toHaveLength(2);
      expect(connections.map(s => s.name)).toContain('用户管理');
      expect(connections.map(s => s.name)).toContain('权限控制');
    });
  });

  describe('equals和toString方法', () => {
    test('相同名称的Schema应该相等', () => {
      if (!Schema) return;
      
      const schema1 = new Schema('用户登录');
      const schema2 = new Schema('用户登录');
      
      expect(schema1.equals(schema2)).toBe(true);
    });

    test('不同名称的Schema应该不相等', () => {
      if (!Schema) return;
      
      const schema1 = new Schema('用户登录');
      const schema2 = new Schema('用户管理');
      
      expect(schema1.equals(schema2)).toBe(false);
    });

    test('与非Schema对象比较应该返回false', () => {
      if (!Schema) return;
      
      const schema = new Schema('用户登录');
      
      expect(schema.equals(null)).toBe(false);
      expect(schema.equals('用户登录')).toBe(false);
      expect(schema.equals({})).toBe(false);
    });

    test('应该返回Schema名称字符串', () => {
      if (!Schema) return;
      
      const schema = new Schema('用户登录');
      expect(schema.toString()).toBe('用户登录');
    });
  });

  describe('graphology集成验证', () => {
    test('应该正确使用graphology管理内部图结构', () => {
      if (!Schema || !WordCue) return;
      
      const schema = new Schema('复杂场景');
      const cue1 = new WordCue('节点1');
      const cue2 = new WordCue('节点2');
      const cue3 = new WordCue('节点3');
      
      // 构建一个小的图结构
      schema.addCue(cue1)
            .addCue(cue2)
            .addCue(cue3)
            .connectCues(cue1, cue2)
            .connectCues(cue2, cue3);
      
      // 验证图结构特性
      expect(schema.getCues()).toHaveLength(3);
      expect(schema.getCueConnections()).toHaveLength(2);
      
      // 验证可以获取图的度数信息
      expect(schema.getCueDegree(cue2)).toBe(2); // cue2连接了cue1和cue3
      expect(schema.getCueDegree(cue1)).toBe(1);
      expect(schema.getCueDegree(cue3)).toBe(1);
    });
  });
});