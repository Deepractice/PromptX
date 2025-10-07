/**
 * ToolError - 增强的工具错误类
 * 
 * 统一的错误处理入口，承担所有错误分析和分类职责
 * - 内置错误分析逻辑（替代ToolErrorManager）
 * - 支持四层错误分类体系
 * - 提供结构化错误数据
 * - 渲染职责交给ToolCommand
 */

// 导入错误定义
const ERROR_CATEGORIES = require('./ErrorCategories');
const DEVELOPMENT_ERRORS = require('./DevelopmentErrors');
const { VALIDATION_ERRORS, validateAgainstSchema } = require('./ValidationErrors');
const SYSTEM_ERRORS = require('./SystemErrors');

class ToolError extends Error {
  // 静态错误定义
  static CATEGORIES = ERROR_CATEGORIES;
  static DEVELOPMENT_ERRORS = DEVELOPMENT_ERRORS;
  static VALIDATION_ERRORS = VALIDATION_ERRORS;
  static SYSTEM_ERRORS = SYSTEM_ERRORS;
  
  // 工具函数
  static validateAgainstSchema = validateAgainstSchema;

  constructor(message, code = 'UNKNOWN_ERROR', details = {}) {
    super(message);
    this.name = 'ToolError';
    this.code = code;
    
    // 结构化错误信息
    this.category = details.category || 'UNKNOWN';
    this.categoryInfo = ERROR_CATEGORIES[this.category];
    this.solution = details.solution || null;
    this.retryable = details.retryable || false;
    this.businessError = details.businessError || null;
    this.context = details.context || {};
    this.originalError = details.originalError || null;
    this.details = details;
    
    // 保留堆栈追踪
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ToolError);
    }
  }

  /**
   * 从各种错误源创建 ToolError（增强版）
   * @param {Error|Object} source - 错误源
   * @param {Object} context - 上下文信息
   * @returns {ToolError}
   */
  static from(source, context = {}) {
    // 已经是 ToolError，直接返回
    if (source instanceof ToolError) {
      return source;
    }
    
    // 从 Error 对象创建，进行错误分析
    if (source instanceof Error) {
      const analysis = ToolError.analyze(source, context);
      
      return new ToolError(
        source.message,
        analysis.code,
        {
          category: analysis.category,
          solution: analysis.solution,
          retryable: analysis.retryable,
          businessError: analysis.businessError,
          context: context,
          originalError: source,
          stack: source.stack
        }
      );
    }
    
    // 从对象创建
    if (source && typeof source === 'object') {
      return new ToolError(
        source.formatted || source.message || 'Unknown error',
        source.code || source.category || 'UNKNOWN_ERROR',
        {
          category: source.category,
          solution: source.solution,
          ...context
        }
      );
    }
    
    // 兜底处理
    return new ToolError(String(source), 'UNKNOWN_ERROR', context);
  }

  /**
   * 分析错误并返回结构化信息（核心方法，替代ToolErrorManager.analyzeError）
   * @param {Error} error - 原始错误
   * @param {Object} context - 错误上下文
   * @returns {Object} 分析结果
   */
  static analyze(error, context = {}) {
    // 1. 检查BusinessError（工具自定义）
    if (context.businessErrors && Array.isArray(context.businessErrors)) {
      for (const bizError of context.businessErrors) {
        if (ToolError.isMatch(error, bizError.match || bizError.identify, context)) {
          return {
            category: ERROR_CATEGORIES.BUSINESS.name,
            code: bizError.code,
            description: bizError.description,
            solution: bizError.solution,
            retryable: bizError.retryable || false,
            businessError: bizError
          };
        }
      }
    }
    
    // 2. 检查ValidationError（基于schema和环境变量）
    // 先进行schema验证
    if (context.schema && context.params) {
      // 适配新的schema格式：支持 schema.parameters 或直接使用 schema
      // 标准格式: { parameters: {...}, environment: {...} }
      // 兼容格式: { type: 'object', properties: {...}, required: [...] }
      const paramSchema = context.schema.parameters || context.schema;
      const validation = validateAgainstSchema(context.params, paramSchema);
      if (!validation.valid) {
        context.validationResult = validation;
        
        if (validation.missing && validation.missing.length > 0) {
          const errorDef = VALIDATION_ERRORS.MISSING_REQUIRED_PARAM;
          return {
            category: ERROR_CATEGORIES.VALIDATION.name,
            code: errorDef.code,
            description: errorDef.description,
            solution: errorDef.getSolution(error, context)
          };
        }
        
        if (validation.typeErrors && validation.typeErrors.length > 0) {
          const errorDef = VALIDATION_ERRORS.INVALID_PARAM_TYPE;
          return {
            category: ERROR_CATEGORIES.VALIDATION.name,
            code: errorDef.code,
            description: errorDef.description,
            solution: errorDef.getSolution(error, context)
          };
        }
        
        if (validation.enumErrors && validation.enumErrors.length > 0) {
          const errorDef = VALIDATION_ERRORS.PARAM_OUT_OF_RANGE;
          return {
            category: ERROR_CATEGORIES.VALIDATION.name,
            code: errorDef.code,
            description: errorDef.description,
            solution: errorDef.getSolution(error, context)
          };
        }
      }
    }
    
    // 检查环境变量（从 schema.environment）
    if (context.environment && context.schema?.environment) {
      const envSchema = context.schema.environment;
      const missingEnvVars = [];

      if (envSchema.required && Array.isArray(envSchema.required)) {
        for (const envName of envSchema.required) {
          if (!context.environment[envName]) {
            missingEnvVars.push(envName);
          }
        }
      }

      if (missingEnvVars.length > 0) {
        context.missingEnvVars = missingEnvVars;
        const errorDef = VALIDATION_ERRORS.MISSING_ENV_VAR;
        return {
          category: ERROR_CATEGORIES.VALIDATION.name,
          code: errorDef.code,
          description: errorDef.description,
          solution: errorDef.getSolution(error, context)
        };
      }
    }
    
    // 其他Validation错误
    for (const [key, errorDef] of Object.entries(VALIDATION_ERRORS)) {
      if (errorDef.identify && errorDef.identify(error, context)) {
        return {
          category: ERROR_CATEGORIES.VALIDATION.name,
          code: errorDef.code,
          description: errorDef.description,
          solution: errorDef.getSolution?.(error, context)
        };
      }
    }
    
    // 3. 检查DevelopmentError
    for (const [key, errorDef] of Object.entries(DEVELOPMENT_ERRORS)) {
      if (errorDef.identify && errorDef.identify(error, context)) {
        return {
          category: ERROR_CATEGORIES.DEVELOPMENT.name,
          code: errorDef.code,
          description: errorDef.description,
          solution: errorDef.getSolution?.(error, context)
        };
      }
    }
    
    // 4. 检查SystemError
    for (const [key, errorDef] of Object.entries(SYSTEM_ERRORS)) {
      if (errorDef.identify && errorDef.identify(error, context)) {
        return {
          category: ERROR_CATEGORIES.SYSTEM.name,
          code: errorDef.code,
          description: errorDef.description,
          solution: errorDef.getSolution?.(error, context),
          retryable: errorDef.getSolution?.(error, context)?.autoRecoverable || false
        };
      }
    }
    
    // 5. 默认返回未知错误
    return {
      category: ERROR_CATEGORIES.SYSTEM.name,
      code: 'UNKNOWN_ERROR',
      description: '未知错误',
      solution: null
    };
  }

  /**
   * 通用错误匹配器
   * @param {Error} error - 错误对象
   * @param {string|RegExp|Function} matcher - 匹配器
   * @param {Object} context - 上下文
   * @returns {boolean} 是否匹配
   */
  static isMatch(error, matcher, context = {}) {
    if (!matcher) return false;
    
    if (typeof matcher === 'string') {
      // 字符串匹配
      return error.message && error.message.includes(matcher);
    } else if (matcher instanceof RegExp) {
      // 正则匹配
      return error.message && matcher.test(error.message);
    } else if (typeof matcher === 'function') {
      // 函数匹配
      return matcher(error, context);
    }
    
    return false;
  }

  /**
   * 转换为简单对象（用于序列化）
   * @returns {Object}
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      category: this.category,
      categoryInfo: this.categoryInfo,
      solution: this.solution,
      retryable: this.retryable,
      businessError: this.businessError,
      context: this.context,
      details: this.details
    };
  }

  /**
   * 格式化为 MCP 响应格式
   * @returns {Object}
   */
  toMCPFormat() {
    return {
      code: this.code,
      message: this.message,
      category: this.category,
      solution: this.solution,
      retryable: this.retryable,
      details: this.details
    };
  }
}

// 常用错误代码（与现有系统对应）
ToolError.CODES = {
  // 验证错误
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_PARAM: 'MISSING_PARAM',
  INVALID_TYPE: 'INVALID_TYPE',
  
  // 开发错误  
  MISSING_DEPENDENCY: 'MISSING_DEPENDENCY',
  SYNTAX_ERROR: 'SYNTAX_ERROR',
  
  // 系统错误
  EXECUTION_ERROR: 'EXECUTION_ERROR',
  TIMEOUT: 'TIMEOUT',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  
  // 通用
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

module.exports = ToolError;