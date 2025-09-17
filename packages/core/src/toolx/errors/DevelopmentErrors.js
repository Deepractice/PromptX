/**
 * DevelopmentErrors.js - 工具开发相关错误定义
 * 这些错误表示工具代码本身有问题，需要开发者修复
 */

const DEVELOPMENT_ERRORS = {
  UNDECLARED_DEPENDENCY: {
    code: 'UNDECLARED_DEPENDENCY',
    category: 'DEVELOPMENT',
    description: '工具使用了未声明的依赖包',
    identify: (error, context) => {
      const message = error.message.toLowerCase();
      if (!message.includes('cannot find module') && !message.includes('cannot resolve')) {
        return false;
      }
      
      // 提取模块名
      const moduleMatch = error.message.match(/Cannot (?:find|resolve) module ['\"]([^'\"]+)['"]/);
      if (!moduleMatch) return false;
      
      const moduleName = moduleMatch[1];
      
      // 检查是否已声明
      if (context.dependencies) {
        if (typeof context.dependencies === 'object') {
          return !Object.keys(context.dependencies).includes(moduleName);
        }
      }
      
      return true;
    },
    getSolution: (error, context) => {
      const moduleMatch = error.message.match(/Cannot (?:find|resolve) module ['\"]([^'\"]+)['"]/);
      const moduleName = moduleMatch ? moduleMatch[1] : 'unknown';
      
      return {
        message: `在 getDependencies() 中添加依赖声明`,
        code: `getDependencies() {
  return {
    '${moduleName}': 'latest'
  };
}`,
        autoRecoverable: false
      };
    }
  },

  TOOL_SYNTAX_ERROR: {
    code: 'TOOL_SYNTAX_ERROR',
    category: 'DEVELOPMENT',
    description: '工具代码存在语法错误',
    identify: (error) => {
      return error instanceof SyntaxError ||
             error.message.includes('Unexpected token') ||
             error.message.includes('Unexpected identifier');
    },
    getSolution: (error) => {
      // 尝试提取行号
      const lineMatch = error.stack && error.stack.match(/:(\d+):(\d+)/);
      const line = lineMatch ? lineMatch[1] : 'unknown';
      
      return {
        message: `修复工具代码的语法错误`,
        detail: `错误位置：第 ${line} 行\n错误信息：${error.message}`,
        autoRecoverable: false
      };
    }
  },

  INVALID_TOOL_EXPORT: {
    code: 'INVALID_TOOL_EXPORT',
    category: 'DEVELOPMENT',
    description: '工具未正确导出必需的接口',
    identify: (error) => {
      return error.message.includes('does not export') ||
             error.message.includes('is not a function') ||
             error.message.includes('Tool must export') ||
             error.message.includes('missing required method');
    },
    getSolution: (error) => {
      // 尝试识别缺失的方法
      const methodMatch = error.message.match(/method ['\"]?(\w+)['\"]?/);
      const method = methodMatch ? methodMatch[1] : 'execute';
      
      return {
        message: `确保工具正确导出所有必需的方法`,
        code: `module.exports = {
  getMetadata() { /* ... */ },
  getSchema() { /* ... */ },
  async execute(params) { /* ... */ }
};`,
        autoRecoverable: false
      };
    }
  },

  INTERFACE_NOT_IMPLEMENTED: {
    code: 'INTERFACE_NOT_IMPLEMENTED',
    category: 'DEVELOPMENT',
    description: '工具未实现必需的接口方法',
    identify: (error) => {
      return error.message.includes('not implemented') ||
             error.message.includes('must implement');
    },
    getSolution: (error) => {
      const methodMatch = error.message.match(/['\"]?(\w+)['\"]? (?:not implemented|must implement)/);
      const method = methodMatch ? methodMatch[1] : 'unknown';
      
      return {
        message: `实现缺失的接口方法: ${method}`,
        autoRecoverable: false
      };
    }
  },

  DEPENDENCY_DECLARED_BUT_MISSING: {
    code: 'DEPENDENCY_DECLARED_BUT_MISSING',
    category: 'DEVELOPMENT',
    description: '依赖已声明但模块中实际未使用正确',
    identify: (error, context) => {
      const message = error.message.toLowerCase();
      if (!message.includes('cannot find module')) return false;
      
      const moduleMatch = error.message.match(/Cannot (?:find|resolve) module ['\"]([^'\"]+)['"]/);
      if (!moduleMatch) return false;
      
      const moduleName = moduleMatch[1];
      
      // 检查是否已声明（已声明但仍然找不到）
      if (context.dependencies && typeof context.dependencies === 'object') {
        return Object.keys(context.dependencies).includes(moduleName);
      }
      
      return false;
    },
    getSolution: (error, context) => {
      return {
        message: '依赖已声明但安装失败，尝试使用 rebuild 模式重新安装',
        autoRecoverable: true,
        retryMode: 'rebuild'
      };
    }
  }
};

module.exports = DEVELOPMENT_ERRORS;