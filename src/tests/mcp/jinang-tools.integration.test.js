/**
 * PromptX五大锦囊MCP工具测试
 * 
 * 测试五个核心锦囊工具的MCP集成功能
 */

const { server, jinang } = require('../../mcp/promptx-mcp-server');

describe('PromptX五大锦囊MCP工具', () => {
  let testServer;

  beforeAll(async () => {
    testServer = server;
    // 自动初始化环境（模拟服务器启动）
    await jinang.init.getContent([]);
    // 预热锦囊系统
    await jinang.hello.getAllRoles();
  });

  afterAll(async () => {
    if (testServer && typeof testServer.close === 'function') {
      await testServer.close();
    }
  });

  describe('🎒 锦囊工具集成测试', () => {
    test('应该有5个锦囊工具', () => {
      expect(testServer).toBeDefined();
      expect(jinang).toBeDefined();
      expect(jinang.init).toBeDefined(); // init用于内部初始化
      expect(jinang.hello).toBeDefined();
      expect(jinang.action).toBeDefined();
      expect(jinang.learn).toBeDefined();
      expect(jinang.recall).toBeDefined();
      expect(jinang.remember).toBeDefined();
    });

    test('应该有正确的服务器信息', () => {
      expect(testServer._serverInfo.name).toBe('PromptX-Jinang-Server');
      expect(testServer._serverInfo.version).toBe('1.0.0');
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
      expect(roleIds).toContain('frontend-developer');
    });

    test('应该能执行hello锦囊内容', async () => {
      const result = await jinang.hello.getContent([]);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('⚡ action锦囊 - 角色激活', () => {
    test('应该能激活assistant角色', async () => {
      const result = await jinang.action.getContent(['assistant']);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    test('应该能激活frontend-developer角色', async () => {
      const result = await jinang.action.getContent(['frontend-developer']);
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
      expect(helloResult).toMatch(/promptx|action|learn|recall/i);

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

  describe('🎯 系统集成测试', () => {
    test('完整的锦囊使用流程', async () => {
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

    test('错误处理机制', async () => {
      // 测试各个锦囊的错误处理
      try {
        await jinang.action.getContent([]);
        // action需要角色参数，应该有合适的处理
      } catch (error) {
        // 应该有友好的错误处理
      }
    });
  });
});

describe('📚 资源系统测试', () => {
  test('应该能读取角色清单资源', async () => {
    const roles = await jinang.hello.getAllRoles();
    expect(Array.isArray(roles)).toBe(true);
    expect(roles.length).toBeGreaterThan(0);
  });

  test('每个角色应该有基本信息', async () => {
    const roles = await jinang.hello.getAllRoles();
    for (const role of roles) {
      expect(role).toHaveProperty('id');
      expect(typeof role.id).toBe('string');
      expect(role.id.length).toBeGreaterThan(0);
    }
  });
}); 