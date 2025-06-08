const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const { execAsync } = require('../utils/testHelpers');

describe('异地环境基础角色发现 TDD-1.1', () => {
  const originalCwd = process.cwd();
  
  afterEach(() => {
    // 确保每个测试后都恢复原始工作目录
    process.chdir(originalCwd);
  });

  test('TC-REMOTE-001: 在空目录中应该发现包内所有角色', async () => {
    const remoteDir = path.join(os.tmpdir(), `remote-empty-test-${Date.now()}`);
    
    try {
      await fs.ensureDir(remoteDir);
      process.chdir(remoteDir);
      
      // 模拟异地命令 - 使用npx dpml-prompt (不是local版本)
      const { stdout } = await execAsync('npx dpml-prompt hello');
      
      // 验证能发现所有包内角色
      expect(stdout).toContain('assistant');
      expect(stdout).toContain('promptx-fullstack-developer');
      expect(stdout).toContain('role-designer');
      expect(stdout).toContain('java-backend-developer');
      expect(stdout).toContain('product-manager');
      expect(stdout).toContain('xiaohongshu-marketer');
      expect(stdout).toContain('frontend-developer');
      
      // 验证输出格式正确
      expect(stdout).toContain('🤖 **AI专业角色服务清单**');
      expect(stdout).toContain('可用角色列表');
      
    } finally {
      process.chdir(originalCwd);
      await fs.remove(remoteDir).catch(() => {
        // 忽略清理错误
      });
    }
  });

  test('TC-REMOTE-002: 多个异地目录应该隔离发现', async () => {
    const dir1 = path.join(os.tmpdir(), `remote-test-1-${Date.now()}`);
    const dir2 = path.join(os.tmpdir(), `remote-test-2-${Date.now()}`);
    
    try {
      await Promise.all([fs.ensureDir(dir1), fs.ensureDir(dir2)]);
      
      // 在目录1运行
      process.chdir(dir1);
      const { stdout: result1 } = await execAsync('npx dpml-prompt hello');
      
      // 在目录2运行
      process.chdir(dir2);
      const { stdout: result2 } = await execAsync('npx dpml-prompt hello');
      
      // 验证结果一致（都只有包内角色）
      expect(result1).toContain('assistant');
      expect(result2).toContain('assistant');
      expect(result1).toContain('promptx-fullstack-developer');
      expect(result2).toContain('promptx-fullstack-developer');
      
      // 验证输出结构相同
      const extractRoleCount = (output) => {
        const matches = output.match(/\*\*角色ID\*\*/g);
        return matches ? matches.length : 0;
      };
      
      expect(extractRoleCount(result1)).toBe(extractRoleCount(result2));
      
    } finally {
      process.chdir(originalCwd);
      await Promise.all([
        fs.remove(dir1).catch(() => {}),
        fs.remove(dir2).catch(() => {})
      ]);
    }
  });

  test('TC-REMOTE-003: 异地目录不应该影响包内角色发现的稳定性', async () => {
    const remoteDir = path.join(os.tmpdir(), `remote-stability-test-${Date.now()}`);
    
    try {
      await fs.ensureDir(remoteDir);
      process.chdir(remoteDir);
      
      // 连续3次调用，确保结果稳定
      const results = [];
      for (let i = 0; i < 3; i++) {
        const { stdout } = await execAsync('npx dpml-prompt hello');
        results.push(stdout);
      }
      
      // 验证所有结果都包含相同的核心角色
      const coreRoles = ['assistant', 'promptx-fullstack-developer', 'role-designer'];
      
      results.forEach((result, index) => {
        coreRoles.forEach(role => {
          expect(result).toContain(role);
        });
        console.log(`第${index + 1}次调用结果稳定`);
      });
      
    } finally {
      process.chdir(originalCwd);
      await fs.remove(remoteDir).catch(() => {});
    }
  });
}); 