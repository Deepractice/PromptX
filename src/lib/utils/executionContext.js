const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * 执行上下文检测工具
 * 根据命令入口自动判断执行模式（CLI vs MCP）并获取正确的工作目录
 * 基于MCP社区标准实践，通过环境变量解决cwd获取问题
 */

/**
 * 获取执行上下文信息
 * @returns {Object} 包含模式和工作目录的上下文对象
 */
function getExecutionContext() {
  const args = process.argv;
  const command = args[2]; // 第一个命令参数
  
  const isMCPMode = command === 'mcp-server';
  
  return {
    mode: isMCPMode ? 'MCP' : 'CLI',
    command: command,
    workingDirectory: isMCPMode ? getMCPWorkingDirectory() : process.cwd(),
    originalCwd: process.cwd()
  };
}

/**
 * MCP模式下获取工作目录
 * 基于社区标准实践，优先从环境变量获取配置的工作目录
 * @returns {string} 工作目录路径
 */
function getMCPWorkingDirectory() {
  // 策略1：WORKSPACE_FOLDER_PATHS（VS Code/Cursor标准环境变量）
  const workspacePaths = process.env.WORKSPACE_FOLDER_PATHS;
  if (workspacePaths) {
    // 取第一个工作区路径（多工作区情况）
    const firstPath = workspacePaths.split(path.delimiter)[0];
    if (firstPath && isValidDirectory(firstPath)) {
      console.error(`[执行上下文] 使用WORKSPACE_FOLDER_PATHS: ${firstPath}`);
      return firstPath;
    }
  }

  // 策略2：PROMPTX_WORKSPACE（PromptX专用环境变量）
  const promptxWorkspace = normalizePath(expandHome(process.env.PROMPTX_WORKSPACE || ''));
  if (promptxWorkspace && isValidDirectory(promptxWorkspace)) {
    console.error(`[执行上下文] 使用PROMPTX_WORKSPACE: ${promptxWorkspace}`);
    return promptxWorkspace;
  }

  // 策略3：PWD环境变量（某些情况下可用）
  const pwd = process.env.PWD;
  if (pwd && isValidDirectory(pwd) && pwd !== process.cwd()) {
    console.error(`[执行上下文] 使用PWD环境变量: ${pwd}`);
    return pwd;
  }

  // 策略4：项目根目录智能推测（向上查找项目标识）
  const projectRoot = findProjectRoot(process.cwd());
  if (projectRoot && projectRoot !== process.cwd()) {
    console.error(`[执行上下文] 智能推测项目根目录: ${projectRoot}`);
    return projectRoot;
  }

  // 策略5：回退到process.cwd()
  console.error(`[执行上下文] 回退到process.cwd(): ${process.cwd()}`);
  console.error(`[执行上下文] 提示：建议在MCP配置中添加 "env": {"PROMPTX_WORKSPACE": "你的项目目录"}`);
  return process.cwd();
}

/**
 * 向上查找项目根目录
 * @param {string} startDir 开始查找的目录
 * @returns {string|null} 项目根目录或null
 */
function findProjectRoot(startDir) {
  const projectMarkers = [
    '.promptx',
    'package.json',
    '.git',
    'pyproject.toml',
    'Cargo.toml',
    'go.mod',
    'pom.xml',
    'build.gradle',
    '.gitignore'
  ];

  let currentDir = path.resolve(startDir);
  const root = path.parse(currentDir).root;

  while (currentDir !== root) {
    // 检查是否包含项目标识文件
    for (const marker of projectMarkers) {
      const markerPath = path.join(currentDir, marker);
      if (fs.existsSync(markerPath)) {
        return currentDir;
      }
    }

    // 向上一级目录
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) break; // 防止无限循环
    currentDir = parentDir;
  }

  return null;
}

/**
 * 验证目录是否有效
 * @param {string} dir 要验证的目录路径
 * @returns {boolean} 目录是否有效
 */
function isValidDirectory(dir) {
  try {
    if (!dir || typeof dir !== 'string') {
      return false;
    }
    
    const resolvedDir = path.resolve(dir);
    const stat = fs.statSync(resolvedDir);
    
    return stat.isDirectory();
  } catch {
    return false;
  }
}

/**
 * 获取调试信息
 * @returns {Object} 调试信息对象
 */
function getDebugInfo() {
  const context = getExecutionContext();
  
  return {
    processArgv: process.argv,
    processCwd: process.cwd(),
    detectedMode: context.mode,
    detectedWorkingDirectory: context.workingDirectory,
    environmentVariables: {
      WORKSPACE_FOLDER_PATHS: process.env.WORKSPACE_FOLDER_PATHS || 'undefined',
      PROMPTX_WORKSPACE: process.env.PROMPTX_WORKSPACE || 'undefined',
      PWD: process.env.PWD || 'undefined'
    },
    nodeVersion: process.version,
    platform: process.platform
  };
}


function normalizePath(p) {
  return path.normalize(p);
}

function expandHome(filepath) {
  if (filepath.startsWith('~/') || filepath === '~') {
    return path.join(os.homedir(), filepath.slice(1));
  }
  return filepath;
}

module.exports = {
  getExecutionContext,
  isValidDirectory,
  getDebugInfo
}; 