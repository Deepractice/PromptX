/**
 * @fileoverview 
 * 此文件提供了 ServerConfigManager 类，用于管理 PromptX 应用程序的服务器配置。
 * 包括端口、主机地址、传输类型等配置的读取、设置和持久化。
 * 
 * @author PromptX Team
 * @version 1.0.0
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';

/**
 * 服务器配置接口
 * 
 * @interface ServerConfig
 * @property {number} port - 服务器端口号，默认 5203
 * @property {string} host - 主机地址，默认 'localhost'
 * @property {'stdio' | 'http'} transport - 传输类型，默认 'stdio'
 * @property {boolean} corsEnabled - 是否启用 CORS，默认 false
 * @property {boolean} debug - 是否启用调试模式，默认 false
 */
export interface ServerConfig {
  /** 服务器端口号 */
  port: number;
  /** 主机地址 */
  host: string;
  /** 传输类型 */
  transport: 'stdio' | 'http';
  /** 是否启用 CORS */
  corsEnabled: boolean;
  /** 是否启用调试模式 */
  debug: boolean;
}

/**
 * 默认服务器配置
 */
const DEFAULT_CONFIG: ServerConfig = {
  port: 5203,
  host: 'localhost',
  transport: 'stdio',
  corsEnabled: false,
  debug: false
};

/**
 * ServerConfigManager 类 - 管理服务器配置
 * 
 * 此类提供了服务器配置的读取、设置和持久化功能，
 * 配置文件存储在用户主目录的 .promptx 文件夹中。
 * 
 * @class ServerConfigManager
 */
export class ServerConfigManager {
  /**
   * 配置文件路径
   * @private
   */
  private configPath: string;

  /**
   * 当前配置缓存
   * @private
   */
  private config: ServerConfig;

  /**
   * 构造函数
   * 
   * @param {string} [configDir] - 可选的配置目录路径，默认为用户主目录下的 .promptx
   */
  constructor(configDir?: string) {
    const defaultConfigDir = join(homedir(), '.promptx');
    const actualConfigDir = configDir || defaultConfigDir;
    this.configPath = join(actualConfigDir, 'server-config.json');
    
    // 确保配置目录存在
    if (!existsSync(actualConfigDir)) {
      mkdirSync(actualConfigDir, { recursive: true });
    }

    // 加载配置
    this.config = this.loadConfig();
  }

  /**
   * 从文件加载配置
   * 
   * @private
   * @returns {ServerConfig} 加载的配置对象
   */
  private loadConfig(): ServerConfig {
    try {
      if (existsSync(this.configPath)) {
        const configData = readFileSync(this.configPath, 'utf-8');
        const parsedConfig = JSON.parse(configData);
        
        // 合并默认配置和加载的配置，确保所有字段都存在
        return {
          ...DEFAULT_CONFIG,
          ...parsedConfig
        };
      }
    } catch (error) {
      console.warn(`Failed to load server config from ${this.configPath}:`, error);
    }
    
    // 如果加载失败或文件不存在，返回默认配置
    return { ...DEFAULT_CONFIG };
  }

  /**
   * 保存配置到文件
   * 
   * @private
   * @throws {Error} 当保存失败时抛出错误
   */
  private saveConfig(): void {
    try {
      // 确保配置目录存在
      const configDir = dirname(this.configPath);
      if (!existsSync(configDir)) {
        mkdirSync(configDir, { recursive: true });
      }

      writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
    } catch (error) {
      throw new Error(`Failed to save server config to ${this.configPath}: ${error}`);
    }
  }

  /**
   * 获取当前完整配置
   * 
   * @returns {ServerConfig} 当前配置对象的副本
   */
  getConfig(): ServerConfig {
    return { ...this.config };
  }

  /**
   * 获取端口号
   * 
   * @returns {number} 当前配置的端口号
   */
  getPort(): number {
    return this.config.port;
  }

  /**
   * 设置端口号
   * 
   * @param {number} port - 要设置的端口号
   * @throws {Error} 当端口号无效时抛出错误
   */
  setPort(port: number): void {
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error(`Invalid port number: ${port}. Port must be an integer between 1 and 65535.`);
    }
    
    this.config.port = port;
    this.saveConfig();
  }

  /**
   * 获取主机地址
   * 
   * @returns {string} 当前配置的主机地址
   */
  getHost(): string {
    return this.config.host;
  }

  /**
   * 设置主机地址
   * 
   * @param {string} host - 要设置的主机地址
   * @throws {Error} 当主机地址无效时抛出错误
   */
  setHost(host: string): void {
    if (!host || typeof host !== 'string' || host.trim().length === 0) {
      throw new Error(`Invalid host address: ${host}. Host must be a non-empty string.`);
    }
    
    this.config.host = host.trim();
    this.saveConfig();
  }

  /**
   * 获取传输类型
   * 
   * @returns {'stdio' | 'http'} 当前配置的传输类型
   */
  getTransport(): 'stdio' | 'http' {
    return this.config.transport;
  }

  /**
   * 设置传输类型
   * 
   * @param {'stdio' | 'http'} transport - 要设置的传输类型
   * @throws {Error} 当传输类型无效时抛出错误
   */
  setTransport(transport: 'stdio' | 'http'): void {
    if (transport !== 'stdio' && transport !== 'http') {
      throw new Error(`Invalid transport type: ${transport}. Transport must be 'stdio' or 'http'.`);
    }
    
    this.config.transport = transport;
    this.saveConfig();
  }

  /**
   * 获取 CORS 启用状态
   * 
   * @returns {boolean} 当前 CORS 启用状态
   */
  getCorsEnabled(): boolean {
    return this.config.corsEnabled;
  }

  /**
   * 设置 CORS 启用状态
   * 
   * @param {boolean} enabled - 是否启用 CORS
   */
  setCorsEnabled(enabled: boolean): void {
    this.config.corsEnabled = Boolean(enabled);
    this.saveConfig();
  }

  /**
   * 获取调试模式状态
   * 
   * @returns {boolean} 当前调试模式状态
   */
  getDebug(): boolean {
    return this.config.debug;
  }

  /**
   * 设置调试模式状态
   * 
   * @param {boolean} enabled - 是否启用调试模式
   */
  setDebug(enabled: boolean): void {
    this.config.debug = Boolean(enabled);
    this.saveConfig();
  }

  /**
   * 批量更新配置
   * 
   * @param {Partial<ServerConfig>} updates - 要更新的配置项
   * @throws {Error} 当配置项无效时抛出错误
   */
  updateConfig(updates: Partial<ServerConfig>): void {
    // 验证更新的配置项
    if (updates.port !== undefined) {
      if (!Number.isInteger(updates.port) || updates.port < 1 || updates.port > 65535) {
        throw new Error(`Invalid port number: ${updates.port}. Port must be an integer between 1 and 65535.`);
      }
    }

    if (updates.host !== undefined) {
      if (!updates.host || typeof updates.host !== 'string' || updates.host.trim().length === 0) {
        throw new Error(`Invalid host address: ${updates.host}. Host must be a non-empty string.`);
      }
    }

    if (updates.transport !== undefined) {
      if (updates.transport !== 'stdio' && updates.transport !== 'http') {
        throw new Error(`Invalid transport type: ${updates.transport}. Transport must be 'stdio' or 'http'.`);
      }
    }

    // 应用更新
    this.config = {
      ...this.config,
      ...updates,
      host: updates.host ? updates.host.trim() : this.config.host,
      corsEnabled: updates.corsEnabled !== undefined ? Boolean(updates.corsEnabled) : this.config.corsEnabled,
      debug: updates.debug !== undefined ? Boolean(updates.debug) : this.config.debug
    };

    this.saveConfig();
  }

  /**
   * 重置配置为默认值
   */
  resetToDefaults(): void {
    this.config = { ...DEFAULT_CONFIG };
    this.saveConfig();
  }

  /**
   * 获取服务器 URL（仅在 HTTP 传输模式下有效）
   * 
   * @returns {string} 服务器 URL
   */
  getServerUrl(): string {
    if (this.config.transport !== 'http') {
      throw new Error('Server URL is only available in HTTP transport mode');
    }
    
    return `http://${this.config.host}:${this.config.port}`;
  }

  /**
   * 检查端口是否可用（简单检查，不进行实际绑定测试）
   * 
   * @param {number} port - 要检查的端口号
   * @returns {boolean} 端口号是否在有效范围内
   */
  static isValidPort(port: number): boolean {
    return Number.isInteger(port) && port >= 1 && port <= 65535;
  }

  /**
   * 检查主机地址格式是否有效（简单检查）
   * 
   * @param {string} host - 要检查的主机地址
   * @returns {boolean} 主机地址格式是否有效
   */
  static isValidHost(host: string): boolean {
    return typeof host === 'string' && host.trim().length > 0;
  }
}