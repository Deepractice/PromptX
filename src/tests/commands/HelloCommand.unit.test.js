const path = require('path');
const fs = require('fs-extra');
const HelloCommand = require('../../lib/core/pouch/commands/HelloCommand');

describe('HelloCommand 基础角色发现', () => {
  let helloCommand;
  
  beforeEach(() => {
    helloCommand = new HelloCommand();
  });

  describe('TC-HELLO-001: 基础角色发现功能', () => {
    test('应该成功发现所有注册表角色', async () => {
      const roles = await helloCommand.discoverAllRoles();
      
      expect(roles).toBeDefined();
      expect(typeof roles).toBe('object');
      expect(Object.keys(roles).length).toBeGreaterThan(0);
      expect(roles).toHaveProperty('assistant');
      expect(roles).toHaveProperty('promptx-fullstack-developer');
      expect(roles).toHaveProperty('role-designer');
    });

    test('应该返回角色的完整信息', async () => {
      const roles = await helloCommand.discoverAllRoles();
      
      expect(roles.assistant).toBeDefined();
      expect(roles.assistant).toHaveProperty('id', 'assistant');
      expect(roles.assistant).toHaveProperty('name');
      expect(roles.assistant).toHaveProperty('description');
      expect(roles.assistant).toHaveProperty('file');
    });

    test('应该正确标识角色来源', async () => {
      const roles = await helloCommand.discoverAllRoles();
      
      Object.values(roles).forEach(role => {
        expect(role).toHaveProperty('source');
        expect(['package', 'local']).toContain(role.source);
      });
    });
  });

  describe('TC-HELLO-002: 角色信息结构验证', () => {
    test('每个角色应该有完整的元数据', async () => {
      const roles = await helloCommand.discoverAllRoles();
      
      Object.entries(roles).forEach(([roleId, roleInfo]) => {
        expect(roleInfo).toMatchObject({
          id: roleId,
          name: expect.any(String),
          description: expect.any(String),
          file: expect.any(String),
          source: expect.stringMatching(/^(package|local)$/),
          capabilities: expect.any(Array)
        });
      });
    });

    test('角色文件路径应该是有效的', async () => {
      const roles = await helloCommand.discoverAllRoles();
      
      for (const [roleId, roleInfo] of Object.entries(roles)) {
        if (roleInfo.source === 'local') {
          const exists = await fs.pathExists(roleInfo.file);
          expect(exists).toBe(true);
        } else if (roleInfo.source === 'package') {
          expect(roleInfo.file).toMatch(/^@package:\/\//);
        }
      }
    });
  });

  describe('TC-HELLO-003: 错误处理', () => {
    test('在无角色目录时应该返回空对象', async () => {
      const mockCommand = new HelloCommand();
      // 模拟一个不存在角色的环境
      const originalScanLocal = mockCommand.scanLocalRoles;
      mockCommand.scanLocalRoles = jest.fn().mockResolvedValue({});
      
      const roles = await mockCommand.discoverAllRoles();
      expect(roles).toBeDefined();
      expect(typeof roles).toBe('object');
    });

    test('在权限错误时应该优雅降级', async () => {
      const mockCommand = new HelloCommand();
      const originalScanLocal = mockCommand.scanLocalRoles;
      mockCommand.scanLocalRoles = jest.fn().mockRejectedValue(new Error('EACCES: permission denied'));
      
      await expect(mockCommand.discoverAllRoles()).resolves.toBeDefined();
    });
  });
}); 