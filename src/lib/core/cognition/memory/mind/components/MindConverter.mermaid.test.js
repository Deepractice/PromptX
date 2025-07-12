// MindConverter.mermaid.test.js - 测试 Mermaid 双向转换功能

const { MindConverter } = require('./MindConverter.js');
const { WordCue } = require('./WordCue.js');
const { GraphSchema } = require('./GraphSchema.js');

describe('MindConverter Mermaid 双向转换', () => {
  let converter;
  
  beforeEach(() => {
    converter = new MindConverter();
  });

  describe('convertMermaidToSchema', () => {
    test('应该将简单的 Mermaid mindmap 转换为 Schema', () => {
      // Given
      const mermaidText = `mindmap
  root)JavaScript)
    前端
    编程语言`;
      
      // When
      const schema = converter.convertMermaidToSchema(mermaidText);
      
      // Then
      expect(schema).toBeDefined();
      const cues = schema.getCues();
      expect(cues.length).toBe(3);
      expect(cues.map(c => c.word)).toContain('JavaScript');
      expect(cues.map(c => c.word)).toContain('前端');
      expect(cues.map(c => c.word)).toContain('编程语言');
    });

    test('应该处理嵌套的 Mermaid 结构', () => {
      // Given
      const mermaidText = `mindmap
  root)认知系统)
    记忆
      短期记忆
      长期记忆
    思维
      分析
      综合`;
      
      // When
      const schema = converter.convertMermaidToSchema(mermaidText);
      
      // Then
      expect(schema).toBeDefined();
      const cues = schema.getCues();
      expect(cues.length).toBe(7);
      
      // 验证层级关系
      const 认知系统 = cues.find(c => c.word === '认知系统');
      const 记忆 = cues.find(c => c.word === '记忆');
      const 短期记忆 = cues.find(c => c.word === '短期记忆');
      
      expect(认知系统.getConnections()).toContain('记忆');
      expect(记忆.getConnections()).toContain('短期记忆');
    });

    test('应该处理空输入', () => {
      // Given
      const mermaidText = '';
      
      // When
      const schema = converter.convertMermaidToSchema(mermaidText);
      
      // Then
      expect(schema).toBeNull();
    });

    test('应该处理只有 mindmap 声明的输入', () => {
      // Given
      const mermaidText = 'mindmap';
      
      // When
      const schema = converter.convertMermaidToSchema(mermaidText);
      
      // Then
      expect(schema).toBeNull();
    });

    test('应该处理不同的节点格式', () => {
      // Given
      const mermaidText = `mindmap
  root((中心))
    [方形节点]
    (圆形节点)
    {菱形节点}
    {{六边形}}
    简单文本`;
      
      // When
      const schema = converter.convertMermaidToSchema(mermaidText);
      
      // Then
      const cues = schema.getCues();
      expect(cues.map(c => c.word)).toContain('中心');
      expect(cues.map(c => c.word)).toContain('方形节点');
      expect(cues.map(c => c.word)).toContain('圆形节点');
      expect(cues.map(c => c.word)).toContain('菱形节点');
      expect(cues.map(c => c.word)).toContain('六边形');
      expect(cues.map(c => c.word)).toContain('简单文本');
    });
  });

  describe('双向转换一致性', () => {
    test('Schema -> Mermaid -> Schema 应该保持结构', () => {
      // Given: 创建一个 Schema
      const originalSchema = new GraphSchema('test-schema');
      const cue1 = new WordCue('概念A');
      const cue2 = new WordCue('概念B');
      const cue3 = new WordCue('概念C');
      
      originalSchema.connect(cue1);
      originalSchema.connect(cue2);
      originalSchema.connect(cue3);
      cue1.connect(cue2);
      
      // When: 转换为 Mermaid 再转回 Schema
      const mermaidText = converter.convertMindToMermaid(originalSchema);
      const convertedSchema = converter.convertMermaidToSchema(mermaidText);
      
      // Then: 验证基本结构保持
      const convertedCues = convertedSchema.getCues();
      
      // 生成的 Mermaid 会包含 schema 的名称作为根节点，所以会有4个节点
      expect(convertedCues.length).toBe(4);
      expect(convertedCues.map(c => c.word)).toContain('test-schema'); // Schema 名称（sanitize 后）
      expect(convertedCues.map(c => c.word)).toContain('概念A');
      expect(convertedCues.map(c => c.word)).toContain('概念B');
      expect(convertedCues.map(c => c.word)).toContain('概念C');
    });
  });
});