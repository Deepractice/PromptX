const BasePouchCommand = require('../BasePouchCommand')
const { getGlobalResourceManager } = require('../../resource')
const ToolSandbox = require('../../../tool/ToolSandbox')
const logger = require('../../../utils/logger')

/**
 * Tool命令处理器
 * 实现toolx MCP工具，执行通过@tool协议声明的工具
 */
class ToolCommand extends BasePouchCommand {
  constructor() {
    super()
    this.resourceManager = null
  }

  /**
   * 获取或初始化ResourceManager
   */
  async getResourceManager() {
    if (!this.resourceManager) {
      this.resourceManager = getGlobalResourceManager()
      // 确保ResourceManager已初始化
      if (!this.resourceManager.initialized) {
        await this.resourceManager.initializeWithNewArchitecture()
      }
    }
    return this.resourceManager
  }

  // BasePouchCommand的抽象方法实现
  getPurpose() {
    return '执行通过@tool协议声明的JavaScript工具'
  }

  async getContent(args) {
    try {
      // 处理参数：如果是数组格式，需要转换为对象格式
      let toolArgs;
      logger.info('[ToolCommand] getContent 接收到的 args:', args);
      logger.info('[ToolCommand] args 类型:', Array.isArray(args) ? 'Array' : typeof args);
      
      if (Array.isArray(args)) {
        // 从CLI调用时，args是数组：[tool_resource, parameters, ...options]
        logger.info('[ToolCommand] 数组参数长度:', args.length);
        logger.info('[ToolCommand] args[0]:', args[0]);
        logger.info('[ToolCommand] args[1] 类型:', typeof args[1]);
        logger.info('[ToolCommand] args[1] 值:', args[1]);
        
        if (args.length >= 2) {
          // 如果 parameters 是 JSON 字符串，解析它
          let parameters = args[1];
          if (typeof parameters === 'string') {
            logger.info('[ToolCommand] 尝试解析 JSON 字符串参数');
            try {
              parameters = JSON.parse(parameters);
              logger.info('[ToolCommand] JSON 解析成功:', parameters);
            } catch (e) {
              logger.warn('[ToolCommand] JSON 解析失败，保持原样:', e.message);
              // 如果解析失败，保持原样（可能是其他格式的字符串参数）
            }
          }
          
          toolArgs = {
            tool_resource: args[0],
            parameters: parameters,
            rebuild: args.includes('--rebuild'),
            timeout: this.extractTimeout(args)
          };
          logger.info('[ToolCommand] 构建的 toolArgs:', toolArgs);
        } else {
          throw new Error('Invalid arguments: expected [tool_resource, parameters]');
        }
      } else {
        // 从其他方式调用时，args已经是对象格式
        toolArgs = args;
        logger.info('[ToolCommand] 直接使用对象格式参数:', toolArgs);
      }
      
      // 执行工具调用
      const result = await this.executeToolInternal(toolArgs)
      
      // 格式化响应 - 检查工具内部执行状态
      if (result.success) {
        // 检查工具内部是否也成功
        const actualToolResult = result.result
        console.log('[DEBUG] actualToolResult structure:', JSON.stringify(actualToolResult, null, 2))
        const isToolInternalSuccess = this.isToolInternalSuccess(actualToolResult)
        console.log('[DEBUG] isToolInternalSuccess result:', isToolInternalSuccess)
        
        if (isToolInternalSuccess) {
          return `🔧 Tool执行成功

📋 工具资源: ${result.tool_resource}
📊 执行结果:
${JSON.stringify(actualToolResult, null, 2)}

⏱️ 性能指标:
- 执行时间: ${result.metadata.execution_time_ms}ms
- 时间戳: ${result.metadata.timestamp}
- 版本: ${result.metadata.version}`
        } else {
          // ToolSandbox成功，但工具内部失败
          const internalError = this.extractToolInternalError(actualToolResult)
          return this.formatToolInternalError(result.tool_resource, internalError, result.metadata)
        }
      } else {
        return `❌ Tool执行失败

📋 工具资源: ${result.tool_resource}
❌ 错误信息: ${result.error.message}
🏷️ 错误类型: ${result.error.type}
🔢 错误代码: ${result.error.code}

⏱️ 执行时间: ${result.metadata.execution_time_ms}ms`
      }
    } catch (error) {
      return `❌ Tool执行异常

错误详情: ${error.message}

💡 请检查:
1. 工具资源引用格式是否正确 (@tool://tool-name)
2. 工具参数是否有效
3. 工具文件是否存在并可执行`
    }
  }

  getPATEOAS(args) {
    return {
      currentState: 'tool_executed',
      nextActions: [
        {
          action: 'execute_another_tool',
          description: '执行其他工具',
          method: 'promptx tool'
        },
        {
          action: 'view_available_tools', 
          description: '查看可用工具',
          method: 'promptx welcome'
        }
      ]
    }
  }

  /**
   * 内部工具执行方法 - 使用ToolSandbox三阶段执行流程
   * @param {Object} args - 命令参数
   * @param {string} args.tool_resource - 工具资源引用，格式：@tool://tool-name
   * @param {Object} args.parameters - 传递给工具的参数
   * @param {boolean} args.rebuild - 是否强制重建沙箱（默认false）
   * @param {number} args.timeout - 工具执行超时时间（毫秒，默认30000ms）
   * @returns {Promise<Object>} 执行结果
   */
  async executeToolInternal(args) {
    const startTime = Date.now()
    let sandbox = null
    
    try {
      logger.info('[ToolCommand] executeToolInternal 接收到的 args:', JSON.stringify(args, null, 2))
      
      // 1. 参数验证
      this.validateArguments(args)
      
      const { tool_resource, parameters, rebuild = false, timeout = 30000 } = args
      
      logger.info('[ToolCommand] 解构后的 parameters:', JSON.stringify(parameters, null, 2))
      logger.info('[ToolCommand] parameters 类型:', typeof parameters)
      logger.debug(`[PromptXTool] 开始执行工具: ${tool_resource}`)
      
      // 2. 构建沙箱选项并创建ToolSandbox实例
      const sandboxOptions = { rebuild, timeout }
      logger.debug(`[PromptXTool] 沙箱选项:`, sandboxOptions)
      sandbox = new ToolSandbox(tool_resource, sandboxOptions)
      
      // 3. 设置ResourceManager
      const resourceManager = await this.getResourceManager()
      sandbox.setResourceManager(resourceManager)
      
      // 4. ToolSandbox三阶段执行流程
      logger.debug(`[PromptXTool] Phase 1: 分析工具`)
      const analysisResult = await sandbox.analyze()
      
      logger.debug(`[PromptXTool] Phase 2: 准备依赖`, { dependencies: analysisResult.dependencies })
      await sandbox.prepareDependencies()
      
      logger.debug(`[PromptXTool] Phase 3: 执行工具`)
      logger.info('[ToolCommand] 传递给 sandbox.execute 的 parameters:', JSON.stringify(parameters, null, 2))
      logger.info('[ToolCommand] parameters 的类型:', typeof parameters)
      const result = await sandbox.execute(parameters)
      
      // 5. 格式化成功结果 
      return this.formatSuccessResult(result, tool_resource, startTime)
      
    } catch (error) {
      // 6. 智能错误处理 - 检查是否可以自动重试
      if (error.intelligentError && this.isAutoRetryable(error.intelligentError)) {
        logger.info(`[PromptXTool] 检测到可自动恢复错误，尝试自动重试: ${error.intelligentError.type}`)
        
        try {
          // 清理当前沙箱
          await sandbox.cleanup()
          
          // 使用重试参数重新创建沙箱
          const retryParameters = error.intelligentError.agentInstructions.retryParameters
          const retryArgs = { ...args, ...retryParameters }
          
          logger.debug(`[PromptXTool] 自动重试参数:`, retryArgs)
          
          // 递归调用（但限制重试次数）
          if (!args._retryCount) args._retryCount = 0
          if (args._retryCount < 1) { // 最多重试1次
            retryArgs._retryCount = args._retryCount + 1
            logger.info(`[PromptXTool] 开始自动重试 (${retryArgs._retryCount}/1)`)
            return await this.executeToolInternal(retryArgs)
          } else {
            logger.warn(`[PromptXTool] 已达到最大重试次数，停止重试`)
          }
        } catch (retryError) {
          logger.error(`[PromptXTool] 自动重试失败: ${retryError.message}`)
          // 使用重试错误而不是原始错误
          error = retryError
        }
      }
      
      // 7. 格式化错误结果  
      logger.error(`[PromptXTool] 工具执行失败: ${error.message}`, error)
      return this.formatErrorResult(error, args.tool_resource, startTime)
    } finally {
      // 7. 清理沙箱资源
      if (sandbox) {
        try {
          await sandbox.cleanup()
        } catch (cleanupError) {
          logger.warn(`[PromptXTool] 沙箱清理失败: ${cleanupError.message}`)
        }
      }
    }
  }

  /**
   * 验证命令参数
   * @param {Object} args - 命令参数
   */
  validateArguments(args) {
    if (!args) {
      throw new Error('Missing arguments')
    }

    if (!args.tool_resource) {
      throw new Error('Missing required parameter: tool_resource')
    }

    if (!args.tool_resource.startsWith('@tool://')) {
      throw new Error('Invalid tool_resource format. Must start with @tool://')
    }

    if (!args.parameters || typeof args.parameters !== 'object') {
      throw new Error('Missing or invalid parameters. Must be an object')
    }
  }

  /**
   * 格式化成功结果 - 适配ToolSandbox返回格式
   * @param {*} result - 工具执行结果
   * @param {string} toolResource - 工具资源引用
   * @param {number} startTime - 开始时间
   * @returns {Object} 格式化的成功结果
   */
  formatSuccessResult(result, toolResource, startTime) {
    const duration = Date.now() - startTime
    
    return {
      success: true,
      tool_resource: toolResource,
      result: result, // ToolSandbox直接返回工具结果
      metadata: {
        executor: 'ToolSandbox',
        execution_time_ms: duration,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    }
  }

  /**
   * 格式化错误结果 - 适配ToolSandbox智能错误格式
   * @param {Error} error - 错误对象
   * @param {string} toolResource - 工具资源引用（可能为空）
   * @param {number} startTime - 开始时间
   * @returns {Object} 格式化的错误结果
   */
  formatErrorResult(error, toolResource, startTime) {
    const duration = Date.now() - startTime
    const executionId = this.generateExecutionId()
    
    // 检查是否为智能错误
    let errorCode, errorMessage, errorType = 'UNKNOWN_ERROR'
    let agentInstructions = null
    
    if (error.intelligentError) {
      // 使用智能错误管理器提供的信息
      errorType = error.intelligentError.type
      errorCode = this.mapIntelligentErrorToCode(errorType)
      errorMessage = error.intelligentError.formattedMessage
      agentInstructions = error.intelligentError.agentInstructions
    } else {
      // 回退到传统错误处理
      errorCode = this.getErrorCode(error)
      errorMessage = error.message
    }
    
    const result = {
      success: false,
      tool_resource: toolResource || 'unknown',
      error: {
        code: errorCode,
        type: errorType,
        message: errorMessage,
        details: {
          executionId: executionId,
          executionTime: `${duration}ms`,
          stack: error.stack
        }
      },
      metadata: {
        executor: 'ToolSandbox',
        timestamp: new Date().toISOString(),
        execution_time_ms: duration
      }
    }
    
    // 如果有Agent指令，添加到metadata中
    if (agentInstructions) {
      result.metadata.agentInstructions = agentInstructions
    }
    
    return result
  }

  /**
   * 将智能错误类型映射到传统错误代码
   * @param {string} intelligentErrorType - 智能错误类型
   * @returns {string} 错误代码
   */
  mapIntelligentErrorToCode(intelligentErrorType) {
    const mapping = {
      'DEPENDENCY_MISSING': 'DEPENDENCY_ERROR',
      'UNDECLARED_DEPENDENCY': 'DEPENDENCY_ERROR', 
      'DEPENDENCY_INSTALL_FAILED': 'DEPENDENCY_ERROR',
      'TOOL_LOADING_ERROR': 'ANALYSIS_ERROR',
      'PARAMETER_VALIDATION_ERROR': 'VALIDATION_ERROR',
      'SANDBOX_ENVIRONMENT_ERROR': 'EXECUTION_ERROR',
      'NETWORK_TIMEOUT': 'EXECUTION_TIMEOUT',
      'UNKNOWN_ERROR': 'UNKNOWN_ERROR'
    }
    
    return mapping[intelligentErrorType] || 'UNKNOWN_ERROR'
  }

  /**
   * 根据错误类型获取错误代码 - 增强支持ToolSandbox错误
   * @param {Error} error - 错误对象
   * @returns {string} 错误代码
   */
  getErrorCode(error) {
    const message = error.message.toLowerCase()
    
    // ToolSandbox特有错误
    if (message.includes('analyze') || message.includes('analysis')) {
      return 'ANALYSIS_ERROR'
    }
    if (message.includes('dependencies') || message.includes('pnpm')) {
      return 'DEPENDENCY_ERROR'
    }
    if (message.includes('sandbox') || message.includes('execution')) {
      return 'EXECUTION_ERROR'
    }
    if (message.includes('validation') || message.includes('validate')) {
      return 'VALIDATION_ERROR'
    }
    
    // 通用错误
    if (message.includes('not found')) {
      return 'TOOL_NOT_FOUND'
    }
    if (message.includes('invalid tool_resource format')) {
      return 'INVALID_TOOL_RESOURCE'
    }
    if (message.includes('missing')) {
      return 'MISSING_PARAMETER'
    }
    if (message.includes('syntax')) {
      return 'TOOL_SYNTAX_ERROR'
    }
    if (message.includes('timeout')) {
      return 'EXECUTION_TIMEOUT'
    }
    
    return 'UNKNOWN_ERROR'
  }

  /**
   * 生成执行ID
   * @returns {string} 唯一的执行ID
   */
  generateExecutionId() {
    return `tool_exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 从参数数组中提取timeout值
   * @param {Array} args - 参数数组
   * @returns {number|undefined} timeout值
   */
  extractTimeout(args) {
    const timeoutIndex = args.indexOf('--timeout');
    if (timeoutIndex !== -1 && timeoutIndex < args.length - 1) {
      const timeout = parseInt(args[timeoutIndex + 1]);
      return isNaN(timeout) ? undefined : timeout;
    }
    return undefined;
  }

  /**
   * 检查智能错误是否可以自动重试
   * @param {Object} intelligentError - 智能错误对象
   * @returns {boolean} 是否可自动重试
   */
  isAutoRetryable(intelligentError) {
    return intelligentError.agentInstructions && 
           intelligentError.agentInstructions.autoRetryable === true &&
           intelligentError.agentInstructions.retryParameters
  }

  /**
   * 检查工具内部执行是否成功
   * @param {*} toolResult - 工具返回的结果
   * @returns {boolean} 工具内部是否成功
   */
  isToolInternalSuccess(toolResult) {
    // 优先检查是否有data字段，这可能是ToolSandbox包装的结果
    if (toolResult && typeof toolResult === 'object' && toolResult.data) {
      // 如果data是对象且包含success字段，检查data的success
      if (typeof toolResult.data === 'object' && 'success' in toolResult.data) {
        return toolResult.data.success === true
      }
    }
    
    // 检查顶层success字段
    if (toolResult && typeof toolResult === 'object' && 'success' in toolResult) {
      return toolResult.success === true
    }
    
    // 如果工具返回结果不包含success字段，认为是成功的（兼容旧工具）
    return true
  }

  /**
   * 从工具内部结果中提取错误信息
   * @param {*} toolResult - 工具返回的结果
   * @returns {Object} 错误信息
   */
  extractToolInternalError(toolResult) {
    // 优先从data字段中提取错误信息
    if (toolResult && typeof toolResult === 'object' && toolResult.data && 
        typeof toolResult.data === 'object' && toolResult.data.error) {
      return {
        code: toolResult.data.error.code || 'TOOL_INTERNAL_ERROR',
        message: toolResult.data.error.message || '工具内部执行失败',
        details: toolResult.data.error.details || toolResult.data.error
      }
    }
    
    // 检查顶层错误信息
    if (toolResult && typeof toolResult === 'object' && toolResult.error) {
      return {
        code: toolResult.error.code || 'TOOL_INTERNAL_ERROR',
        message: toolResult.error.message || '工具内部执行失败',
        details: toolResult.error.details || toolResult.error
      }
    }
    
    return {
      code: 'TOOL_INTERNAL_ERROR',
      message: '工具内部执行失败，但未提供错误详情',
      details: JSON.stringify(toolResult)
    }
  }

  /**
   * 格式化工具内部错误
   * @param {string} toolResource - 工具资源
   * @param {Object} internalError - 内部错误信息
   * @param {Object} metadata - 元数据
   * @returns {string} 格式化的错误信息
   */
  formatToolInternalError(toolResource, internalError, metadata) {
    // 尝试应用智能错误分析
    const intelligentError = this.analyzeToolInternalError(internalError, toolResource)
    
    return `❌ Tool内部执行失败

📋 工具资源: ${toolResource}
❌ 错误信息: ${intelligentError.message}
🏷️ 错误类型: ${intelligentError.type}
🔢 错误代码: ${intelligentError.code}

💡 智能建议:
${intelligentError.suggestion}

⏱️ 执行时间: ${metadata.execution_time_ms}ms`
  }

  /**
   * 分析工具内部错误并提供智能建议
   * @param {Object} internalError - 内部错误
   * @param {string} toolResource - 工具资源
   * @returns {Object} 智能分析结果
   */
  analyzeToolInternalError(internalError, toolResource) {
    const message = internalError.message.toLowerCase()
    const details = internalError.details || ''
    
    // 依赖相关错误
    if (message.includes('is not a function') || message.includes('cannot find module')) {
      return {
        code: 'DEPENDENCY_ERROR',
        type: 'DEPENDENCY_USAGE_ERROR',
        message: internalError.message,
        suggestion: `🔧 依赖使用错误：
• 检查依赖的正确用法
• 确认依赖版本兼容性
• 可能需要使用 "rebuild": true 重建沙箱

💡 建议操作：
toolx ${toolResource} {"rebuild": true, ...其他参数}`
      }
    }
    
    // 参数验证错误
    if (message.includes('validation') || message.includes('parameter')) {
      return {
        code: 'PARAMETER_ERROR',
        type: 'PARAMETER_VALIDATION_ERROR', 
        message: internalError.message,
        suggestion: `📝 参数错误：
• 检查传入的参数格式和类型
• 确认必需参数是否缺失
• 参考工具的schema定义`
      }
    }
    
    // 网络或外部服务错误
    if (message.includes('timeout') || message.includes('network') || message.includes('fetch')) {
      return {
        code: 'NETWORK_ERROR',
        type: 'EXTERNAL_SERVICE_ERROR',
        message: internalError.message,
        suggestion: `🌐 网络服务错误：
• 检查网络连接状态
• 确认外部API服务可用性
• 稍后重试可能解决问题`
      }
    }
    
    // 默认分析
    return {
      code: internalError.code || 'TOOL_INTERNAL_ERROR',
      type: 'UNKNOWN_TOOL_ERROR',
      message: internalError.message,
      suggestion: `🔧 工具内部错误：
• 这可能是工具代码的逻辑问题
• 检查工具的实现是否正确
• 如果问题持续，请联系工具开发者

🐛 错误详情：
${typeof details === 'string' ? details : JSON.stringify(details, null, 2)}`
    }
  }

  /**
   * 获取工具命令的元信息 - ToolSandbox版本
   * @returns {Object} 命令元信息
   */
  getMetadata() {
    return {
      name: 'toolx',
      description: '使用ToolSandbox执行通过@tool协议声明的工具',
      version: '2.0.0',
      author: 'PromptX Framework',
      executor: 'ToolSandbox',
      supports: {
        protocols: ['@tool://'],
        formats: ['.tool.js'],
        features: [
          'ToolSandbox沙箱执行',
          '自动依赖管理',
          '三阶段执行流程',
          'pnpm依赖安装',
          '参数验证',
          '错误处理',
          '执行监控',
          '资源清理'
        ]
      }
    }
  }
}

module.exports = ToolCommand