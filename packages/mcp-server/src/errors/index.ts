/**
 * 错误处理模块导出
 */

// 错误类型
export {
  MCPError,
  ErrorSeverity,
  ErrorCategory,
  NetworkError,
  ProtocolError,
  ToolExecutionError,
  ResourceAccessError,
  SessionError,
  TransportError,
  ConfigurationError,
  ErrorHelper
} from './MCPError.js';

// 错误恢复策略
export {
  ExponentialBackoffStrategy,
  CircuitBreakerStrategy,
  CompositeStrategy,
  NoOpStrategy
} from './ErrorRecoveryStrategies.js';

// 错误收集器
export {
  ErrorCollector,
  ErrorStats,
  globalErrorCollector
} from './ErrorCollector.js';