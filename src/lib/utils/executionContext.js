const fs = require('fs');
const path = require('path');
const os = require('os');
const logger = require('./logger');
const { getDirectoryService } = require('./DirectoryService');

/**
 * 执行上下文检测工具 (已重构)
 * 
 * 现在使用统一的DirectoryService提供路径解析
 * 保持向后兼容的API，但内部使用新的架构
 * 
 * @deprecated 推荐直接使用 DirectoryService
 * 
 * 注意：此文件主要保留向后兼容的同步API
 * 
 * 调试模式：设置环境变量 PROMPTX_DEBUG=true 启用详细日志
 * 示例：export PROMPTX_DEBUG=true && promptx mcp-server
 * 新代码请直接使用 DirectoryService 的异步API
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
 * 使用新的DirectoryService进行路径解析
 * @returns {string} 工作目录路径
 */
function getMCPWorkingDirectory() {
  try {
    const directoryService = getDirectoryService();
    
    // 使用新的统一路径解析服务
    // 注意：这是异步操作，但为了保持API兼容性，我们需要同步处理
    // 在实际使用中，建议迁移到异步版本
    const context = {
      startDir: process.cwd(),
      platform: process.platform,
      avoidUserHome: true
    };
    
    // 同步获取工作空间目录
    // TODO: 在后续版本中迁移到异步API
    return getWorkspaceSynchronous(context);
    
  } catch (error) {
    logger.warn('[executionContext] 使用新服务失败，回退到旧逻辑:', error.message);
    return getMCPWorkingDirectoryLegacy();
  }
}

/**
 * 同步获取工作空间（临时解决方案）
 * @param {Object} context - 查找上下文
 * @returns {string} 工作空间路径
 */
function getWorkspaceSynchronous(context) {
  // 获取调试模式设置
  const debug = process.env.PROMPTX_DEBUG === 'true';
  
  if (debug) {
    console.error('🔍 [executionContext] 工作空间检测开始');
    console.error(`🔍 [executionContext] 当前目录: ${process.cwd()}`);
  }
  
  // 策略1：IDE环境变量
  const workspacePaths = process.env.WORKSPACE_FOLDER_PATHS;
  if (workspacePaths) {
    try {
      const folders = JSON.parse(workspacePaths);
      if (Array.isArray(folders) && folders.length > 0) {
        const firstFolder = folders[0];
        if (isValidDirectory(firstFolder)) {
          if (debug) console.error(`[执行上下文] 使用IDE工作空间: ${firstFolder}`);
          return firstFolder;
        }
      }
    } catch {
      // 忽略解析错误，尝试直接使用
      const firstPath = workspacePaths.split(path.delimiter)[0];
      if (firstPath && isValidDirectory(firstPath)) {
        if (debug) console.error(`[执行上下文] 使用IDE工作空间: ${firstPath}`);
        return firstPath;
      }
    }
  }

  // 策略2：PromptX专用环境变量
  const promptxWorkspaceEnv = process.env.PROMPTX_WORKSPACE;
  if (promptxWorkspaceEnv && promptxWorkspaceEnv.trim() !== '') {
    const promptxWorkspace = normalizePath(expandHome(promptxWorkspaceEnv));
    if (isValidDirectory(promptxWorkspace)) {
      if (debug) console.error(`[执行上下文] 使用PROMPTX_WORKSPACE: ${promptxWorkspace}`);
      return promptxWorkspace;
    }
  }

  // 策略3：使用新架构的ProjectManager
  try {
    const ProjectManager = require('./ProjectManager');
    if (ProjectManager.isInitialized()) {
      const projectPath = ProjectManager.getCurrentProjectPath();
      if (debug) console.error(`[执行上下文] 使用ProjectManager当前项目: ${projectPath}`);
      return projectPath;
    }
  } catch (error) {
    // ProjectManager未初始化，继续其他策略
  }

  // 策略4：PWD环境变量
  const pwd = process.env.PWD;
  if (pwd && isValidDirectory(pwd) && pwd !== process.cwd()) {
    if (debug) console.error(`[执行上下文] 使用PWD环境变量: ${pwd}`);
    return pwd;
  }

  // 策略6：回退到当前目录
  const fallbackPath = process.cwd();
  if (debug) {
    console.error(`[执行上下文] 回退到当前目录: ${fallbackPath}`);
    console.error(`[执行上下文] 建议在MCP配置中添加 "env": {"PROMPTX_WORKSPACE": "你的项目目录"}`);
  }
  return fallbackPath;
}

/**
 * 旧版MCP工作目录获取逻辑（兼容性备用）
 * @deprecated
 */
function getMCPWorkingDirectoryLegacy() {
  // 保留原始的同步逻辑作为备份
  return process.cwd();
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

/**
 * 规范化路径
 */
function normalizePath(p) {
  return path.normalize(p);
}

/**
 * 展开家目录路径
 */
function expandHome(filepath) {
  if (!filepath || typeof filepath !== 'string') {
    return '';
  }
  
  if (filepath.startsWith('~/') || filepath === '~') {
    return path.join(os.homedir(), filepath.slice(2));
  }
  
  return filepath;
}

module.exports = {
  getExecutionContext,
  isValidDirectory,
  getDebugInfo
}; 