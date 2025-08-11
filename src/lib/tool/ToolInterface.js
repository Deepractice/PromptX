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
      name: 'getPackage',
      signature: '() => Object',
      description: '获取工具包信息（可选，用于依赖管理）',
      returns: {
        directory: 'string - 工具目录路径',
        dependencies: 'Object - 依赖对象，格式：{包名: 版本}',
        packageJson: 'Object - package.json内容（可选）'
      }
    },
    {
      name: 'validate',
      signature: '(parameters: Object) => Object',
      description: '验证参数（可选，有默认实现）',
      parameters: {
        parameters: 'Object - 待验证参数'
      },
      returns: {
        valid: 'boolean - 验证是否通过',
        errors: 'Array<string> - 错误信息列表'
      }
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
      type: 'object',
      properties: {
        input: {
          type: 'string',
          description: '输入参数'
        }
      },
      required: ['input'],
      additionalProperties: false
    };
  }

  async execute(parameters) {
    const { input } = parameters;
    
    // 工具逻辑
    const result = \`处理结果: \${input}\`;
    
    return result;
  }

  // 可选：声明依赖（新格式：对象）
  getDependencies() {
    return {
      'lodash': '^4.17.21',
      'axios': '^1.6.0'
    };
  }

  // 可选：自定义参数验证
  validate(parameters) {
    const errors = [];
    
    if (!parameters.input || parameters.input.trim() === '') {
      errors.push('input不能为空');
    }
    
    return { valid: errors.length === 0, errors };
  }

  // 可选：清理资源
  cleanup() {
    console.log('清理资源');
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