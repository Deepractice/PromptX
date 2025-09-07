import { MCPError, ErrorSeverity, ErrorCategory } from '~/errors/MCPError.js';
import logger from '@promptx/logger';

/**
 * 错误统计信息
 */
export interface ErrorStats {
  /** 总错误数 */
  totalErrors: number;
  /** 按严重程度分类 */
  bySeverity: Record<ErrorSeverity, number>;
  /** 按类别分类 */
  byCategory: Record<ErrorCategory, number>;
  /** 按错误代码分类 */
  byCode: Record<string, number>;
  /** 最近错误 */
  recentErrors: Array<{
    timestamp: number;
    code: string;
    message: string;
    severity: ErrorSeverity;
    category: ErrorCategory;
  }>;
  /** 错误率（每分钟） */
  errorRate: number;
  /** 恢复成功率 */
  recoveryRate: number;
}

/**
 * 错误收集器
 * 
 * 收集、分析和报告错误信息
 */
export class ErrorCollector {
  private errors: MCPError[] = [];
  private maxErrors: number;
  private windowSize: number; // 时间窗口（毫秒）
  private recoveryAttempts: number = 0;
  private recoverySuccesses: number = 0;
  
  // 错误阈值触发器
  private thresholds: Map<string, { count: number; action: () => void }> = new Map();
  
  constructor(options: {
    maxErrors?: number;
    windowSize?: number;
  } = {}) {
    this.maxErrors = options.maxErrors || 1000;
    this.windowSize = options.windowSize || 60000; // 默认1分钟
    
    // 定期清理旧错误
    setInterval(() => this.cleanup(), this.windowSize);
  }
  
  /**
   * 收集错误
   */
  collect(error: Error): void {
    const mcpError = error instanceof MCPError 
      ? error 
      : new MCPError(
          error.message,
          'UNKNOWN_ERROR',
          ErrorSeverity.RECOVERABLE,
          ErrorCategory.INTERNAL,
          { cause: error }
        );
    
    this.errors.push(mcpError);
    
    // 记录到日志
    this.logError(mcpError);
    
    // 检查阈值
    this.checkThresholds(mcpError);
    
    // 限制内存使用
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }
  }
  
  /**
   * 记录恢复尝试
   */
  recordRecoveryAttempt(success: boolean): void {
    this.recoveryAttempts++;
    if (success) {
      this.recoverySuccesses++;
    }
  }
  
  /**
   * 获取错误统计
   */
  getStats(): ErrorStats {
    const now = Date.now();
    const recentErrors = this.getRecentErrors();
    
    const stats: ErrorStats = {
      totalErrors: recentErrors.length,
      bySeverity: this.groupBySeverity(recentErrors),
      byCategory: this.groupByCategory(recentErrors),
      byCode: this.groupByCode(recentErrors),
      recentErrors: recentErrors.slice(-10).map(e => ({
        timestamp: e.timestamp,
        code: e.code,
        message: e.message,
        severity: e.severity,
        category: e.category
      })),
      errorRate: this.calculateErrorRate(recentErrors),
      recoveryRate: this.recoveryAttempts > 0 
        ? this.recoverySuccesses / this.recoveryAttempts 
        : 0
    };
    
    return stats;
  }
  
  /**
   * 设置错误阈值触发器
   */
  setThreshold(
    key: string,
    count: number,
    action: () => void
  ): void {
    this.thresholds.set(key, { count, action });
  }
  
  /**
   * 清除错误历史
   */
  clear(): void {
    this.errors = [];
    this.recoveryAttempts = 0;
    this.recoverySuccesses = 0;
  }
  
  /**
   * 导出错误报告
   */
  exportReport(): string {
    const stats = this.getStats();
    const report = [
      '=== Error Report ===',
      `Time: ${new Date().toISOString()}`,
      `Total Errors: ${stats.totalErrors}`,
      `Error Rate: ${stats.errorRate.toFixed(2)} errors/min`,
      `Recovery Rate: ${(stats.recoveryRate * 100).toFixed(2)}%`,
      '',
      '--- By Severity ---',
      ...Object.entries(stats.bySeverity).map(([k, v]) => `${k}: ${v}`),
      '',
      '--- By Category ---',
      ...Object.entries(stats.byCategory).map(([k, v]) => `${k}: ${v}`),
      '',
      '--- Top Error Codes ---',
      ...Object.entries(stats.byCode)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([k, v]) => `${k}: ${v}`),
      '',
      '--- Recent Errors ---',
      ...stats.recentErrors.map(e => 
        `[${new Date(e.timestamp).toISOString()}] ${e.severity} - ${e.code}: ${e.message}`
      )
    ];
    
    return report.join('\n');
  }
  
  // ============ 私有方法 ============
  
  private logError(error: MCPError): void {
    const logMessage = `[ERROR_COLLECTED] ${error.code} - ${error.message}`;
    const context = {
      code: error.code,
      severity: error.severity,
      category: error.category,
      recoverable: error.recoverable,
      context: error.context
    };
    
    switch (error.severity) {
      case ErrorSeverity.WARNING:
        logger.warn(logMessage, context);
        break;
      case ErrorSeverity.FATAL:
        logger.error(`[FATAL] ${logMessage}`, context);
        break;
      default:
        logger.error(logMessage, context);
    }
  }
  
  private checkThresholds(error: MCPError): void {
    // 检查严重程度阈值
    const severityKey = `severity:${error.severity}`;
    const severityCount = this.getRecentErrors()
      .filter(e => e.severity === error.severity).length;
    
    const severityThreshold = this.thresholds.get(severityKey);
    if (severityThreshold && severityCount >= severityThreshold.count) {
      logger.warn(`[THRESHOLD] ${severityKey} threshold reached: ${severityCount}`);
      severityThreshold.action();
    }
    
    // 检查类别阈值
    const categoryKey = `category:${error.category}`;
    const categoryCount = this.getRecentErrors()
      .filter(e => e.category === error.category).length;
    
    const categoryThreshold = this.thresholds.get(categoryKey);
    if (categoryThreshold && categoryCount >= categoryThreshold.count) {
      logger.warn(`[THRESHOLD] ${categoryKey} threshold reached: ${categoryCount}`);
      categoryThreshold.action();
    }
    
    // 检查特定错误代码阈值
    const codeKey = `code:${error.code}`;
    const codeCount = this.getRecentErrors()
      .filter(e => e.code === error.code).length;
    
    const codeThreshold = this.thresholds.get(codeKey);
    if (codeThreshold && codeCount >= codeThreshold.count) {
      logger.warn(`[THRESHOLD] ${codeKey} threshold reached: ${codeCount}`);
      codeThreshold.action();
    }
  }
  
  private getRecentErrors(): MCPError[] {
    const cutoff = Date.now() - this.windowSize;
    return this.errors.filter(e => e.timestamp > cutoff);
  }
  
  private cleanup(): void {
    const before = this.errors.length;
    this.errors = this.getRecentErrors();
    const after = this.errors.length;
    
    if (before > after) {
      logger.debug(`[ERROR_COLLECTOR] Cleaned up ${before - after} old errors`);
    }
  }
  
  private groupBySeverity(errors: MCPError[]): Record<ErrorSeverity, number> {
    const result = {
      [ErrorSeverity.WARNING]: 0,
      [ErrorSeverity.RECOVERABLE]: 0,
      [ErrorSeverity.CRITICAL]: 0,
      [ErrorSeverity.FATAL]: 0
    };
    
    for (const error of errors) {
      result[error.severity]++;
    }
    
    return result;
  }
  
  private groupByCategory(errors: MCPError[]): Record<ErrorCategory, number> {
    const result = {} as Record<ErrorCategory, number>;
    
    for (const category of Object.values(ErrorCategory)) {
      result[category] = 0;
    }
    
    for (const error of errors) {
      result[error.category]++;
    }
    
    return result;
  }
  
  private groupByCode(errors: MCPError[]): Record<string, number> {
    const result: Record<string, number> = {};
    
    for (const error of errors) {
      result[error.code] = (result[error.code] || 0) + 1;
    }
    
    return result;
  }
  
  private calculateErrorRate(errors: MCPError[]): number {
    if (errors.length === 0) return 0;
    
    // 计算每分钟错误率
    const timeSpan = Math.min(
      Date.now() - errors[0].timestamp,
      this.windowSize
    );
    
    const minutes = timeSpan / 60000;
    return errors.length / Math.max(minutes, 1);
  }
}

/**
 * 全局错误收集器实例
 */
export const globalErrorCollector = new ErrorCollector();