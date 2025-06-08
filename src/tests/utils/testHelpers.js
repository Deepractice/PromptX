const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * 异步执行命令并返回结果
 * @param {string} command - 要执行的命令
 * @param {object} options - 执行选项
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
const safeExecAsync = async (command, options = {}) => {
  try {
    const result = await execAsync(command, {
      timeout: 30000, // 30秒超时
      maxBuffer: 10 * 1024 * 1024, // 10MB输出缓冲
      ...options
    });
    return result;
  } catch (error) {
    // 如果是非零退出码，但有输出，仍然返回结果
    if (error.stdout || error.stderr) {
      return {
        stdout: error.stdout || '',
        stderr: error.stderr || '',
        code: error.code
      };
    }
    throw error;
  }
};

/**
 * 提取角色ID列表从hello命令输出
 * @param {string} helloOutput - hello命令的输出
 * @returns {string[]} 角色ID数组
 */
const extractRoleIds = (helloOutput) => {
  const roleIdRegex = /\*\*角色ID\*\*:\s*`([^`]+)`/g;
  const roleIds = [];
  let match;
  while ((match = roleIdRegex.exec(helloOutput)) !== null) {
    roleIds.push(match[1]);
  }
  return roleIds;
};

/**
 * 等待指定时间
 * @param {number} ms - 毫秒数
 * @returns {Promise<void>}
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 验证角色输出格式是否正确
 * @param {string} output - 命令输出
 * @returns {boolean}
 */
const validateRoleListFormat = (output) => {
  const requiredPatterns = [
    /🤖.*AI专业角色服务清单/,
    /可用角色列表/,
    /\*\*角色ID\*\*/,
    /激活命令/
  ];
  
  return requiredPatterns.every(pattern => pattern.test(output));
};

/**
 * 创建临时测试目录名称
 * @param {string} prefix - 前缀
 * @returns {string}
 */
const createTempDirName = (prefix = 'test') => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

module.exports = {
  execAsync: safeExecAsync,
  extractRoleIds,
  delay,
  validateRoleListFormat,
  createTempDirName
}; 