/**
 * ToolErrorManager - PromptX 工具错误管理器 v2.0
 * 
 * 统一的错误处理中心，负责：
 * 1. 识别错误类型（DEVELOPMENT/VALIDATION/BUSINESS/SYSTEM）
 * 2. 生成结构化错误信息
 * 3. 提供解决方案和自动恢复建议
 * 4. 支持工具自定义的业务错误
 */

const logger = require('@promptx/logger');
const { 
  ERROR_CATEGORIES,
  DEVELOPMENT_ERRORS,
  VALIDATION_ERRORS,
  SYSTEM_ERRORS,
  validateAgainstSchema,
  checkMissingEnvVars
} = require('./index');

class ToolErrorManager {
  constructor() {
    this.version = '2.0.0';
    this.categories = ERROR_CATEGORIES;
    this.developmentErrors = DEVELOPMENT_ERRORS;
    this.validationErrors = VALIDATION_ERRORS;
    this.systemErrors = SYSTEM_ERRORS;
  }

  /**
   * 分析错误并返回结构化信息
   * @param {Error} originalError - 原始错误对象
   * @param {Object} context - 错误上下文
   * @param {string} context.phase - 执行阶段
   * @param {string} context.toolId - 工具ID
   * @param {Object} context.params - 执行参数
   * @param {Object} context.schema - 参数schema
   * @param {Object} context.metadata - 工具元数据
   * @param {Object} context.dependencies - 工具依赖
   * @param {Array} context.businessErrors - 工具定义的业务错误
   * @returns {Object} 结构化错误信息
   */
  analyzeError(originalError, context = {}) {
    let errorInfo = null;
    
    // 1. 先进行验证检查（基于schema和metadata）
    errorInfo = this.checkValidationError(originalError, context);
    if (errorInfo) {
      return this.buildErrorResponse(errorInfo, originalError, context);
    }
    
    // 2. 检查开发错误
    errorInfo = this.checkDevelopmentError(originalError, context);
    if (errorInfo) {
      return this.buildErrorResponse(errorInfo, originalError, context);
    }
    
    // 3. 检查业务错误（工具自定义）
    if (context.businessErrors && context.businessErrors.length > 0) {
      errorInfo = this.checkBusinessError(originalError, context.businessErrors, context);
      if (errorInfo) {
        return this.buildErrorResponse(errorInfo, originalError, context);
      }
    }
    
    // 4. 检查系统错误
    errorInfo = this.checkSystemError(originalError, context);
    if (errorInfo) {
      return this.buildErrorResponse(errorInfo, originalError, context);
    }
    
    // 5. 未知错误
    return this.buildErrorResponse(
      this.systemErrors.UNKNOWN_ERROR,
      originalError,
      context
    );
  }

  /**
   * 检查验证错误
   */
  checkValidationError(error, context) {
    // 基于 schema 验证参数
    if (context.schema && context.params) {
      const validation = validateAgainstSchema(context.params, context.schema);
      if (!validation.valid) {
        // 根据验证结果找到对应的错误类型
        context.validationResult = validation;
        
        if (validation.missing && validation.missing.length > 0) {
          return this.validationErrors.MISSING_REQUIRED_PARAM;
        }
        if (validation.typeErrors && validation.typeErrors.length > 0) {
          return this.validationErrors.INVALID_PARAM_TYPE;
        }
        
        return this.validationErrors.SCHEMA_VALIDATION_FAILED;
      }
    }
    
    // 基于 metadata.envVars 检查环境变量
    if (context.metadata && context.metadata.envVars && context.environment) {
      const missing = checkMissingEnvVars(context.metadata.envVars, context.environment);
      if (missing.length > 0) {
        context.missingEnvVars = missing;
        return this.validationErrors.MISSING_ENV_VAR;
      }
    }
    
    // 检查其他验证错误
    for (const errorDef of Object.values(this.validationErrors)) {
      if (this.matchError(error, errorDef, context)) {
        return errorDef;
      }
    }
    
    return null;
  }

  /**
   * 检查开发错误
   */
  checkDevelopmentError(error, context) {
    for (const errorDef of Object.values(this.developmentErrors)) {
      if (this.matchError(error, errorDef, context)) {
        return errorDef;
      }
    }
    return null;
  }

  /**
   * 检查业务错误（工具自定义）
   */
  checkBusinessError(error, businessErrors, context) {
    for (const bizError of businessErrors) {
      if (this.isErrorMatch(error, bizError.match || bizError.identify, context)) {
        // 转换为标准格式
        return {
          category: 'BUSINESS',
          code: bizError.code,
          description: bizError.description,
          getSolution: () => {
            if (typeof bizError.solution === 'string') {
              return { message: bizError.solution };
            }
            return bizError.solution;
          },
          source: 'tool-defined'
        };
      }
    }
    return null;
  }

  /**
   * 检查系统错误
   */
  checkSystemError(error, context) {
    for (const errorDef of Object.values(this.systemErrors)) {
      if (this.matchError(error, errorDef, context)) {
        return errorDef;
      }
    }
    return null;
  }

  /**
   * 匹配错误
   */
  matchError(error, errorDef, context) {
    if (typeof errorDef.identify === 'function') {
      return errorDef.identify(error, context);
    }
    return false;
  }

  /**
   * 通用错误匹配（支持字符串、正则、函数）
   */
  isErrorMatch(error, matcher, context) {
    if (!matcher) return false;
    
    if (typeof matcher === 'string') {
      // 字符串：简单包含匹配
      return error.message.includes(matcher);
    } else if (matcher instanceof RegExp) {
      // 正则：正则匹配
      return matcher.test(error.message);
    } else if (typeof matcher === 'function') {
      // 函数：自定义逻辑
      return matcher(error, context);
    }
    
    return false;
  }

  /**
   * 构建错误响应
   */
  buildErrorResponse(errorDef, originalError, context) {
    const category = this.categories[errorDef.category];
    const solution = errorDef.getSolution ? 
      errorDef.getSolution(originalError, context) : 
      { message: '请检查错误详情' };
    
    // 替换解决方案中的模板变量
    if (solution.message) {
      solution.message = this.replaceTemplateVars(solution.message, originalError, context);
    }
    
    const response = {
      // 错误分类信息
      category: errorDef.category,
      categoryInfo: category,
      
      // 错误详情
      code: errorDef.code,
      description: errorDef.description,
      message: originalError.message,
      
      // 解决方案
      solution: solution,
      autoRecoverable: solution.autoRecoverable || false,
      
      // 上下文信息
      context: {
        phase: context.phase,
        toolId: context.toolId,
        timestamp: new Date().toISOString()
      },
      
      // 调试信息（仅在开发环境）
      debug: process.env.NODE_ENV === 'development' ? {
        stack: originalError.stack,
        fullContext: context
      } : undefined,
      
      // 格式化输出
      formatted: this.formatError(category, errorDef, solution, originalError, context)
    };
    
    // 记录错误日志
    this.logError(response);
    
    return response;
  }

  /**
   * 替换模板变量
   */
  replaceTemplateVars(template, error, context) {
    return template
      .replace(/{module}/g, this.extractModuleName(error.message))
      .replace(/{filepath}/g, context.params?.filepath || 'unknown')
      .replace(/{envVar}/g, context.missingEnvVars?.[0] || 'unknown')
      .replace(/{toolId}/g, context.toolId || 'unknown')
      .replace(/{phase}/g, context.phase || 'unknown')
      .replace(/{params}/g, JSON.stringify(context.params || {}))
      .replace(/{error}/g, error.message);
  }

  /**
   * 提取模块名
   */
  extractModuleName(message) {
    const match = message.match(/Cannot (?:find|resolve) module ['\"]([^'\"]+)['"]/);
    return match ? match[1] : 'unknown';
  }

  /**
   * 格式化错误输出（用于MCP展示）
   */
  formatError(category, errorDef, solution, originalError, context) {
    const lines = [
      `${category.emoji} ${category.description}`,
      '━'.repeat(40),
      `错误代码: ${errorDef.code}`,
      `错误描述: ${errorDef.description}`,
      `责任方: ${category.responsibility}`,
      '',
      '📋 详细信息:',
      originalError.message,
      '',
      '💡 解决方案:',
      solution.message || '请查看错误详情'
    ];
    
    if (solution.suggestions && Array.isArray(solution.suggestions)) {
      lines.push('', '建议:', ...solution.suggestions);
    }
    
    if (solution.autoRecoverable) {
      lines.push('', '🔄 可自动重试');
      if (solution.retryDelay) {
        lines.push(`⏱️ 重试延迟: ${solution.retryDelay}ms`);
      }
    }
    
    lines.push(
      '',
      `⏰ 时间: ${context.timestamp || new Date().toISOString()}`,
      `🔧 工具: ${context.toolId || 'unknown'}`,
      `📍 阶段: ${context.phase || 'unknown'}`
    );
    
    return lines.join('\n');
  }

  /**
   * 记录错误日志
   */
  logError(errorInfo) {
    const level = errorInfo.autoRecoverable ? 'warn' : 'error';
    logger[level](`[ToolErrorManager] ${errorInfo.code}`, {
      category: errorInfo.category,
      code: errorInfo.code,
      toolId: errorInfo.context.toolId,
      phase: errorInfo.context.phase,
      autoRecoverable: errorInfo.autoRecoverable
    });
  }

  /**
   * 判断是否可自动恢复
   */
  isAutoRecoverable(errorInfo) {
    return errorInfo.autoRecoverable === true;
  }

  /**
   * 获取重试参数
   */
  getRetryParams(errorInfo) {
    const solution = errorInfo.solution;
    return {
      mode: solution.retryMode || 'execute',
      delay: solution.retryDelay || 0,
      params: solution.retryParams || {}
    };
  }
}

module.exports = ToolErrorManager;