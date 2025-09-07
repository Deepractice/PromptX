import type { ToolWithHandler } from '~/interfaces/MCPServer.js';

/**
 * Echo 工具 - 回显输入消息
 * 
 * 用于测试基本的输入输出功能
 */
export const echoTool: ToolWithHandler = {
  name: 'echo',
  description: 'Echo back the input message',
  inputSchema: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: 'Message to echo back'
      }
    },
    required: ['message']
  },
  handler: async (args: { message: string }) => {
    return {
      content: [{
        type: 'text',
        text: `Echo: ${args.message}`
      }]
    };
  }
};