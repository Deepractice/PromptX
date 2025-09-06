/**
 * SystemPnpmRunner - 系统Node.js环境下的pnpm安装器
 * 
 * 直接使用系统Node.js执行pnpm安装
 * 适用于CLI环境或非Electron环境
 */

const { spawn } = require('child_process');
const logger = require('@promptx/logger');
const PnpmInstaller = require('./PnpmInstaller');

class SystemPnpmRunner {
  /**
   * 在系统Node.js环境中安装pnpm依赖
   * @param {Object} options - 安装选项
   * @param {string} options.workingDir - 工作目录
   * @param {Object|Array} options.dependencies - 依赖列表
   * @param {number} options.timeout - 超时时间（毫秒）
   * @returns {Promise<Object>} 安装结果
   */
  static async install({ workingDir, dependencies, timeout = 30000 }) {
    const startTime = Date.now();
    const depsList = PnpmInstaller.buildDependenciesList(dependencies);
    
    logger.debug(`[SystemPnpmRunner] Installing in system Node.js environment`);
    logger.debug(`[SystemPnpmRunner] Working directory: ${workingDir}`);
    logger.debug(`[SystemPnpmRunner] Dependencies: [${depsList}]`);
    
    return new Promise((resolve, reject) => {
      // 获取pnpm二进制路径和参数
      const pnpmBinaryPath = PnpmInstaller.getPnpmBinaryPath();
      const pnpmArgs = PnpmInstaller.getOptimizedPnpmArgs();
      
      // 准备执行环境
      const cleanEnv = this.createCleanEnvironment();
      const fullArgs = [pnpmBinaryPath, ...pnpmArgs];
      
      logger.info(`[SystemPnpmRunner] Executing: node ${fullArgs.join(' ')}`);
      
      // 设置超时
      const timeoutHandle = setTimeout(() => {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        logger.error(`[SystemPnpmRunner] Installation timeout after ${elapsed}s`);
        
        try {
          pnpm.kill('SIGTERM');
        } catch (killError) {
          logger.warn(`[SystemPnpmRunner] Error killing process: ${killError.message}`);
        }
        
        reject(new Error(`pnpm installation timeout after ${elapsed}s`));
      }, timeout);
      
      // 启动pnpm进程
      const pnpm = spawn('node', fullArgs, {
        cwd: workingDir,
        env: cleanEnv,
        stdio: 'pipe'
      });
      
      let stdout = '';
      let stderr = '';
      
      // 处理输出
      pnpm.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        
        // 只记录重要的输出
        const trimmedOutput = output.trim();
        if (trimmedOutput && (
          trimmedOutput.includes('Progress:') ||
          trimmedOutput.includes('Done') ||
          trimmedOutput.includes('error') ||
          trimmedOutput.includes('WARN') ||
          trimmedOutput.includes('ERR')
        )) {
          logger.debug(`[SystemPnpmRunner] ${trimmedOutput}`);
        }
      });
      
      pnpm.stderr.on('data', (data) => {
        const error = data.toString();
        stderr += error;
        
        const trimmedError = error.trim();
        if (trimmedError) {
          logger.warn(`[SystemPnpmRunner] stderr: ${trimmedError}`);
        }
      });
      
      // 处理进程结束
      pnpm.on('close', (code) => {
        clearTimeout(timeoutHandle);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        
        if (code === 0) {
          logger.info(`[SystemPnpmRunner] Installation completed successfully in ${elapsed}s`);
          resolve({
            stdout,
            stderr,
            elapsed
          });
        } else {
          logger.error(`[SystemPnpmRunner] Installation failed with exit code ${code} after ${elapsed}s`);
          
          // 输出错误详情用于调试
          if (stderr.trim()) {
            logger.error(`[SystemPnpmRunner] Error output: ${stderr.trim()}`);
          }
          
          reject(new Error(`pnpm install failed with code ${code}: ${stderr}`));
        }
      });
      
      // 处理进程启动错误
      pnpm.on('error', (error) => {
        clearTimeout(timeoutHandle);
        logger.error(`[SystemPnpmRunner] Failed to spawn pnpm process: ${error.message}`);
        reject(new Error(`Failed to spawn pnpm: ${error.message}`));
      });
    });
  }
  
  /**
   * 创建干净的执行环境
   * @returns {Object} 环境变量对象
   */
  static createCleanEnvironment() {
    return {
      // 保留必要的系统环境变量
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      USER: process.env.USER,
      USERPROFILE: process.env.USERPROFILE,
      APPDATA: process.env.APPDATA,
      LOCALAPPDATA: process.env.LOCALAPPDATA,
      
      // 设置Node.js和pnpm相关环境
      NODE_ENV: 'production',
      CI: '1',
      
      // 移除可能干扰的环境变量
      ELECTRON_RUN_AS_NODE: undefined,
      ELECTRON_NODE_PATH: undefined,
      PROMPTX_NODE_EXECUTABLE: undefined,
      PROMPTX_DISABLE_AUTO_UPDATE: undefined,
      
      // 设置pnpm配置
      PNPM_HOME: process.env.PNPM_HOME,
      
      // 确保非交互模式
      npm_config_yes: 'true',
      npm_config_audit: 'false'
    };
  }
  
  /**
   * 检查系统Node.js环境
   * @returns {Promise<boolean>} 是否可用
   */
  static async checkSystemNode() {
    return new Promise((resolve) => {
      const nodeCheck = spawn('node', ['--version'], { stdio: 'pipe' });
      
      nodeCheck.on('close', (code) => {
        resolve(code === 0);
      });
      
      nodeCheck.on('error', () => {
        resolve(false);
      });
      
      // 2秒超时
      setTimeout(() => {
        try {
          nodeCheck.kill();
        } catch (e) {
          // ignore
        }
        resolve(false);
      }, 2000);
    });
  }
}

module.exports = SystemPnpmRunner;