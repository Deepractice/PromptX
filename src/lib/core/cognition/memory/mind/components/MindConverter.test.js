// MindConverter.test.js - Mind转Mermaid字符串的TDD测试用例

const { MindConverter } = require('./MindConverter.js');
const { WordCue } = require('./WordCue.js');
const { GraphSchema } = require('./GraphSchema.js');
const { NetworkSemantic } = require('./NetworkSemantic.js');

describe('MindConverter', () => {
  let converter;

  beforeEach(() => {
    converter = new MindConverter();
  });

  describe('convertMindToMermaid', () => {
    test('should convert single WordCue to mermaid mindmap', () => {
      // Given
      const cue = new WordCue('hello');
      
      // When
      const mermaidText = converter.convertMindToMermaid(cue);
      
      // Then
      expect(mermaidText).toContain('mindmap');
      expect(mermaidText).toContain('root)hello)');
    });

    test('should convert connected WordCues to mindmap with branches', () => {
      // Given
      const cue1 = new WordCue('hello');
      const cue2 = new WordCue('world');
      cue1.connect(cue2);
      
      // When
      const mermaidText = converter.convertMindToMermaid(cue1);
      
      // Then
      expect(mermaidText).toContain('mindmap');
      expect(mermaidText).toContain('root)hello)');
      expect(mermaidText).toContain('world');
    });

    test('should convert GraphSchema to mermaid mindmap', () => {
      // Given
      const schema = new GraphSchema('greeting');
      const cue1 = new WordCue('hello');
      const cue2 = new WordCue('world');
      cue1.connect(cue2);
      schema.addCue(cue1);
      schema.addCue(cue2);
      
      // When
      const mermaidText = converter.convertMindToMermaid(schema);
      
      // Then
      expect(mermaidText).toContain('mindmap');
      expect(mermaidText).toContain('root)greeting)');
      expect(mermaidText).toContain('hello');
      expect(mermaidText).toContain('world');
    });

    test('should convert NetworkSemantic to mermaid mindmap with multiple schemas', () => {
      // Given
      const semantic = new NetworkSemantic('conversation');
      
      const schema1 = new GraphSchema('greeting');
      const cue1 = new WordCue('hello');
      const cue2 = new WordCue('world');
      cue1.connect(cue2);
      schema1.addCue(cue1);
      schema1.addCue(cue2);
      
      const schema2 = new GraphSchema('farewell');
      const cue3 = new WordCue('goodbye');
      const cue4 = new WordCue('everyone');
      cue3.connect(cue4);
      schema2.addCue(cue3);
      schema2.addCue(cue4);
      
      semantic.addSchema(schema1);
      semantic.addSchema(schema2);
      
      // When
      const mermaidText = converter.convertMindToMermaid(semantic);
      
      // Then
      expect(mermaidText).toContain('mindmap');
      expect(mermaidText).toContain('root)conversation)');
      expect(mermaidText).toContain('greeting');
      expect(mermaidText).toContain('farewell');
      expect(mermaidText).toContain('hello');
      expect(mermaidText).toContain('goodbye');
    });

    test('should handle cross-schema connections in mindmap', () => {
      // Given
      const semantic = new NetworkSemantic('conversation');
      
      const schema1 = new GraphSchema('greeting');
      const cue1 = new WordCue('hello');
      schema1.addCue(cue1);
      
      const schema2 = new GraphSchema('response');
      const cue2 = new WordCue('hi');
      schema2.addCue(cue2);
      
      // 建立跨Schema连接
      cue1.connect(cue2);
      
      semantic.addSchema(schema1);
      semantic.addSchema(schema2);
      
      // When
      const mermaidText = converter.convertMindToMermaid(semantic);
      
      // Then - mindmap会显示在不同分支下
      expect(mermaidText).toContain('hello');
      expect(mermaidText).toContain('hi');
    });

    test('should handle empty Mind gracefully', () => {
      // Given
      const emptySemantic = new NetworkSemantic('empty');
      
      // When
      const mermaidText = converter.convertMindToMermaid(emptySemantic);
      
      // Then
      expect(mermaidText).toContain('mindmap');
      expect(mermaidText).toContain('root)empty)');
    });

    test('should throw error for null or undefined Mind', () => {
      // When & Then
      expect(() => converter.convertMindToMermaid(null)).toThrow('Mind is required');
      expect(() => converter.convertMindToMermaid(undefined)).toThrow('Mind is required');
    });

    test('should handle complex nested structure in mindmap', () => {
      // Given
      const semantic = new NetworkSemantic('knowledge');
      
      // 创建多层嵌套结构
      const schema = new GraphSchema('concepts');
      const cue1 = new WordCue('AI');
      const cue2 = new WordCue('Machine_Learning');
      const cue3 = new WordCue('Deep_Learning');
      
      // 建立连接关系
      cue1.connect(cue2);
      cue2.connect(cue3);
      
      schema.addCue(cue1);
      schema.addCue(cue2);
      schema.addCue(cue3);
      semantic.addSchema(schema);
      
      // When
      const mermaidText = converter.convertMindToMermaid(semantic);
      
      // Then
      expect(mermaidText).toContain('mindmap');
      expect(mermaidText).toContain('root)knowledge)');
      expect(mermaidText).toContain('concepts');
      expect(mermaidText).toContain('AI');
      expect(mermaidText).toContain('Machine_Learning');
      expect(mermaidText).toContain('Deep_Learning');
    });
  });
});