const BasePouchCommand = require('../BasePouchCommand')
const { getGlobalResourceManager } = require('../../resource')
const ToolSandbox = require('../../../tool/ToolSandbox')
const logger = require('../../../utils/logger')

/**
 * Tool命令处理器
 * 实现promptx_tool MCP工具，执行通过@tool协议声明的工具
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
      // 处理参数：如果是数组，取第一个元素；否则直接使用
      const toolArgs = Array.isArray(args) ? args[0] : args
      
      // 执行工具调用
      const result = await this.executeToolInternal(toolArgs)
      
      // 格式化响应
      if (result.success) {
        return `🔧 Tool执行成功

📋 工具资源: ${result.tool_resource}
📊 执行结果:
${JSON.stringify(result.result, null, 2)}

⏱️ 性能指标:
- 执行时间: ${result.metadata.execution_time_ms}ms
- 时间戳: ${result.metadata.timestamp}
- 版本: ${result.metadata.version}`
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
   * @param {boolean} args.forceReinstall - 是否强制重新安装工具依赖（默认false）
   * @param {number} args.timeout - 工具执行超时时间（毫秒，默认30000ms）
   * @returns {Promise<Object>} 执行结果
   */
  async executeToolInternal(args) {
    const startTime = Date.now()
    let sandbox = null
    
    try {
      // 1. 参数验证
      this.validateArguments(args)
      
      const { tool_resource, parameters, forceReinstall = false, timeout = 30000 } = args
      
      logger.debug(`[PromptXTool] 开始执行工具: ${tool_resource}`)
      
      // 2. 构建沙箱选项并创建ToolSandbox实例
      const sandboxOptions = { forceReinstall, timeout }
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
      const result = await sandbox.execute(parameters)
      
      // 5. 格式化成功结果 
      return this.formatSuccessResult(result, tool_resource, startTime)
      
    } catch (error) {
      // 6. 格式化错误结果
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
   * 格式化错误结果 - 适配ToolSandbox错误格式
   * @param {Error} error - 错误对象
   * @param {string} toolResource - 工具资源引用（可能为空）
   * @param {number} startTime - 开始时间
   * @returns {Object} 格式化的错误结果
   */
  formatErrorResult(error, toolResource, startTime) {
    const duration = Date.now() - startTime
    const executionId = this.generateExecutionId()
    
    return {
      success: false,
      tool_resource: toolResource || 'unknown',
      error: {
        code: this.getErrorCode(error),
        message: error.message,
        details: {
          executionId: executionId,
          executionTime: `${duration}ms`,
          stack: error.stack
        }
      },
      metadata: {
        executor: 'ToolSandbox',
        timestamp: new Date().toISOString()
      }
    }
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
   * 获取工具命令的元信息 - ToolSandbox版本
   * @returns {Object} 命令元信息
   */
  getMetadata() {
    return {
      name: 'promptx_tool',
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