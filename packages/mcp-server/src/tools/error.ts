import type { ToolWithHandler } from '~/interfaces/MCPServer.js';
import { 
  MCPError, 
  NetworkError, 
  ToolExecutionError,
  ErrorSeverity,
  ErrorCategory 
} from '~/errors/MCPError.js';

/**
 * Error 工具 - 模拟各种错误条件
 * 
 * 用于测试错误处理和恢复机制
 */
export const errorTool: ToolWithHandler = {
  name: 'simulateError',
  description: 'Simulate various error conditions for testing',
  inputSchema: {
    type: 'object',
    properties: {
      errorType: {
        type: 'string',
        enum: ['network', 'timeout', 'validation', 'internal', 'recoverable'],
        description: 'Type of error to simulate'
      },
      message: {
        type: 'string',
        description: 'Custom error message'
      },
      shouldRecover: {
        type: 'boolean',
        description: 'Whether the error should be recoverable',
        default: false
      }
    },
    required: ['errorType']
  },
  handler: async (args: { errorType: string; message?: string; shouldRecover?: boolean }) => {
    const customMessage = args.message || `Simulated ${args.errorType} error`;
    
    switch (args.errorType) {
      case 'network':
        throw new NetworkError(
          customMessage,
          'NETWORK_ERROR',
          { simulatedError: true }
        );
        
      case 'timeout':
        // 模拟超时
        await new Promise(resolve => setTimeout(resolve, 30000));
        return {
          content: [{
            type: 'text',
            text: 'This should timeout'
          }]
        };
        
      case 'validation':
        return {
          content: [{
            type: 'text',
            text: `Validation error: ${customMessage}`
          }],
          isError: true
        };
        
      case 'internal':
        throw new Error(customMessage);
        
      case 'recoverable':
        throw new ToolExecutionError(
          customMessage,
          'simulateError',
          { recoverable: args.shouldRecover }
        );
        
      default:
        throw new MCPError(
          customMessage,
          'UNKNOWN_ERROR',
          ErrorSeverity.CRITICAL,
          ErrorCategory.INTERNAL
        );
    }
  }
};