/**
 * SystemErrors.js - 系统和环境相关错误定义
 * 这些错误通常是PromptX系统问题或环境问题
 */

const SYSTEM_ERRORS = {
  DEPENDENCY_INSTALL_FAILED: {
    code: 'DEPENDENCY_INSTALL_FAILED',
    category: 'SYSTEM',
    description: '依赖安装失败',
    identify: (error) => {
      return error.message.includes('pnpm install failed') ||
             error.message.includes('npm ERR') ||
             error.message.includes('yarn error') ||
             error.message.includes('Failed to install dependencies');
    },
    getSolution: (error) => {
      return {
        message: '依赖安装失败，可能是网络问题',
        suggestions: [
          '1. 检查网络连接',
          '2. 尝试更换 npm 镜像源',
          '3. 使用 rebuild 模式重试',
          '4. 清理缓存后重试'
        ],
        autoRecoverable: true,
        retryDelay: 5000,
        retryMode: 'rebuild'
      };
    }
  },

  SANDBOX_INIT_FAILED: {
    code: 'SANDBOX_INIT_FAILED',
    category: 'SYSTEM',
    description: '沙箱环境初始化失败',
    identify: (error) => {
      return error.message.includes('Failed to create sandbox') ||
             error.message.includes('VM context error') ||
             error.message.includes('Sandbox initialization failed');
    },
    getSolution: (error) => {
      return {
        message: '沙箱环境初始化失败',
        suggestions: [
          '1. 重启 PromptX 服务',
          '2. 清理 ~/.promptx/toolbox 目录',
          '3. 检查目录权限',
          '4. 报告给 PromptX 团队'
        ],
        autoRecoverable: false
      };
    }
  },

  NETWORK_TIMEOUT: {
    code: 'NETWORK_TIMEOUT',
    category: 'SYSTEM',
    description: '网络请求超时',
    identify: (error) => {
      return error.message.includes('timeout') ||
             error.message.includes('ETIMEDOUT') ||
             error.message.includes('ESOCKETTIMEDOUT') ||
             error.code === 'ETIMEDOUT';
    },
    getSolution: (error, context) => {
      const currentTimeout = context.timeout || 30000;
      const newTimeout = Math.min(currentTimeout * 2, 300000); // 最长5分钟
      
      return {
        message: '网络请求超时',
        detail: `当前超时时间: ${currentTimeout}ms`,
        suggestions: [
          '1. 检查网络连接',
          '2. 增加超时时间重试',
          '3. 检查目标服务是否可访问'
        ],
        autoRecoverable: true,
        retryParams: { timeout: newTimeout }
      };
    }
  },

  DISK_SPACE_ERROR: {
    code: 'DISK_SPACE_ERROR',
    category: 'SYSTEM',
    description: '磁盘空间不足',
    identify: (error) => {
      return error.message.includes('ENOSPC') ||
             error.message.includes('No space left on device') ||
             error.message.includes('disk full');
    },
    getSolution: (error) => {
      return {
        message: '磁盘空间不足',
        suggestions: [
          '1. 清理磁盘空间',
          '2. 清理 ~/.promptx/toolbox 目录',
          '3. 清理 npm/pnpm 缓存'
        ],
        autoRecoverable: false
      };
    }
  },

  PERMISSION_DENIED: {
    code: 'PERMISSION_DENIED',
    category: 'SYSTEM',
    description: '权限不足',
    identify: (error) => {
      return error.message.includes('EACCES') ||
             error.message.includes('Permission denied') ||
             error.message.includes('operation not permitted');
    },
    getSolution: (error, context) => {
      const path = error.message.match(/['"](\/[^'"]+)['"]/)?.[1] || context.sandboxPath;
      
      return {
        message: '文件或目录权限不足',
        detail: `路径: ${path}`,
        suggestions: [
          '1. 检查文件/目录权限',
          '2. 确保 PromptX 有写入权限',
          '3. 尝试修复权限: chmod -R 755 ~/.promptx'
        ],
        autoRecoverable: false
      };
    }
  },

  MEMORY_ERROR: {
    code: 'MEMORY_ERROR',
    category: 'SYSTEM',
    description: '内存不足',
    identify: (error) => {
      return error.message.includes('JavaScript heap out of memory') ||
             error.message.includes('Cannot allocate memory') ||
             error.message.includes('ENOMEM');
    },
    getSolution: (error) => {
      return {
        message: '内存不足',
        suggestions: [
          '1. 关闭其他应用释放内存',
          '2. 增加 Node.js 内存限制',
          '3. 优化工具减少内存使用'
        ],
        autoRecoverable: false
      };
    }
  },

  PACKAGE_REGISTRY_ERROR: {
    code: 'PACKAGE_REGISTRY_ERROR',
    category: 'SYSTEM',
    description: '包注册源访问失败',
    identify: (error) => {
      return error.message.includes('registry error') ||
             error.message.includes('npm registry') ||
             error.message.includes('E404') ||
             error.message.includes('tarball');
    },
    getSolution: (error) => {
      return {
        message: 'npm/pnpm 包注册源访问失败',
        suggestions: [
          '1. 检查网络连接',
          '2. 尝试使用镜像源: npm config set registry https://registry.npmmirror.com',
          '3. 检查包名和版本是否正确',
          '4. 稍后重试'
        ],
        autoRecoverable: true,
        retryDelay: 10000
      };
    }
  },

  VM_EXECUTION_ERROR: {
    code: 'VM_EXECUTION_ERROR',
    category: 'SYSTEM',
    description: 'VM 执行环境错误',
    identify: (error) => {
      return error.message.includes('VM execution') ||
             error.message.includes('sandbox context') ||
             error.message.includes('vm.Script');
    },
    getSolution: (error) => {
      return {
        message: 'VM 执行环境错误',
        detail: 'PromptX 沙箱执行环境异常',
        suggestions: [
          '1. 重启 PromptX 服务',
          '2. 报告问题给 PromptX 团队'
        ],
        autoRecoverable: false
      };
    }
  },

  TOOL_NOT_FOUND: {
    code: 'TOOL_NOT_FOUND',
    category: 'SYSTEM',
    description: '工具未找到',
    identify: (error) => {
      return error.message.includes('Tool not found') ||
             error.message.includes('Failed to load tool');
    },
    getSolution: (error, context) => {
      return {
        message: '指定的工具不存在',
        toolId: context?.toolId,
        suggestions: [
          '1. 检查工具ID是否正确',
          '2. 确认工具已安装',
          '3. 使用 discover 命令查看可用工具',
          '4. 尝试重新安装工具'
        ],
        autoRecoverable: false
      };
    }
  },

  UNKNOWN_ERROR: {
    code: 'UNKNOWN_ERROR',
    category: 'SYSTEM',
    description: '未知系统错误',
    identify: (error) => {
      // 这是最后的兜底
      return true;
    },
    getSolution: (error, context) => {
      return {
        message: '未知系统错误',
        detail: error.message,
        stack: error.stack,
        context: context,
        suggestions: [
          '1. 查看错误详情',
          '2. 重试操作',
          '3. 报告问题给开发者'
        ],
        autoRecoverable: false
      };
    }
  }
};

module.exports = SYSTEM_ERRORS;