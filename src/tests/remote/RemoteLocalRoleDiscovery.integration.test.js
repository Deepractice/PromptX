const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const { execAsync, extractRoleIds } = require('../utils/testHelpers');

describe('异地本地角色发现与合并 TDD-1.2', () => {
  const originalCwd = process.cwd();
  
  afterEach(() => {
    // 确保每个测试后都恢复原始工作目录
    process.chdir(originalCwd);
  });

  test('TC-REMOTE-003: 异地环境应该发现并合并本地角色', async () => {
    const remoteDir = path.join(os.tmpdir(), `remote-local-role-test-${Date.now()}`);
    
    try {
      await fs.ensureDir(remoteDir);
      process.chdir(remoteDir);
      
      // 在异地创建本地角色
      const roleDir = path.join(remoteDir, 'prompt/domain/remote-expert');
      await fs.ensureDir(roleDir);
      await fs.writeFile(
        path.join(roleDir, 'remote-expert.role.md'),
        `<role>
          <personality>异地专家</personality>
          <principle>专注于异地开发环境的测试和验证</principle>
        </role>`
      );
      
      // 验证异地hello命令能发现本地+包内角色
      const { stdout } = await execAsync('npx dpml-prompt-local hello');
      
      // 应该包含包内角色
      expect(stdout).toContain('role-designer');
      expect(stdout).toContain('promptx-fullstack-developer');
      
      // 应该包含本地角色
      expect(stdout).toContain('remote-expert');
      
      // 验证输出格式正确
      expect(stdout).toContain('🤖 **AI专业角色服务清单**');
      
      const roleIds = extractRoleIds(stdout);
      expect(roleIds).toContain('remote-expert');
      expect(roleIds.length).toBeGreaterThan(6); // 包内角色+新角色
      
    } finally {
      process.chdir(originalCwd);
      await fs.remove(remoteDir).catch(() => {
        // 忽略清理错误
      });
    }
  });

  test('TC-REMOTE-004: 异地动态创建角色应该被立即发现', async () => {
    const remoteDir = path.join(os.tmpdir(), `remote-dynamic-test-${Date.now()}`);
    
    try {
      await fs.ensureDir(remoteDir);
      process.chdir(remoteDir);
      
      // 初始状态：只有包内角色
      const { stdout: initial } = await execAsync('npx dpml-prompt-local hello');
      expect(initial).not.toContain('dynamic-role');
      
      // 动态创建角色
      const roleDir = path.join(remoteDir, 'prompt/domain/dynamic-role');
      await fs.ensureDir(roleDir);
      await fs.writeFile(
        path.join(roleDir, 'dynamic-role.role.md'),
        `<role>
          <personality>动态角色</personality>
          <principle>验证动态角色创建和发现机制</principle>
        </role>`
      );
      
      // 验证新角色被发现
      const { stdout: updated } = await execAsync('npx dpml-prompt-local hello');
      expect(updated).toContain('dynamic-role');
      
      const initialRoles = extractRoleIds(initial);
      const updatedRoles = extractRoleIds(updated);
      
      expect(updatedRoles.length).toBe(initialRoles.length + 1);
      expect(updatedRoles).toContain('dynamic-role');
      
    } finally {
      process.chdir(originalCwd);
      await fs.remove(remoteDir).catch(() => {});
    }
  });

  test('TC-REMOTE-005: 异地环境支持多个本地角色', async () => {
    const remoteDir = path.join(os.tmpdir(), `remote-multi-roles-test-${Date.now()}`);
    
    try {
      await fs.ensureDir(remoteDir);
      process.chdir(remoteDir);
      
      // 创建多个本地角色
      const roles = [
        { id: 'remote-tester', desc: '异地测试专家' },
        { id: 'remote-manager', desc: '异地项目管理' },
        { id: 'remote-architect', desc: '异地架构师' }
      ];
      
      for (const role of roles) {
        const roleDir = path.join(remoteDir, 'prompt/domain', role.id);
        await fs.ensureDir(roleDir);
        await fs.writeFile(
          path.join(roleDir, `${role.id}.role.md`),
          `<role>
            <personality>${role.desc}</personality>
            <principle>专注于异地环境下的${role.desc}工作</principle>
          </role>`
        );
      }
      
      // 验证所有角色都被发现
      const { stdout } = await execAsync('npx dpml-prompt-local hello');
      
      roles.forEach(role => {
        expect(stdout).toContain(role.id);
      });
      
      const roleIds = extractRoleIds(stdout);
      roles.forEach(role => {
        expect(roleIds).toContain(role.id);
      });
      
      // 验证总数正确
      expect(roleIds.length).toBeGreaterThanOrEqual(6 + roles.length); // 包内+本地
      
    } finally {
      process.chdir(originalCwd);
      await fs.remove(remoteDir).catch(() => {});
    }
  });

  test('TC-REMOTE-006: 异地角色文件格式验证', async () => {
    const remoteDir = path.join(os.tmpdir(), `remote-format-test-${Date.now()}`);
    
    try {
      await fs.ensureDir(remoteDir);
      process.chdir(remoteDir);
      
      // 创建格式正确的角色
      const validRoleDir = path.join(remoteDir, 'prompt/domain/valid-role');
      await fs.ensureDir(validRoleDir);
      await fs.writeFile(
        path.join(validRoleDir, 'valid-role.role.md'),
        `<role>
          <personality>有效角色</personality>
          <principle>格式正确的角色定义</principle>
        </role>`
      );
      
      // 创建格式错误的角色文件（应该被忽略）
      const invalidRoleDir = path.join(remoteDir, 'prompt/domain/invalid-role');
      await fs.ensureDir(invalidRoleDir);
      await fs.writeFile(
        path.join(invalidRoleDir, 'invalid-role.role.md'),
        'invalid xml content without proper tags'
      );
      
      // 验证只有有效角色被发现
      const { stdout } = await execAsync('npx dpml-prompt-local hello');
      
      expect(stdout).toContain('valid-role');
      // 格式错误的角色应该被忽略，不应该出现在输出中
      expect(stdout).not.toContain('invalid-role');
      
    } finally {
      process.chdir(originalCwd);
      await fs.remove(remoteDir).catch(() => {});
    }
  });
}); 