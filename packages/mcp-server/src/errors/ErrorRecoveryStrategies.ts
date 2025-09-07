import type { ErrorRecoveryStrategy } from '~/interfaces/MCPServer.js';
import { MCPError, ErrorSeverity, ErrorCategory, ErrorHelper } from '~/errors/MCPError.js';
import logger from '@promptx/logger';

/**
 * 指数退避重试策略
 * 
 * 重试延迟按指数增长：baseDelay * (2 ^ attemptNumber)
 */
export class ExponentialBackoffStrategy implements ErrorRecoveryStrategy {
  private baseDelay: number;
  private maxDelay: number;
  private maxRetries: number;
  private jitterEnabled: boolean;
  
  constructor(options: {
    baseDelay?: number;
    maxDelay?: number;
    maxRetries?: number;
    jitterEnabled?: boolean;
  } = {}) {
    this.baseDelay = options.baseDelay || 1000; // 默认1秒
    this.maxDelay = options.maxDelay || 30000; // 最大30秒
    this.maxRetries = options.maxRetries || 3;
    this.jitterEnabled = options.jitterEnabled ?? true;
  }
  
  isRecoverable(error: Error): boolean {
    if (error instanceof MCPError) {
      return error.recoverable && error.retryCount < this.maxRetries;
    }
    
    return ErrorHelper.isRecoverable(error);
  }
  
  async recover(error: Error, context: any): Promise<void> {
    const mcpError = error instanceof MCPError ? error : ErrorHelper.wrap(error);
    
    if (!this.isRecoverable(mcpError)) {
      throw new Error(`Error is not recoverable: ${mcpError.message}`);
    }
    
    mcpError.incrementRetry();
    const delay = this.getRetryDelay(mcpError.retryCount);
    
    logger.info(`[RECOVERY] Attempting recovery ${mcpError.retryCount}/${this.maxRetries}, delay: ${delay}ms`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // 根据错误类型执行不同的恢复操作
    switch (mcpError.category) {
      case ErrorCategory.NETWORK:
      case ErrorCategory.TRANSPORT:
        // 重连
        if (context.reconnect) {
          await context.reconnect();
        }
        break;
        
      case ErrorCategory.SESSION:
        // 清理会话
        if (context.cleanupSession) {
          await context.cleanupSession(mcpError.context?.sessionId);
        }
        break;
        
      case ErrorCategory.TOOL_EXECUTION:
        // 工具执行失败，可能需要重置工具状态
        if (context.resetTool) {
          await context.resetTool(mcpError.context?.toolName);
        }
        break;
        
      default:
        // 默认：只等待
        break;
    }
  }
  
  getRetryDelay(attemptNumber: number): number {
    // 计算基础延迟
    let delay = Math.min(
      this.baseDelay * Math.pow(2, attemptNumber - 1),
      this.maxDelay
    );
    
    // 添加抖动以避免惊群效应
    if (this.jitterEnabled) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }
    
    return Math.floor(delay);
  }
}

/**
 * 熔断器策略
 * 
 * 当错误率超过阈值时，快速失败，避免资源浪费
 */
export class CircuitBreakerStrategy implements ErrorRecoveryStrategy {
  private errorThreshold: number;
  private resetTimeout: number;
  private windowSize: number;
  
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private errorCount: number = 0;
  private successCount: number = 0;
  private lastFailTime?: number;
  private requests: Array<{ timestamp: number; success: boolean }> = [];
  
  constructor(options: {
    errorThreshold?: number;  // 错误率阈值（0-1）
    resetTimeout?: number;     // 熔断后重置时间
    windowSize?: number;       // 统计窗口大小
  } = {}) {
    this.errorThreshold = options.errorThreshold || 0.5;
    this.resetTimeout = options.resetTimeout || 60000; // 60秒
    this.windowSize = options.windowSize || 10;
  }
  
  isRecoverable(error: Error): boolean {
    // 熔断器开启时，检查是否可以进入半开状态
    if (this.state === 'OPEN') {
      if (this.lastFailTime && Date.now() - this.lastFailTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
        logger.info('[CIRCUIT_BREAKER] Entering HALF_OPEN state');
      } else {
        return false; // 熔断中，快速失败
      }
    }
    
    return ErrorHelper.isRecoverable(error);
  }
  
  async recover(error: Error, context: any): Promise<void> {
    this.recordError();
    
    if (this.state === 'OPEN') {
      throw new Error('Circuit breaker is OPEN, failing fast');
    }
    
    // 使用指数退避策略进行实际恢复
    const backoffStrategy = new ExponentialBackoffStrategy();
    await backoffStrategy.recover(error, context);
    
    // 如果恢复成功，记录成功
    this.recordSuccess();
  }
  
  getRetryDelay(attemptNumber: number): number {
    // 熔断器不直接控制重试延迟
    return 0;
  }
  
  /**
   * 记录错误
   */
  private recordError(): void {
    this.requests.push({ timestamp: Date.now(), success: false });
    this.cleanupOldRequests();
    
    const errorRate = this.calculateErrorRate();
    
    if (errorRate > this.errorThreshold && this.state === 'CLOSED') {
      this.state = 'OPEN';
      this.lastFailTime = Date.now();
      logger.error(`[CIRCUIT_BREAKER] Circuit opened! Error rate: ${(errorRate * 100).toFixed(2)}%`);
    } else if (this.state === 'HALF_OPEN') {
      // 半开状态下出错，重新开启
      this.state = 'OPEN';
      this.lastFailTime = Date.now();
      logger.warn('[CIRCUIT_BREAKER] Half-open test failed, circuit reopened');
    }
  }
  
  /**
   * 记录成功
   */
  recordSuccess(): void {
    this.requests.push({ timestamp: Date.now(), success: true });
    this.cleanupOldRequests();
    
    if (this.state === 'HALF_OPEN') {
      // 半开状态下成功，关闭熔断器
      this.state = 'CLOSED';
      logger.info('[CIRCUIT_BREAKER] Half-open test succeeded, circuit closed');
    }
  }
  
  /**
   * 清理旧请求记录
   */
  private cleanupOldRequests(): void {
    // 只保留最近的N个请求
    if (this.requests.length > this.windowSize) {
      this.requests = this.requests.slice(-this.windowSize);
    }
  }
  
  /**
   * 计算错误率
   */
  private calculateErrorRate(): number {
    if (this.requests.length === 0) return 0;
    
    const errors = this.requests.filter(r => !r.success).length;
    return errors / this.requests.length;
  }
  
  /**
   * 获取熔断器状态
   */
  getState(): string {
    return this.state;
  }
}

/**
 * 组合策略
 * 
 * 结合多种策略，提供更灵活的错误恢复
 */
export class CompositeStrategy implements ErrorRecoveryStrategy {
  private strategies: ErrorRecoveryStrategy[];
  
  constructor(strategies: ErrorRecoveryStrategy[]) {
    this.strategies = strategies;
  }
  
  isRecoverable(error: Error): boolean {
    // 所有策略都认为可恢复才可恢复
    return this.strategies.every(s => s.isRecoverable(error));
  }
  
  async recover(error: Error, context: any): Promise<void> {
    // 依次执行所有策略
    for (const strategy of this.strategies) {
      if (strategy.isRecoverable(error)) {
        await strategy.recover(error, context);
      }
    }
  }
  
  getRetryDelay(attemptNumber: number): number {
    // 使用第一个策略的延迟
    return this.strategies[0]?.getRetryDelay(attemptNumber) || 0;
  }
}

/**
 * 无操作策略
 * 
 * 用于测试或禁用错误恢复
 */
export class NoOpStrategy implements ErrorRecoveryStrategy {
  isRecoverable(error: Error): boolean {
    return false;
  }
  
  async recover(error: Error, context: any): Promise<void> {
    throw error;
  }
  
  getRetryDelay(attemptNumber: number): number {
    return 0;
  }
}