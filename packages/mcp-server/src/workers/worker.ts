import * as workerpool from 'workerpool';
import logger from '@promptx/logger';
import { allTools } from '../tools/index.js';
import type { ToolWithHandler } from '../interfaces/MCPServer.js';

interface TaskData {
  toolName: string;
  args: any;
}

/**
 * 创建工具映射表
 */
const toolsMap = new Map<string, ToolWithHandler>();
allTools.forEach(tool => {
  toolsMap.set(tool.name, tool);
});

/**
 * 执行工具 handler
 */
async function executeTool(taskData: TaskData): Promise<any> {
  const { toolName, args } = taskData;
  
  try {
    logger.debug(`[Worker ${process.pid}] Executing tool: ${toolName}`);
    
    // 从映射表中获取工具
    const tool = toolsMap.get(toolName);
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }
    
    // 直接执行 handler（保留了所有依赖）
    const result = await tool.handler(args);
    
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