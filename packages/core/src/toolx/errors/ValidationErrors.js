/**
 * ValidationErrors.js - 参数和环境验证错误定义
 * 这些错误由系统自动检测，基于工具的 getSchema() 和 getMetadata()
 */

const VALIDATION_ERRORS = {
  MISSING_REQUIRED_PARAM: {
    code: 'MISSING_REQUIRED_PARAM',
    category: 'VALIDATION',
    description: '缺少必需的参数',
    identify: (error, context) => {
      // 基于 schema.required 自动检测
      if (context.validationResult && !context.validationResult.valid) {
        return context.validationResult.errors.some(e => 
          e.includes('required') || e.includes('missing'));
      }
      return error.message.includes('Missing required parameter') ||
             error.message.includes('required property');
    },
    getSolution: (error, context) => {
      const missing = context.validationResult?.missing || [];
      return {
        message: `提供必需的参数`,
        params: missing.length > 0 ? missing : 'Check schema for required parameters',
        example: missing.length > 0 ? 
          `{ ${missing.map(p => `"${p}": "value"`).join(', ')} }` : null,
        autoRecoverable: false
      };
    }
  },

  INVALID_PARAM_TYPE: {
    code: 'INVALID_PARAM_TYPE',
    category: 'VALIDATION',
    description: '参数类型错误',
    identify: (error, context) => {
      if (context.validationResult && !context.validationResult.valid) {
        return context.validationResult.errors.some(e => 
          e.includes('type') || e.includes('should be'));
      }
      return /expected (string|number|boolean|object|array) but got/i.test(error.message) ||
             error.message.includes('type mismatch');
    },
    getSolution: (error, context) => {
      const typeErrors = context.validationResult?.typeErrors || [];
      return {
        message: '修正参数类型',
        detail: typeErrors.length > 0 ? 
          typeErrors.map(e => `${e.param}: 期望 ${e.expected}, 实际 ${e.actual}`).join('\n') :
          '检查参数类型是否符合 schema 定义',
        autoRecoverable: false
      };
    }
  },

  PARAM_OUT_OF_RANGE: {
    code: 'PARAM_OUT_OF_RANGE',
    category: 'VALIDATION',
    description: '参数值超出允许范围',
    identify: (error) => {
      return /out of range|exceeds maximum|below minimum/i.test(error.message) ||
             error.message.includes('enum') ||
             error.message.includes('not in allowed values');
    },
    getSolution: (error, context) => {
      return {
        message: '参数值超出允许范围',
        detail: '请检查参数值是否在允许的范围内',
        autoRecoverable: false
      };
    }
  },

  MISSING_ENV_VAR: {
    code: 'MISSING_ENV_VAR',
    category: 'VALIDATION',
    description: '缺少必需的环境变量',
    identify: (error, context) => {
      // 基于 metadata.envVars 的 required 字段检测
      if (context.missingEnvVars && context.missingEnvVars.length > 0) {
        return true;
      }
      return error.message.includes('Missing environment variable') ||
             error.message.includes('env var not set') ||
             error.message.includes('缺少必需的配置');
    },
    getSolution: (error, context) => {
      const missing = context.missingEnvVars || [];
      const envVar = missing[0] || error.message.match(/variable ['\"]?(\w+)['\"]?/)?.[1] || 'UNKNOWN';
      
      return {
        message: `使用 configure 模式设置环境变量`,
        command: `toolx configure --set ${envVar}=value`,
        detail: missing.length > 0 ? 
          `缺少环境变量: ${missing.join(', ')}` : 
          `缺少环境变量: ${envVar}`,
        autoRecoverable: false
      };
    }
  },

  INVALID_ENV_VAR_VALUE: {
    code: 'INVALID_ENV_VAR_VALUE',
    category: 'VALIDATION',
    description: '环境变量值无效',
    identify: (error) => {
      return error.message.includes('Invalid environment variable') ||
             error.message.includes('env var invalid');
    },
    getSolution: (error, context) => {
      return {
        message: '检查环境变量值是否正确',
        detail: '使用 configure 模式重新设置',
        autoRecoverable: false
      };
    }
  },

  SCHEMA_VALIDATION_FAILED: {
    code: 'SCHEMA_VALIDATION_FAILED',
    category: 'VALIDATION',
    description: '参数未通过 schema 验证',
    identify: (error, context) => {
      return context.validationResult && !context.validationResult.valid;
    },
    getSolution: (error, context) => {
      const errors = context.validationResult?.errors || [];
      return {
        message: '参数验证失败',
        errors: errors,
        detail: errors.length > 0 ? errors.join('\n') : '请检查参数格式',
        autoRecoverable: false
      };
    }
  }
};

/**
 * 基于 schema 自动验证参数
 */
function validateAgainstSchema(params, schema) {
  const errors = [];
  const missing = [];
  const typeErrors = [];
  
  if (!schema || !schema.properties) {
    return { valid: true };
  }
  
  // 检查必需参数
  if (schema.required && Array.isArray(schema.required)) {
    for (const required of schema.required) {
      if (params[required] === undefined || params[required] === null) {
        missing.push(required);
        errors.push(`Missing required parameter: ${required}`);
      }
    }
  }
  
  // 检查类型
  for (const [key, def] of Object.entries(schema.properties)) {
    if (params[key] !== undefined && params[key] !== null) {
      const actualType = typeof params[key];
      const expectedType = def.type;
      
      if (expectedType && actualType !== expectedType) {
        // 特殊处理 array 类型
        if (expectedType === 'array' && !Array.isArray(params[key])) {
          typeErrors.push({ param: key, expected: 'array', actual: actualType });
          errors.push(`Parameter ${key} should be array but got ${actualType}`);
        } else if (expectedType !== 'array' && actualType !== expectedType) {
          typeErrors.push({ param: key, expected: expectedType, actual: actualType });
          errors.push(`Parameter ${key} should be ${expectedType} but got ${actualType}`);
        }
      }
      
      // 检查枚举值
      if (def.enum && !def.enum.includes(params[key])) {
        errors.push(`Parameter ${key} must be one of: ${def.enum.join(', ')}`);
      }
      
      // 检查范围
      if (typeof params[key] === 'number') {
        if (def.minimum !== undefined && params[key] < def.minimum) {
          errors.push(`Parameter ${key} must be >= ${def.minimum}`);
        }
        if (def.maximum !== undefined && params[key] > def.maximum) {
          errors.push(`Parameter ${key} must be <= ${def.maximum}`);
        }
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    missing,
    typeErrors
  };
}

/**
 * 基于 metadata.envVars 检查环境变量
 */
function checkMissingEnvVars(envVars, environment) {
  const missing = [];
  
  if (!envVars || !Array.isArray(envVars)) {
    return missing;
  }
  
  for (const envVar of envVars) {
    if (envVar.required && !environment[envVar.name]) {
      missing.push(envVar.name);
    }
  }
  
  return missing;
}

module.exports = {
  VALIDATION_ERRORS,
  validateAgainstSchema,
  checkMissingEnvVars
};