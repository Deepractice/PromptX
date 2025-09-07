/**
 * MCP错误类型系统
 * 
 * 提供统一的错误分类和处理机制
 */

/**
 * 错误严重程度
 */
export enum ErrorSeverity {
  /** 可忽略的警告 */
  WARNING = 'warning',
  /** 可恢复的错误 */
  RECOVERABLE = 'recoverable',
  /** 需要人工干预的错误 */
  CRITICAL = 'critical',
  /** 致命错误，需要重启 */
  FATAL = 'fatal'
}

/**
 * 错误类别
 */
export enum ErrorCategory {
  /** 网络相关错误 */
  NETWORK = 'network',
  /** 协议错误（JSON-RPC等） */
  PROTOCOL = 'protocol',
  /** 工具执行错误 */
  TOOL_EXECUTION = 'tool_execution',
  /** 资源访问错误 */
  RESOURCE_ACCESS = 'resource_access',
  /** 会话管理错误 */
  SESSION = 'session',
  /** 传输层错误 */
  TRANSPORT = 'transport',
  /** 配置错误 */
  CONFIGURATION = 'configuration',
  /** 内部错误 */
  INTERNAL = 'internal'
}

/**
 * MCP基础错误类
 */
export class MCPError extends Error {
  /** 错误代码 */
  public readonly code: string;
  /** 错误严重程度 */
  public readonly severity: ErrorSeverity;
  /** 错误类别 */
  public readonly category: ErrorCategory;
  /** 是否可恢复 */
  public readonly recoverable: boolean;
  /** 错误上下文 */
  public readonly context?: any;
  /** 错误发生时间 */
  public readonly timestamp: number;
  /** 原始错误 */
  public readonly cause?: Error;
  /** 重试次数 */
  public retryCount: number = 0;
  
  constructor(
    message: string,
    code: string,
    severity: ErrorSeverity,
    category: ErrorCategory,
    options?: {
      cause?: Error;
      context?: any;
      recoverable?: boolean;
    }
  ) {
    super(message);
    this.name = 'MCPError';
    this.code = code;
    this.severity = severity;
    this.category = category;
    this.cause = options?.cause;
    this.context = options?.context;
    this.timestamp = Date.now();
    
    // 根据严重程度判断是否可恢复
    this.recoverable = options?.recoverable ?? 
      (severity === ErrorSeverity.WARNING || severity === ErrorSeverity.RECOVERABLE);
    
    // 保持原始堆栈信息
    if (options?.cause && options.cause.stack) {
      this.stack = `${this.stack}\nCaused by: ${options.cause.stack}`;
    }
  }
  
  /**
   * 转换为JSON-RPC错误格式
   */
  toJsonRpcError(): { code: number; message: string; data?: any } {
    // 根据类别映射到JSON-RPC错误码
    let jsonRpcCode: number;
    
    switch (this.category) {
      case ErrorCategory.PROTOCOL:
        jsonRpcCode = -32700; // Parse error
        break;
      case ErrorCategory.TOOL_EXECUTION:
        jsonRpcCode = -32602; // Invalid params
        break;
      case ErrorCategory.RESOURCE_ACCESS:
        jsonRpcCode = -32001; // Custom: Resource error
        break;
      case ErrorCategory.SESSION:
        jsonRpcCode = -32002; // Custom: Session error
        break;
      case ErrorCategory.TRANSPORT:
        jsonRpcCode = -32003; // Custom: Transport error
        break;
      default:
        jsonRpcCode = -32603; // Internal error
    }
    
    return {
      code: jsonRpcCode,
      message: this.message,
      data: {
        mcp_code: this.code,
        category: this.category,
        severity: this.severity,
        context: this.context
      }
    };
  }
  
  /**
   * 判断是否应该重试
   */
  shouldRetry(maxRetries: number = 3): boolean {
    return this.recoverable && this.retryCount < maxRetries;
  }
  
  /**
   * 增加重试次数
   */
  incrementRetry(): void {
    this.retryCount++;
  }
}

/**
 * 网络错误
 */
export class NetworkError extends MCPError {
  constructor(message: string, options?: { cause?: Error; context?: any }) {
    super(
      message,
      'NETWORK_ERROR',
      ErrorSeverity.RECOVERABLE,
      ErrorCategory.NETWORK,
      options
    );
    this.name = 'NetworkError';
  }
}

/**
 * 协议错误
 */
export class ProtocolError extends MCPError {
  constructor(message: string, options?: { cause?: Error; context?: any }) {
    super(
      message,
      'PROTOCOL_ERROR',
      ErrorSeverity.CRITICAL,
      ErrorCategory.PROTOCOL,
      { ...options, recoverable: false }
    );
    this.name = 'ProtocolError';
  }
}

/**
 * 工具执行错误
 */
export class ToolExecutionError extends MCPError {
  constructor(
    toolName: string,
    message: string,
    options?: { cause?: Error; context?: any }
  ) {
    super(
      `Tool '${toolName}' execution failed: ${message}`,
      'TOOL_EXECUTION_ERROR',
      ErrorSeverity.RECOVERABLE,
      ErrorCategory.TOOL_EXECUTION,
      { ...options, context: { ...options?.context, toolName } }
    );
    this.name = 'ToolExecutionError';
  }
}

/**
 * 资源访问错误
 */
export class ResourceAccessError extends MCPError {
  constructor(
    resourceUri: string,
    message: string,
    options?: { cause?: Error; context?: any }
  ) {
    super(
      `Resource '${resourceUri}' access failed: ${message}`,
      'RESOURCE_ACCESS_ERROR',
      ErrorSeverity.RECOVERABLE,
      ErrorCategory.RESOURCE_ACCESS,
      { ...options, context: { ...options?.context, resourceUri } }
    );
    this.name = 'ResourceAccessError';
  }
}

/**
 * 会话错误
 */
export class SessionError extends MCPError {
  constructor(
    sessionId: string,
    message: string,
    options?: { cause?: Error; context?: any }
  ) {
    super(
      `Session '${sessionId}' error: ${message}`,
      'SESSION_ERROR',
      ErrorSeverity.RECOVERABLE,
      ErrorCategory.SESSION,
      { ...options, context: { ...options?.context, sessionId } }
    );
    this.name = 'SessionError';
  }
}

/**
 * 传输层错误
 */
export class TransportError extends MCPError {
  constructor(message: string, options?: { cause?: Error; context?: any }) {
    super(
      message,
      'TRANSPORT_ERROR',
      ErrorSeverity.CRITICAL,
      ErrorCategory.TRANSPORT,
      options
    );
    this.name = 'TransportError';
  }
}

/**
 * 配置错误
 */
export class ConfigurationError extends MCPError {
  constructor(message: string, options?: { cause?: Error; context?: any }) {
    super(
      message,
      'CONFIGURATION_ERROR',
      ErrorSeverity.FATAL,
      ErrorCategory.CONFIGURATION,
      { ...options, recoverable: false }
    );
    this.name = 'ConfigurationError';
  }
}

/**
 * 错误帮助函数
 */
export class ErrorHelper {
  /**
   * 判断错误是否可恢复
   */
  static isRecoverable(error: Error): boolean {
    if (error instanceof MCPError) {
      return error.recoverable;
    }
    
    // 对于标准错误，根据类型判断
    if (error.name === 'ECONNRESET' || error.name === 'ETIMEDOUT') {
      return true;
    }
    
    return false;
  }
  
  /**
   * 将普通错误包装为MCPError
   */
  static wrap(error: Error, category: ErrorCategory = ErrorCategory.INTERNAL): MCPError {
    if (error instanceof MCPError) {
      return error;
    }
    
    return new MCPError(
      error.message,
      'WRAPPED_ERROR',
      ErrorSeverity.RECOVERABLE,
      category,
      { cause: error }
    );
  }
  
  /**
   * 创建错误上下文
   */
  static createContext(
    method?: string,
    params?: any,
    sessionId?: string,
    requestId?: string | number
  ): any {
    return {
      method,
      params,
      sessionId,
      requestId,
      timestamp: Date.now()
    };
  }
}