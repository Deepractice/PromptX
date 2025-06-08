/**
 * @fileoverview MCP与PromptX集成服务
 * 统一管理角色发现、执行和资源访问的集成逻辑
 */

const HelloCommand = require('../../lib/core/pouch/commands/HelloCommand');
const ActionCommand = require('../../lib/core/pouch/commands/ActionCommand');
const fs = require('fs-extra');
const path = require('path');

/**
 * MCP与PromptX集成服务
 * 提供统一的集成接口和错误处理
 */
class IntegrationService {
  constructor() {
    this.helloCommand = new HelloCommand();
    this.actionCommand = new ActionCommand();
    this.cache = new Map();
  }

  /**
   * 发现所有可用角色
   * @returns {Promise<Array>} 角色列表
   */
  async discoverRoles() {
    try {
      const cacheKey = 'roles';
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      const roles = await this.helloCommand.getAllRoles();
      const formattedRoles = roles.map(role => ({
        name: role.id,
        description: role.description || `${role.id}角色`,
        path: role.file,
        protocol: role.file.startsWith('@package://') ? role.file : undefined
      }));

      // 缓存结果（5分钟）
      this.cache.set(cacheKey, formattedRoles);
      setTimeout(() => this.cache.delete(cacheKey), 5 * 60 * 1000);

      return formattedRoles;
    } catch (error) {
      throw new Error(`角色发现失败: ${error.message}`);
    }
  }

  /**
   * 执行指定角色
   * @param {string} roleName 角色名称
   * @param {string} input 输入内容
   * @returns {Promise<Object>} 执行结果
   */
  async executeRole(roleName, input) {
    try {
      // 验证角色存在
      const roleInfo = await this.getRoleInfo(roleName);
      if (!roleInfo) {
        throw new Error(`Role not found: ${roleName}`);
      }

      // 模拟角色执行（实际项目中这里会调用具体的执行逻辑）
      const result = {
        role: roleName,
        input: input,
        output: `Role ${roleName} executed successfully with input: ${input}`,
        timestamp: new Date().toISOString(),
        metadata: {
          rolePath: roleInfo.file,
          protocol: roleInfo.file.startsWith('@package://') ? 'package' : 'local'
        }
      };

      return result;
    } catch (error) {
      throw new Error(`角色执行失败: ${error.message}`);
    }
  }

  /**
   * 获取角色信息
   * @param {string} roleName 角色名称
   * @returns {Promise<Object|null>} 角色信息
   */
  async getRoleInfo(roleName) {
    try {
      return await this.helloCommand.getRoleInfo(roleName);
    } catch (error) {
      console.warn(`获取角色信息失败 (${roleName}):`, error.message);
      return null;
    }
  }

  /**
   * 读取角色资源
   * @param {string} roleName 角色名称
   * @returns {Promise<string>} 角色文件内容
   */
  async readRoleResource(roleName) {
    try {
      const roleInfo = await this.getRoleInfo(roleName);
      if (!roleInfo) {
        throw new Error(`Role not found: ${roleName}`);
      }

      let filePath = roleInfo.file;
      
      // 处理@package://路径
      if (filePath.startsWith('@package://')) {
        const PackageProtocol = require('../../lib/core/resource/protocols/PackageProtocol');
        const packageProtocol = new PackageProtocol();
        const packageRoot = await packageProtocol.getPackageRoot();
        filePath = path.join(packageRoot, filePath.replace('@package://', ''));
      }

      // 检查文件是否存在
      if (!await fs.pathExists(filePath)) {
        throw new Error(`Role file not found: ${filePath}`);
      }

      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`读取角色资源失败: ${error.message}`);
    }
  }

  /**
   * 读取思维资源
   * @param {string} roleName 角色名称
   * @returns {Promise<string>} 思维文件内容
   */
  async readThoughtResource(roleName) {
    try {
      const roleInfo = await this.getRoleInfo(roleName);
      if (!roleInfo) {
        throw new Error(`Role not found: ${roleName}`);
      }

      // 构造思维文件路径
      let thoughtPath;
      if (roleInfo.file.startsWith('@package://')) {
        const PackageProtocol = require('../../lib/core/resource/protocols/PackageProtocol');
        const packageProtocol = new PackageProtocol();
        const packageRoot = await packageProtocol.getPackageRoot();
        const rolePath = roleInfo.file.replace('@package://', '');
        thoughtPath = path.join(packageRoot, rolePath.replace('/execution/', '/thought/'));
      } else {
        // 绝对路径处理
        thoughtPath = roleInfo.file.replace('/execution/', '/thought/');
      }

      // 检查思维文件是否存在
      if (!await fs.pathExists(thoughtPath)) {
        throw new Error(`Thought file not found: ${thoughtPath}`);
      }

      return await fs.readFile(thoughtPath, 'utf-8');
    } catch (error) {
      throw new Error(`读取思维资源失败: ${error.message}`);
    }
  }

  /**
   * 验证角色有效性
   * @param {string} roleName 角色名称
   * @returns {Promise<boolean>} 是否有效
   */
  async validateRole(roleName) {
    try {
      const roleInfo = await this.getRoleInfo(roleName);
      return roleInfo !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取集成状态
   * @returns {Object} 集成状态信息
   */
  getIntegrationStatus() {
    return {
      helloCommandReady: !!this.helloCommand,
      actionCommandReady: !!this.actionCommand,
      cacheSize: this.cache.size,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 清理缓存
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * 处理并发角色发现请求
   * @param {number} count 并发请求数量
   * @returns {Promise<Array>} 结果数组
   */
  async handleConcurrentRoleDiscovery(count = 3) {
    const promises = [];
    for (let i = 0; i < count; i++) {
      promises.push(this.discoverRoles());
    }
    return await Promise.all(promises);
  }
}

module.exports = IntegrationService; 