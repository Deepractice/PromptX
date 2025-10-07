// Note: Module loading is now handled by ToolModuleImport class
// The importx package is dynamically loaded inside ToolModuleImport when needed

// Directly import error classes
const { 
  ToolError,
  VALIDATION_ERRORS,
  SYSTEM_ERRORS,
  DEVELOPMENT_ERRORS
} = require('./errors');
const ToolDirectoryManager = require('./ToolDirectoryManager'); 
const SandboxIsolationManager = require('./SandboxIsolationManager');

/**
 * ToolSandbox - Tool sandbox environment manager
 * 
 * Unified module loading architecture completely based on importx:
 * - @tool:// protocol for tool location
 * - @user://.promptx/toolbox sandbox isolation
 * - Automatic dependency management
 * - Reusable execution environment
 * - Unified importx module loading
 */
class ToolSandbox {
  constructor(toolReference, options = {}) {
    this.toolReference = toolReference;  // @tool://url-validator
    this.resourceManager = null;         // ResourceManager instance
    this.toolId = null;                  // Tool ID, e.g. url-validator
    this.toolContent = null;             // Tool file content
    this.toolInstance = null;            // Tool instance
    this.dependencies = [];              // Dependency list
    this.directoryManager = null;        // Directory manager
    this.sandboxPath = null;             // Sandbox directory path (kept for compatibility)
    this.sandboxContext = null;          // VM sandbox context
    this.isolationManager = null;        // Sandbox isolation manager
    
    // Asynchronously loaded modules
    this.fs = null;
    this.vm = null;
    this.logger = null;
    
    // Status flags
    this.isAnalyzed = false;
    this.isPrepared = false;
    this.isInitialized = false;
    
    // Configuration options
    this.options = {
      timeout: 30000,
      enableDependencyInstall: true,
      rebuild: false,  // Force rebuild sandbox (for handling exceptional situations)
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
      const promptxPath = require('path').join(require('os').homedir(), '.promptx');
      this.isolationManager = new SandboxIsolationManager(promptxPath);
      
      this.isInitialized = true;
      this.logger.debug('[ToolSandbox] Initialized with importx');
    } catch (error) {
      // 初始化失败是系统错误
      throw new ToolError(
        `Failed to initialize ToolSandbox: ${error.message}`,
        SYSTEM_ERRORS.SANDBOX_INIT_FAILED.code,
        { originalError: error.message }
      );
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

    // ResourceManager 应该在创建时就设置好，这里只是 assert
    if (!this.resourceManager) {
      throw new Error('[BUG] ResourceManager should be set during initialization');
    }

    try {
      // 1. 解析工具引用，提取工具ID
      this.toolId = this.extractToolId(this.toolReference);
      
      // 2. 通过ResourceManager加载工具内容
      this.logger.debug(`[ToolSandbox] Loading tool content for: ${this.toolReference}`);
      const resourceResult = await this.resourceManager.loadResource(this.toolReference);
      
      if (!resourceResult.success) {
        throw new ToolError(
          `Failed to load tool: ${resourceResult.error?.message || 'Unknown error'}`,
          SYSTEM_ERRORS.TOOL_NOT_FOUND.code,
          { toolId: this.toolId }
        );
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
      const enhancedError = ToolError.from(error, {
        phase: 'analyze',
        toolReference: this.toolReference,
        toolId: this.toolId,
        dependencies: this.dependencies
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

    // 框架应该保证调用顺序，这里只是 assert
    console.assert(this.isAnalyzed, '[BUG] Tool should be analyzed before preparing dependencies');

    try {
      // 1. 确保沙箱目录存在
      await this.directoryManager.ensureDirectories();

      // 2. 如果有依赖，智能处理它们
      if (Object.keys(this.dependencies).length > 0) {
        // 使用PreinstalledDependenciesManager分析依赖
        try {
          const { analyzeToolDependencies } = require('@promptx/resource');
          const analysis = analyzeToolDependencies(this.dependencies);
          
          this.logger.info(
            `[ToolSandbox] Dependency analysis: ` +
            `${Object.keys(analysis.preinstalled).length} preinstalled, ` +
            `${Object.keys(analysis.required).length} need installation`
          );
          
          // 记录预装依赖的来源
          for (const [dep, source] of Object.entries(analysis.sources)) {
            this.logger.debug(`[ToolSandbox] Using preinstalled: ${dep} from ${source}`);
          }
          
          // 只安装真正需要的依赖
          if (Object.keys(analysis.required).length > 0) {
            this.logger.debug(`[ToolSandbox] Installing required dependencies: ${JSON.stringify(analysis.required)}`);
            // 临时替换dependencies，只安装需要的
            const originalDeps = this.dependencies;
            this.dependencies = analysis.required;
            await this.installDependencies();
            this.dependencies = originalDeps; // 恢复原始依赖列表
          } else {
            this.logger.info('[ToolSandbox] All dependencies are preinstalled, skipping installation!');
          }
        } catch (error) {
          // 如果依赖分析失败，降级到原始行为
          this.logger.warn(`[ToolSandbox] Dependency analysis failed, falling back to full install: ${error.message}`);
          await this.installDependencies();
        }
      } else {
        this.logger.debug('[ToolSandbox] No dependencies to install');
      }

      // 3. 创建执行沙箱环境
      await this.createExecutionSandbox();

      this.isPrepared = true;
      this.logger.debug('[ToolSandbox] Dependencies prepared successfully');
      
      return { success: true, message: 'Dependencies prepared successfully' };

    } catch (error) {
      const enhancedError = ToolError.from(error, {
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
   * 配置环境变量
   * @param {Object} params - 配置参数
   * @returns {Promise<Object>} 配置结果
   */
  async configureEnvironment(params = {}) {
    await this.ensureInitialized();
    
    // 框架应该保证调用顺序，这里只是 assert
    console.assert(this.isAnalyzed, '[BUG] Tool should be analyzed before configuring');
    
    // 创建 ToolAPI 实例来管理环境变量
    const ToolAPI = require('./api/ToolAPI');
    const api = new ToolAPI(this.toolId, this.sandboxPath, this.resourceManager);
    const env = api.environment;
    
    try {
      // 如果params为空，返回当前配置和元信息
      if (!params || Object.keys(params).length === 0) {
        this.logger.debug(`[ToolSandbox] Getting current environment configuration for ${this.toolId}`);
        
        // 获取工具声明的环境变量（从 schema.environment）
        let declaredVars = {};
        if (this.toolInstance && typeof this.toolInstance.getSchema === 'function') {
          const schema = this.toolInstance.getSchema();
          if (schema.environment && schema.environment.properties) {
            const envSchema = schema.environment;
            const requiredVars = envSchema.required || [];

            // 转换 JSON Schema 格式为变量定义
            for (const [varName, varSpec] of Object.entries(envSchema.properties)) {
              declaredVars[varName] = {
                required: requiredVars.includes(varName),
                description: varSpec.description,
                default: varSpec.default
              };
            }
          }
        }

        // 获取当前配置的环境变量
        const currentVars = await env.getAll();

        // 构建状态信息
        const status = {};
        for (const [varName, varDef] of Object.entries(declaredVars)) {
          const value = currentVars[varName];
          status[varName] = {
            required: varDef.required || false,
            configured: value !== undefined,
            value: value ? '***' : undefined, // 脱敏显示
            description: varDef.description,
            default: varDef.default
          };
        }
        
        // 检查是否有未声明但已配置的变量
        for (const key of Object.keys(currentVars)) {
          if (!status[key]) {
            status[key] = {
              required: false,
              configured: true,
              value: '***',
              description: 'User defined variable',
              undeclared: true
            };
          }
        }
        
        return {
          action: 'get',
          toolId: this.toolId,
          envPath: env.envPath,
          variables: status,
          summary: {
            total: Object.keys(status).length,
            configured: Object.values(status).filter(v => v.configured).length,
            required: Object.values(status).filter(v => v.required).length,
            missing: Object.values(status).filter(v => v.required && !v.configured).length
          }
        };
      }
      
      // 特殊操作
      if (params._action === 'clear') {
        this.logger.info(`[ToolSandbox] Clearing all environment variables for ${this.toolId}`);
        await env.clear();
        return {
          action: 'clear',
          success: true,
          message: 'All environment variables cleared'
        };
      }
      
      if (params._action === 'delete' && params._keys) {
        this.logger.info(`[ToolSandbox] Deleting environment variables for ${this.toolId}`);
        const deleted = [];
        for (const key of params._keys) {
          if (await env.delete(key)) {
            deleted.push(key);
          }
        }
        return {
          action: 'delete',
          success: true,
          deleted: deleted
        };
      }
      
      // 设置环境变量
      this.logger.info(`[ToolSandbox] Setting environment variables for ${this.toolId}`);
      const configured = [];
      for (const [key, value] of Object.entries(params)) {
        if (!key.startsWith('_')) { // 忽略以_开头的特殊参数
          await env.set(key, value);
          configured.push(key);
        }
      }
      
      return {
        action: 'set',
        success: true,
        configured: configured,
        envPath: env.envPath,
        message: `Configured ${configured.length} environment variable(s)`
      };
      
    } catch (error) {
      const enhancedError = ToolError.from(error, {
        phase: 'configure',
        toolId: this.toolId,
        params: params,
        metadata: this.metadata
      });
      this.logger.error(`[ToolSandbox] Configuration failed: ${enhancedError.message}`);
      throw enhancedError;
    }
  }

  /**
   * 查询工具日志
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 查询结果
   */
  async queryLogs(params = {}) {
    await this.ensureInitialized();
    
    // 框架应该保证调用顺序，这里只是 assert
    console.assert(this.isAnalyzed, '[BUG] Tool should be analyzed before querying logs');
    
    const ToolLoggerQuery = require('./ToolLoggerQuery');
    const logQuery = new ToolLoggerQuery(this.toolId, this.sandboxPath);
    
    try {
      const { action = 'tail', ...options } = params;
      
      switch (action) {
        case 'tail': {
          // 获取最近的日志
          const lines = options.lines || 50;
          return {
            success: true,
            action: 'tail',
            logs: await logQuery.tail(lines),
            count: lines
          };
        }
          
        case 'search':
          // 搜索日志
          if (!options.keyword) {
            throw new ToolError(
              'Search action requires keyword parameter',
              VALIDATION_ERRORS.MISSING_REQUIRED_PARAM.code,
              { param: 'keyword' }
            );
          }
          return {
            success: true,
            action: 'search',
            keyword: options.keyword,
            logs: await logQuery.search(options.keyword, options),
            options
          };
          
        case 'errors': {
          // 获取错误日志
          const limit = options.limit || 50;
          return {
            success: true,
            action: 'errors',
            logs: await logQuery.getErrors(limit),
            limit
          };
        }
          
        case 'stats':
          // 获取统计信息
          return {
            success: true,
            action: 'stats',
            stats: await logQuery.getStats()
          };
          
        case 'timeRange':
          // 按时间范围查询
          if (!options.startTime || !options.endTime) {
            throw new ToolError(
              'Time range action requires startTime and endTime parameters',
              VALIDATION_ERRORS.MISSING_REQUIRED_PARAM.code,
              { params: ['startTime', 'endTime'] }
            );
          }
          return {
            success: true,
            action: 'timeRange',
            startTime: options.startTime,
            endTime: options.endTime,
            logs: await logQuery.getByTimeRange(options.startTime, options.endTime)
          };
          
        case 'clear': {
          // 清空日志
          const cleared = await logQuery.clear();
          return {
            success: cleared,
            action: 'clear',
            message: cleared ? 'Logs cleared successfully' : 'Failed to clear logs'
          };
        }
          
        default:
          throw new ToolError(
            `Unknown log query action: ${action}`,
            VALIDATION_ERRORS.INVALID_PARAM_VALUE?.code || 'INVALID_PARAM',
            { param: 'action', value: action }
          );
      }
      
    } catch (error) {
      const enhancedError = ToolError.from(error, {
        phase: 'queryLogs',
        toolId: this.toolId,
        params: params
      });
      this.logger.error(`[ToolSandbox] Log query failed: ${enhancedError.message}`);
      throw enhancedError;
    }
  }

  /**
   * 执行工具dry-run测试
   * @param {Object} params - 测试参数
   * @returns {Promise<Object>} 测试结果
   */
  async dryRun(params = {}) {
    await this.ensureInitialized();

    // 确保依赖已准备
    if (!this.isPrepared) {
      await this.prepareDependencies();
    }

    try {
      // 在沙箱中加载工具
      const script = new this.vm.Script(this.toolContent, { filename: `${this.toolId}.js` });
      const context = this.vm.createContext(this.sandboxContext);

      script.runInContext(context);
      const exported = context.module.exports;

      // 创建API实例并设置为dryrun模式
      const ToolAPI = require('./api/ToolAPI');
      const toolAPI = new ToolAPI(this.toolId, this.sandboxPath, this.resourceManager);
      toolAPI.setToolInstance(exported);

      // 设置bridge为dryrun模式
      if (toolAPI.bridge) {
        toolAPI.bridge.setMode('dryrun');
      }

      exported.api = toolAPI;

      // 执行工具
      const result = await exported.execute(params);

      // 如果工具支持bridges，执行批量dry-run测试
      let bridgeTestResults = null;
      if (typeof exported.getBridges === 'function') {
        bridgeTestResults = await toolAPI.bridge.dryRunAll();
      }

      return {
        success: true,
        result: result,
        bridgeTests: bridgeTestResults,
        message: 'Dry-run completed successfully'
      };

    } catch (error) {
      const enhancedError = ToolError.from(error, {
        phase: 'dryrun',
        toolId: this.toolId,
        params: params
      });

      return {
        success: false,
        error: enhancedError.toJSON(),
        message: `Dry-run failed: ${enhancedError.message}`
      };
    }
  }

  /**
   * 执行工具
   */
  async execute(params = {}) {
    await this.ensureInitialized();
    
    // 框架应该保证调用顺序，这里只是 assert
    console.assert(this.isPrepared, '[BUG] Dependencies should be prepared before execution');

    // 在try块外声明，以便catch块能访问
    let businessErrors = [];
    let exported = null;

    try {
      // 环境变量自动检查（排除配置类操作）
      const configActions = ['configure', 'config', 'setup', 'init', 'check', 'info'];
      const isConfigAction = params.action && configActions.includes(params.action.toLowerCase());

      if (!isConfigAction && typeof this.toolInstance.getSchema === 'function') {
        const schema = this.toolInstance.getSchema();
        if (schema.environment) {
          this.logger.debug(`[ToolSandbox] Checking environment variables for ${this.toolId}`);
          // 使用已创建的 ToolAPI 实例
          const ToolAPI = require('./api/ToolAPI');
          const api = new ToolAPI(this.toolId, this.sandboxPath, this.resourceManager);
          const env = api.environment;

          const envSchema = schema.environment;
          const requiredVars = envSchema.required || [];

          for (const varName of requiredVars) {
            const value = await env.get(varName);
            if (!value) {
              const varSpec = envSchema.properties?.[varName];
              this.logger.warn(`[ToolSandbox] Missing required environment variable: ${varName}`);
              // 返回格式符合 ToolCommand 的预期
              return {
                success: false,
                error: {
                  code: 'MISSING_ENV_VAR',
                  message: `缺少必需的环境变量: ${varName}`,
                  details: {
                    missing: varName,
                    description: varSpec?.description || `请配置 ${varName}`,
                    instruction: `请使用 action: "configure" 配置环境变量，或直接编辑 ${env.envPath} 文件`,
                    envPath: env.envPath
                  }
                }
              };
            }
          }
          this.logger.debug(`[ToolSandbox] All required environment variables are configured`);
        }
      }
      
      // 使用 ToolValidator 进行参数验证
      const ToolValidator = require('./ToolValidator');
      const validation = ToolValidator.defaultValidate(this.toolInstance, params);
      if (!validation.valid) {
        this.logger.error(`[ToolSandbox] 参数验证失败:`, validation.errors);

        // 创建验证错误，通过 analyze 生成完整的错误信息（包括 solution）
        const error = new Error(validation.errors.join('; '));
        const schema = this.toolInstance.getSchema();
        const context = {
          validationResult: {
            valid: false,
            errors: validation.errors,
            missing: validation.missing,
            typeErrors: validation.typeErrors,
            enumErrors: validation.enumErrors
          },
          schema: schema,
          params: params,
          toolName: this.toolId
        };

        throw ToolError.from(error, context);
      }

      // 执行工具
      const startTime = Date.now();
      this.logger.debug(`[ToolSandbox] Executing tool with params:`, params);

      // 在完全隔离的沙箱中重新加载工具
      const script = new this.vm.Script(this.toolContent, { filename: `${this.toolId}.js` });
      const context = this.vm.createContext(this.sandboxContext);
      
      script.runInContext(context);
      exported = context.module.exports;
      
      // 创建并注入统一的 ToolAPI 实例 - 这是唯一的注入点
      const ToolAPI = require('./api/ToolAPI');
      const toolAPI = new ToolAPI(this.toolId, this.sandboxPath, this.resourceManager);
      // 设置工具实例引用，以支持Bridge功能
      toolAPI.setToolInstance(exported);
      exported.api = toolAPI;
      
      // 获取工具的BusinessErrors定义
      try {
        if (typeof exported.getBusinessErrors === 'function') {
          businessErrors = exported.getBusinessErrors() || [];
          this.logger.debug(`[ToolSandbox] Got ${businessErrors.length} business errors from tool`);
        }
      } catch (e) {
        this.logger.warn(`[ToolSandbox] Failed to get business errors:`, e.message);
      }
      
      // 执行工具的execute方法
      const result = await exported.execute(params);

      const executionTime = Date.now() - startTime;
      this.logger.debug(`[ToolSandbox] Tool execution completed in ${executionTime}ms`);

      return result;

    } catch (error) {
      // 如果已经是 ToolError，直接抛出
      if (error instanceof ToolError) {
        throw error;
      }
      
      // 使用增强的ToolError.from，传入完整context
      this.logger.error(`[ToolSandbox] Execution failed:`, error.message);
      throw ToolError.from(error, {
        phase: 'execute',
        toolId: this.toolId,
        params: params,
        businessErrors: businessErrors,  // 关键：传入BusinessErrors
        schema: this.schema,
        metadata: this.metadata,
        environment: this.environment
      });
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
    
    // 在创建 importx 之前，先将 polyfills 注入到全局
    // 这样所有通过 importx 动态加载的模块都能访问到这些 polyfills
    if (typeof global.File === 'undefined' && this.sandboxContext.File) {
      global.File = this.sandboxContext.File;
      this.logger.info('[ToolSandbox] Injected File polyfill to global');
    }
    if (typeof global.Blob === 'undefined' && this.sandboxContext.Blob) {
      global.Blob = this.sandboxContext.Blob;
      this.logger.info('[ToolSandbox] Injected Blob polyfill to global');
    }
    if (typeof global.FormData === 'undefined' && this.sandboxContext.FormData) {
      global.FormData = this.sandboxContext.FormData;
      this.logger.info('[ToolSandbox] Injected FormData polyfill to global');
    }

    // 简化的模块加载函数 - 提供基础的importx功能作为后备
    // 主要的模块加载应该通过 api.importx() 进行
    this.sandboxContext.importx = async (moduleName) => {
      this.logger.warn(`[ToolSandbox] Direct importx usage detected. Consider using api.importx() instead.`);
      
      // 创建临时的 ToolModuleImport 实例
      const ToolModuleImport = require('./module/ToolModuleImport');
      const moduleImporter = new ToolModuleImport(this.toolId, this.sandboxPath);
      
      try {
        return await moduleImporter.import(moduleName);
      } catch (error) {
        this.logger.error(`[ToolSandbox] Failed to load module ${moduleName}: ${error.message}`);
        throw new ToolError(
          `Cannot load module '${moduleName}': ${error.message}`,
          DEVELOPMENT_ERRORS.UNDECLARED_DEPENDENCY.code,
          { module: moduleName, originalError: error.message }
        );
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
    throw new ToolError(
      `Invalid tool reference format: ${toolReference}`,
      VALIDATION_ERRORS.INVALID_PARAM_FORMAT?.code || 'INVALID_PARAM',
      { toolReference }
    );
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
      throw new ToolError(
        `Failed to parse tool content: ${error.message}`,
        DEVELOPMENT_ERRORS.TOOL_SYNTAX_ERROR.code,
        { originalError: error.message }
      );
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
    const PackageInstaller = require('./PackageInstaller');
    
    // 创建package.json
    await PackageInstaller.createPackageJson(this.sandboxPath, this.toolId, this.dependencies);
    
    // 安装依赖
    await PackageInstaller.install({
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
      const fs = require('fs').promises;
      await fs.access(nodeModulesPath);
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