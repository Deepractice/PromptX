/**
 * 版本信息工具
 * 统一管理PromptX版本信息的获取
 */

let cachedVersion = null;

/**
 * 获取PromptX版本号
 * @returns {string} 版本号
 */
function getVersion() {
  if (cachedVersion) {
    return cachedVersion;
  }
  
  try {
    const packageJson = require('../../../package.json');
    cachedVersion = packageJson.version || '1.0.0';
  } catch {
    cachedVersion = '1.0.0';
  }
  
  return cachedVersion;
}

/**
 * 获取完整版本信息（包含Node版本）
 * @returns {string} 完整版本信息
 */
function getFullVersion() {
  const version = getVersion();
  const nodeVersion = process.version;
  return `${version} (Node.js ${nodeVersion})`;
}

module.exports = {
  getVersion,
  getFullVersion
};