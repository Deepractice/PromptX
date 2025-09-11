/**
 * PreinstalledDependenciesManager
 * 
 * 管理预装依赖，实现依赖复用机制
 * 扫描@promptx/core和@promptx/resource的所有依赖，供工具直接复用
 */

import * as fs from 'fs';
import * as path from 'path';

const logger = require('@promptx/logger');

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

  constructor() {
    this.availableDependencies = new Map();
    this.packagePaths = new Map();
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
   * 使用npm的版本范围规则进行精确匹配
   */
  private isVersionCompatible(available: string, requested: string): boolean {
    // 如果请求的是 * 或 latest，总是兼容
    if (requested === '*' || requested === 'latest') {
      return true;
    }

    // 清理版本号（去掉workspace:*等特殊标记）
    if (requested.startsWith('workspace:')) {
      return false; // workspace依赖不能复用
    }

    // 如果版本完全相同，直接返回true
    if (available === requested) {
      return true;
    }

    // 处理常见的版本范围模式
    try {
      // 提取实际版本号（去掉范围符号）
      const availableClean = available.replace(/^[\^~>=<]/, '').trim();
      const requestedClean = requested.replace(/^[\^~>=<]/, '').trim();
      
      // 解析版本号
      const parseVersion = (v: string) => {
        const parts = v.split('.').map(p => parseInt(p, 10) || 0);
        return { major: parts[0], minor: parts[1] || 0, patch: parts[2] || 0 };
      };
      
      const avail = parseVersion(availableClean);
      const req = parseVersion(requestedClean);
      
      // 根据请求的版本范围类型进行匹配
      if (requested.startsWith('^')) {
        // ^ 允许兼容的更新（相同主版本号）
        return avail.major === req.major && 
               (avail.minor > req.minor || 
                (avail.minor === req.minor && avail.patch >= req.patch));
      } else if (requested.startsWith('~')) {
        // ~ 允许补丁级别的更新（相同主版本号和次版本号）
        return avail.major === req.major && 
               avail.minor === req.minor && 
               avail.patch >= req.patch;
      } else if (requested.includes('>=')) {
        // >= 最低版本要求
        return avail.major > req.major ||
               (avail.major === req.major && avail.minor > req.minor) ||
               (avail.major === req.major && avail.minor === req.minor && avail.patch >= req.patch);
      } else {
        // 精确版本匹配
        return availableClean === requestedClean;
      }
    } catch (error) {
      // 如果解析失败，进行保守的字符串比较
      logger.debug(`[PreinstalledDeps] Version parsing failed for ${available} vs ${requested}, using conservative match`);
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