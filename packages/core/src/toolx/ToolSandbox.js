// importx 是 ESM-only 包，需要动态导入
let importx = null;
const getImportx = async () => {
  if (!importx) {
    const { import: importFn } = await import('importx');
    importx = importFn;
  }
  return importx;
};

// 在 CommonJS 中创建 parentURL
const { pathToFileURL } = require('url');
const parentURL = pathToFileURL(__filename).href;

// 直接引入管理器类
const SandboxErrorManager = require('./SandboxErrorManager');
const ToolDirectoryManager = require('./ToolDirectoryManager'); 
const SandboxIsolationManager = require('./SandboxIsolationManager');

/**
 * ToolSandbox - 工具沙箱环境管理器
 * 
 * 完全基于importx的统一模块加载架构：
 * - @tool:// 协议定位工具
 * - @user://.promptx/toolbox 沙箱隔离
 * - 自动依赖管理
 * - 可复用的执行环境
 * - 统一的importx模块加载
 */
class ToolSandbox {
  constructor(toolReference, options = {}) {
    this.toolReference = toolReference;  // @tool://url-validator
    this.resourceManager = null;         // ResourceManager实例
    this.toolId = null;                  // 工具ID，如 url-validator
    this.toolContent = null;             // 工具文件内容
    this.toolInstance = null;            // 工具实例
    this.dependencies = [];              // 依赖列表
    this.directoryManager = null;        // 目录管理器
    this.sandboxPath = null;             // 沙箱目录路径（保留用于兼容）
    this.sandboxContext = null;          // VM沙箱上下文
    this.isolationManager = null;        // 沙箱隔离管理器
    this.errorManager = null;            // 智能错误管理器
    
    // 异步加载的模块
    this.fs = null;
    this.vm = null;
    this.logger = null;
    
    // 状态标志
    this.isAnalyzed = false;
    this.isPrepared = false;
    this.isInitialized = false;
    
    // 配置选项
    this.options = {
      timeout: 30000,
      enableDependencyInstall: true,
      rebuild: false,  // 强制重建沙箱（用于处理异常情况）
      ...options
    };
  }

  /**
   * 异步初始化 - 加载所有必需的模块
   */
  async init() {
    if (this.isInitialized) {
      return;
    }

    try {
      // ToolSandbox 内部使用常规 require()
      this.fs = require('fs');
      this.vm = require('vm');
      this.logger = require('@promptx/logger');
      
      // 管理器类已在顶部静态导入
      
      this.errorManager = new SandboxErrorManager();
      this.isolationManager = new SandboxIsolationManager(process.cwd());
      
      this.isInitialized = true;
      this.logger.debug('[ToolSandbox] Initialized with importx');
    } catch (error) {
      throw new Error(`Failed to initialize ToolSandbox: ${error.message}`);
    }
  }

  /**
   * 静态工厂方法 - 创建已初始化的ToolSandbox实例
   */
  static async create(toolReference, options = {}) {
    const sandbox = new ToolSandbox(toolReference, options);
    await sandbox.init();
    return sandbox;
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
    await this.ensureInitialized();
    this.logger.debug(`[ToolSandbox] Clearing sandbox state${deleteDirectory ? ' and deleting directory' : ''}`);
    
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
        this.logger.debug(`[ToolSandbox] Error deleting toolbox directory (can be ignored): ${error.message}`);
      }
    }
  }

  /**
   * 确保已初始化
   */
  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.init();
    }
  }

  /**
   * 分析工具：加载工具内容，提取元信息和依赖
   * @returns {Promise<Object>} 分析结果
   */
  async analyze() {
    await this.ensureInitialized();
    
    if (this.isAnalyzed && !this.options.rebuild) {
      this.logger.debug(`[ToolSandbox] Using cached analysis result, dependencies: ${JSON.stringify(this.dependencies)}`);
      return this.getAnalysisResult();
    }

    if (!this.resourceManager) {
      throw new Error('ResourceManager not set. Call setResourceManager() first.');
    }

    try {
      // 1. 解析工具引用，提取工具ID
      this.toolId = this.extractToolId(this.toolReference);
      
      // 2. 通过ResourceManager加载工具内容
      this.logger.debug(`[ToolSandbox] Loading tool content for: ${this.toolReference}`);
      const resourceResult = await this.resourceManager.loadResource(this.toolReference);
      
      if (!resourceResult.success) {
        throw new Error(`Failed to load tool: ${resourceResult.error?.message || 'Unknown error'}`);
      }
      
      this.toolContent = resourceResult.content;
      this.logger.debug(`[ToolSandbox] Tool content loaded successfully`);

      // 3. 解析工具实例以提取依赖（使用原生Node.js环境）
      this.toolInstance = this.parseToolContent(this.toolContent);
      
      if (typeof this.toolInstance.getDependencies === 'function') {
        this.dependencies = this.toolInstance.getDependencies() || {};
      } else {
        this.dependencies = {};
      }

      // 4. 初始化目录管理器
      this.directoryManager = new ToolDirectoryManager(this.toolId, this.resourceManager);
      await this.directoryManager.initialize();
      this.sandboxPath = await this.directoryManager.getToolboxPath();

      this.isAnalyzed = true;
      this.logger.debug(`[ToolSandbox] Analysis completed. Dependencies: ${JSON.stringify(this.dependencies)}`);
      
      return this.getAnalysisResult();

    } catch (error) {
      const enhancedError = this.errorManager.analyzeError(error, {
        phase: 'analyze',
        toolReference: this.toolReference,
        toolId: this.toolId
      });
      this.logger.error(`[ToolSandbox] Analysis failed: ${enhancedError.message}`);
      throw enhancedError;
    }
  }

  /**
   * 准备依赖环境
   */
  async prepareDependencies() {
    await this.ensureInitialized();
    
    if (this.isPrepared && !this.options.rebuild) {
      this.logger.debug('[ToolSandbox] Dependencies already prepared');
      return { success: true, message: 'Dependencies already prepared' };
    }

    if (!this.isAnalyzed) {
      throw new Error('Tool must be analyzed before preparing dependencies. Call analyze() first.');
    }

    try {
      // 1. 确保沙箱目录存在
      await this.directoryManager.ensureDirectories();

      // 2. 如果有依赖，安装它们
      if (Object.keys(this.dependencies).length > 0) {
        this.logger.debug(`[ToolSandbox] Installing dependencies: ${JSON.stringify(this.dependencies)}`);
        await this.installDependencies();
      } else {
        this.logger.debug('[ToolSandbox] No dependencies to install');
      }

      // 3. 创建执行沙箱环境
      await this.createExecutionSandbox();

      this.isPrepared = true;
      this.logger.debug('[ToolSandbox] Dependencies prepared successfully');
      
      return { success: true, message: 'Dependencies prepared successfully' };

    } catch (error) {
      const enhancedError = this.errorManager.analyzeError(error, {
        phase: 'prepareDependencies',
        toolId: this.toolId,
        dependencies: this.dependencies,
        sandboxPath: this.sandboxPath
      });
      this.logger.error(`[ToolSandbox] Dependency preparation failed: ${enhancedError.message}`);
      throw enhancedError;
    }
  }

  /**
   * 执行工具
   */
  async execute(params = {}) {
    await this.ensureInitialized();
    
    if (!this.isPrepared) {
      throw new Error('Dependencies must be prepared before execution. Call prepareDependencies() first.');
    }

    try {
      // 参数验证
      if (typeof this.toolInstance.validate === 'function') {
        const validation = this.toolInstance.validate(params);
        if (validation && !validation.valid) {
          throw new Error(`Parameter validation failed: ${validation.errors?.join(', ')}`);
        }
      }

      // 执行工具
      const startTime = Date.now();
      this.logger.debug(`[ToolSandbox] Executing tool with params:`, params);

      // 在完全隔离的沙箱中重新加载工具
      const script = new this.vm.Script(this.toolContent, { filename: `${this.toolId}.js` });
      const context = this.vm.createContext(this.sandboxContext);
      
      script.runInContext(context);
      const exported = context.module.exports;
      
      // 执行工具的execute方法
      const result = await exported.execute(params);

      const executionTime = Date.now() - startTime;
      this.logger.debug(`[ToolSandbox] Tool execution completed in ${executionTime}ms`);

      return result;

    } catch (error) {
      const enhancedError = this.errorManager.analyzeError(error, {
        phase: 'execute',
        toolId: this.toolId,
        params: params,
        sandboxPath: this.sandboxPath
      });
      this.logger.error(`[ToolSandbox] Execution failed: ${enhancedError.message}`);
      throw enhancedError;
    }
  }

  /**
   * 创建执行沙箱环境
   */
  async createExecutionSandbox() {
    const hasNodeModules = await this.checkNodeModulesExists();
    
    if (hasNodeModules) {
      this.logger.debug('[ToolSandbox] Creating smart sandbox with dependency support');
      this.sandboxContext = this.vm.createContext(this.createSmartSandboxEnvironment());
    } else {
      this.logger.debug('[ToolSandbox] Creating basic sandbox without dependencies');
      this.sandboxContext = this.vm.createContext(this.createBasicSandboxEnvironment());
    }

    // 统一的模块加载函数 - 使用importx
    this.sandboxContext.importx = async (moduleName) => {
      try {
        this.logger.debug(`[ToolSandbox] Loading module: ${moduleName}`);
        
        // 获取importx实例并加载模块
        const importFn = await getImportx();
        return await importFn(moduleName, {
          parentURL,
          cache: true,
          loader: 'auto'
        });
      } catch (error) {
        this.logger.error(`[ToolSandbox] Failed to load module ${moduleName}: ${error.message}`);
        throw new Error(`Cannot load module '${moduleName}': ${error.message}`);
      }
    };
    
    // 保留向后兼容的别名 
    this.sandboxContext.loadModule = this.sandboxContext.importx;
    this.sandboxContext.importModule = this.sandboxContext.importx;
  }

  /**
   * 创建基础沙箱环境
   */
  createBasicSandboxEnvironment() {
    return this.isolationManager.createIsolatedContext();
  }

  /**
   * 创建智能沙箱环境（支持依赖）
   */
  createSmartSandboxEnvironment() {
    return this.isolationManager.createIsolatedContext();
  }

  // ... 其他辅助方法保持不变但使用this.fs等异步加载的模块 ...

  /**
   * 提取工具ID
   */
  extractToolId(toolReference) {
    if (toolReference.startsWith('@tool://')) {
      return toolReference.substring(8); // 移除 '@tool://' 前缀
    }
    throw new Error(`Invalid tool reference format: ${toolReference}`);
  }

  /**
   * 解析工具内容
   */
  parseToolContent(content) {
    try {
      // 创建一个完整的Node.js模块环境来执行工具代码
      const script = new this.vm.Script(content);
      const context = this.vm.createContext({
        // 模块系统
        module: { exports: {} },
        exports: {},
        require: require, // 直接使用Node.js的require
        
        // Node.js全局对象
        console: console,
        process: process,
        Buffer: Buffer,
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
        setInterval: setInterval,
        clearInterval: clearInterval,
        setImmediate: setImmediate,
        clearImmediate: clearImmediate,
        
        // 路径信息
        __filename: 'tool.js',
        __dirname: process.cwd(),
        
        // 全局构造函数
        Object: Object,
        Array: Array,
        String: String,
        Number: Number,
        Boolean: Boolean,
        Date: Date,
        RegExp: RegExp,
        Error: Error,
        JSON: JSON,
        Math: Math,
        Promise: Promise
      });
      
      script.runInContext(context);
      
      // 返回导出的模块
      return context.module.exports;
    } catch (error) {
      throw new Error(`Failed to parse tool content: ${error.message}`);
    }
  }

  /**
   * 获取分析结果
   */
  getAnalysisResult() {
    return {
      toolId: this.toolId,
      dependencies: this.dependencies,
      sandboxPath: this.sandboxPath,
      hasMetadata: typeof this.toolInstance?.getMetadata === 'function',
      hasSchema: typeof this.toolInstance?.getSchema === 'function'
    };
  }

  /**
   * 安装依赖
   */
  async installDependencies() {
    const PnpmInstaller = require('./PnpmInstaller');
    
    // 创建package.json
    await PnpmInstaller.createPackageJson(this.sandboxPath, this.toolId, this.dependencies);
    
    // 安装依赖
    await PnpmInstaller.install({
      workingDir: this.sandboxPath,
      dependencies: this.dependencies,
      timeout: this.options.timeout
    });
  }

  /**
   * 检查node_modules是否存在
   */
  async checkNodeModulesExists() {
    try {
      const nodeModulesPath = require('path').join(this.sandboxPath, 'node_modules');
      await this.fs.promises.access(nodeModulesPath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 清理资源
   */
  async cleanup() {
    // 清理沙箱状态，但不删除目录
    await this.clearSandbox(false);
  }
}

module.exports = ToolSandbox;