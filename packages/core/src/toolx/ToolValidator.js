const { TOOL_INTERFACE, TOOL_ERROR_CODES } = require('./ToolInterface');

/**
 * ToolValidator - 工具接口验证器
 * 使用鸭子类型验证工具是否符合PromptX接口规范
 */
class ToolValidator {
  /**
   * 验证工具是否符合接口规范
   * @param {any} tool - 待验证的工具对象
   * @returns {Object} 验证结果 {valid: boolean, errors: [], warnings: []}
   */
  static validateTool(tool) {
    const errors = [];
    const warnings = [];

    // 基础类型检查
    if (!tool || typeof tool !== 'object') {
      errors.push('工具必须是对象类型');
      return { valid: false, errors, warnings };
    }

    // 验证必需方法
    for (const methodSpec of TOOL_INTERFACE.required) {
      const methodName = methodSpec.name;
      
      if (!(methodName in tool)) {
        errors.push(`缺少必需方法: ${methodName}`);
        continue;
      }
      
      if (typeof tool[methodName] !== 'function') {
        errors.push(`${methodName} 必须是函数类型`);
        continue;
      }

      // 方法签名验证
      try {
        const validationResult = this.validateMethod(tool, methodSpec);
        if (!validationResult.valid) {
          errors.push(...validationResult.errors);
          warnings.push(...validationResult.warnings);
        }
      } catch (error) {
        warnings.push(`${methodName} 方法验证时出错: ${error.message}`);
      }
    }

    // 验证可选方法
    for (const methodSpec of TOOL_INTERFACE.optional) {
      const methodName = methodSpec.name;
      
      if (methodName in tool) {
        if (typeof tool[methodName] !== 'function') {
          warnings.push(`${methodName} 应该是函数类型`);
        } else {
          try {
            const validationResult = this.validateMethod(tool, methodSpec);
            if (!validationResult.valid) {
              warnings.push(...validationResult.errors);
            }
          } catch (error) {
            warnings.push(`${methodName} 方法验证时出错: ${error.message}`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 验证特定方法
   * @param {Object} tool - 工具对象
   * @param {Object} methodSpec - 方法规范
   * @returns {Object} 验证结果
   */
  static validateMethod(tool, methodSpec) {
    const errors = [];
    const warnings = [];
    const methodName = methodSpec.name;

    try {
      switch (methodName) {
        case 'getMetadata':
          return this.validateGetMetadata(tool);
        case 'getSchema':
          return this.validateGetSchema(tool);
        case 'execute':
          return this.validateExecute(tool);
        case 'validate':
          return this.validateValidateMethod(tool);
        default:
          return { valid: true, errors: [], warnings: [] };
      }
    } catch (error) {
      errors.push(`${methodName} 方法调用失败: ${error.message}`);
      return { valid: false, errors, warnings };
    }
  }

  /**
   * 验证getMetadata方法
   * @param {Object} tool - 工具对象
   * @returns {Object} 验证结果
   */
  static validateGetMetadata(tool) {
    const errors = [];
    const warnings = [];

    try {
      const metadata = tool.getMetadata();
      
      if (!metadata || typeof metadata !== 'object') {
        errors.push('getMetadata() 必须返回对象');
        return { valid: false, errors, warnings };
      }

      // 验证必需字段
      if (!metadata.name || typeof metadata.name !== 'string') {
        errors.push('metadata.name 必须是非空字符串');
      }

      if (!metadata.description || typeof metadata.description !== 'string') {
        errors.push('metadata.description 必须是非空字符串');
      }

      if (!metadata.version || typeof metadata.version !== 'string') {
        errors.push('metadata.version 必须是非空字符串');
      }

      // 验证可选字段
      if (metadata.category && typeof metadata.category !== 'string') {
        warnings.push('metadata.category 应该是字符串类型');
      }

      if (metadata.author && typeof metadata.author !== 'string') {
        warnings.push('metadata.author 应该是字符串类型');
      }

    } catch (error) {
      errors.push(`getMetadata() 执行失败: ${error.message}`);
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * 验证getSchema方法
   * @param {Object} tool - 工具对象
   * @returns {Object} 验证结果
   */
  static validateGetSchema(tool) {
    const errors = [];
    const warnings = [];

    try {
      const schema = tool.getSchema();
      
      if (!schema || typeof schema !== 'object') {
        errors.push('getSchema() 必须返回对象');
        return { valid: false, errors, warnings };
      }

      // 基础JSON Schema验证
      if (!schema.type) {
        warnings.push('schema.type 建议定义');
      }

      if (schema.type && typeof schema.type !== 'string') {
        errors.push('schema.type 必须是字符串');
      }

      if (schema.properties && typeof schema.properties !== 'object') {
        errors.push('schema.properties 必须是对象');
      }

      if (schema.required && !Array.isArray(schema.required)) {
        errors.push('schema.required 必须是数组');
      }

    } catch (error) {
      errors.push(`getSchema() 执行失败: ${error.message}`);
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * 验证execute方法
   * @param {Object} tool - 工具对象
   * @returns {Object} 验证结果
   */
  static validateExecute(tool) {
    const errors = [];
    const warnings = [];

    // 检查方法签名
    const executeMethod = tool.execute;
    if (executeMethod.length === 0) {
      warnings.push('execute() 方法建议接受parameters参数');
    }

    // 注意：这里不实际调用execute方法，因为可能有副作用
    // 只进行静态检查

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * 验证validate方法（可选）
   * @param {Object} tool - 工具对象
   * @returns {Object} 验证结果
   */
  static validateValidateMethod(tool) {
    const errors = [];
    const warnings = [];

    try {
      // 测试validate方法的返回格式
      const testParams = {};
      const result = tool.validate(testParams);
      
      if (!result || typeof result !== 'object') {
        errors.push('validate() 必须返回对象');
        return { valid: false, errors, warnings };
      }

      if (typeof result.valid !== 'boolean') {
        errors.push('validate() 返回值必须包含valid(boolean)字段');
      }

      if (result.errors && !Array.isArray(result.errors)) {
        errors.push('validate() 返回值的errors字段必须是数组');
      }

    } catch (error) {
      warnings.push(`validate() 方法测试失败: ${error.message}`);
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * 为工具提供默认的validate方法实现
   * @param {Object} tool - 工具对象
   * @param {Object} parameters - 待验证参数
   * @returns {Object} 验证结果
   */
  static defaultValidate(tool, parameters) {
    const errors = [];
    const missing = [];
    const typeErrors = [];

    try {
      // 获取schema
      const schema = tool.getSchema();

      // 基础类型检查
      if (!parameters || typeof parameters !== 'object') {
        errors.push('参数必须是对象类型');
        return { valid: false, errors, missing, typeErrors };
      }

      // 适配新的schema格式：支持 schema.parameters 或直接使用 schema
      // 标准格式: { parameters: {...}, environment: {...} }
      // 兼容格式: { type: 'object', properties: {...}, required: [...] }
      const paramSchema = schema.parameters || schema;

      // 必需参数检查
      if (paramSchema.required && Array.isArray(paramSchema.required)) {
        for (const field of paramSchema.required) {
          if (!(field in parameters)) {
            errors.push(`缺少必需参数: ${field}`);
            missing.push(field);
          }
        }
      }

      // 基础字段类型检查
      if (paramSchema.properties && typeof paramSchema.properties === 'object') {
        for (const [field, fieldSchema] of Object.entries(paramSchema.properties)) {
          if (field in parameters) {
            const value = parameters[field];
            const expectedType = fieldSchema.type;

            if (expectedType && !this.validateType(value, expectedType)) {
              const errorMsg = `参数 ${field} 类型错误，期望 ${expectedType}，实际 ${typeof value}`;
              errors.push(errorMsg);
              typeErrors.push({
                param: field,
                expected: expectedType,
                actual: typeof value
              });
            }
          }
        }
      }

    } catch (error) {
      errors.push(`参数验证失败: ${error.message}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      missing,
      typeErrors
    };
  }

  /**
   * 类型验证辅助方法
   * @param {*} value - 待验证值
   * @param {string} expectedType - 期望类型
   * @returns {boolean} 是否匹配
   */
  static validateType(value, expectedType) {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return typeof value === 'object' && value !== null;
      case 'array':
        return Array.isArray(value);
      default:
        return true; // 未知类型，跳过验证
    }
  }

  /**
   * 生成工具接口报告
   * @param {Object} tool - 工具对象
   * @returns {Object} 接口报告
   */
  static generateInterfaceReport(tool) {
    const validation = this.validateTool(tool);
    const report = {
      toolName: 'unknown',
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings,
      implementedMethods: {
        required: [],
        optional: []
      },
      metadata: null,
      schema: null
    };

    try {
      // 获取工具名称
      if (tool.getMetadata) {
        const metadata = tool.getMetadata();
        report.toolName = metadata.name || 'unknown';
        report.metadata = metadata;
      }

      // 获取schema
      if (tool.getSchema) {
        report.schema = tool.getSchema();
      }

      // 检查已实现的方法
      for (const methodSpec of TOOL_INTERFACE.required) {
        if (typeof tool[methodSpec.name] === 'function') {
          report.implementedMethods.required.push(methodSpec.name);
        }
      }

      for (const methodSpec of TOOL_INTERFACE.optional) {
        if (typeof tool[methodSpec.name] === 'function') {
          report.implementedMethods.optional.push(methodSpec.name);
        }
      }

    } catch (error) {
      report.warnings.push(`生成报告时出错: ${error.message}`);
    }

    return report;
  }
}

module.exports = ToolValidator;