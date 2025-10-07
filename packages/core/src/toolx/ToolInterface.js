/**
 * ToolInterface - PromptX工具接口规范
 * 定义鸭子类型的工具接口，外部工具无需继承任何类
 */

/**
 * Tool接口规范定义
 */
const TOOL_INTERFACE = {
  // 必须实现的方法
  required: [
    {
      name: 'getMetadata',
      signature: '() => Object',
      description: '获取工具元信息',
      returns: {
        name: 'string - 工具名称',
        description: 'string - 工具描述', 
        version: 'string - 版本号',
        category: 'string - 分类（可选）',
        author: 'string - 作者（可选）'
      }
    },
    {
      name: 'getSchema',
      signature: '() => Object',
      description: '获取参数JSON Schema',
      returns: {
        type: 'string - 参数类型，通常为object',
        properties: 'Object - 参数属性定义',
        required: 'Array - 必需参数列表（可选）',
        additionalProperties: 'boolean - 是否允许额外参数（可选）'
      }
    },
    {
      name: 'execute',
      signature: '(parameters: Object) => Promise<any>',
      description: '执行工具主逻辑',
      parameters: {
        parameters: 'Object - 工具参数，符合getSchema定义'
      },
      returns: 'Promise<any> - 工具执行结果'
    }
  ],

  // 可选实现的方法
  optional: [
    {
      name: 'api',
      signature: 'ToolAPI',
      description: '统一的工具API接口（由ToolSandbox自动注入）',
      returns: 'ToolAPI - 提供environment, logger, storage, cache, metrics等所有运行时服务',
      notes: '此对象由 ToolSandbox 自动注入，工具无需实现。通过 this.api 访问所有运行时功能。'
    },
    {
      name: 'getDependencies',
      signature: '() => Object',
      description: '声明工具依赖（可选）',
      returns: 'Object - 依赖对象，格式：{包名: 版本}',
      notes: '声明工具需要的npm包依赖，系统会自动安装'
    },
    {
      name: 'cleanup',
      signature: '() => void | Promise<void>',
      description: '清理资源（可选）',
      returns: 'void | Promise<void>'
    },
    {
      name: 'init',
      signature: '(config?: Object) => void | Promise<void>',
      description: '初始化工具（可选）',
      parameters: {
        config: 'Object - 初始化配置（可选）'
      },
      returns: 'void | Promise<void>'
    },
    {
      name: 'getBusinessErrors',
      signature: '() => Array<BusinessError>',
      description: '定义工具的业务执行错误（可选但推荐）',
      returns: `Array<{
        code: string,        // 错误代码，如 'FILE_NOT_FOUND'
        description: string, // 错误描述
        match: string|RegExp|Function, // 匹配规则
        solution: string|Object, // 解决方案
        retryable?: boolean  // 是否可重试
      }>`,
      notes: '工具可以定义特有的业务错误，这些错误将被系统识别并提供给AI处理'
    },
    {
      name: 'getBridges',
      signature: '() => Object<Bridge>',
      description: '定义工具的外部依赖桥接器（可选但推荐）',
      returns: `Object<{
        [operation: string]: {
          real: async (args, api) => any,  // 真实实现
          mock: async (args, api) => any   // Mock实现
        }
      }>`,
      notes: '定义外部依赖的real和mock实现，支持dry-run测试。每个操作需要提供real和/或mock实现。',
      example: `{
        'mysql:connect': {
          real: async (args, api) => {
            const mysql2 = await api.importx('mysql2/promise');
            return await mysql2.createConnection(args);
          },
          mock: async (args, api) => ({
            execute: async () => [[], []],
            end: async () => {}
          })
        }
      }`
    },
    {
      name: 'getMockArgs',
      signature: '(operation: string) => Object',
      description: '为指定bridge操作生成mock参数（可选）',
      parameters: {
        operation: 'string - bridge操作名称'
      },
      returns: 'Object - 该操作的mock参数',
      notes: '用于dry-run测试时生成合理的测试参数'
    },
    {
      name: 'getBridgeErrors',
      signature: '() => Object<Array<BusinessError>>',
      description: '定义每个bridge操作的特定业务错误（可选）',
      returns: `Object<{
        [operation: string]: Array<BusinessError>
      }>`,
      notes: '为每个bridge操作定义特定的错误处理规则'
    }
  ]
};

/**
 * 工具错误类型定义
 */
const TOOL_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',     // 参数验证失败
  EXECUTION_ERROR: 'EXECUTION_ERROR',       // 执行错误
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',           // 超时错误
  PERMISSION_ERROR: 'PERMISSION_ERROR',     // 权限错误
  RESOURCE_ERROR: 'RESOURCE_ERROR',         // 资源错误
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR' // 配置错误
};

/**
 * 标准结果格式定义
 */
const TOOL_RESULT_FORMAT = {
  success: {
    success: true,
    data: 'any - 工具返回的实际数据',
    metadata: {
      tool: 'string - 工具名称',
      executionTime: 'string - 执行时间',
      timestamp: 'string - 时间戳',
      // ...其他元信息
    }
  },
  
  error: {
    success: false,
    error: {
      code: 'string - 错误代码（见TOOL_ERROR_CODES）',
      message: 'string - 错误消息',
      details: 'Object - 错误详情（可选）'
    },
    metadata: {
      tool: 'string - 工具名称',
      timestamp: 'string - 时间戳',
      // ...其他元信息
    }
  }
};

/**
 * 示例工具实现
 */
const EXAMPLE_TOOL = `
class ExampleTool {
  getMetadata() {
    return {
      name: 'example-tool',
      description: '示例工具',
      version: '1.0.0',
      category: 'example',
      author: 'PromptX Team'
    };
  }

  getSchema() {
    return {
      // 执行参数Schema
      parameters: {
        type: 'object',
        properties: {
          input: {
            type: 'string',
            description: '输入参数'
          }
        },
        required: ['input'],
        additionalProperties: false
      }
      // 如需环境变量，添加 environment 字段
      // environment: {
      //   type: 'object',
      //   properties: {
      //     API_KEY: { type: 'string', description: 'API密钥' }
      //   },
      //   required: ['API_KEY']
      // }
    };
  }

  async execute(parameters) {
    const { input } = parameters;
    
    // 工具逻辑
    const result = \`处理结果: \${input}\`;
    
    return result;
  }

  // 可选：声明依赖
  getDependencies() {
    return {
      'lodash': '^4.17.21',
      'axios': '^1.6.0'
    };
  }

  // 可选：清理资源
  cleanup() {
    console.log('Cleaning up resources');
  }
  
  // 可选：定义业务错误
  getBusinessErrors() {
    return [
      {
        code: 'INVALID_INPUT_FORMAT',
        description: '输入格式不正确',
        match: /invalid format|format error/i,
        solution: '请检查输入格式是否符合要求',
        retryable: false
      },
      {
        code: 'PROCESSING_TIMEOUT',
        description: '处理超时',
        match: 'processing timeout',
        solution: '处理时间过长，请稍后重试',
        retryable: true
      }
    ];
  }
}

module.exports = ExampleTool;
`;

module.exports = {
  TOOL_INTERFACE,
  TOOL_ERROR_CODES,
  TOOL_RESULT_FORMAT,
  EXAMPLE_TOOL
};