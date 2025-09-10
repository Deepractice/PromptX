import { ToolWithHandler } from './MCPServer';

/**
 * Worker Pool 接口定义
 * 提供工具执行的进程隔离能力
 */
export interface ToolWorkerPool {
  /**
   * 执行工具 - 核心方法
   * @param tool 工具定义（包含 handler）
   * @param args 工具参数
   * @returns 执行结果
   */
  execute<T = any>(tool: ToolWithHandler, args: any): Promise<T>;
  
  /**
   * 初始化 pool
   */
  initialize(): Promise<void>;
  
  /**
   * 终止 pool
   */
  terminate(): Promise<void>;
  
  /**
   * 获取 pool 状态统计
   */
  getStats(): PoolStats;
}

/**
 * Pool 状态统计
 */
export interface PoolStats {
  active: number;     // 正在执行的任务数
  pending: number;    // 排队中的任务数
  available: number;  // 空闲 worker 数
  total: number;      // worker 总数
}

/**
 * Worker Pool 配置选项
 */
export interface ToolWorkerPoolOptions {
  minWorkers?: number;      // 最小 worker 数量，默认 2
  maxWorkers?: number;      // 最大 worker 数量，默认 4
  workerTimeout?: number;   // worker 执行超时时间（毫秒），默认 30000
}