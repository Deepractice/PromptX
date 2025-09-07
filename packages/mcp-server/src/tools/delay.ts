import type { ToolWithHandler } from '~/interfaces/MCPServer.js';

/**
 * Delay 工具 - 延迟执行
 * 
 * 用于测试异步操作和超时处理
 */
export const delayTool: ToolWithHandler = {
  name: 'delay',
  description: 'Wait for specified milliseconds',
  inputSchema: {
    type: 'object',
    properties: {
      ms: {
        type: 'number',
        minimum: 0,
        maximum: 10000,
        description: 'Milliseconds to wait (0-10000)'
      },
      message: {
        type: 'string',
        description: 'Optional message to return after delay'
      }
    },
    required: ['ms']
  },
  handler: async (args: { ms: number; message?: string }) => {
    const startTime = Date.now();
    
    // 等待指定时间
    await new Promise(resolve => setTimeout(resolve, args.ms));
    
    const actualDelay = Date.now() - startTime;
    const message = args.message 
      ? `${args.message} (after ${actualDelay}ms)`
      : `Waited ${actualDelay}ms`;
    
    return {
      content: [{
        type: 'text',
        text: message
      }]
    };
  }
};