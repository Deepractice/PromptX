/**
 * PackageInstaller - 基于 Arborist 的完整依赖管理器
 * 
 * 使用 npm 官方的 @npmcli/arborist，提供与 npm install 完全一致的行为
 * 自动处理所有传递依赖、版本冲突、循环依赖等复杂场景
 * 修复 issue #332：传递依赖未自动安装的问题
 */

const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const logger = require('@promptx/logger');

class PackageInstaller {
  /**
   * 获取最优的npm registry
   * 自动检测用户地区，选择最快的镜像源
   */
  static async getOptimalRegistry() {
    try {
      // 1. 检查环境变量中的用户配置
      const userRegistry = process.env.NPM_REGISTRY || process.env.npm_config_registry;
      if (userRegistry) {
        logger.info(`[PackageInstaller] Using user configured registry: ${userRegistry}`);
        return userRegistry;
      }

      // 2. 检测是否在中国地区（基于时区）
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const isChina = timezone?.includes('Shanghai') || 
                     timezone?.includes('Hong_Kong') ||
                     timezone?.includes('Beijing') ||
                     timezone?.includes('Chongqing');
      
      if (isChina) {
        // 中国地区使用淘宝镜像
        const chinaRegistry = 'https://registry.npmmirror.com';
        logger.info(`[PackageInstaller] Detected China timezone (${timezone}), using mirror: ${chinaRegistry}`);
        return chinaRegistry;
      }

      // 3. 默认使用官方源
      const defaultRegistry = 'https://registry.npmjs.org/';
      logger.debug(`[PackageInstaller] Using default registry: ${defaultRegistry}`);
      return defaultRegistry;
      
    } catch (error) {
      logger.warn(`[PackageInstaller] Failed to detect optimal registry: ${error.message}`);
      return 'https://registry.npmjs.org/';
    }
  }
  /**
   * 统一的包安装入口 - 使用 Arborist 替代 pacote
   * @param {Object} options - 安装选项
   * @param {string} options.workingDir - 工作目录
   * @param {Object|Array} options.dependencies - 依赖列表
   * @param {number} options.timeout - 超时时间（毫秒）
   * @returns {Promise<Object>} 安装结果
   */
  static async install({ workingDir, dependencies, timeout = 30000 }) {
    const startTime = Date.now();
    
    // 构建依赖列表字符串用于日志
    const depsList = this.buildDependenciesList(dependencies);
    
    logger.info(`[PackageInstaller] Starting installation via Arborist: [${depsList}]`);
    logger.debug(`[PackageInstaller] Working directory: ${workingDir}`);
    
    try {
      // 确保工作目录存在
      await fs.mkdir(workingDir, { recursive: true });
      
      // 读取或创建package.json
      const packageJsonPath = path.join(workingDir, 'package.json');
      let manifest;
      
      try {
        const content = await fs.readFile(packageJsonPath, 'utf8');
        manifest = JSON.parse(content);
        logger.debug(`[PackageInstaller] Found existing package.json`);
      } catch (error) {
        // package.json不存在，创建默认的
        manifest = {
          name: `toolbox-${path.basename(workingDir)}`,
          version: '1.0.0',
          description: `Tool dependencies for ${path.basename(workingDir)}`,
          private: true,
          dependencies: {}
        };
        logger.debug(`[PackageInstaller] Creating new package.json`);
      }
      
      // 规范化依赖格式
      const normalizedDeps = this.normalizeDependencies(dependencies);
      
      // 更新 manifest 的 dependencies
      manifest.dependencies = { ...manifest.dependencies, ...normalizedDeps };
      await fs.writeFile(packageJsonPath, JSON.stringify(manifest, null, 2));
      
      logger.debug(`[PackageInstaller] Installing ${Object.keys(normalizedDeps).length} dependencies using Arborist`);
      
      // 使用 Arborist 安装所有依赖（包括传递依赖）
      const Arborist = require('@npmcli/arborist');
      
      // 获取最优的registry
      const registry = await this.getOptimalRegistry();
      
      const arb = new Arborist({
        path: workingDir,
        registry: registry,
        cache: path.join(os.homedir(), '.npm', '_cacache'),
        save: false,  // 不需要再次更新 package.json
        omit: [],     // 安装所有依赖
        force: false,
        fund: false,
        audit: false,
        legacyPeerDeps: true  // 兼容旧包
      });
      
      // 执行安装 - Arborist 会自动处理所有传递依赖
      await arb.reify({
        add: Object.entries(normalizedDeps).map(([name, version]) => `${name}@${version}`)
      });
      
      // 加载实际安装的包信息
      const tree = await arb.loadActual();
      const installedPackages = [];
      const installResults = {};
      
      // 收集安装的包信息
      for (const [name, node] of tree.children) {
        if (node && node.package) {
          installedPackages.push(name);
          installResults[name] = {
            name: node.package.name,
            version: node.package.version,
            path: node.path
          };
          logger.debug(`[PackageInstaller] ✓ ${name}@${node.package.version} installed`);
        }
      }
      
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      logger.info(`[PackageInstaller] Installation completed successfully in ${elapsed}s`);
      logger.info(`[PackageInstaller] Installed ${installedPackages.length} packages with all transitive dependencies`);
      
      return {
        success: true,
        elapsed: elapsed,
        manifest: manifest,
        environment: 'arborist',
        installedPackages: installedPackages,
        results: installResults
      };
      
    } catch (error) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      logger.error(`[PackageInstaller] Installation failed after ${elapsed}s: ${error.message}`);
      
      throw new Error(`Arborist installation failed: ${error.message}`);
    }
  }
  
  /**
   * 构建依赖列表字符串用于日志
   * @param {Object|Array} dependencies - 依赖
   * @returns {string} 格式化的依赖列表
   */
  static buildDependenciesList(dependencies) {
    if (!dependencies) return '';
    
    if (typeof dependencies === 'object' && !Array.isArray(dependencies)) {
      // 对象格式：{"package": "version"}
      return Object.keys(dependencies)
        .map(name => `${name}@${dependencies[name]}`)
        .join(', ');
    } else if (Array.isArray(dependencies)) {
      // 数组格式：["package@version"]
      return dependencies.join(', ');
    }
    
    return String(dependencies);
  }
  
  /**
   * 规范化依赖格式为对象
   * @param {Object|Array} dependencies - 原始依赖
   * @returns {Object} 规范化的依赖对象
   */
  static normalizeDependencies(dependencies) {
    if (!dependencies) return {};
    
    if (typeof dependencies === 'object' && !Array.isArray(dependencies)) {
      // 已经是对象格式
      return dependencies;
    }
    
    if (Array.isArray(dependencies)) {
      // 数组格式转对象
      const normalized = {};
      for (const dep of dependencies) {
        if (dep.includes('@')) {
          const lastAtIndex = dep.lastIndexOf('@');
          if (lastAtIndex > 0) {
            const name = dep.substring(0, lastAtIndex);
            const version = dep.substring(lastAtIndex + 1);
            normalized[name] = version;
          } else {
            normalized[dep] = 'latest';
          }
        } else {
          normalized[dep] = 'latest';
        }
      }
      return normalized;
    }
    
    return {};
  }
  
  /**
   * 创建package.json文件 - 保持向后兼容的API
   * @param {string} workingDir - 工作目录
   * @param {string} toolId - 工具ID
   * @param {Object|Array} dependencies - 依赖列表
   */
  static async createPackageJson(workingDir, toolId, dependencies) {
    const packageJsonPath = path.join(workingDir, 'package.json');
    
    const packageJson = {
      name: `toolbox-${toolId}`,
      version: '1.0.0',
      description: `Sandbox for tool: ${toolId}`,
      private: true,
      dependencies: this.normalizeDependencies(dependencies)
    };
    
    logger.debug(`[PackageInstaller] Creating package.json: ${packageJsonPath}`);
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }
  
  /**
   * 检查包是否已安装
   * @param {string} workingDir - 工作目录
   * @param {string} packageName - 包名
   * @returns {Promise<boolean>} 是否已安装
   */
  static async isPackageInstalled(workingDir, packageName) {
    try {
      const packagePath = packageName.startsWith('@') 
        ? path.join(workingDir, 'node_modules', ...packageName.split('/'))
        : path.join(workingDir, 'node_modules', packageName);
        
      const packageJsonPath = path.join(packagePath, 'package.json');
      await fs.access(packageJsonPath);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * 获取已安装包的信息
   * @param {string} workingDir - 工作目录
   * @param {string} packageName - 包名
   * @returns {Promise<Object|null>} 包信息
   */
  static async getPackageInfo(workingDir, packageName) {
    try {
      const packagePath = packageName.startsWith('@')
        ? path.join(workingDir, 'node_modules', ...packageName.split('/'))
        : path.join(workingDir, 'node_modules', packageName);
        
      const packageJsonPath = path.join(packagePath, 'package.json');
      const content = await fs.readFile(packageJsonPath, 'utf8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
}

module.exports = PackageInstaller;