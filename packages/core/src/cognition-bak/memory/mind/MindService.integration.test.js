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

  describe('多语义网络（Multiple Independent Schemas）测试', () => {
    test('应该能正确识别和分离独立的Schema组', async () => {
      // 准备：创建多个独立的知识领域
      const globalSemantic = new NetworkSemantic('MultiDomainSemantic');
      
      // 领域1：烹饪
      const cookingSchema = new GraphSchema('烹饪');
      const italianCue = new WordCue('意大利菜');
      const pastaCue = new WordCue('意大利面');
      const pizzaCue = new WordCue('披萨');
      
      // 领域2：量子物理
      const quantumSchema = new GraphSchema('量子物理');
      const waveCue = new WordCue('波粒二象性');
      const uncertaintyCue = new WordCue('不确定性原理');
      
      // 领域3：区块链
      const blockchainSchema = new GraphSchema('区块链');
      const cryptoCue = new WordCue('加密货币');
      const smartContractCue = new WordCue('智能合约');
      
      // 构建独立的语义网络
      await mindService.addMind(cookingSchema, globalSemantic);
      await mindService.addMind(quantumSchema, globalSemantic);
      await mindService.addMind(blockchainSchema, globalSemantic);
      
      // 添加各领域的 Cue
      await mindService.connectMinds(italianCue, cookingSchema);
      await mindService.connectMinds(pastaCue, cookingSchema);
      await mindService.connectMinds(pizzaCue, cookingSchema);
      await mindService.connectMinds(italianCue, pastaCue);  // 领域内连接
      
      await mindService.connectMinds(waveCue, quantumSchema);
      await mindService.connectMinds(uncertaintyCue, quantumSchema);
      
      await mindService.connectMinds(cryptoCue, blockchainSchema);
      await mindService.connectMinds(smartContractCue, blockchainSchema);
      
      // 验证：获取独立的 Schema 组
      const schemaGroups = globalSemantic.getConnectedSchemaGroups();
      expect(schemaGroups).toHaveLength(3);  // 应该有3个独立的组
      
      // 验证：每个组包含正确的 Schema
      const groupNames = schemaGroups.map(group => group.map(s => s.name).sort());
      expect(groupNames).toContainEqual(['烹饪']);
      expect(groupNames).toContainEqual(['量子物理']);
      expect(groupNames).toContainEqual(['区块链']);
      
      // 验证：Mermaid 输出包含多个独立的 mindmap
      const mermaidText = mindService.convertMindToMermaid(globalSemantic);
      const mindmapCount = (mermaidText.match(/^mindmap$/gm) || []).length;
      expect(mindmapCount).toBe(3);  // 应该有3个独立的 mindmap
      
      // 验证：不包含 global-semantic 根节点
      expect(mermaidText).not.toContain('global-semantic');
      expect(mermaidText).not.toContain('MultiDomainSemantic');
    });

    test('应该能正确识别通过共享Cue连接的Schema组', async () => {
      // 准备：创建有关联的知识领域
      const globalSemantic = new NetworkSemantic('ConnectedDomainsSemantic');
      
      // 领域1：健康饮食
      const healthyFoodSchema = new GraphSchema('健康饮食');
      const vegetableCue = new WordCue('蔬菜');
      const nutritionCue = new WordCue('营养');
      const cookingMethodCue = new WordCue('烹饪方法');  // 共享 Cue
      
      // 领域2：烹饪技巧
      const cookingSkillSchema = new GraphSchema('烹饪技巧');
      const stirFryCue = new WordCue('炒菜');
      // 重用 cookingMethodCue - 这将连接两个 Schema
      
      // 领域3：独立的编程领域
      const programmingSchema = new GraphSchema('编程');
      const javascriptCue = new WordCue('JavaScript');
      const pythonCue = new WordCue('Python');
      
      // 构建网络
      await mindService.addMind(healthyFoodSchema, globalSemantic);
      await mindService.addMind(cookingSkillSchema, globalSemantic);
      await mindService.addMind(programmingSchema, globalSemantic);
      
      // 添加 Cue 到各自的 Schema
      await mindService.connectMinds(vegetableCue, healthyFoodSchema);
      await mindService.connectMinds(nutritionCue, healthyFoodSchema);
      await mindService.connectMinds(cookingMethodCue, healthyFoodSchema);
      
      await mindService.connectMinds(stirFryCue, cookingSkillSchema);
      await mindService.connectMinds(cookingMethodCue, cookingSkillSchema);  // 共享的 Cue
      
      await mindService.connectMinds(javascriptCue, programmingSchema);
      await mindService.connectMinds(pythonCue, programmingSchema);
      
      // 验证：获取连接的 Schema 组
      const schemaGroups = globalSemantic.getConnectedSchemaGroups();
      expect(schemaGroups).toHaveLength(2);  // 应该有2个组（健康饮食+烹饪技巧 合并为1组）
      
      // 验证：找到包含两个 Schema 的组
      const connectedGroup = schemaGroups.find(group => group.length === 2);
      expect(connectedGroup).toBeDefined();
      const connectedNames = connectedGroup.map(s => s.name).sort();
      expect(connectedNames).toEqual(['健康饮食', '烹饪技巧']);
      
      // 验证：编程领域独立
      const independentGroup = schemaGroups.find(group => group.length === 1);
      expect(independentGroup).toBeDefined();
      expect(independentGroup[0].name).toBe('编程');
      
      // 验证：Mermaid 输出
      const mermaidText = mindService.convertMindToMermaid(globalSemantic);
      const mindmapCount = (mermaidText.match(/^mindmap$/gm) || []).length;
      expect(mindmapCount).toBe(2);  // 应该有2个 mindmap
    });

    test('应该能正确渲染多个独立Schema的Mermaid格式', async () => {
      // 准备：创建示例语义网络用于文档
      const exampleSemantic = new NetworkSemantic('DocumentationExample');
      
      // 创建三个完全独立的 Schema
      const schema1 = new GraphSchema('前端开发');
      const reactCue = new WordCue('React');
      const vueCue = new WordCue('Vue');
      
      const schema2 = new GraphSchema('后端开发');
      const nodeCue = new WordCue('Node.js');
      const javaCue = new WordCue('Java');
      
      const schema3 = new GraphSchema('数据库');
      const mysqlCue = new WordCue('MySQL');
      const mongodbCue = new WordCue('MongoDB');
      
      // 构建独立网络
      await mindService.addMind(schema1, exampleSemantic);
      await mindService.addMind(schema2, exampleSemantic);
      await mindService.addMind(schema3, exampleSemantic);
      
      await mindService.connectMinds(reactCue, schema1);
      await mindService.connectMinds(vueCue, schema1);
      
      await mindService.connectMinds(nodeCue, schema2);
      await mindService.connectMinds(javaCue, schema2);
      
      await mindService.connectMinds(mysqlCue, schema3);
      await mindService.connectMinds(mongodbCue, schema3);
      
      // 生成 Mermaid 文本
      const mermaidText = mindService.convertMindToMermaid(exampleSemantic);
      
      // 验证：包含所有三个独立的 mindmap
      expect(mermaidText).toContain('root((前端开发))');
      expect(mermaidText).toContain('root((后端开发))');
      expect(mermaidText).toContain('root((数据库))');
      
      // 验证：包含所有技术栈
      expect(mermaidText).toContain('React');
      expect(mermaidText).toContain('Vue');
      expect(mermaidText).toContain('Node.js');
      expect(mermaidText).toContain('Java');
      expect(mermaidText).toContain('MySQL');
      expect(mermaidText).toContain('MongoDB');
      
      // 保存示例文件
      const projectRoot = path.resolve(__dirname, '../../../../..');
      const exampleDir = path.join(projectRoot, 'test-output', 'mind-service', 'multiple-schemas-example');
      await fs.ensureDir(exampleDir);
      
      const exampleService = new MindService();
      exampleService.setStoragePath(exampleDir);
      await exampleService.persistSemantic(exampleSemantic);
      await exampleService.persistMindAsMermaid(exampleSemantic, 'multiple-schemas-example');
      
      console.log(`\n✅ 生成了多语义网络示例文件在: ${exampleDir}`);
      console.log('  - DocumentationExample.json: 多个独立 Schema 的语义网络');
      console.log('  - multiple-schemas-example.mmd: Mermaid 格式的多个独立 mindmap');
    });

    test('应该能通过新词桥接原本独立的Schema', async () => {
      // 准备：创建初始独立的知识领域
      const globalSemantic = new NetworkSemantic('BridgingSemantic');
      
      // 领域1：健康生活
      const healthSchema = new GraphSchema('健康生活');
      const exerciseCue = new WordCue('运动');
      const dietCue = new WordCue('饮食');
      
      // 领域2：技术开发
      const techSchema = new GraphSchema('技术开发');
      const apiCue = new WordCue('API开发');
      const databaseCue = new WordCue('数据库设计');
      
      // 构建初始的独立网络
      await mindService.addMind(healthSchema, globalSemantic);
      await mindService.addMind(techSchema, globalSemantic);
      
      await mindService.connectMinds(exerciseCue, healthSchema);
      await mindService.connectMinds(dietCue, healthSchema);
      
      await mindService.connectMinds(apiCue, techSchema);
      await mindService.connectMinds(databaseCue, techSchema);
      
      // 验证初始状态：两个独立的 Schema 组
      let schemaGroups = globalSemantic.getConnectedSchemaGroups();
      expect(schemaGroups).toHaveLength(2);
      
      // 验证初始 Mermaid 输出：两个独立的 mindmap
      let mermaidText = mindService.convertMindToMermaid(globalSemantic);
      let mindmapCount = (mermaidText.match(/^mindmap$/gm) || []).length;
      expect(mindmapCount).toBe(2);
      
      // 场景：添加一个新的 Schema，它与两个原本独立的领域都有关联
      const appSchema = new GraphSchema('健康管理应用');
      const healthDataCue = new WordCue('健康数据');  // 连接到健康领域
      const apiDesignCue = new WordCue('API设计');     // 连接到技术领域
      
      // 添加新 Schema
      await mindService.addMind(appSchema, globalSemantic);
      
      // 建立桥接连接
      await mindService.connectMinds(healthDataCue, appSchema);
      await mindService.connectMinds(apiDesignCue, appSchema);
      
      // 关键：将桥接词汇连接到原有的领域
      await mindService.connectMinds(healthDataCue, healthSchema);  // 连接到健康生活
      await mindService.connectMinds(apiDesignCue, techSchema);     // 连接到技术开发
      
      // 重要：还需要连接新 Schema 的 Cue 到原有领域的 Cue，形成真正的桥接
      await mindService.connectMinds(healthDataCue, dietCue);       // 健康数据与饮食相关
      await mindService.connectMinds(apiDesignCue, apiCue);         // API设计与API开发相关
      
      // 验证连接后的状态：应该合并为一个大的 Schema 组
      schemaGroups = globalSemantic.getConnectedSchemaGroups();
      expect(schemaGroups).toHaveLength(1);  // 三个 Schema 通过桥接词汇连成一个组
      
      // 验证合并后的组包含所有三个 Schema
      const mergedGroup = schemaGroups[0];
      expect(mergedGroup).toHaveLength(3);
      const schemaNames = mergedGroup.map(s => s.name).sort();
      expect(schemaNames).toEqual(['健康生活', '健康管理应用', '技术开发']);
      
      // 验证 Mermaid 输出：现在应该只有一个 mindmap
      mermaidText = mindService.convertMindToMermaid(globalSemantic);
      mindmapCount = (mermaidText.match(/^mindmap$/gm) || []).length;
      expect(mindmapCount).toBe(1);
      
      // 验证合并后的 mindmap 包含所有元素
      expect(mermaidText).toContain('健康生活');
      expect(mermaidText).toContain('技术开发');
      expect(mermaidText).toContain('健康管理应用');
      expect(mermaidText).toContain('健康数据');
      expect(mermaidText).toContain('API设计');
      
      // 验证根节点包含所有三个 Schema 的名称
      expect(mermaidText).toMatch(/root\(\(.*健康生活.*健康管理应用.*技术开发.*\)\)/s);
      
      // 保存演示文件
      const projectRoot = path.resolve(__dirname, '../../../../..');
      const bridgeDir = path.join(projectRoot, 'test-output', 'mind-service', 'bridging-example');
      await fs.ensureDir(bridgeDir);
      
      const bridgeService = new MindService();
      bridgeService.setStoragePath(bridgeDir);
      
      // 保存桥接前的状态（模拟）
      const beforeBridgeSemantic = new NetworkSemantic('BeforeBridge');
      const health1 = new GraphSchema('健康生活');
      const tech1 = new GraphSchema('技术开发');
      await bridgeService.addMind(health1, beforeBridgeSemantic);
      await bridgeService.addMind(tech1, beforeBridgeSemantic);
      await bridgeService.persistMindAsMermaid(beforeBridgeSemantic, 'before-bridge');
      
      // 保存桥接后的状态
      await bridgeService.persistSemantic(globalSemantic);
      await bridgeService.persistMindAsMermaid(globalSemantic, 'after-bridge');
      
      console.log(`\n✅ 生成了桥接示例文件在: ${bridgeDir}`);
      console.log('  - before-bridge.mmd: 桥接前的两个独立 mindmap');
      console.log('  - after-bridge.mmd: 桥接后合并为一个 mindmap');
      console.log('  - BridgingSemantic.json: 完整的桥接后语义网络');
    });
  });
});