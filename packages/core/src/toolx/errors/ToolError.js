/**
 * ToolError - 简化的工具错误类
 * 
 * 奥卡姆剃刀原则：只保留必要的属性
 * - message: 错误信息（必须）
 * - code: 错误代码（必须）  
 * - details: 额外细节（可选）
 */
class ToolError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', details = null) {
    super(message);
    this.name = 'ToolError';
    this.code = code;
    this.details = details;
    
    // 保留堆栈追踪
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ToolError);
    }
  }

  /**
   * 从各种错误源创建 ToolError
   * @param {Error|Object} source - 错误源
   * @param {Object} context - 上下文信息
   * @returns {ToolError}
   */
  static from(source, context = {}) {
    // 已经是 ToolError，直接返回
    if (source instanceof ToolError) {
      return source;
    }
    
    // 从 Error 对象创建
    if (source instanceof Error) {
      return new ToolError(
        source.message,
        source.code || 'EXECUTION_ERROR',
        { 
          originalError: source.name,
          stack: source.stack,
          ...context
        }
      );
    }
    
    // 从对象创建（如 errorManager.analyzeError 的返回值）
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
   * 转换为简单对象（用于序列化）
   * @returns {Object}
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
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