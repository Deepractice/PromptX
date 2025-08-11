/**
 * SandboxErrorManager - ToolSandbox智能错误管理器
 * 
 * 设计原则：
 * - 与现有ToolCommand错误体系兼容
 * - 提供Agent友好的错误信息和自动恢复建议
 * - 支持MCP协议的结构化错误响应
 * - 遵循奥卡姆剃刀原则，最简化错误处理流程
 */

class SandboxErrorManager {
  constructor() {
    this.version = '1.0.0';
  }

  /**
   * 分析原始错误并生成智能错误信息
   * @param {Error} originalError - 原始错误对象
   * @param {Object} context - 错误上下文信息
   * @param {string} context.toolId - 工具ID
   * @param {Array} context.dependencies - 声明的依赖列表
   * @param {string} context.sandboxPath - 沙箱路径
   * @param {string} context.phase - 执行阶段 (analyze|prepare|execute)
   * @returns {Object} 增强的错误信息
   */
  analyzeError(originalError, context = {}) {
    const errorType = this.classifyError(originalError, context);
    const agentInstructions = this.generateAgentInstructions(errorType, originalError, context);
    
    return {
      // 保持与ToolCommand兼容的原始信息
      originalError,
      message: originalError.message,
      
      // 增强的智能信息
      type: errorType,
      agentInstructions,
      context,
      
      // MCP友好的格式化消息
      formattedMessage: this.formatForMCP(errorType, originalError, agentInstructions, context)
    };
  }

  /**
   * 错误分类逻辑
   * @param {Error} error - 错误对象
   * @param {Object} context - 上下文信息
   * @returns {string} 错误类型
   */
  classifyError(error, context) {
    const message = error.message.toLowerCase();
    
    // 依赖缺失错误 - 最常见的问题
    if (message.includes('cannot find module')) {
      const missingModule = this.extractModuleName(error.message);
      
      // 兼容新旧格式
      let isDeclaredDependency = false;
      if (Array.isArray(context.dependencies)) {
        // 旧格式：数组
        isDeclaredDependency = context.dependencies.some(dep => 
          dep.split('@')[0] === missingModule
        );
      } else if (typeof context.dependencies === 'object' && context.dependencies) {
        // 新格式：对象
        isDeclaredDependency = Object.keys(context.dependencies).includes(missingModule);
      }
      
      if (isDeclaredDependency) {
        return 'DEPENDENCY_MISSING';
      } else {
        return 'UNDECLARED_DEPENDENCY';
      }
    }
    
    // 依赖安装失败
    if (message.includes('pnpm install failed') || 
        message.includes('dependency installation') ||
        message.includes('npm err')) {
      return 'DEPENDENCY_INSTALL_FAILED';
    }
    
    // 工具文件问题
    if (message.includes('failed to load tool') ||
        message.includes('tool does not export') ||
        message.includes('invalid tool export format')) {
      return 'TOOL_LOADING_ERROR';
    }
    
    // 参数验证错误
    if (message.includes('parameter validation failed') ||
        message.includes('missing required parameter')) {
      return 'PARAMETER_VALIDATION_ERROR';
    }
    
    // 沙箱环境错误
    if (message.includes('sandbox') || message.includes('vm')) {
      return 'SANDBOX_ENVIRONMENT_ERROR';
    }
    
    // 网络超时
    if (message.includes('timeout') || message.includes('etimedout')) {
      return 'NETWORK_TIMEOUT';
    }
    
    return 'UNKNOWN_ERROR';
  }

  /**
   * 为Agent生成智能指令
   * @param {string} errorType - 错误类型
   * @param {Error} originalError - 原始错误
   * @param {Object} context - 上下文
   * @returns {Object} Agent指令对象
   */
  generateAgentInstructions(errorType, originalError, context) {
    switch (errorType) {
      case 'DEPENDENCY_MISSING':
        return {
          action: 'AUTO_RETRY_WITH_FORCE_REINSTALL',
          autoRetryable: true,
          command: '自动重试，添加 forceReinstall: true 参数',
          explanation: '依赖已声明但未正确安装，通过强制重装可解决',
          userMessage: `检测到依赖 ${this.extractModuleName(originalError.message)} 安装不完整，正在自动重新安装...`,
          retryParameters: { forceReinstall: true }
        };
        
      case 'UNDECLARED_DEPENDENCY': {
        const missingModule = this.extractModuleName(originalError.message);
        return {
          action: 'REPORT_MISSING_DEPENDENCY',
          autoRetryable: false,
          command: '提示工具开发者添加依赖声明',
          explanation: `工具代码使用了未声明的依赖: ${missingModule}`,
          userMessage: `❌ 工具缺少依赖声明

🔧 需要在工具的 getDependencies() 方法中添加：
   '${missingModule}': 'latest'

📝 完整示例（新格式）：
   getDependencies() {
     return {
       ${context.dependencies && typeof context.dependencies === 'object' && !Array.isArray(context.dependencies) 
         ? Object.entries(context.dependencies).map(([k, v]) => `'${k}': '${v}'`).join(',\n       ') + ','
         : '// 其他依赖...'}
       '${missingModule}': 'latest'
     };
   }`,
          developerAction: `在 ${context.toolId}.tool.js 的 getDependencies() 中添加 '${missingModule}': 'latest'`
        };
      }
        
      case 'DEPENDENCY_INSTALL_FAILED':
        return {
          action: 'CHECK_NETWORK_AND_RETRY',
          autoRetryable: false,
          command: '检查网络连接，建议用户稍后重试',
          explanation: '依赖安装过程失败，可能是网络问题或包源问题',
          userMessage: `❌ 依赖安装失败

🌐 可能原因：
   • 网络连接不稳定
   • npm/pnpm 镜像源问题
   • 依赖包版本不存在

💡 建议解决方案：
   1. 检查网络连接
   2. 稍后重试（使用 forceReinstall: true）
   3. 如果持续失败，请联系开发者`,
          retryDelay: 5000
        };
        
      case 'TOOL_LOADING_ERROR':
        return {
          action: 'REPORT_TOOL_ERROR',
          autoRetryable: false,
          command: '报告工具文件问题',
          explanation: '工具代码本身存在问题，需要开发者修复',
          userMessage: `❌ 工具加载失败

🔧 工具代码问题：${originalError.message}

💡 这是工具开发问题，请联系工具作者修复`,
          developerAction: '检查工具的 module.exports 和基本语法'
        };
        
      case 'NETWORK_TIMEOUT':
        return {
          action: 'RETRY_WITH_EXTENDED_TIMEOUT',
          autoRetryable: true,
          command: '自动重试，使用更长的超时时间',
          explanation: '网络超时，使用更长超时时间重试',
          userMessage: '⏰ 网络超时，正在使用更长超时时间重试...',
          retryParameters: { timeout: 60000 } // 60秒
        };
        
      default:
        return {
          action: 'REPORT_UNKNOWN_ERROR',
          autoRetryable: false,
          command: '报告未知错误给用户',
          explanation: '未知错误类型，需要人工分析',
          userMessage: `❌ 执行失败：${originalError.message}

🤖 这是一个未分类的错误，请将此信息反馈给开发者以改进错误处理`,
          debugInfo: {
            stack: originalError.stack,
            context
          }
        };
    }
  }

  /**
   * 为MCP协议格式化错误消息
   * @param {string} errorType - 错误类型
   * @param {Error} originalError - 原始错误
   * @param {Object} agentInstructions - Agent指令
   * @param {Object} context - 上下文
   * @returns {string} MCP友好的错误消息
   */
  formatForMCP(errorType, originalError, agentInstructions, context) {
    const emoji = this.getErrorEmoji(errorType);
    const timestamp = new Date().toISOString();
    
    let message = `${emoji} ToolSandbox执行失败

🏷️ 错误类型: ${errorType}
⏰ 时间: ${timestamp}
🔧 工具: ${context.toolId || 'unknown'}
📁 阶段: ${context.phase || 'unknown'}

📋 详细信息:
${originalError.message}

🤖 AI处理建议:
${agentInstructions.userMessage || agentInstructions.explanation}`;

    // 如果可以自动重试，添加重试信息
    if (agentInstructions.autoRetryable) {
      message += `

🔄 自动恢复: ${agentInstructions.action}
⚡ 操作: ${agentInstructions.command}`;
    }

    return message;
  }

  /**
   * 从错误消息中提取模块名
   * @param {string} errorMessage - 错误消息
   * @returns {string} 模块名
   */
  extractModuleName(errorMessage) {
    const match = errorMessage.match(/Cannot (?:find|resolve) module ['\"]([^'\"]+)['\"]/);
    return match ? match[1] : 'unknown';
  }

  /**
   * 根据错误类型获取对应emoji
   * @param {string} errorType - 错误类型
   * @returns {string} emoji
   */
  getErrorEmoji(errorType) {
    const emojiMap = {
      'DEPENDENCY_MISSING': '📦',
      'UNDECLARED_DEPENDENCY': '🔍',
      'DEPENDENCY_INSTALL_FAILED': '🌐',
      'TOOL_LOADING_ERROR': '🔧',
      'PARAMETER_VALIDATION_ERROR': '📝',
      'SANDBOX_ENVIRONMENT_ERROR': '🏗️',
      'NETWORK_TIMEOUT': '⏰',
      'UNKNOWN_ERROR': '❓'
    };
    
    return emojiMap[errorType] || '❌';
  }

  /**
   * 检查错误是否可以自动恢复
   * @param {Object} intelligentError - 智能错误对象
   * @returns {boolean} 是否可自动恢复
   */
  isAutoRecoverable(intelligentError) {
    return intelligentError.agentInstructions.autoRetryable === true;
  }

  /**
   * 获取自动恢复的重试参数
   * @param {Object} intelligentError - 智能错误对象
   * @returns {Object|null} 重试参数
   */
  getRetryParameters(intelligentError) {
    return intelligentError.agentInstructions.retryParameters || null;
  }
}

module.exports = SandboxErrorManager;