const fs = require('fs').promises;
const path = require('path');
const logger = require('@promptx/logger');

/**
 * ToolEnvironment - 工具环境变量管理器
 * 
 * 为每个工具提供独立的环境变量管理
 * 存储位置：~/.promptx/user/toolbox/{toolId}/.env
 * 
 * 特性：
 * - 工具级环境变量隔离
 * - 支持 .env 文件格式
 * - 运行时读写能力
 * - 敏感信息管理（API Keys等）
 */
class ToolEnvironment {
  constructor(toolId, toolboxPath) {
    this.toolId = toolId;
    this.envPath = path.join(toolboxPath, '.env');
    this.envCache = null; // 缓存已加载的环境变量
    logger.debug(`[ToolEnvironment] Initialized for tool: ${toolId}, path: ${this.envPath}`);
  }

  /**
   * 获取环境变量值
   * @param {string} key - 环境变量名
   * @returns {Promise<string|undefined>} 环境变量值
   */
  async get(key) {
    if (typeof key !== 'string') {
      throw new Error('Environment variable key must be a string');
    }

    const env = await this._loadEnv();
    return env[key];
  }

  /**
   * 设置环境变量
   * @param {string} key - 环境变量名
   * @param {string} value - 环境变量值
   */
  async set(key, value) {
    if (typeof key !== 'string') {
      throw new Error('Environment variable key must be a string');
    }

    // 环境变量值应该是字符串
    const strValue = value === undefined || value === null ? '' : String(value);

    const env = await this._loadEnv();
    env[key] = strValue;
    await this._saveEnv(env);
    
    // 更新缓存
    this.envCache = env;
    
    logger.debug(`[ToolEnvironment] Set env "${key}" for tool: ${this.toolId}`);
  }

  /**
   * 删除环境变量
   * @param {string} key - 要删除的环境变量名
   * @returns {Promise<boolean>} 是否删除成功
   */
  async delete(key) {
    if (typeof key !== 'string') {
      throw new Error('Environment variable key must be a string');
    }

    const env = await this._loadEnv();
    const exists = key in env;
    
    if (exists) {
      delete env[key];
      await this._saveEnv(env);
      this.envCache = env;
      logger.debug(`[ToolEnvironment] Deleted env "${key}" for tool: ${this.toolId}`);
    }
    
    return exists;
  }

  /**
   * 获取所有环境变量
   * @returns {Promise<Object>} 所有环境变量的键值对
   */
  async getAll() {
    return await this._loadEnv();
  }

  /**
   * 检查环境变量是否存在
   * @param {string} key - 要检查的环境变量名
   * @returns {Promise<boolean>} 是否存在
   */
  async has(key) {
    if (typeof key !== 'string') {
      throw new Error('Environment variable key must be a string');
    }

    const env = await this._loadEnv();
    return key in env;
  }

  /**
   * 清空所有环境变量
   */
  async clear() {
    await this._saveEnv({});
    this.envCache = {};
    logger.debug(`[ToolEnvironment] Cleared all env vars for tool: ${this.toolId}`);
  }

  /**
   * 批量设置环境变量
   * @param {Object} vars - 要设置的环境变量对象
   */
  async setAll(vars) {
    if (typeof vars !== 'object' || vars === null) {
      throw new Error('Environment variables must be an object');
    }

    const env = await this._loadEnv();
    
    // 将所有值转换为字符串
    for (const [key, value] of Object.entries(vars)) {
      env[key] = value === undefined || value === null ? '' : String(value);
    }
    
    await this._saveEnv(env);
    this.envCache = env;
    
    logger.debug(`[ToolEnvironment] Batch set ${Object.keys(vars).length} env vars for tool: ${this.toolId}`);
  }

  /**
   * 内部方法：加载 .env 文件
   * @private
   */
  async _loadEnv() {
    // 如果有缓存，返回缓存
    if (this.envCache !== null) {
      return { ...this.envCache };
    }

    try {
      const content = await fs.readFile(this.envPath, 'utf8');
      const env = this._parseEnvFile(content);
      this.envCache = env;
      return { ...env };
    } catch (error) {
      if (error.code === 'ENOENT') {
        // 文件不存在，返回空对象
        this.envCache = {};
        return {};
      }
      logger.error(`[ToolEnvironment] Failed to load .env file: ${error.message}`);
      throw new Error(`Failed to load environment variables: ${error.message}`);
    }
  }

  /**
   * 内部方法：保存 .env 文件
   * @private
   */
  async _saveEnv(env) {
    try {
      // 确保目录存在
      const dir = path.dirname(this.envPath);
      await fs.mkdir(dir, { recursive: true });
      
      // 生成 .env 格式的内容
      const content = this._generateEnvFile(env);
      
      // 写入文件
      await fs.writeFile(this.envPath, content, 'utf8');
    } catch (error) {
      logger.error(`[ToolEnvironment] Failed to save .env file: ${error.message}`);
      throw new Error(`Failed to save environment variables: ${error.message}`);
    }
  }

  /**
   * 解析 .env 文件内容
   * @private
   */
  _parseEnvFile(content) {
    const env = {};
    const lines = content.split('\n');
    
    for (const line of lines) {
      // 跳过空行和注释
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }
      
      // 解析 KEY=VALUE 格式
      const index = trimmed.indexOf('=');
      if (index !== -1) {
        const key = trimmed.substring(0, index).trim();
        let value = trimmed.substring(index + 1).trim();
        
        // 处理引号
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
        // 处理转义字符
        value = value.replace(/\\n/g, '\n')
                     .replace(/\\r/g, '\r')
                     .replace(/\\t/g, '\t')
                     .replace(/\\\\/g, '\\');
        
        env[key] = value;
      }
    }
    
    return env;
  }

  /**
   * 生成 .env 文件内容
   * @private
   */
  _generateEnvFile(env) {
    const lines = [];
    
    // 添加文件头注释
    lines.push('# Tool Environment Variables');
    lines.push(`# Tool: ${this.toolId}`);
    lines.push(`# Generated by PromptX ToolEnvironment`);
    lines.push(`# Last modified: ${new Date().toISOString()}`);
    lines.push('');
    
    // 添加环境变量
    for (const [key, value] of Object.entries(env)) {
      // 如果值包含特殊字符，使用引号包围
      let formattedValue = String(value);
      
      // 转义特殊字符
      formattedValue = formattedValue
        .replace(/\\/g, '\\\\')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
      
      // 如果包含空格或特殊字符，用引号包围
      if (formattedValue.includes(' ') || 
          formattedValue.includes('#') || 
          formattedValue.includes('=') ||
          formattedValue.includes('\n') ||
          formattedValue.includes('"') ||
          formattedValue.includes("'")) {
        formattedValue = `"${formattedValue.replace(/"/g, '\\"')}"`;
      }
      
      lines.push(`${key}=${formattedValue}`);
    }
    
    return lines.join('\n') + '\n';
  }

  /**
   * 重新加载环境变量（清除缓存）
   */
  async reload() {
    this.envCache = null;
    await this._loadEnv();
    logger.debug(`[ToolEnvironment] Reloaded env vars for tool: ${this.toolId}`);
  }
}

module.exports = ToolEnvironment;