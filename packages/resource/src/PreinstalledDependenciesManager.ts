/**
 * PreinstalledDependenciesManager
 * 
 * 管理预装依赖，实现依赖复用机制
 * 扫描@promptx/core和@promptx/resource的所有依赖，供工具直接复用
 */

import * as fs from 'fs';
import * as path from 'path';

const logger = require('@promptx/logger');
const semver = require('semver');

interface DependencyInfo {
  version: string;
  source: string;
  preinstalled: boolean;
  location?: string;
}

interface DependencyAnalysis {
  preinstalled: Record<string, string>;
  required: Record<string, string>;
  sources: Record<string, string>;
}

export class PreinstalledDependenciesManager {
  private availableDependencies: Map<string, DependencyInfo>;
  private packagePaths: Map<string, string>;
  private loadedModules: Map<string, any>; // 缓存已加载的模块

  constructor() {
    this.availableDependencies = new Map();
    this.packagePaths = new Map();
    this.loadedModules = new Map();
    this.scanPreinstalledDependencies();
  }

  /**
   * 扫描预装依赖
   * 只扫描 @promptx/resource 的依赖
   */
  private scanPreinstalledDependencies(): void {
    // 在运行时，__dirname是dist目录，package.json已复制到dist中
    const packageJsonPath = path.join(__dirname, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error(`[PreinstalledDeps] CRITICAL: package.json not found at: ${packageJsonPath}. Build process may be broken.`);
    }
    
    try {
      const packageContent = fs.readFileSync(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(packageContent);
      const dependencies = packageJson.dependencies || {};
      
      // 记录包路径
      this.packagePaths.set('@promptx/resource', __dirname);
      
      // 扫描所有dependencies
      for (const [depName, version] of Object.entries(dependencies)) {
        // 对于pnpm管理的依赖，我们不检查实际路径
        // 因为pnpm会通过符号链接确保可用性
        this.availableDependencies.set(depName, {
          version: version as string,
          source: '@promptx/resource',
          preinstalled: true,
          location: 'pnpm-managed'
        });
      }
      
      logger.debug(`[PreinstalledDeps] Scanned @promptx/resource: found ${Object.keys(dependencies).length} dependencies`);
      logger.info(`[PreinstalledDeps] Found ${this.availableDependencies.size} preinstalled packages`);
      this.logAvailableDependencies();
      
    } catch (error) {
      throw new Error(`[PreinstalledDeps] Failed to parse package.json: ${(error as Error).message}`);
    }
  }

  /**
   * 检查是否为Node.js内置模块
   */
  private isBuiltinModule(moduleName: string): boolean {
    const builtins = [
      'fs', 'path', 'os', 'crypto', 'util', 'stream', 
      'http', 'https', 'url', 'querystring', 'child_process'
    ];
    return builtins.includes(moduleName);
  }

  /**
   * 记录可用的预装依赖（用于调试）
   */
  private logAvailableDependencies(): void {
    const grouped: Record<string, string[]> = {};
    
    for (const [depName, info] of this.availableDependencies) {
      if (!grouped[info.source]) {
        grouped[info.source] = [];
      }
      grouped[info.source].push(`${depName}@${info.version}`);
    }

    for (const [source, deps] of Object.entries(grouped)) {
      logger.debug(`[${source}] Preinstalled: ${deps.join(', ')}`);
    }
  }

  /**
   * 分析工具依赖，区分预装和需要安装的
   */
  public analyzeDependencies(toolDependencies: Record<string, string>): DependencyAnalysis {
    const result: DependencyAnalysis = {
      preinstalled: {},
      required: {},
      sources: {}
    };

    for (const [depName, requestedVersion] of Object.entries(toolDependencies)) {
      const available = this.availableDependencies.get(depName);
      
      if (available) {
        // 检查版本兼容性
        if (this.isVersionCompatible(available.version, requestedVersion)) {
          result.preinstalled[depName] = requestedVersion;
          result.sources[depName] = available.source;
          logger.debug(`[Dep] ${depName}@${requestedVersion} -> Use preinstalled from ${available.source}`);
        } else {
          // 版本不兼容，需要安装
          result.required[depName] = requestedVersion;
          logger.debug(`[Dep] ${depName}@${requestedVersion} -> Version mismatch, need install`);
        }
      } else {
        result.required[depName] = requestedVersion;
        logger.debug(`[Dep] ${depName}@${requestedVersion} -> Not preinstalled, need install`);
      }
    }

    logger.info(
      `[DependencyAnalysis] Preinstalled: ${Object.keys(result.preinstalled).length}, ` +
      `Required: ${Object.keys(result.required).length}`
    );

    return result;
  }

  /**
   * 检查版本兼容性
   * 使用标准的 semver 库进行版本匹配
   */
  private isVersionCompatible(available: string, requested: string): boolean {
    // 处理特殊情况
    if (requested === '*' || requested === 'latest') {
      return true;
    }

    if (requested.startsWith('workspace:')) {
      return false; // workspace依赖不能复用
    }

    try {
      // 清理版本号，去掉前缀（semver.coerce会处理）
      const availableClean = available.replace(/^[\^~>=<]/, '').trim();
      
      // 使用 semver.satisfies 进行标准的版本范围匹配
      // 这个函数会正确处理 ^, ~, >=, > 等所有npm版本范围语法
      return semver.satisfies(availableClean, requested);
    } catch (error) {
      // 如果semver无法解析，回退到精确匹配
      logger.debug(`[PreinstalledDeps] Semver failed for ${available} vs ${requested}: ${(error as Error).message}`);
      return available === requested;
    }
  }

  /**
   * 获取预装依赖的实际路径
   */
  public getPreinstalledPath(depName: string): string | null {
    const info = this.availableDependencies.get(depName);
    return info?.location || null;
  }

  /**
   * 获取预装的模块实例
   * 直接加载并缓存预装的模块，供 ToolSandbox 使用
   */
  public async getPreinstalledModule(moduleName: string): Promise<any | null> {
    // 检查是否是预装的包
    if (!this.isPreinstalled(moduleName)) {
      return null;
    }

    // 检查缓存（使用完整的模块名作为缓存键）
    if (this.loadedModules.has(moduleName)) {
      logger.debug(`[PreinstalledDeps] Returning cached module: ${moduleName}`);
      return this.loadedModules.get(moduleName);
    }

    try {
      logger.info(`[PreinstalledDeps] Loading preinstalled module: ${moduleName}`);
      
      // 创建一个从 @promptx/resource 位置的 require
      // 这样可以正确解析预装在 resource 包中的依赖
      const { createRequire } = require('module');
      // 使用源目录的package.json路径，因为node_modules在源目录
      const sourceDir = path.resolve(__dirname, '..'); // 从dist回到packages/resource
      const resourcePackageJson = path.join(sourceDir, 'package.json');
      
      // 验证文件是否存在
      if (!fs.existsSync(resourcePackageJson)) {
        logger.error(`[PreinstalledDeps] package.json not found at: ${resourcePackageJson}`);
        logger.error(`[PreinstalledDeps] __dirname is: ${__dirname}`);
        logger.error(`[PreinstalledDeps] sourceDir is: ${sourceDir}`);
        throw new Error(`package.json not found at: ${resourcePackageJson}`);
      }
      
      logger.info(`[PreinstalledDeps] Using package.json at: ${resourcePackageJson}`);
      const requireFromResource = createRequire(resourcePackageJson);
      
      // 获取模块的实际路径
      const modulePath = requireFromResource.resolve(moduleName);
      logger.debug(`[PreinstalledDeps] Module resolved to: ${modulePath}`);
      
      // 检查包的类型（通过读取其 package.json）
      let isESModule = false;
      try {
        // 找到模块的 package.json
        const moduleDir = path.dirname(modulePath);
        let currentDir = moduleDir;
        
        // 向上查找 package.json
        while (currentDir !== path.dirname(currentDir)) {
          const pkgPath = path.join(currentDir, 'package.json');
          if (fs.existsSync(pkgPath)) {
            const pkgContent = fs.readFileSync(pkgPath, 'utf8');
            const pkg = JSON.parse(pkgContent);
            if (pkg.name === moduleName) {
              isESModule = pkg.type === 'module';
              logger.debug(`[PreinstalledDeps] Module ${moduleName} is ${isESModule ? 'ESM' : 'CommonJS'}`);
              break;
            }
          }
          currentDir = path.dirname(currentDir);
        }
      } catch (e) {
        logger.debug(`[PreinstalledDeps] Could not determine module type, assuming CommonJS`);
      }
      
      let module;
      if (isESModule) {
        // ES Module - 使用 import
        logger.debug(`[PreinstalledDeps] Loading as ES Module: ${moduleName}`);
        module = await import(modulePath);
      } else {
        // CommonJS - 使用 require
        logger.debug(`[PreinstalledDeps] Loading as CommonJS: ${moduleName}`);
        module = requireFromResource(moduleName);
      }
      
      // 缓存并返回
      this.loadedModules.set(moduleName, module);
      logger.info(`[PreinstalledDeps] Successfully loaded ${isESModule ? 'ESM' : 'CommonJS'} module: ${moduleName}`);
      return module;
      
    } catch (error: any) {
      logger.error(`[PreinstalledDeps] Failed to load module ${moduleName}: ${error.message}`);
      return null;
    }
  }

  /**
   * 获取模块解析的基础路径
   * 用于 importx 从 @promptx/resource 位置解析预装的包
   */
  public getModuleResolutionPath(): string {
    // 返回 @promptx/resource 的 package.json 路径
    // importx 将从这里解析预装的包
    return path.join(__dirname, 'package.json');
  }

  /**
   * 检查模块是否预装
   */
  public isPreinstalled(moduleName: string): boolean {
    // 处理带路径的模块名（如 @modelcontextprotocol/server-filesystem/dist/lib.js）
    // 提取包名进行检查
    const packageName = this.extractPackageName(moduleName);
    return this.availableDependencies.has(packageName);
  }
  
  /**
   * 从模块路径中提取包名
   */
  private extractPackageName(moduleName: string): string {
    // 处理 @scope/package/path 格式
    if (moduleName.startsWith('@')) {
      const parts = moduleName.split('/');
      if (parts.length >= 2) {
        return `${parts[0]}/${parts[1]}`;
      }
    }
    // 处理 package/path 格式
    const firstSlash = moduleName.indexOf('/');
    if (firstSlash > 0) {
      return moduleName.substring(0, firstSlash);
    }
    return moduleName;
  }

  /**
   * 获取所有预装依赖列表
   */
  public getAllPreinstalled(): string[] {
    return Array.from(this.availableDependencies.keys());
  }

  /**
   * 获取预装依赖的详细信息
   */
  public getDependencyInfo(depName: string): DependencyInfo | null {
    return this.availableDependencies.get(depName) || null;
  }
}

// 单例模式
let instance: PreinstalledDependenciesManager | null = null;

export function getPreinstalledDependenciesManager(): PreinstalledDependenciesManager {
  if (!instance) {
    instance = new PreinstalledDependenciesManager();
  }
  return instance;
}

/**
 * 便捷方法：分析工具依赖
 */
export function analyzeToolDependencies(dependencies: Record<string, string>): DependencyAnalysis {
  return getPreinstalledDependenciesManager().analyzeDependencies(dependencies);
}