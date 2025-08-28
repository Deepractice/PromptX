const ToolValidator = require('./ToolValidator');
const { TOOL_ERROR_CODES, TOOL_RESULT_FORMAT } = require('./ToolInterface');

/**
 * ToolUtils - 工具实用函数集合
 * 提供工具开发和使用的辅助函数
 */
class ToolUtils {
  /**
   * 创建标准化的成功结果
   * @param {*} data - 结果数据
   * @param {Object} options - 选项
   * @returns {Object} 标准化结果
   */
  static createSuccessResult(data, options = {}) {
    const {
      tool = 'unknown',
      executionTime = null,
      metadata = {}
    } = options;

    return {
      success: true,
      data: data,
      metadata: {
        tool: tool,
        executionTime: executionTime,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };
  }

  /**
   * 创建标准化的错误结果
   * @param {string} code - 错误代码
   * @param {string} message - 错误消息
   * @param {Object} options - 选项
   * @returns {Object} 标准化错误
   */
  static createErrorResult(code, message, options = {}) {
    const {
      tool = 'unknown',
      details = {},
      metadata = {}
    } = options;

    return {
      success: false,
      error: {
        code: code,
        message: message,
        details: details
      },
      metadata: {
        tool: tool,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };
  }

  /**
   * 验证工具结果格式
   * @param {Object} result - 工具结果
   * @returns {Object} 验证结果
   */
  static validateResult(result) {
    const errors = [];

    if (!result || typeof result !== 'object') {
      errors.push('结果必须是对象类型');
      return { valid: false, errors };
    }

    if (typeof result.success !== 'boolean') {
      errors.push('结果必须包含success(boolean)字段');
    }

    if (result.success) {
      // 成功结果验证
      if (!('data' in result)) {
        errors.push('成功结果必须包含data字段');
      }
    } else {
      // 错误结果验证
      if (!result.error || typeof result.error !== 'object') {
        errors.push('错误结果必须包含error(object)字段');
      } else {
        if (!result.error.code || typeof result.error.code !== 'string') {
          errors.push('错误结果必须包含error.code(string)字段');
        }
        if (!result.error.message || typeof result.error.message !== 'string') {
          errors.push('错误结果必须包含error.message(string)字段');
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * 安全地执行工具方法
   * @param {Object} tool - 工具实例
   * @param {string} methodName - 方法名
   * @param {...any} args - 方法参数
   * @returns {Promise<*>} 执行结果
   */
  static async safeExecute(tool, methodName, ...args) {
    try {
      if (!tool || typeof tool[methodName] !== 'function') {
        throw new Error(`工具不存在方法: ${methodName}`);
      }

      const result = await tool[methodName](...args);
      return result;
    } catch (error) {
      throw new Error(`方法执行失败 ${methodName}: ${error.message}`);
    }
  }

  /**
   * 工具性能分析
   * @param {Object} tool - 工具实例
   * @param {Object} parameters - 测试参数
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 性能分析结果
   */
  static async benchmarkTool(tool, parameters = {}, options = {}) {
    const {
      iterations = 10,
      warmup = 3
    } = options;

    const results = {
      toolName: 'unknown',
      iterations: iterations,
      warmup: warmup,
      times: [],
      stats: {}
    };

    try {
      // 获取工具名称
      if (tool.getMetadata) {
        const metadata = tool.getMetadata();
        results.toolName = metadata.name || 'unknown';
      }

      // 验证工具接口
      const validation = ToolValidator.validateTool(tool);
      if (!validation.valid) {
        throw new Error(`工具接口验证失败: ${validation.errors.join(', ')}`);
      }

      // 预热运行
      for (let i = 0; i < warmup; i++) {
        await tool.execute(parameters);
      }

      // 性能测试
      for (let i = 0; i < iterations; i++) {
        const startTime = process.hrtime.bigint();
        await tool.execute(parameters);
        const endTime = process.hrtime.bigint();
        
        const executionTime = Number(endTime - startTime) / 1000000; // 转换为毫秒
        results.times.push(executionTime);
      }

      // 计算统计信息
      results.stats = this.calculateStats(results.times);

    } catch (error) {
      results.error = error.message;
    }

    return results;
  }

  /**
   * 计算统计信息
   * @param {Array<number>} times - 时间数组
   * @returns {Object} 统计信息
   */
  static calculateStats(times) {
    if (times.length === 0) {
      return {};
    }

    const sorted = [...times].sort((a, b) => a - b);
    const sum = times.reduce((a, b) => a + b, 0);
    
    return {
      count: times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      mean: sum / times.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }

  /**
   * 生成工具模板代码
   * @param {Object} options - 工具选项
   * @returns {string} 工具模板代码
   */
  static generateToolTemplate(options = {}) {
    const {
      toolName = 'ExampleTool',
      className = 'ExampleTool',
      description = '示例工具',
      category = 'utility',
      author = 'PromptX Developer'
    } = options;

    return `/**
 * ${className} - ${description}
 * 使用PromptX鸭子类型接口，无需继承任何基类
 */
class ${className} {
  getMetadata() {
    return {
      name: '${toolName}',
      description: '${description}',
      version: '1.0.0',
      category: '${category}',
      author: '${author}'
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
    
    try {
      // TODO: 实现工具逻辑
      const result = \`处理结果: \${input}\`;
      
      return result;
    } catch (error) {
      throw new Error(\`执行失败: \${error.message}\`);
    }
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
    // 清理逻辑
  }
}

module.exports = ${className};
`;
  }

  /**
   * 创建工具开发指南
   * @returns {string} 开发指南
   */
  static getDevGuide() {
    return `
# PromptX Tool 开发指南

## 鸭子类型接口
PromptX工具使用鸭子类型设计，无需继承任何基类。只需实现以下接口：

### 必需方法
1. \`getMetadata()\` - 返回工具元信息
2. \`getSchema()\` - 返回参数JSON Schema
3. \`execute(parameters)\` - 执行工具逻辑

### 可选方法
1. \`validate(parameters)\` - 自定义参数验证
2. \`cleanup()\` - 清理资源
3. \`init(config)\` - 初始化工具

## 开发步骤
1. 使用 ToolUtils.generateToolTemplate() 生成模板
2. 实现必需的接口方法
3. 使用 ToolValidator.validateTool() 验证接口
4. 使用 ToolUtils.benchmarkTool() 性能测试
5. 注册到工具注册表

## 示例代码
\`\`\`javascript
${this.generateToolTemplate()}
\`\`\`

## 最佳实践
- 保持execute方法的幂等性
- 提供清晰的错误消息
- 使用合适的JSON Schema验证
- 实现适当的资源清理
- 遵循统一的结果格式
`;
  }
}

module.exports = ToolUtils;