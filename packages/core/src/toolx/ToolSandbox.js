const path = require('path');
const fs = require('fs').promises;
const { spawn } = require('child_process');
const vm = require('vm');
const SandboxIsolationManager = require('./SandboxIsolationManager');
const SandboxErrorManager = require('./SandboxErrorManager');
const ToolDirectoryManager = require('./ToolDirectoryManager');
const ESModuleRequireSupport = require('./ESModuleRequireSupport');
const logger = require('../utils/logger');

/**
 * ToolSandbox - 工具沙箱环境管理器
 * 
 * 基于现有协议系统的工具执行环境，支持：
 * - @tool:// 协议定位工具
 * - @user://.promptx/toolbox 沙箱隔离
 * - 自动依赖管理
 * - 可复用的执行环境
 */
class ToolSandbox {
  constructor(toolReference, options = {}) {
    this.toolReference = toolReference;  // @tool://url-validator
    this.resourceManager = null;         // ResourceManager实例
    this.toolId = null;                  // 工具ID，如 url-validator
    this.toolContent = null;             // 工具文件内容
    this.toolInstance = null;            // 工具实例
    this.dependencies = [];              // 依赖列表
    this.directoryManager = null;        // 目录管理器（新增）
    this.sandboxPath = null;             // 沙箱目录路径（保留用于兼容）
    this.sandboxContext = null;          // VM沙箱上下文
    this.isolationManager = null;        // 沙箱隔离管理器
    this.errorManager = new SandboxErrorManager(); // 智能错误管理器
    this.esModuleSupport = null;         // ES Module 支持器
    
    // 状态标志
    this.isAnalyzed = false;
    this.isPrepared = false;
    
    // 配置选项
    this.options = {
      timeout: 30000,
      enableDependencyInstall: true,
      rebuild: false,  // 强制重建沙箱（用于处理异常情况）
      ...options
    };
  }

  /**
   * 设置ResourceManager实例
   * @param {ResourceManager} resourceManager 
   */
  setResourceManager(resourceManager) {
    this.resourceManager = resourceManager;
  }

  /**
   * 清理沙箱状态和缓存
   * @param {boolean} deleteDirectory - 是否删除沙箱目录
   */
  async clearSandbox(deleteDirectory = false) {
    logger.debug(`[ToolSandbox] Clearing sandbox state${deleteDirectory ? ' and deleting directory' : ''}`);
    
    // 清空所有缓存和状态
    this.isAnalyzed = false;
    this.isPrepared = false;
    this.toolContent = null;
    this.toolInstance = null;
    this.dependencies = [];
    this.sandboxContext = null;
    
    // 如果需要，删除沙箱目录
    if (deleteDirectory && this.directoryManager) {
      try {
        await this.directoryManager.deleteToolbox();
      } catch (error) {
        logger.debug(`[ToolSandbox] Error deleting toolbox directory (can be ignored): ${error.message}`);
      }
    }
  }

  /**
   * 分析工具：加载工具内容，提取元信息和依赖
   * @returns {Promise<Object>} 分析结果
   */
  async analyze() {
    if (this.isAnalyzed && !this.options.rebuild) {
      logger.debug(`[ToolSandbox] Using cached analysis result, dependencies: ${JSON.stringify(this.dependencies)}`);
      return this.getAnalysisResult();
    }

    if (!this.resourceManager) {
      throw new Error('ResourceManager not set. Call setResourceManager() first.');
    }

    try {
      // 1. 解析工具引用，提取工具ID
      this.toolId = this.extractToolId(this.toolReference);
      
      // 2. 通过协议系统加载工具（forceReinstall时强制重新加载）
      const loadOptions = this.options.forceReinstall ? { noCache: true } : {};
      logger.debug(`[ToolSandbox] Loading tool ${this.toolReference}, options:`, loadOptions);
      
      const toolResult = await this.resourceManager.loadResource(this.toolReference, loadOptions);
      if (!toolResult.success) {
        // 调试：尝试不同的查找方式
        logger.debug(`[ToolSandbox] Debug: Trying to find tool ${this.toolReference}`);
        const directLookup = this.resourceManager.registryData.findResourceById(`tool:${this.toolId}`, 'tool');
        logger.debug(`[ToolSandbox]    - Direct lookup tool:${this.toolId}: ${directLookup ? 'found' : 'not found'}`);
        
        throw new Error(`Failed to load tool: ${toolResult.error.message}`);
      }
      
      this.toolContent = toolResult.content;
      
      // 调试：检查加载的工具内容
      logger.debug(`[ToolSandbox] Loaded tool content first 200 chars:`, this.toolContent.substring(0, 200));
      
      // 3. 初始化目录管理器
      this.directoryManager = new ToolDirectoryManager(this.toolId, this.resourceManager);
      await this.directoryManager.initialize();
      await this.directoryManager.ensureDirectories();
      
      // 4. 设置 sandboxPath 用于兼容
      this.sandboxPath = this.directoryManager.getWorkingPath();
      
      // 5. 在基础沙箱中分析工具
      await this.analyzeToolInSandbox();
      
      this.isAnalyzed = true;
      return this.getAnalysisResult();
      
    } catch (error) {
      throw new Error(`Tool analysis failed: ${error.message}`);
    }
  }

  /**
   * 准备依赖：安装依赖，准备执行环境
   * @returns {Promise<Object>} 准备结果
   */
  async prepareDependencies() {
    // 处理rebuild选项
    if (this.options.rebuild) {
      logger.debug(`[ToolSandbox] Manually triggering sandbox rebuild`);
      await this.clearSandbox(true);
      // 重新初始化目录管理器
      if (this.directoryManager) {
        await this.directoryManager.initialize();
      }
    }
    
    // 分析工具（如果需要）
    if (!this.isAnalyzed) {
      await this.analyze();
    }
    
    // 自动检测依赖是否需要更新
    if (!this.options.rebuild && await this.checkDependenciesNeedUpdate()) {
      logger.debug(`[ToolSandbox] Dependency changes detected, auto-rebuilding sandbox`);
      await this.clearSandbox(true);
      // 重新分析以获取最新依赖
      await this.analyze();
    }
    
    if (this.isPrepared) {
      return { success: true, message: 'Dependencies already prepared' };
    }

    try {
      // 1. 确保沙箱目录存在
      await this.ensureSandboxDirectory();
      
      // 2. 如果有依赖，安装它们
      const hasDependencies = typeof this.dependencies === 'object' && !Array.isArray(this.dependencies) 
        ? Object.keys(this.dependencies).length > 0
        : this.dependencies.length > 0;
        
      if (hasDependencies) {
        await this.installDependencies();
        
        // 2.1 检测 ES Module 依赖
        await this.detectAndHandleESModules();
      }
      
      // 3. 创建执行沙箱环境
      await this.createExecutionSandbox();
      
      this.isPrepared = true;
      return { 
        success: true, 
        sandboxPath: this.directoryManager.getWorkingPath(),
        toolboxPath: this.directoryManager.getToolboxPath(),
        dependencies: this.dependencies 
      };
      
    } catch (error) {
      throw new Error(`Dependency preparation failed: ${error.message}`);
    }
  }

  /**
   * 执行工具
   * @param {Object} parameters - 工具参数
   * @returns {Promise<Object>} 执行结果
   */
  async execute(parameters = {}) {
    if (!this.isPrepared) {
      await this.prepareDependencies();
    }

    try {
      // 1. 参数验证
      await this.validateParameters(parameters);
      
      // 2. 在沙箱中执行工具
      const result = await this.executeInSandbox(parameters);
      
      return {
        success: true,
        data: result,
        metadata: {
          toolId: this.toolId,
          sandboxPath: this.directoryManager.getWorkingPath(),
          toolboxPath: this.directoryManager.getToolboxPath(),
          executionTime: Date.now()
        }
      };
      
    } catch (error) {
      // 使用智能错误管理器分析错误
      const intelligentError = this.errorManager.analyzeError(error, {
        toolId: this.toolId,
        dependencies: this.dependencies,
        sandboxPath: this.directoryManager?.getWorkingPath(),
        toolboxPath: this.directoryManager?.getToolboxPath(),
        phase: 'execute'
      });
      
      // 抛出增强的错误对象，供上层处理自动重试
      const enhancedError = new Error(intelligentError.formattedMessage);
      enhancedError.intelligentError = intelligentError;
      enhancedError.originalError = error;
      throw enhancedError;
    }
  }

  /**
   * 提取工具ID
   * @param {string} toolReference - @tool://url-validator
   * @returns {string} 工具ID
   */
  extractToolId(toolReference) {
    const match = toolReference.match(/^@tool:\/\/(.+)$/);
    if (!match) {
      throw new Error(`Invalid tool reference format: ${toolReference}`);
    }
    return match[1];
  }


  /**
   * 在基础沙箱中分析工具
   */
  async analyzeToolInSandbox() {
    // 创建分析阶段的隔离管理器，使用工作目录
    this.isolationManager = new SandboxIsolationManager(this.directoryManager.getWorkingPath(), {
      enableDependencyLoading: false,
      analysisMode: true
    });
    
    const sandbox = this.isolationManager.createIsolatedContext();
    
    // 调试：检查即将执行的代码
    logger.debug(`[ToolSandbox] Tool code getDependencies section:`, 
      this.toolContent.match(/getDependencies[\s\S]*?return[\s\S]*?\]/)?.[0] || 'getDependencies not found');
    
    const script = new vm.Script(this.toolContent, { filename: `${this.toolId}.js` });
    const context = vm.createContext(sandbox);
    
    try {
      script.runInContext(context);
    } catch (error) {
      // 使用智能错误过滤处理require错误
      const filteredError = this._filterRequireError(error);
      if (filteredError) {
        throw filteredError;
      }
      // 如果是预期的require错误，继续执行
    }
    
    const exported = context.module.exports;
    
    if (!exported) {
      throw new Error(`Tool does not export anything: ${this.toolId}`);
    }
    
    // 创建工具实例
    let toolInstance;
    if (typeof exported === 'function') {
      toolInstance = new exported();
    } else if (typeof exported === 'object') {
      toolInstance = exported;
    } else {
      throw new Error(`Invalid tool export format: ${this.toolId}`);
    }
    
    // 提取依赖
    if (typeof toolInstance.getDependencies === 'function') {
      try {
        this.dependencies = toolInstance.getDependencies() || {};
        logger.debug(`[ToolSandbox] Extracted dependencies: ${JSON.stringify(this.dependencies)}`);
      } catch (error) {
        logger.warn(`[ToolSandbox] Failed to get dependencies for ${this.toolId}: ${error.message}`);
        this.dependencies = {};
      }
    } else {
      logger.debug(`[ToolSandbox] Tool does not have getDependencies method`);
      this.dependencies = {};
    }
    
    this.toolInstance = toolInstance;
  }

  /**
   * 智能过滤require错误
   * @param {Error} error - 捕获的错误
   * @returns {Error|null} - 如果是真正的错误则返回Error对象，如果是预期的require错误则返回null
   * @private
   */
  _filterRequireError(error) {
    // 检查是否是MODULE_NOT_FOUND错误
    if (error.code === 'MODULE_NOT_FOUND') {
      const missingModule = this._extractMissingModuleName(error.message);
      
      if (missingModule) {
        // 获取已声明的依赖列表
        const declaredDependencies = this._extractDeclaredDependencies();
        
        // 检查缺失的模块是否在依赖声明中
        if (this._isDeclaredInDependencies(missingModule, declaredDependencies)) {
          logger.debug(`[ToolSandbox] Dependency ${missingModule} not installed, will install in prepareDependencies phase`);
          return null; // 预期的错误，忽略
        } else {
          return new Error(`未声明的依赖: ${missingModule}，请在getDependencies()中添加此依赖`);
        }
      }
    }
    
    // 其他错误直接返回
    return error;
  }

  /**
   * 从错误信息中提取缺失的模块名
   * @param {string} errorMessage - 错误信息
   * @returns {string|null} - 模块名或null
   * @private
   */
  _extractMissingModuleName(errorMessage) {
    // 匹配 "Cannot find module 'moduleName'" 或 "Cannot resolve module 'moduleName'"
    const match = errorMessage.match(/Cannot (?:find|resolve) module ['"]([^'"]+)['"]/);
    return match ? match[1] : null;
  }

  /**
   * 尝试从工具代码中提取已声明的依赖
   * @returns {string[]} - 依赖列表
   * @private
   */
  _extractDeclaredDependencies() {
    try {
      // 尝试通过正则表达式从代码中提取getDependencies的返回值
      const dependencyMatch = this.toolContent.match(/getDependencies\s*\(\s*\)\s*\{[\s\S]*?return\s*\[([\s\S]*?)\]/);
      
      if (dependencyMatch) {
        const dependencyString = dependencyMatch[1];
        // 提取字符串字面量
        const stringMatches = dependencyString.match(/['"]([^'"]+)['"]/g);
        if (stringMatches) {
          return stringMatches.map(str => str.slice(1, -1)); // 去掉引号
        }
      }
    } catch (error) {
      logger.warn(`[ToolSandbox] Unable to parse dependency declaration: ${error.message}`);
    }
    
    return [];
  }

  /**
   * 检查模块是否在依赖声明中
   * @param {string} moduleName - 模块名
   * @param {string[]} declaredDependencies - 已声明的依赖列表
   * @returns {boolean} - 是否已声明
   * @private
   */
  _isDeclaredInDependencies(moduleName, declaredDependencies) {
    return declaredDependencies.some(dep => {
      // 支持 "axios@^1.6.0" 格式，提取模块名部分
      const depName = dep.split('@')[0];
      return depName === moduleName;
    });
  }

  /**
   * 检查沙箱目录是否存在
   * @returns {Promise<boolean>}
   */
  async sandboxExists() {
    if (!this.directoryManager) {
      return false;
    }
    return await this.directoryManager.toolboxExists();
  }

  /**
   * 确保沙箱目录存在
   */
  async ensureSandboxDirectory() {
    // 委托给 directoryManager 处理
    if (this.directoryManager) {
      await this.directoryManager.ensureDirectories();
    }
  }

  /**
   * 安装依赖
   */
  async installDependencies() {
    // 检查依赖是否为空（支持对象和数组格式）
    const hasDependencies = typeof this.dependencies === 'object' && !Array.isArray(this.dependencies) 
      ? Object.keys(this.dependencies).length > 0
      : this.dependencies.length > 0;
      
    if (!hasDependencies) {
      return;
    }

    // 1. 创建package.json
    await this.createPackageJson();
    
    // 2. 使用内置pnpm安装依赖
    await this.runPnpmInstall();
  }

  /**
   * 检查依赖是否需要更新
   * @returns {Promise<boolean>} true表示需要更新
   */
  async checkDependenciesNeedUpdate() {
    const packageJsonPath = this.directoryManager.getPackageJsonPath();
    
    try {
      // 读取现有的package.json
      const existingContent = await fs.readFile(packageJsonPath, 'utf-8');
      const existingPackageJson = JSON.parse(existingContent);
      const existingDeps = existingPackageJson.dependencies || {};
      
      // 构建新的依赖对象
      let newDeps = {};
      if (typeof this.dependencies === 'object' && !Array.isArray(this.dependencies)) {
        // 新格式：直接使用对象
        newDeps = this.dependencies;
      } else if (Array.isArray(this.dependencies)) {
        // 兼容旧格式（数组）
        for (const dep of this.dependencies) {
          if (dep.includes('@')) {
            const lastAtIndex = dep.lastIndexOf('@');
            if (lastAtIndex > 0) {
              const name = dep.substring(0, lastAtIndex);
              const version = dep.substring(lastAtIndex + 1);
              newDeps[name] = version;
            } else {
              newDeps[dep] = 'latest';
            }
          } else {
            newDeps[dep] = 'latest';
          }
        }
      }
      
      // 比较依赖是否一致
      const existingKeys = Object.keys(existingDeps).sort();
      const newKeys = Object.keys(newDeps).sort();
      
      // 检查键是否相同
      if (existingKeys.length !== newKeys.length || 
          !existingKeys.every((key, index) => key === newKeys[index])) {
        logger.debug(`[ToolSandbox] Dependency list changed - old: ${existingKeys.join(', ')} | new: ${newKeys.join(', ')}`);
        return true;
      }
      
      // 检查版本是否相同
      for (const key of existingKeys) {
        if (existingDeps[key] !== newDeps[key]) {
          logger.debug(`[ToolSandbox] Dependency version changed - ${key}: ${existingDeps[key]} -> ${newDeps[key]}`);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      // 文件不存在或解析失败，需要创建
      logger.debug(`[ToolSandbox] package.json does not exist or is invalid, needs to be created`);
      return true;
    }
  }

  /**
   * 创建package.json
   */
  async createPackageJson() {
    const packageJsonPath = this.directoryManager.getPackageJsonPath();
    
    const packageJson = {
      name: `toolbox-${this.toolId}`,
      version: '1.0.0',
      description: `Sandbox for tool: ${this.toolId}`,
      private: true,
      dependencies: {}
    };
    
    // 直接使用 getDependencies 返回的对象格式 {"package-name": "version"}
    logger.debug(`[ToolSandbox] Processing dependencies: ${JSON.stringify(this.dependencies)}`);
    if (typeof this.dependencies === 'object' && !Array.isArray(this.dependencies)) {
      // 新格式：直接使用对象
      packageJson.dependencies = this.dependencies;
    } else if (Array.isArray(this.dependencies)) {
      // 兼容旧格式（数组），但应该逐步废弃
      logger.warn(`[ToolSandbox] Tool ${this.toolId} is using deprecated array format for dependencies. Please update to object format.`);
      for (const dep of this.dependencies) {
        if (dep.includes('@')) {
          const lastAtIndex = dep.lastIndexOf('@');
          if (lastAtIndex > 0) {
            const name = dep.substring(0, lastAtIndex);
            const version = dep.substring(lastAtIndex + 1);
            logger.debug(`[ToolSandbox] Parsing dependency "${dep}" => name="${name}", version="${version}"`);
            packageJson.dependencies[name] = version;
          } else {
            // 只有 @ 开头，没有版本号的情况（如 @scope/package）
            packageJson.dependencies[dep] = 'latest';
          }
        } else {
          packageJson.dependencies[dep] = 'latest';
        }
      }
    }
    
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }

  /**
   * 运行pnpm安装
   */
  async runPnpmInstall() {
    return new Promise((resolve, reject) => {
      // 获取内置pnpm路径 - 直接从node_modules获取
      const pnpmModulePath = require.resolve('pnpm');
      const pnpmBinPath = path.join(path.dirname(pnpmModulePath), 'bin', 'pnpm.cjs');
      
      const pnpm = spawn('node', [pnpmBinPath, 'install'], {
        cwd: this.directoryManager.getToolboxPath(),  // 使用 toolbox 路径安装依赖
        stdio: 'pipe'
      });
      
      let stdout = '';
      let stderr = '';
      
      pnpm.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      pnpm.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      pnpm.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`pnpm install failed with code ${code}: ${stderr}`));
        }
      });
      
      pnpm.on('error', (error) => {
        reject(new Error(`Failed to spawn pnpm: ${error.message}`));
      });
    });
  }

  /**
   * 检测和处理 ES Module 依赖
   */
  async detectAndHandleESModules() {
    // 初始化 ES Module 支持器
    if (!this.esModuleSupport) {
      this.esModuleSupport = new ESModuleRequireSupport(this.directoryManager.getToolboxPath());
    }

    // 检测依赖类型
    const dependencyTypes = await this.esModuleSupport.detectDependenciesTypes(this.dependencies);
    
    if (dependencyTypes.esmodule.length > 0) {
      logger.warn(`[ToolSandbox] 检测到 ES Module 依赖：`, dependencyTypes.esmodule.map(d => d.name).join(', '));
      logger.info(`[ToolSandbox] ES Module 包需要使用动态 import() 加载，工具可能需要相应调整`);
      
      // 存储 ES Module 信息供后续使用
      this.esModuleDependencies = dependencyTypes.esmodule;
    }

    if (dependencyTypes.unknown.length > 0) {
      logger.debug(`[ToolSandbox] 无法检测的依赖类型：`, dependencyTypes.unknown.map(d => d.name).join(', '));
    }

    return dependencyTypes;
  }

  /**
   * 创建执行沙箱环境
   */
  async createExecutionSandbox() {
    // 创建执行阶段的隔离管理器，使用工作目录
    this.isolationManager = new SandboxIsolationManager(this.directoryManager.getWorkingPath(), {
      enableDependencyLoading: true,
      analysisMode: false,
      toolboxPath: this.directoryManager.getToolboxPath()  // 传递 toolbox 路径用于依赖加载
    });
    
    this.sandboxContext = this.isolationManager.createIsolatedContext();
    
    // 添加 ES Module 动态加载支持
    // 始终提供 importModule 函数，以支持工具动态加载 ES Module
    if (!this.esModuleSupport) {
      this.esModuleSupport = new ESModuleRequireSupport(this.directoryManager.getToolboxPath());
    }
    
    // 统一的模块加载函数 - 自动检测并加载
    this.sandboxContext.loadModule = async (moduleName) => {
      const moduleType = await this.esModuleSupport.detectModuleType(moduleName);
      if (moduleType === 'esm') {
        // ES Module - 尝试动态 import
        try {
          return await this.esModuleSupport.loadESModule(moduleName);
        } catch (error) {
          // 如果动态 import 失败，尝试通过 require 加载并提取 default
          const module = this.sandboxContext.require(moduleName);
          // Node.js 的 createRequire 会将 ES Module 包装，真正的导出在 default 中
          return module.default || module;
        }
      } else {
        return this.sandboxContext.require(moduleName);
      }
    };
    
    // 保留 importModule 作为别名（向后兼容）
    this.sandboxContext.importModule = this.sandboxContext.loadModule;
    
    // 增强 require - 主动检测 ES Module 并阻止加载
    const originalRequire = this.sandboxContext.require;
    const esModuleSupport = this.esModuleSupport;  // 捕获引用用于闭包
    
    this.sandboxContext.require = function(moduleName) {
      // 主动检测是否是 ES Module（使用同步方法避免 async）
      try {
        const packageJsonPath = require.resolve(`${moduleName}/package.json`, {
          paths: [esModuleSupport.toolboxPath]
        });
        const packageJson = require(packageJsonPath);
        
        if (packageJson.type === 'module') {
          // 是 ES Module，主动抛出错误
          const error = new Error(
            `❌ "${moduleName}" 是 ES Module 包，请使用 await loadModule('${moduleName}') 代替 require('${moduleName}')\n` +
            `💡 提示：loadModule 会自动检测包类型并正确加载`
          );
          error.code = 'ERR_REQUIRE_ESM';
          throw error;
        }
      } catch (checkError) {
        // 如果检测失败（比如包不存在），让原始 require 处理
        if (checkError.code === 'ERR_REQUIRE_ESM') {
          throw checkError;  // 重新抛出我们的错误
        }
      }
      
      // 不是 ES Module 或检测失败，使用原始 require
      const result = originalRequire(moduleName);
      
      // 额外检查：如果返回对象有 __esModule 和 default，说明是被包装的 ES Module
      if (result && result.__esModule && result.default && !result.default.__esModule) {
        // 这是 createRequire 包装的 ES Module，应该报错
        const error = new Error(
          `❌ "${moduleName}" 是 ES Module 包，请使用 await loadModule('${moduleName}') 代替 require('${moduleName}')\n` +
          `💡 提示：loadModule 会自动检测包类型并正确加载`
        );
        error.code = 'ERR_REQUIRE_ESM';
        throw error;
      }
      
      return result;
    };
    
    if (this.esModuleDependencies && this.esModuleDependencies.length > 0) {
      logger.debug(`[ToolSandbox] 已为工具 ${this.toolId} 启用 ES Module 支持，检测到 ${this.esModuleDependencies.length} 个 ES Module 依赖`);
    } else {
      logger.debug(`[ToolSandbox] 已为工具 ${this.toolId} 启用 importModule 函数`);
    }
    
    // 在完全隔离的沙箱中重新加载工具
    const script = new vm.Script(this.toolContent, { filename: `${this.toolId}.js` });
    const context = vm.createContext(this.sandboxContext);
    
    script.runInContext(context);
    const exported = context.module.exports;
    
    if (typeof exported === 'function') {
      this.toolInstance = new exported();
    } else if (typeof exported === 'object') {
      this.toolInstance = exported;
    }
  }


  /**
   * 解析协议路径（支持@project://等协议）
   * @param {string} protocolPath - 协议路径，如@project://.promptx/cwd
   * @returns {Promise<string>} 解析后的绝对路径
   */
  async resolveProtocolPath(protocolPath) {
    // 处理undefined或null的情况
    if (!protocolPath) {
      throw new Error('protocolPath is required but was undefined');
    }
    
    // 🚀 新架构：@project协议直接使用ProjectPathResolver
    if (protocolPath.startsWith('@project://')) {
      const { getGlobalProjectPathResolver } = require('../utils/ProjectPathResolver');
      const pathResolver = getGlobalProjectPathResolver();
      
      try {
        // 提取协议路径的相对部分
        const relativePath = protocolPath.replace(/^@project:\/\//, '');
        const resolvedPath = pathResolver.resolvePath(relativePath);
        
        // 确保目录存在
        const fs = require('fs').promises;
        try {
          await fs.access(resolvedPath);
        } catch (error) {
          if (error.code === 'ENOENT') {
            await fs.mkdir(resolvedPath, { recursive: true });
            logger.debug(`[ToolSandbox] Created unified working directory: ${resolvedPath}`);
          }
        }
        
        return resolvedPath;
      } catch (error) {
        throw new Error(`解析@project://路径失败: ${error.message}`);
      }
    }
    
    // 其他协议路径使用ResourceManager解析
    if (protocolPath.startsWith('@')) {
      if (!this.resourceManager) {
        throw new Error('ResourceManager not set. Cannot resolve protocol path.');
      }
      
      // 其他协议处理逻辑保持不变
      throw new Error(`暂不支持的协议路径: ${protocolPath}`);
    }
    
    // 普通路径直接返回
    return protocolPath;
  }




  /**
   * 参数验证
   */
  async validateParameters(parameters) {
    if (typeof this.toolInstance.validate === 'function') {
      const result = this.toolInstance.validate(parameters);
      
      if (typeof result === 'boolean' && !result) {
        throw new Error('Parameter validation failed');
      } else if (result && typeof result === 'object' && !result.valid) {
        throw new Error(`Parameter validation failed: ${result.errors?.join(', ')}`);
      }
    }
  }

  /**
   * 在沙箱中执行工具
   */
  async executeInSandbox(parameters) {
    if (!this.toolInstance || typeof this.toolInstance.execute !== 'function') {
      throw new Error(`Tool ${this.toolId} does not have execute method`);
    }
    
    return await this.toolInstance.execute(parameters);
  }

  /**
   * 获取分析结果
   */
  getAnalysisResult() {
    return {
      toolId: this.toolId,
      dependencies: this.dependencies,
      sandboxPath: this.directoryManager?.getWorkingPath(),
      toolboxPath: this.directoryManager?.getToolboxPath(),
      hasMetadata: typeof this.toolInstance?.getMetadata === 'function',
      hasSchema: typeof this.toolInstance?.getSchema === 'function'
    };
  }

  /**
   * 清理沙箱资源
   */
  async cleanup() {
    // 清理隔离管理器
    if (this.isolationManager) {
      this.isolationManager.cleanup();
      this.isolationManager = null;
    }
    
    // 清理 ES Module 支持器
    if (this.esModuleSupport) {
      this.esModuleSupport.clearCache();
      this.esModuleSupport = null;
    }
    
    // 清理其他资源
    this.sandboxContext = null;
    this.toolInstance = null;
    this.esModuleDependencies = null;
  }

  /**
   * 获取工具元信息
   */
  getToolMetadata() {
    if (this.toolInstance && typeof this.toolInstance.getMetadata === 'function') {
      return this.toolInstance.getMetadata();
    }
    return null;
  }

  /**
   * 获取工具Schema
   */
  getToolSchema() {
    if (this.toolInstance && typeof this.toolInstance.getSchema === 'function') {
      return this.toolInstance.getSchema();
    }
    return null;
  }
}

module.exports = ToolSandbox;