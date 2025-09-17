const BasePouchCommand = require('../BasePouchCommand')
const { getGlobalResourceManager } = require('../../resource')
const ToolSandbox = require('~/toolx/ToolSandbox')
const logger = require('@promptx/logger')

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
        // 从CLI调用时，args是数组：[tool_resource, mode?, parameters?, ...options]
        logger.info('[ToolCommand] 数组参数长度:', args.length);
        logger.info('[ToolCommand] args[0]:', args[0]);
        
        toolArgs = {
          tool_resource: args[0]
        };
        
        // 解析mode和parameters
        if (args.length >= 2) {
          // 检查第二个参数是否是mode
          const validModes = ['execute', 'manual', 'configure', 'rebuild', 'log'];
          if (validModes.includes(args[1])) {
            toolArgs.mode = args[1];
            // 如果有第三个参数，它是parameters
            if (args.length >= 3) {
              let parameters = args[2];
              if (typeof parameters === 'string') {
                try {
                  parameters = JSON.parse(parameters);
                } catch (e) {
                  // 保持原样
                }
              }
              toolArgs.parameters = parameters;
            }
          } else {
            // 第二个参数是parameters（默认execute模式）
            let parameters = args[1];
            if (typeof parameters === 'string') {
              try {
                parameters = JSON.parse(parameters);
              } catch (e) {
                // 保持原样
              }
            }
            toolArgs.parameters = parameters;
          }
        }
        
        // 提取timeout
        toolArgs.timeout = this.extractTimeout(args);
        logger.info('[ToolCommand] 构建的 toolArgs:', toolArgs);
      } else {
        // 从其他方式调用时，args已经是对象格式
        toolArgs = args;
        logger.info('[ToolCommand] 直接使用对象格式参数:', toolArgs);
      }
      
      // 执行工具调用
      const result = await this.executeToolInternal(toolArgs)
      
      // 根据mode格式化不同的响应
      if (result.success) {
        const mode = result.mode || 'execute'
        
        switch(mode) {
          case 'manual':
            return `📚 工具手册

📋 工具资源: ${result.tool_resource}

${result.result.manual}

⏱️ 加载时间: ${result.metadata.execution_time_ms}ms`
          
          case 'configure':
            if (result.result.action === 'get') {
              // 显示配置状态
              const vars = result.result.variables
              const summary = result.result.summary
              let output = `🔧 环境变量配置状态

📋 工具资源: ${result.tool_resource}
📁 配置文件: ${result.result.envPath}

📊 配置摘要:
- 总计: ${summary.total} 个变量
- 已配置: ${summary.configured} 个
- 必需: ${summary.required} 个
- 缺失: ${summary.missing} 个

📝 变量详情:
`
              for (const [key, info] of Object.entries(vars)) {
                const status = info.configured ? '✅' : (info.required ? '❌' : '⭕')
                const value = info.configured ? info.value : (info.default ? `默认: ${info.default}` : '未设置')
                output += `${status} ${key}: ${value}\n   ${info.description || ''}\n`
              }
              
              return output
            } else {
              // 设置/清除操作
              return `🔧 环境变量配置

📋 工具资源: ${result.tool_resource}
✅ 操作: ${result.result.action}
📝 结果: ${result.result.message}
${result.result.configured ? `📋 已配置: ${result.result.configured.join(', ')}` : ''}

⏱️ 执行时间: ${result.metadata.execution_time_ms}ms`
            }
          
          case 'rebuild':
          case 'execute':
          default:
            // 检查工具内部执行状态
            const actualToolResult = result.result
            const isToolInternalSuccess = this.isToolInternalSuccess(actualToolResult)
            
            if (isToolInternalSuccess) {
              return `🔧 Tool${mode === 'rebuild' ? '重建并' : ''}执行成功

📋 工具资源: ${result.tool_resource}
${mode === 'rebuild' ? '♻️ 模式: 强制重建\n' : ''}📊 执行结果:
${JSON.stringify(actualToolResult, null, 2)}

⏱️ 性能指标:
- 执行时间: ${result.metadata.execution_time_ms}ms
- 时间戳: ${result.metadata.timestamp}`
            } else {
              const internalError = this.extractToolInternalError(actualToolResult)
              return this.formatToolInternalError(result.tool_resource, internalError, result.metadata)
            }
        }
      } else {
        return `❌ Tool执行失败

📋 工具资源: ${result.tool_resource}
🔧 模式: ${result.mode || 'execute'}
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
          method: 'promptx discover'
        }
      ]
    }
  }

  /**
   * 内部工具执行方法 - 支持多种执行模式
   * @param {Object} args - 命令参数
   * @param {string} args.tool_resource - 工具资源引用，格式：@tool://tool-name
   * @param {string} args.mode - 执行模式：execute/manual/configure/rebuild（默认execute）
   * @param {Object} args.parameters - 传递给工具的参数（含义根据mode不同而不同）
   * @param {number} args.timeout - 工具执行超时时间（毫秒，默认30000ms）
   * @returns {Promise<Object>} 执行结果
   */
  async executeToolInternal(args) {
    const startTime = Date.now()
    
    try {
      logger.info('[ToolCommand] executeToolInternal 接收到的 args:', JSON.stringify(args, null, 2))
      
      // 1. 参数验证
      this.validateArguments(args)
      
      const { tool_resource, mode = 'execute', parameters = {}, timeout = 30000 } = args
      
      logger.info('[ToolCommand] 执行模式 mode:', mode)
      logger.debug(`[PromptXTool] 开始执行工具: ${tool_resource}, 模式: ${mode}`)
      
      // 2. 根据mode分发到不同的处理方法
      switch(mode) {
        case 'execute':
          return await this.executeNormalMode(tool_resource, parameters, timeout, startTime)
        
        case 'manual':
          return await this.executeManualMode(tool_resource, startTime)
        
        case 'configure':
          return await this.executeConfigureMode(tool_resource, parameters, startTime)
        
        case 'rebuild':
          return await this.executeRebuildMode(tool_resource, parameters, timeout, startTime)
        
        case 'log':
          return await this.executeLogMode(tool_resource, parameters, startTime)
        
        default:
          throw new Error(`Unsupported mode: ${mode}. Supported modes: execute, manual, configure, rebuild, log`)
      }
      
    } catch (error) {
      // 格式化错误结果
      logger.error(`[PromptXTool] 工具执行失败: ${error.message}`, error)
      return this.formatErrorResult(error, args.tool_resource, startTime)
    }
  }

  /**
   * Execute模式 - 正常执行工具
   */
  async executeNormalMode(tool_resource, parameters, timeout, startTime) {
    let sandbox = null
    
    try {
      // 创建沙箱
      sandbox = new ToolSandbox(tool_resource, { timeout })
      const resourceManager = await this.getResourceManager()
      sandbox.setResourceManager(resourceManager)
      
      // 三阶段执行
      logger.debug(`[PromptXTool] Execute模式: Phase 1 - 分析工具`)
      const analysisResult = await sandbox.analyze()
      
      logger.debug(`[PromptXTool] Execute模式: Phase 2 - 准备依赖`)
      await sandbox.prepareDependencies()
      
      logger.debug(`[PromptXTool] Execute模式: Phase 3 - 执行工具`)
      const result = await sandbox.execute(parameters)
      
      return this.formatSuccessResult(result, tool_resource, startTime)
      
    } finally {
      if (sandbox) await sandbox.cleanup()
    }
  }

  /**
   * Manual模式 - 从工具接口自动生成手册
   */
  async executeManualMode(tool_resource, startTime) {
    let sandbox = null
    
    try {
      // 创建沙箱来分析工具
      sandbox = new ToolSandbox(tool_resource)
      sandbox.setResourceManager(await this.getResourceManager())
      
      // 分析工具获取接口信息
      await sandbox.analyze()
      const analysisResult = sandbox.getAnalysisResult()
      
      // 获取工具实例
      const toolInstance = sandbox.toolInstance
      if (!toolInstance) {
        throw new Error('Tool instance not found')
      }
      
      // 收集工具信息
      const manual = {
        toolId: analysisResult.toolId,
        toolReference: tool_resource,
        
        // 从getMetadata获取基础信息
        metadata: typeof toolInstance.getMetadata === 'function' ? toolInstance.getMetadata() : {},
        
        // 从getDependencies获取依赖
        dependencies: typeof toolInstance.getDependencies === 'function' ? toolInstance.getDependencies() : {},
        
        // 从getSchema获取参数定义
        schema: typeof toolInstance.getSchema === 'function' ? toolInstance.getSchema() : {},
        
        // 接口可用性
        interfaces: {
          hasExecute: typeof toolInstance.execute === 'function',
          hasValidate: typeof toolInstance.validate === 'function',
          hasInit: typeof toolInstance.init === 'function',
          hasCleanup: typeof toolInstance.cleanup === 'function',
          hasGetMetadata: typeof toolInstance.getMetadata === 'function',
          hasGetDependencies: typeof toolInstance.getDependencies === 'function',
          hasGetSchema: typeof toolInstance.getSchema === 'function'
        }
      }
      
      // 格式化为易读的手册文本
      const formattedManual = this.formatToolManual(manual)
      
      return {
        success: true,
        tool_resource: tool_resource,
        mode: 'manual',
        result: {
          manual: formattedManual,
          raw: manual,
          toolId: manual.toolId
        },
        metadata: {
          execution_time_ms: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          source: 'auto-generated'
        }
      }
    } catch (error) {
      throw error
    } finally {
      // 清理沙箱
      if (sandbox) {
        try {
          await sandbox.cleanup()
        } catch (cleanupError) {
          logger.warn(`[PromptXTool] 清理沙箱失败: ${cleanupError.message}`)
        }
      }
    }
  }
  
  /**
   * 格式化工具信息为手册文本
   */
  formatToolManual(manual) {
    const lines = []
    
    // 标题 - 优先使用name，然后是id，最后是toolId
    const displayName = manual.metadata.name || manual.metadata.id || manual.toolId
    lines.push(`# 工具手册: ${displayName}`)
    lines.push('')
    
    // 基础信息
    lines.push('## 基础信息')
    if (manual.metadata.id || manual.toolId) {
      lines.push(`**标识**: @tool://${manual.metadata.id || manual.toolId}`)
    }
    if (manual.metadata.name) {
      lines.push(`**名称**: ${manual.metadata.name}`)
    }
    if (manual.metadata.description) {
      lines.push(`**描述**: ${manual.metadata.description}`)
    }
    if (manual.metadata.version) {
      lines.push(`**版本**: ${manual.metadata.version}`)
    }
    if (manual.metadata.category) {
      lines.push(`**分类**: ${manual.metadata.category}`)
    }
    if (manual.metadata.author) {
      lines.push(`**作者**: ${manual.metadata.author}`)
    }
    if (manual.metadata.tags && manual.metadata.tags.length > 0) {
      lines.push(`**标签**: ${manual.metadata.tags.join(', ')}`)
    }
    lines.push('')
    
    // 适用场景（新增）
    if (manual.metadata.scenarios && manual.metadata.scenarios.length > 0) {
      lines.push('## 适用场景')
      manual.metadata.scenarios.forEach(scenario => {
        lines.push(`- ✅ ${scenario}`)
      })
      lines.push('')
    }
    
    // 限制说明（新增）
    if (manual.metadata.limitations && manual.metadata.limitations.length > 0) {
      lines.push('## 限制说明')
      manual.metadata.limitations.forEach(limitation => {
        lines.push(`- ❌ ${limitation}`)
      })
      lines.push('')
    }
    
    // 环境变量
    if (manual.metadata.envVars && manual.metadata.envVars.length > 0) {
      lines.push('## 环境变量')
      lines.push('| 名称 | 必需 | 默认值 | 描述 |')
      lines.push('|------|------|--------|------|')
      manual.metadata.envVars.forEach(v => {
        const required = v.required ? '✅' : '❌'
        const defaultVal = v.default || '-'
        lines.push(`| ${v.name} | ${required} | ${defaultVal} | ${v.description || ''} |`)
      })
      lines.push('')
    }
    
    // 依赖
    if (Object.keys(manual.dependencies).length > 0) {
      lines.push('## 依赖包')
      lines.push('| 包名 | 版本 |')
      lines.push('|------|------|')
      Object.entries(manual.dependencies).forEach(([name, version]) => {
        lines.push(`| ${name} | ${version} |`)
      })
      lines.push('')
    }
    
    // 参数Schema
    if (manual.schema.properties && Object.keys(manual.schema.properties).length > 0) {
      lines.push('## 参数定义')
      lines.push('| 参数 | 类型 | 必需 | 描述 |')
      lines.push('|------|------|------|------|')
      
      const required = manual.schema.required || []
      Object.entries(manual.schema.properties).forEach(([key, prop]) => {
        const isRequired = required.includes(key) ? '✅' : '❌'
        const type = prop.type || 'any'
        const desc = prop.description || ''
        lines.push(`| ${key} | ${type} | ${isRequired} | ${desc} |`)
      })
      lines.push('')
    }
    
    // 接口信息
    lines.push('## 接口实现')
    lines.push('| 接口 | 已实现 |')
    lines.push('|------|--------|')
    Object.entries(manual.interfaces).forEach(([key, value]) => {
      const impl = value ? '✅' : '❌'
      const name = key.replace('has', '')
      lines.push(`| ${name} | ${impl} |`)
    })
    lines.push('')
    
    // 使用示例
    lines.push('## 使用示例')
    lines.push('```javascript')
    lines.push(`// 执行工具`)
    lines.push(`{tool_resource: '${manual.toolReference}', mode: 'execute', parameters: {...}}`)
    lines.push('')
    if (manual.metadata.envVars && manual.metadata.envVars.length > 0) {
      lines.push(`// 配置环境变量`)
      lines.push(`{tool_resource: '${manual.toolReference}', mode: 'configure', parameters: {KEY: 'value'}}`)
      lines.push('')
    }
    lines.push(`// 查看日志`)
    lines.push(`{tool_resource: '${manual.toolReference}', mode: 'log', parameters: {action: 'tail'}}`)
    lines.push('```')
    
    return lines.join('\n')
  }

  /**
   * Configure模式 - 配置环境变量
   */
  async executeConfigureMode(tool_resource, parameters, startTime) {
    let sandbox = null
    
    try {
      // 创建沙箱（只需要analyze阶段）
      sandbox = new ToolSandbox(tool_resource)
      const resourceManager = await this.getResourceManager()
      sandbox.setResourceManager(resourceManager)
      
      // 只执行分析阶段获取toolId和路径
      logger.debug(`[PromptXTool] Configure模式: 分析工具`)
      await sandbox.analyze()
      
      // 调用沙箱的配置方法
      const result = await sandbox.configureEnvironment(parameters)
      
      return {
        success: true,
        tool_resource: tool_resource,
        mode: 'configure',
        result: result,
        metadata: {
          execution_time_ms: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      }
      
    } finally {
      if (sandbox) await sandbox.cleanup()
    }
  }

  /**
   * Rebuild模式 - 强制重建后执行
   */
  async executeRebuildMode(tool_resource, parameters, timeout, startTime) {
    let sandbox = null
    
    try {
      // 创建沙箱，设置rebuild标志
      sandbox = new ToolSandbox(tool_resource, { timeout, rebuild: true })
      const resourceManager = await this.getResourceManager()
      sandbox.setResourceManager(resourceManager)
      
      // 先清理旧沙箱
      logger.debug(`[PromptXTool] Rebuild模式: 清理旧沙箱`)
      await sandbox.clearSandbox(true)  // true表示删除目录
      
      // 重新执行三阶段
      logger.debug(`[PromptXTool] Rebuild模式: Phase 1 - 分析工具`)
      const analysisResult = await sandbox.analyze()
      
      logger.debug(`[PromptXTool] Rebuild模式: Phase 2 - 准备依赖（强制重装）`)
      await sandbox.prepareDependencies()
      
      logger.debug(`[PromptXTool] Rebuild模式: Phase 3 - 执行工具`)
      const result = await sandbox.execute(parameters)
      
      return this.formatSuccessResult(result, tool_resource, startTime)
      
    } finally {
      if (sandbox) await sandbox.cleanup()
    }
  }

  /**
   * Log模式 - 查询工具执行日志
   */
  async executeLogMode(tool_resource, parameters, startTime) {
    let sandbox = null
    
    try {
      // 创建沙箱（不需要执行，只需要查询日志）
      sandbox = new ToolSandbox(tool_resource)
      const resourceManager = await this.getResourceManager()
      sandbox.setResourceManager(resourceManager)
      
      // 只需要分析工具以获取toolId和sandboxPath
      logger.debug(`[PromptXTool] Log模式: 分析工具以获取日志路径`)
      await sandbox.analyze()
      
      // 查询日志
      logger.debug(`[PromptXTool] Log模式: 查询日志，参数:`, parameters)
      const result = await sandbox.queryLogs(parameters)
      
      return this.formatSuccessResult(result, tool_resource, startTime)
      
    } finally {
      if (sandbox) await sandbox.cleanup()
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

    // mode参数验证
    if (args.mode) {
      const validModes = ['execute', 'manual', 'configure', 'rebuild', 'log']
      if (!validModes.includes(args.mode)) {
        throw new Error(`Invalid mode: ${args.mode}. Valid modes are: ${validModes.join(', ')}`)
      }
    }

    // parameters验证根据mode不同而不同
    if (args.mode === 'execute' || args.mode === 'rebuild' || !args.mode) {
      // execute和rebuild模式需要parameters是对象
      if (args.parameters !== undefined && typeof args.parameters !== 'object') {
        throw new Error('Parameters must be an object for execute/rebuild mode')
      }
    }
    // manual模式不需要parameters
    // configure模式parameters可选（为空时查看配置）
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