// MermaidMindmap.test.js - Mermaid Mindmap解析器测试

const { mermaidMindmap } = require('./index');
const { GraphSchema } = require('../components/GraphSchema');

describe('MermaidMindmap', () => {
  describe('parse()', () => {
    test('should parse simple mindmap', () => {
      const mindmapText = `mindmap
  ((Root))
    Child1
    Child2`;

      const schema = mermaidMindmap.parse(mindmapText);
      
      expect(schema).toBeInstanceOf(GraphSchema);
      expect(schema.name).toBe('Root');
      
      const cues = schema.getCues();
      expect(cues.length).toBe(2);
      expect(cues.map(c => c.word)).toContain('Child1');
      expect(cues.map(c => c.word)).toContain('Child2');
    });

    test('should parse nested mindmap', () => {
      const mindmapText = `mindmap
  ((记忆系统))
    测试功能
      remember功能
        正常工作验证
      recall功能
    架构设计
      持久化方案
        Mermaid格式`;

      const schema = mermaidMindmap.parse(mindmapText);
      
      expect(schema.name).toBe('记忆系统');
      
      const cues = schema.getCues();
      const cueWords = cues.map(c => c.word);
      
      expect(cueWords).toContain('测试功能');
      expect(cueWords).toContain('remember功能');
      expect(cueWords).toContain('正常工作验证');
      expect(cueWords).toContain('recall功能');
      expect(cueWords).toContain('架构设计');
      expect(cueWords).toContain('持久化方案');
      expect(cueWords).toContain('Mermaid格式');
    });

    test('should handle empty mindmap', () => {
      const mindmapText = `mindmap
  ((EmptyRoot))`;

      const schema = mermaidMindmap.parse(mindmapText);
      
      expect(schema.name).toBe('EmptyRoot');
      expect(schema.getCues().length).toBe(0);
    });

    test('should throw error on invalid syntax', () => {
      const invalidText = `not a mindmap`;
      
      expect(() => {
        mermaidMindmap.parse(invalidText);
      }).toThrow();
    });
  });

  describe('serialize()', () => {
    test('should serialize simple schema', () => {
      const schema = new GraphSchema('Root');
      const cue1 = schema.createCue('Child1');
      const cue2 = schema.createCue('Child2');
      
      const result = mermaidMindmap.serialize(schema);
      
      expect(result).toContain('mindmap');
      expect(result).toContain('((Root))');
      expect(result).toContain('Child1');
      expect(result).toContain('Child2');
    });

    test('should serialize nested schema', () => {
      const schema = new GraphSchema('记忆系统');
      const test = schema.createCue('测试功能');
      const remember = schema.createCue('remember功能');
      const verify = schema.createCue('正常工作验证');
      
      test.connect(remember);
      remember.connect(verify);
      
      const result = mermaidMindmap.serialize(schema);
      
      expect(result).toContain('mindmap');
      expect(result).toContain('((记忆系统))');
      expect(result).toContain('测试功能');
      expect(result).toContain('remember功能');
      expect(result).toContain('正常工作验证');
      
      // 验证缩进层级
      const lines = result.split('\n');
      const testLine = lines.find(l => l.includes('测试功能'));
      const rememberLine = lines.find(l => l.includes('remember功能'));
      const verifyLine = lines.find(l => l.includes('正常工作验证'));
      
      expect(testLine.indexOf('测试') < rememberLine.indexOf('remember')).toBe(true);
      expect(rememberLine.indexOf('remember') < verifyLine.indexOf('正常')).toBe(true);
    });
  });

  describe('validate()', () => {
    test('should validate correct mindmap', () => {
      const validText = `mindmap
  ((Root))
    Child1
    Child2`;

      const result = mermaidMindmap.validate(validText);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect invalid mindmap', () => {
      const invalidText = `invalid syntax`;
      
      const result = mermaidMindmap.validate(invalidText);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('merge()', () => {
    test('should merge two mindmaps', () => {
      const existing = `mindmap
  ((Root))
    Child1
    Child2`;

      const newText = `mindmap
  ((Root))
    Child3
    Child4`;

      const result = mermaidMindmap.merge(existing, newText);
      
      expect(result).toContain('Child1');
      expect(result).toContain('Child2');
      expect(result).toContain('Child3');
      expect(result).toContain('Child4');
    });

    test('should handle empty existing text', () => {
      const newText = `mindmap
  ((Root))
    Child1`;

      const result = mermaidMindmap.merge('', newText);
      
      expect(result).toContain('mindmap');
      expect(result).toContain('Root');
      expect(result).toContain('Child1');
    });

    test('should handle duplicate nodes', () => {
      const existing = `mindmap
  ((Root))
    Child1
      SubChild1`;

      const newText = `mindmap
  ((Root))
    Child1
      SubChild2`;

      const result = mermaidMindmap.merge(existing, newText);
      
      expect(result).toContain('Child1');
      expect(result).toContain('SubChild1');
      expect(result).toContain('SubChild2');
    });
  });

  describe('round-trip conversion', () => {
    test('should preserve structure in parse->serialize->parse cycle', () => {
      const originalText = `mindmap
  ((PromptX系统))
    记忆系统
      短期记忆
      长期记忆
    语义网络
      Schema定义
      Cue关系`;

      // 解析
      const schema1 = mermaidMindmap.parse(originalText);
      
      // 序列化
      const serialized = mermaidMindmap.serialize(schema1);
      
      // 再次解析
      const schema2 = mermaidMindmap.parse(serialized);
      
      // 比较两个schema的内容
      const cues1 = schema1.getCues().map(c => c.word).sort();
      const cues2 = schema2.getCues().map(c => c.word).sort();
      
      expect(cues1).toEqual(cues2);
      expect(schema1.name).toBe(schema2.name);
    });
  });
});