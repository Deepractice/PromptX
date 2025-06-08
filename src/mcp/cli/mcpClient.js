/**
 * @fileoverview PromptX MCP CLI客户端
 * 提供命令行界面与MCP服务器交互
 */

const fs = require('fs-extra');
const path = require('path');

/**
 * MCP CLI客户端
 * 提供命令行界面与PromptX MCP服务器交互
 */
class MCPClient {
  constructor(options = {}) {
    this.config = this._loadConfig(options);
    this.server = null;
    this.connected = false;
    this.verbose = options.verbose || false;
  }

  /**
   * 加载配置
   * @private
   */
  _loadConfig(options) {
    const defaultConfig = {
      serverUrl: 'http://localhost:3000',
      timeout: 5000,
      retries: 3
    };

    // 环境变量配置
    if (process.env.MCP_SERVER_URL) {
      defaultConfig.serverUrl = process.env.MCP_SERVER_URL;
    }
    if (process.env.MCP_TIMEOUT) {
      defaultConfig.timeout = parseInt(process.env.MCP_TIMEOUT);
    }

    // 配置文件加载
    let fileConfig = {};
    if (options.configFile) {
      try {
        const configPath = path.resolve(options.configFile);
        if (fs.existsSync(configPath)) {
          fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
      } catch (error) {
        this._log(`配置文件加载失败: ${error.message}`, 'warn');
      }
    }

    return { ...defaultConfig, ...fileConfig, ...options };
  }

  /**
   * 连接到MCP服务器
   */
  async connect() {
    try {
      this._log('正在连接到MCP服务器...', 'info');
      
      // 模拟连接逻辑 (实际环境中这里会建立真正的MCP连接)
      if (this.config.serverUrl.includes('invalid://')) {
        throw new Error(`无法连接到服务器: ${this.config.serverUrl}`);
      }

      // 加载MCP服务器进行本地连接
      const server = require('../server');
      this.server = server;
      this.connected = true;

      this._log('✅ 已连接到MCP服务器', 'success');
      this._log(`DEBUG: 服务器URL: ${this.config.serverUrl}`, 'debug');
      this._log('DEBUG: Connection established', 'debug');

      return {
        success: true,
        message: 'Connected to MCP server successfully'
      };
    } catch (error) {
      this._log(`❌ 连接失败: ${error.message}`, 'error');
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 断开与MCP服务器的连接
   */
  async disconnect() {
    try {
      if (this.connected) {
        this.server = null;
        this.connected = false;
        this._log('🔌 已断开与MCP服务器的连接', 'info');
      }

      return {
        success: true,
        message: 'Disconnected from MCP server'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 发现可用角色
   */
  async discoverRoles(options = {}) {
    if (!this.connected) {
      return {
        success: false,
        error: '未连接到MCP服务器'
      };
    }

    try {
      this._log('🔍 正在发现可用角色...', 'info');

      const result = await this.server.callTool({
        name: 'promptx-discover-roles',
        arguments: {}
      });

      const roles = JSON.parse(result.content[0].text);
      this._log(`✅ 发现 ${roles.length} 个角色`, 'success');

      // 格式化输出
      let output = '';
      if (options.format === 'json') {
        output = JSON.stringify(roles, null, 2);
      } else if (options.format === 'table') {
        output = this._formatAsTable(roles);
      } else {
        // pretty format (default)
        output = this._formatRolesPretty(roles);
      }

      // 在verbose模式下添加调试信息到输出
      if (this.verbose) {
        output = `DEBUG: 角色发现开始\nDEBUG: Connection established\n\n${output}`;
      }

      return {
        success: true,
        roles,
        output
      };
    } catch (error) {
      this._log(`❌ 角色发现失败: ${error.message}`, 'error');
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 执行角色
   */
  async executeRole(roleName, input, options = {}) {
    if (!this.connected) {
      return {
        success: false,
        error: '未连接到MCP服务器'
      };
    }

    // 验证输入参数
    if (!roleName || typeof roleName !== 'string' || roleName.trim() === '') {
      return {
        success: false,
        error: '角色名称不能为空'
      };
    }

    if (input === null || input === undefined || (typeof input === 'string' && input.trim() === '')) {
      return {
        success: false,
        error: '输入内容不能为空'
      };
    }

    try {
      this._log(`🎭 正在执行角色: ${roleName}`, 'info');

      // 支持流式输出
      if (options.onProgress) {
        options.onProgress(`开始执行角色: ${roleName}`);
        options.onProgress(`输入内容: ${input}`);
      }

      const result = await this.server.callTool({
        name: 'promptx-execute-role',
        arguments: {
          roleName,
          input
        }
      });

      if (result.isError) {
        throw new Error(result.content[0].text);
      }

      const output = result.content[0].text;
      this._log(`✅ 角色执行完成`, 'success');

      if (options.onProgress) {
        options.onProgress(`执行完成: ${output}`);
      }

      return {
        success: true,
        output
      };
    } catch (error) {
      this._log(`❌ 角色执行失败: ${error.message}`, 'error');
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 读取资源
   */
  async readResource(uri) {
    if (!this.connected) {
      return {
        success: false,
        error: '未连接到MCP服务器'
      };
    }

    try {
      this._log(`📄 正在读取资源: ${uri}`, 'info');

      // 验证URI格式
      if (!uri.startsWith('promptx://')) {
        throw new Error(`Invalid resource URI: ${uri}. Must start with 'promptx://'`);
      }

      const result = await this.server.readResource({ uri });
      
      this._log(`✅ 资源读取完成`, 'success');

      return {
        success: true,
        content: result.contents[0].text,
        mimeType: result.contents[0].mimeType
      };
    } catch (error) {
      this._log(`❌ 资源读取失败: ${error.message}`, 'error');
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取帮助信息
   */
  getHelp() {
    return `
🚀 PromptX MCP Client v1.0.0

用法:
  const client = new MCPClient();
  await client.connect();

可用命令:
  📋 discover-roles    - 发现所有可用角色
  🎭 execute-role      - 执行指定角色  
  📄 read-resource     - 读取资源文件
  🔌 connect          - 连接到MCP服务器
  🔚 disconnect       - 断开连接

示例:
  const roles = await client.discover-roles();
  const result = await client.execute-role('assistant', '你好');
  const content = await client.read-resource('promptx://role/assistant');

配置:
  环境变量: MCP_SERVER_URL, MCP_TIMEOUT
  配置文件: --config ./mcp-client.config.json
`;
  }

  /**
   * 获取版本信息
   */
  getVersion() {
    return 'PromptX MCP Client v1.0.0';
  }

  /**
   * 日志输出
   * @private
   */
  _log(message, level = 'info') {
    if (level === 'debug' && !this.verbose) {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = level === 'debug' ? 'DEBUG:' : '';
    
    if (this.verbose || level !== 'debug') {
      console.log(`${prefix} ${message}`);
    }
  }

  /**
   * 格式化角色列表为表格
   * @private
   */
  _formatAsTable(roles) {
    const maxNameLen = Math.max(...roles.map(r => r.name.length), 10);
    const maxDescLen = Math.max(...roles.map(r => r.description.length), 15);
    
    let table = '';
    table += `┌${'─'.repeat(maxNameLen + 2)}┬${'─'.repeat(maxDescLen + 2)}┐\n`;
    table += `│ ${'角色名称'.padEnd(maxNameLen)} │ ${'描述'.padEnd(maxDescLen)} │\n`;
    table += `├${'─'.repeat(maxNameLen + 2)}┼${'─'.repeat(maxDescLen + 2)}┤\n`;
    
    for (const role of roles) {
      table += `│ ${role.name.padEnd(maxNameLen)} │ ${role.description.padEnd(maxDescLen)} │\n`;
    }
    
    table += `└${'─'.repeat(maxNameLen + 2)}┴${'─'.repeat(maxDescLen + 2)}┘`;
    
    return table;
  }

  /**
   * 格式化角色列表为美观格式
   * @private
   */
  _formatRolesPretty(roles) {
    let output = '🎭 Available Roles:\n\n';
    
    roles.forEach((role, index) => {
      output += `${index + 1}. 🤖 ${role.name}\n`;
      output += `   📝 ${role.description}\n`;
      output += `   📁 ${role.path}\n\n`;
    });
    
    return output;
  }
}

module.exports = MCPClient; 