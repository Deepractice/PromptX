/**
 * PromptX六大锦囊MCP工具简化测试
 * 
 * 测试六个锦囊工具的基本功能（5个核心 + 1个可选）
 */

// 单独导入命令，避免资源重复注册问题
const InitCommand = require('../../lib/core/pouch/commands/InitCommand');
const HelloCommand = require('../../lib/core/pouch/commands/HelloCommand');
const ActionCommand = require('../../lib/core/pouch/commands/ActionCommand');
const LearnCommand = require('../../lib/core/pouch/commands/LearnCommand');
const RecallCommand = require('../../lib/core/pouch/commands/RecallCommand');
const RememberCommand = require('../../lib/core/pouch/commands/RememberCommand');

describe('PromptX六大锦囊MCP工具基础测试', () => {
  let jinang;

  beforeAll(async () => {
    // 初始化锦囊命令实例
    jinang = {
      init: new InitCommand(),
      hello: new HelloCommand(),
      action: new ActionCommand(),
      learn: new LearnCommand(),
      recall: new RecallCommand(),
      remember: new RememberCommand()
    };
    
    // 执行初始化
    await jinang.init.getContent([]);
  });

  describe('🏗️ init锦囊 - 环境初始化', () => {
    test('应该能执行初始化', async () => {
      const result = await jinang.init.getContent([]);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('初始化');
    });
  });

  describe('👋 hello锦囊 - 角色发现', () => {
    test('应该能发现可用角色', async () => {
      const roles = await jinang.hello.getAllRoles();
      expect(Array.isArray(roles)).toBe(true);
      expect(roles.length).toBeGreaterThan(0);
      
      // 验证标准角色存在
      const roleIds = roles.map(r => r.id);
      expect(roleIds).toContain('assistant');
    });

    test('应该能执行hello锦囊内容', async () => {
      const result = await jinang.hello.getContent([]);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('角色');
    });
  });

  describe('⚡ action锦囊 - 角色激活', () => {
    test('应该能激活assistant角色', async () => {
      const result = await jinang.action.getContent(['assistant']);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    test('对于不存在的角色应该给出友好提示', async () => {
      const result = await jinang.action.getContent(['non-existent-role']);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      // 应该包含错误提示或引导信息
    });
  });

  describe('📚 learn锦囊 - 知识学习', () => {
    test('应该能执行learn锦囊', async () => {
      const result = await jinang.learn.getContent([]);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    test('应该能学习特定资源', async () => {
      const result = await jinang.learn.getContent(['thought://assistant']);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('🔍 recall锦囊 - 记忆检索', () => {
    test('应该能执行recall锦囊', async () => {
      const result = await jinang.recall.getContent([]);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    test('应该能检索特定查询', async () => {
      const result = await jinang.recall.getContent(['前端开发']);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('🧠 remember锦囊 - 知识记忆', () => {
    test('应该能执行remember锦囊', async () => {
      const result = await jinang.remember.getContent(['测试知识点']);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('🔄 PATEOAS状态转换', () => {
    test('每个锦囊输出应该包含PATEOAS导航', async () => {
      const helloResult = await jinang.hello.getContent([]);
      expect(helloResult).toMatch(/action|learn|recall/i);

      const actionResult = await jinang.action.getContent(['assistant']);
      expect(actionResult).toMatch(/learn|recall|remember/i);
    });

    test('锦囊输出应该引导下一步操作', async () => {
      const result = await jinang.hello.getContent([]);
      // 验证输出包含下一步指引
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(100); // 确保有足够的内容
    });
  });

  describe('🎯 完整锦囊流程测试', () => {
    test('完整的六锦囊使用流程（init自动执行）', async () => {
      // 0. init已自动执行（在beforeAll中）
      
      // 1. 发现角色
      const roles = await jinang.hello.getAllRoles();
      expect(roles.length).toBeGreaterThan(0);

      // 2. 激活角色
      const actionResult = await jinang.action.getContent(['assistant']);
      expect(actionResult).toBeDefined();

      // 3. 学习知识
      const learnResult = await jinang.learn.getContent([]);
      expect(learnResult).toBeDefined();

      // 4. 检索记忆
      const recallResult = await jinang.recall.getContent([]);
      expect(recallResult).toBeDefined();

      // 5. 记忆知识
      const rememberResult = await jinang.remember.getContent(['AI学习成果']);
      expect(rememberResult).toBeDefined();
    });

    test('验证六大锦囊的完整性', () => {
      // 验证所有锦囊实例都存在
      expect(jinang.init).toBeDefined();     // 环境初始化
      expect(jinang.hello).toBeDefined();    // 角色发现
      expect(jinang.action).toBeDefined();   // 角色激活
      expect(jinang.learn).toBeDefined();    // 知识学习
      expect(jinang.recall).toBeDefined();   // 记忆检索
      expect(jinang.remember).toBeDefined(); // 知识记忆
    });
  });
}); 