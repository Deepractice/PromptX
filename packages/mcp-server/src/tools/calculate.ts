import type { ToolWithHandler } from '~/interfaces/MCPServer.js';

/**
 * Calculate 工具 - 执行基本数学运算
 * 
 * 支持加减乘除四则运算
 */
export const calculateTool: ToolWithHandler = {
  name: 'calculate',
  description: 'Perform basic mathematical calculations',
  inputSchema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['add', 'subtract', 'multiply', 'divide'],
        description: 'Mathematical operation to perform'
      },
      a: {
        type: 'number',
        description: 'First operand'
      },
      b: {
        type: 'number',
        description: 'Second operand'
      }
    },
    required: ['operation', 'a', 'b']
  },
  handler: async (args: { operation: string; a: number; b: number }) => {
    let result: number;
    let expression: string;
    
    switch (args.operation) {
      case 'add':
        result = args.a + args.b;
        expression = `${args.a} + ${args.b}`;
        break;
      case 'subtract':
        result = args.a - args.b;
        expression = `${args.a} - ${args.b}`;
        break;
      case 'multiply':
        result = args.a * args.b;
        expression = `${args.a} × ${args.b}`;
        break;
      case 'divide':
        if (args.b === 0) {
          return {
            content: [{
              type: 'text',
              text: 'Error: Division by zero'
            }],
            isError: true
          };
        }
        result = args.a / args.b;
        expression = `${args.a} ÷ ${args.b}`;
        break;
      default:
        return {
          content: [{
            type: 'text',
            text: `Error: Unknown operation ${args.operation}`
          }],
          isError: true
        };
    }
    
    return {
      content: [{
        type: 'text',
        text: `${expression} = ${result}`
      }]
    };
  }
};