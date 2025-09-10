import * as workerpool from 'workerpool';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { 
  ToolWorkerPool, 
  PoolStats, 
  ToolWorkerPoolOptions 
} from '../interfaces/ToolWorkerPool';
import { ToolWithHandler } from '../interfaces/MCPServer';
import logger from '@promptx/logger';

/**
 * 基于 workerpool 的 ToolWorkerPool 实现
 */
export class WorkerpoolAdapter implements ToolWorkerPool {
  private pool: workerpool.Pool | null = null;
  private options: Required<ToolWorkerPoolOptions>;
  
  constructor(options: ToolWorkerPoolOptions = {}) {
    this.options = {
      minWorkers: options.minWorkers ?? 2,
      maxWorkers: options.maxWorkers ?? 4,
      workerTimeout: options.workerTimeout ?? 30000,
    };
  }
  
  /**
   * 初始化 worker pool
   */
  async initialize(): Promise<void> {
    if (this.pool) {
      logger.warn('WorkerpoolAdapter: Pool already initialized');
      return;
    }
    
    // tsup 会把 worker.ts 编译到 dist/worker.js
    // WorkerpoolAdapter 会在某个 chunk 文件中，所以用相对路径找 worker.js
    const workerPath = fileURLToPath(new URL('./worker.js', import.meta.url));
    
    this.pool = workerpool.pool(workerPath, {
      minWorkers: this.options.minWorkers,
      maxWorkers: this.options.maxWorkers,
      workerType: 'process', // 使用进程而非线程
      workerTerminateTimeout: 5000,
      forkOpts: {
        env: process.env,
        cwd: process.cwd(),
      }
    });
    
    logger.info(`WorkerpoolAdapter initialized: ${this.options.minWorkers}-${this.options.maxWorkers} workers`);
  }
  
  /**
   * 执行工具
   */
  async execute<T = any>(tool: ToolWithHandler, args: any): Promise<T> {
    if (!this.pool) {
      throw new Error('WorkerpoolAdapter: Pool not initialized. Call initialize() first.');
    }
    
    try {
      logger.debug(`Executing tool '${tool.name}' in worker pool`);
      
      // 准备执行数据（只传递工具名和参数）
      const taskData = {
        toolName: tool.name,
        args
      };
      
      // 在 worker 中执行
      const result = await this.pool.exec('executeTool', [taskData]);
      
      logger.debug(`Tool '${tool.name}' execution completed`);
      return result as T;
      
    } catch (error: any) {
      logger.error(`Tool '${tool.name}' execution failed: ${error.message}`);
      
      // 处理超时错误
      if (error.message?.includes('timeout')) {
        throw new Error(`Tool '${tool.name}' execution timeout after ${this.options.workerTimeout}ms`);
      }
      
      // 重新抛出其他错误
      throw error;
    }
  }
  
  /**
   * 获取 pool 状态
   */
  getStats(): PoolStats {
    if (!this.pool) {
      return {
        active: 0,
        pending: 0,
        available: 0,
        total: 0
      };
    }
    
    const stats = this.pool.stats();
    return {
      active: stats.activeTasks,
      pending: stats.pendingTasks,
      available: stats.idleWorkers,
      total: stats.totalWorkers
    };
  }
  
  /**
   * 终止 pool
   */
  async terminate(): Promise<void> {
    if (!this.pool) {
      logger.warn('WorkerpoolAdapter: No pool to terminate');
      return;
    }
    
    logger.info('Terminating worker pool...');
    await this.pool.terminate();
    this.pool = null;
    logger.info('Worker pool terminated');
  }
  
  /**
   * 判断工具是否需要使用 worker pool
   */
  static shouldUsePool(toolName: string): boolean {
    // 需要隔离执行的工具列表
    const isolatedTools = [
      'toolx',           // 主要目标
      'build',           // 构建任务
      'test',            // 测试任务
      'compile',         // 编译任务
      'heavy-compute'    // 计算密集型任务
    ];
    
    return isolatedTools.includes(toolName);
  }
}