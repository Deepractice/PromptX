// MindService.mermaid.test.js - MindService Mermaid字符串API测试

const fs = require('fs-extra');
const path = require('path');
const { MindService } = require('./MindService.js');
const { WordCue } = require('./components/WordCue.js');
const { GraphSchema } = require('./components/GraphSchema.js');
const { NetworkSemantic } = require('./components/NetworkSemantic.js');

describe('MindService Mermaid API', () => {
  let mindService;
  let testOutputDir;

  beforeEach(async () => {
    mindService = new MindService();
    
    // 设置测试输出目录
    testOutputDir = path.join(__dirname, '../../../test-output/mind-service-mermaid');
    await fs.ensureDir(testOutputDir);
    mindService.setStoragePath(testOutputDir);
  });

  afterEach(async () => {
    // 清理测试文件
    if (await fs.pathExists(testOutputDir)) {
      await fs.remove(testOutputDir);
    }
  });

  describe('convertMindToMermaid', () => {
    test('应该转换WordCue为Mermaid字符串', () => {
      // Given
      const cue = new WordCue('test');
      
      // When
      const mermaidText = mindService.convertMindToMermaid(cue);
      
      // Then
      expect(mermaidText).toContain('mindmap');
      expect(mermaidText).toContain('test');
    });

    test('应该支持转换选项', () => {
      // Given
      const cue = new WordCue('test');
      
      // When
      const mermaidText = mindService.convertMindToMermaid(cue, { 
        type: 'mindmap'
      });
      
      // Then
      expect(mermaidText).toContain('mindmap');
    });

    test('应该转换复杂Semantic结构', async () => {
      // Given
      const semantic = new NetworkSemantic('complex');
      const schema = new GraphSchema('concepts');
      const cue1 = new WordCue('hello');
      const cue2 = new WordCue('world');
      
      cue1.connect(cue2);
      schema.addCue(cue1);
      schema.addCue(cue2);
      await mindService.addMind(schema, semantic);
      
      // When
      const mermaidText = mindService.convertMindToMermaid(semantic);
      
      // Then
      expect(mermaidText).toContain('concepts');
      expect(mermaidText).toContain('hello');
      expect(mermaidText).toContain('world');
    });
  });

  describe('persistMindAsMermaid', () => {
    test('应该持久化Mind为Mermaid文件', async () => {
      // Given
      const semantic = new NetworkSemantic('test_mind');
      const cue = new WordCue('hello');
      semantic.addCue(cue);
      
      // When
      const filePath = await mindService.persistMindAsMermaid(semantic, 'test_mind');
      
      // Then
      expect(await fs.pathExists(filePath)).toBe(true);
      expect(filePath).toMatch(/test_mind\.mmd$/);
      
      const content = await fs.readFile(filePath, 'utf8');
      expect(content).toContain('mindmap');
      expect(content).toContain('hello');
    });

    test('应该支持自定义转换选项', async () => {
      // Given
      const cue = new WordCue('test');
      
      // When
      const filePath = await mindService.persistMindAsMermaid(
        cue, 
        'custom_options',
        { type: 'mindmap' }
      );
      
      // Then
      const content = await fs.readFile(filePath, 'utf8');
      expect(content).toContain('mindmap');
    });

    test('应该在未设置存储路径时抛出错误', async () => {
      // Given
      const serviceWithoutPath = new MindService();
      const cue = new WordCue('test');
      
      // When & Then
      await expect(
        serviceWithoutPath.persistMindAsMermaid(cue, 'test')
      ).rejects.toThrow('Storage path not set');
    });

    test('应该在缺少参数时抛出错误', async () => {
      // When & Then
      await expect(
        mindService.persistMindAsMermaid(null, 'test')
      ).rejects.toThrow('Mind and filename are required');
      
      const cue = new WordCue('test');
      await expect(
        mindService.persistMindAsMermaid(cue, null)
      ).rejects.toThrow('Mind and filename are required');
    });
  });

  describe('loadMermaidText', () => {
    test('应该加载Mermaid文件内容', async () => {
      // Given - 先创建一个Mermaid文件
      const semantic = new NetworkSemantic('load_test');
      const cue = new WordCue('content');
      semantic.addCue(cue);
      
      await mindService.persistMindAsMermaid(semantic, 'load_test');
      
      // When
      const content = await mindService.loadMermaidText('load_test');
      
      // Then
      expect(content).toContain('mindmap');
      expect(content).toContain('content');
    });

    test('应该在文件不存在时抛出错误', async () => {
      // When & Then
      await expect(
        mindService.loadMermaidText('nonexistent')
      ).rejects.toThrow('Mermaid file not found');
    });

    test('应该在未设置存储路径时抛出错误', async () => {
      // Given
      const serviceWithoutPath = new MindService();
      
      // When & Then
      await expect(
        serviceWithoutPath.loadMermaidText('test')
      ).rejects.toThrow('Storage path not set');
    });
  });

  describe('persistSemanticBoth', () => {
    test('应该同时持久化JSON和Mermaid格式', async () => {
      // Given
      const semantic = new NetworkSemantic('dual_format');
      const schema = new GraphSchema('test_schema');
      const cue1 = new WordCue('node1');
      const cue2 = new WordCue('node2');
      
      cue1.connect(cue2);
      schema.addCue(cue1);
      schema.addCue(cue2);
      await mindService.addMind(schema, semantic);
      
      // When
      const result = await mindService.persistSemanticBoth(semantic);
      
      // Then
      expect(result).toHaveProperty('jsonPath');
      expect(result).toHaveProperty('mermaidPath');
      
      // 验证两个文件都存在
      expect(await fs.pathExists(result.jsonPath)).toBe(true);
      expect(await fs.pathExists(result.mermaidPath)).toBe(true);
      
      // 验证文件内容
      const jsonContent = await fs.readJson(result.jsonPath);
      expect(jsonContent.name).toBe('dual_format');
      
      const mermaidContent = await fs.readFile(result.mermaidPath, 'utf8');
      expect(mermaidContent).toContain('test_schema');
      expect(mermaidContent).toContain('node1');
      expect(mermaidContent).toContain('node2');
    });

    test('应该支持自定义转换选项', async () => {
      // Given
      const semantic = new NetworkSemantic('custom_both');
      const cue = new WordCue('test');
      semantic.addCue(cue);
      
      // When
      const result = await mindService.persistSemanticBoth(
        semantic, 
        { type: 'mindmap' }
      );
      
      // Then
      const mermaidContent = await fs.readFile(result.mermaidPath, 'utf8');
      expect(mermaidContent).toContain('mindmap');
    });

    test('应该在缺少参数时抛出错误', async () => {
      // When & Then
      await expect(
        mindService.persistSemanticBoth(null)
      ).rejects.toThrow('Semantic is required for persistence');
    });
  });

  describe('集成工作流测试', () => {
    test('应该支持完整的Mermaid读写工作流', async () => {
      // 1. 创建结构
      const semantic = new NetworkSemantic('workflow_test');
      
      const aiSchema = new GraphSchema('ai_concepts');
      const aiCue = new WordCue('artificial_intelligence');
      const mlCue = new WordCue('machine_learning');
      aiCue.connect(mlCue);
      aiSchema.addCue(aiCue);
      aiSchema.addCue(mlCue);
      
      await mindService.addMind(aiSchema, semantic);
      
      // 2. 转换为Mermaid字符串
      const originalMermaid = mindService.convertMindToMermaid(semantic);
      expect(originalMermaid).toContain('ai_concepts');
      expect(originalMermaid).toContain('artificial_intelligence');
      expect(originalMermaid).toContain('machine_learning');
      
      // 3. 持久化Mermaid文件
      const mermaidPath = await mindService.persistMindAsMermaid(semantic, 'workflow_test');
      expect(await fs.pathExists(mermaidPath)).toBe(true);
      
      // 4. 重新加载Mermaid内容
      const loadedMermaidContent = await mindService.loadMermaidText('workflow_test');
      expect(loadedMermaidContent).toContain('ai_concepts');
      expect(loadedMermaidContent).toContain('artificial_intelligence');
      expect(loadedMermaidContent).toContain('machine_learning');
      
      // 5. 验证内容一致性
      expect(loadedMermaidContent).toBe(originalMermaid);
    });

    test('应该支持双格式持久化', async () => {
      // Given
      const semantic = new NetworkSemantic('dual_test');
      const cue = new WordCue('simple_test');
      semantic.addCue(cue);
      
      // When
      const result = await mindService.persistSemanticBoth(semantic);
      
      // Then
      expect(await fs.pathExists(result.jsonPath)).toBe(true);
      expect(await fs.pathExists(result.mermaidPath)).toBe(true);
      
      // 验证Mermaid内容正确
      const mermaidContent = await mindService.loadMermaidText('dual_test');
      expect(mermaidContent).toContain('simple_test');
    });
  });
});