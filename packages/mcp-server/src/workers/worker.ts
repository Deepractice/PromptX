import * as workerpool from 'workerpool';
import logger from '@promptx/logger';

interface TaskData {
  toolName: string;
  handlerString: string;
  args: any;
}

/**
 * 执行工具 handler
 */
async function executeTool(taskData: TaskData): Promise<any> {
  const { toolName, handlerString, args } = taskData;
  
  try {
    logger.debug(`[Worker ${process.pid}] Executing tool: ${toolName}`);
    
    // 重建 handler 函数
    // 使用 Function 构造器而不是 eval，更安全
    const handler = new Function('return ' + handlerString)();
    
    // 确保 handler 是函数
    if (typeof handler !== 'function') {
      throw new Error(`Invalid handler for tool ${toolName}: not a function`);
    }
    
    // 执行 handler
    const result = await handler(args);
    
    logger.debug(`[Worker ${process.pid}] Tool ${toolName} completed`);
    return result;
    
  } catch (error: any) {
    logger.error(`[Worker ${process.pid}] Tool ${toolName} failed: ${error.message}`);
    // 抛出错误让 pool 处理
    throw error;
  }
}

interface HealthCheckResult {
  status: string;
  pid: number;
  memory: NodeJS.MemoryUsage;
  uptime: number;
}

/**
 * Worker 健康检查
 */
function healthCheck(): HealthCheckResult {
  return {
    status: 'ok',
    pid: process.pid,
    memory: process.memoryUsage(),
    uptime: process.uptime()
  };
}

// 注册 worker 函数
workerpool.worker({
  executeTool,
  healthCheck
});