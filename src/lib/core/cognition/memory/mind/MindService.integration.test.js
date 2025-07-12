// MindService 集成测试
// 测试整个Mind体系的服务层集成

const { MindService } = require('./MindService.js');
const { WordCue } = require('./components/WordCue.js');
const { GraphSchema } = require('./components/GraphSchema.js');
const { NetworkSemantic } = require('./components/NetworkSemantic.js');
const fs = require('fs-extra');
const path = require('path');

describe('MindService 集成测试', () => {
  let mindService;
  let testDir;
  
  beforeEach(async () => {
    mindService = new MindService();
    
    // 使用PromptX项目根目录的统一测试输出目录
    const projectRoot = path.resolve(__dirname, '../../../../..');
    testDir = path.join(projectRoot, 'test-output', 'mind-service', Date.now().toString());
    await fs.ensureDir(testDir);
    mindService.setStoragePath(testDir);
  });
  
  afterEach(async () => {
    // 清理测试目录 (示例测试保留文件)
    if (testDir && await fs.pathExists(testDir) && !testDir.includes('example-output')) {
      await fs.remove(testDir);
    }
  });

  describe('addMind 功能测试', () => {
    test('应该能添加WordCue到Semantic', async () => {
      // 准备
      const semantic = new NetworkSemantic('TestSemantic');
      const cue = new WordCue('苹果');
      
      // 执行
      await mindService.addMind(cue, semantic);
      
      // 验证
      expect(semantic.hasCue(cue)).toBe(true);
      expect(semantic.getAllCues()).toContain(cue);
    });

    test('应该能添加GraphSchema到Semantic', async () => {
      // 准备
      const semantic = new NetworkSemantic('TestSemantic');
      const schema = new GraphSchema('用户登录');
      
      // 执行
      await mindService.addMind(schema, semantic);
      
      // 验证
      expect(semantic.hasSchema(schema)).toBe(true);
      expect(semantic.getAllSchemas()).toContain(schema);
    });

    test('应该能添加Semantic到另一个Semantic（嵌套）', async () => {
      // 准备
      const mainSemantic = new NetworkSemantic('MainSemantic');
      const subSemantic = new NetworkSemantic('SubSemantic');
      
      // 执行
      await mindService.addMind(subSemantic, mainSemantic);
      
      // 验证 - 这里需要确认NetworkSemantic如何处理嵌套Semantic
      // 暂时验证连接关系
      expect(mainSemantic.isConnectedTo(subSemantic)).toBe(true);
    });
  });

  describe('connectMinds 功能测试', () => {
    test('应该能连接两个WordCue（同层连接）', async () => {
      // 准备
      const cue1 = new WordCue('苹果');
      const cue2 = new WordCue('水果');
      
      // 执行
      await mindService.connectMinds(cue1, cue2);
      
      // 验证
      expect(cue1.getConnections()).toContain('水果');
      expect(cue2.getConnections()).toContain('苹果');
    });

    test('应该能连接WordCue和GraphSchema（跨层连接）', async () => {
      // 准备
      const cue = new WordCue('用户');
      const schema = new GraphSchema('用户登录');
      
      // 执行
      await mindService.connectMinds(cue, schema);
      
      // 验证 - 层次主导原则：cue被包含到schema中
      expect(schema.hasCue(cue)).toBe(true);
      expect(schema.getCues()).toContain(cue);
    });

    test('应该能连接GraphSchema和NetworkSemantic（跨层连接）', async () => {
      // 准备
      const schema = new GraphSchema('用户登录');
      const semantic = new NetworkSemantic('GlobalSemantic');
      
      // 执行
      await mindService.connectMinds(schema, semantic);
      
      // 验证 - 层次主导原则：schema被包含到semantic中
      expect(semantic.hasSchema(schema)).toBe(true);
      expect(semantic.getAllSchemas()).toContain(schema);
    });

    test('应该正确应用层次主导原则', async () => {
      // 准备
      const cue = new WordCue('登录');
      const schema = new GraphSchema('用户登录');
      const semantic = new NetworkSemantic('系统认知');
      
      // 执行：建立完整的层次关系
      await mindService.connectMinds(cue, schema);    // cue → schema
      await mindService.connectMinds(schema, semantic); // schema → semantic
      
      // 验证层次关系
      expect(schema.hasCue(cue)).toBe(true);           // cue在schema中
      expect(semantic.hasSchema(schema)).toBe(true);    // schema在semantic中
      expect(semantic.hasCue(cue)).toBe(false);        // cue不直接在semantic中
    });
  });

  describe('persistSemantic 功能测试', () => {
    test('应该能持久化空的Semantic', async () => {
      // 准备
      const semantic = new NetworkSemantic('EmptySemantic');
      
      // 执行
      await mindService.persistSemantic(semantic);
      
      // 验证文件存在
      const filePath = path.join(testDir, 'EmptySemantic.json');
      expect(await fs.pathExists(filePath)).toBe(true);
      
      // 验证文件内容
      const content = await fs.readJson(filePath);
      expect(content.name).toBe('EmptySemantic');
      expect(content.type).toBe('NetworkSemantic');
    });

    test('应该能持久化包含Mind的Semantic', async () => {
      // 准备复杂的认知网络
      const semantic = new NetworkSemantic('ComplexSemantic');
      const cue1 = new WordCue('苹果');
      const cue2 = new WordCue('水果');
      const schema = new GraphSchema('吃苹果');
      
      // 建立网络
      await mindService.addMind(cue1, semantic);
      await mindService.addMind(cue2, semantic);
      await mindService.addMind(schema, semantic);
      await mindService.connectMinds(cue1, cue2);
      await mindService.connectMinds(cue1, schema);
      
      // 执行持久化
      await mindService.persistSemantic(semantic);
      
      // 验证文件内容
      const filePath = path.join(testDir, 'ComplexSemantic.json');
      const content = await fs.readJson(filePath);
      
      expect(content.name).toBe('ComplexSemantic');
      expect(content.cues).toHaveLength(2);
      expect(content.schemas).toHaveLength(1);
      expect(content.connections).toBeDefined();
    });

    test('应该能从持久化文件加载Semantic', async () => {
      // 准备并持久化
      const originalSemantic = new NetworkSemantic('LoadTestSemantic');
      const cue = new WordCue('测试词汇');
      
      await mindService.addMind(cue, originalSemantic);
      await mindService.persistSemantic(originalSemantic);
      
      // 执行加载
      const loadedSemantic = await mindService.loadSemantic('LoadTestSemantic');
      
      // 验证加载结果
      expect(loadedSemantic.name).toBe('LoadTestSemantic');
      expect(loadedSemantic.getAllCues()).toHaveLength(1);
      expect(loadedSemantic.getAllCues()[0].word).toBe('测试词汇');
    });
  });

  describe('完整集成流程测试', () => {
    test('应该能创建、连接、持久化完整的认知网络', async () => {
      // 准备：创建认知网络
      const globalSemantic = new NetworkSemantic('GlobalCognition');
      
      // 创建Cue层
      const userCue = new WordCue('用户');
      const loginCue = new WordCue('登录');
      const systemCue = new WordCue('系统');
      
      // 创建Schema层
      const loginSchema = new GraphSchema('用户登录');
      const systemSchema = new GraphSchema('系统启动');
      
      // 执行：构建网络
      // 1. 添加所有Mind到全局语义网络
      await mindService.addMind(userCue, globalSemantic);
      await mindService.addMind(loginCue, globalSemantic);
      await mindService.addMind(systemCue, globalSemantic);
      await mindService.addMind(loginSchema, globalSemantic);
      await mindService.addMind(systemSchema, globalSemantic);
      
      // 2. 建立连接关系
      await mindService.connectMinds(userCue, loginCue);      // 词汇关联
      await mindService.connectMinds(loginCue, loginSchema);  // 词汇→事件
      await mindService.connectMinds(loginSchema, systemSchema); // 事件关联
      
      // 3. 持久化整个网络
      await mindService.persistSemantic(globalSemantic);
      
      // 验证：网络结构正确
      expect(globalSemantic.getAllCues()).toHaveLength(3);
      expect(globalSemantic.getAllSchemas()).toHaveLength(2);
      expect(userCue.getConnections()).toContain('登录');
      expect(loginSchema.hasCue(loginCue)).toBe(true);
      
      // 验证：持久化成功
      const filePath = path.join(testDir, 'GlobalCognition.json');
      expect(await fs.pathExists(filePath)).toBe(true);
      
      // 验证：可以重新加载
      const reloadedSemantic = await mindService.loadSemantic('GlobalCognition');
      expect(reloadedSemantic.getAllCues()).toHaveLength(3);
      expect(reloadedSemantic.getAllSchemas()).toHaveLength(2);
    });
  });

  describe('📁 示例输出文件（用于查看JSON格式）', () => {
    test('生成各种类型的Mind序列化示例', async () => {
      // 使用固定的输出目录（不会被清理）
      const projectRoot = path.resolve(__dirname, '../../../../..');
      const exampleDir = path.join(projectRoot, 'test-output', 'mind-service', 'example-output');
      await fs.ensureDir(exampleDir);
      
      const exampleService = new MindService();
      exampleService.setStoragePath(exampleDir);

      // 1. 简单的Semantic示例
      const simpleSemantic = new NetworkSemantic('SimpleCognition');
      await exampleService.persistSemantic(simpleSemantic);

      // 2. 包含Cue的Semantic示例
      const cuesSemantic = new NetworkSemantic('CuesExample');
      const apple = new WordCue('苹果');
      const fruit = new WordCue('水果');
      const healthy = new WordCue('健康');
      
      await exampleService.addMind(apple, cuesSemantic);
      await exampleService.addMind(fruit, cuesSemantic);
      await exampleService.addMind(healthy, cuesSemantic);
      
      // 建立词汇关联
      await exampleService.connectMinds(apple, fruit);
      await exampleService.connectMinds(fruit, healthy);
      
      await exampleService.persistSemantic(cuesSemantic);

      // 3. 包含Schema的完整示例
      const fullSemantic = new NetworkSemantic('FullCognitionExample');
      
      // 创建词汇层
      const user = new WordCue('用户');
      const login = new WordCue('登录');
      const system = new WordCue('系统');
      const data = new WordCue('数据');
      const analysis = new WordCue('分析');
      
      // 创建事件层
      const loginEvent = new GraphSchema('用户登录事件');
      const analysisEvent = new GraphSchema('数据分析流程');
      
      // 构建网络
      await exampleService.addMind(user, fullSemantic);
      await exampleService.addMind(login, fullSemantic);
      await exampleService.addMind(system, fullSemantic);
      await exampleService.addMind(data, fullSemantic);
      await exampleService.addMind(analysis, fullSemantic);
      await exampleService.addMind(loginEvent, fullSemantic);
      await exampleService.addMind(analysisEvent, fullSemantic);
      
      // 建立连接关系
      await exampleService.connectMinds(user, login);           // 词汇关联
      await exampleService.connectMinds(data, analysis);        // 词汇关联
      await exampleService.connectMinds(login, loginEvent);     // 词汇→事件
      await exampleService.connectMinds(analysis, analysisEvent); // 词汇→事件
      await exampleService.connectMinds(loginEvent, analysisEvent); // 事件关联
      
      await exampleService.persistSemantic(fullSemantic);

      // 输出文件位置信息
      console.log('\n📁 示例文件已生成在:', exampleDir);
      console.log('包含以下文件:');
      console.log('- SimpleCognition.json (空语义网络)');
      console.log('- CuesExample.json (词汇关联网络)');
      console.log('- FullCognitionExample.json (完整认知网络)');
      
      // 验证文件存在
      expect(await fs.pathExists(path.join(exampleDir, 'SimpleCognition.json'))).toBe(true);
      expect(await fs.pathExists(path.join(exampleDir, 'CuesExample.json'))).toBe(true);
      expect(await fs.pathExists(path.join(exampleDir, 'FullCognitionExample.json'))).toBe(true);
    });
  });
});