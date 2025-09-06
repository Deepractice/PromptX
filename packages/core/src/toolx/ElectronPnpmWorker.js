/**
 * ElectronPnpmWorker - Electron环境下的pnpm安装器
 * 
 * 使用utilityProcess创建隔离的Node.js进程执行pnpm安装
 * 完全避免Electron主进程的副作用（如自动更新检查）
 */

const path = require('path');
const logger = require('@promptx/logger');
const PnpmInstaller = require('./PnpmInstaller');

class ElectronPnpmWorker {
  /**
   * 在Electron环境中安装pnpm依赖
   * @param {Object} options - 安装选项
   * @param {string} options.workingDir - 工作目录
   * @param {Object|Array} options.dependencies - 依赖列表
   * @param {number} options.timeout - 超时时间（毫秒）
   * @returns {Promise<Object>} 安装结果
   */
  static async install({ workingDir, dependencies, timeout = 30000 }) {
    const startTime = Date.now();
    
    try {
      // 获取utilityProcess
      const { utilityProcess } = require('electron');
      
      if (!utilityProcess || typeof utilityProcess.fork !== 'function') {
        throw new Error('utilityProcess.fork not available in current Electron version');
      }
      
      // 获取worker脚本路径
      const workerPath = path.join(__dirname, 'electron-pnpm-worker-script.js');
      
      logger.debug(`[ElectronPnpmWorker] Creating utilityProcess worker: ${workerPath}`);
      
      // 创建utilityProcess
      const worker = utilityProcess.fork(workerPath);
      
      return new Promise((resolve, reject) => {
        let workerTimeout;
        let isResolved = false;
        
        // 设置超时
        workerTimeout = setTimeout(() => {
          if (isResolved) return;
          isResolved = true;
          
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          logger.error(`[ElectronPnpmWorker] Installation timeout after ${elapsed}s`);
          
          try {
            worker.kill();
          } catch (killError) {
            logger.warn(`[ElectronPnpmWorker] Error killing worker: ${killError.message}`);
          }
          
          reject(new Error(`pnpm installation timeout after ${elapsed}s`));
        }, timeout);
        
        // 监听worker消息
        worker.on('message', (message) => {
          const { type, data, error: errorMsg, details } = message;
          
          logger.debug(`[ElectronPnpmWorker] Received message: ${type}`);
          
          switch (type) {
            case 'log':
              logger.debug(`[ElectronPnpmWorker] ${data}`);
              break;
              
            case 'success':
              if (isResolved) return;
              isResolved = true;
              
              clearTimeout(workerTimeout);
              logger.info(`[ElectronPnpmWorker] ${data.message}`);
              
              try {
                worker.kill();
              } catch (killError) {
                logger.warn(`[ElectronPnpmWorker] Error killing worker: ${killError.message}`);
              }
              
              resolve({
                stdout: data.stdout || '',
                stderr: data.stderr || '',
                elapsed: data.elapsed
              });
              break;
              
            case 'error':
              if (isResolved) return;
              isResolved = true;
              
              clearTimeout(workerTimeout);
              logger.error(`[ElectronPnpmWorker] Worker error: ${errorMsg}`);
              
              if (details) {
                logger.error(`[ElectronPnpmWorker] Error details:`, details);
              }
              
              try {
                worker.kill();
              } catch (killError) {
                logger.warn(`[ElectronPnpmWorker] Error killing worker: ${killError.message}`);
              }
              
              reject(new Error(errorMsg));
              break;
              
            default:
              logger.warn(`[ElectronPnpmWorker] Unknown message type: ${type}`);
          }
        });
        
        // 监听worker进程事件
        worker.on('spawn', () => {
          logger.debug(`[ElectronPnpmWorker] Worker process spawned successfully`);
          
          // 准备安装参数
          const installOptions = {
            workingDir,
            dependencies,
            pnpmBinaryPath: PnpmInstaller.getPnpmBinaryPath(),
            pnpmArgs: PnpmInstaller.getOptimizedPnpmArgs(),
            depsList: PnpmInstaller.buildDependenciesList(dependencies)
          };
          
          // 发送安装命令到worker
          worker.postMessage({
            command: 'install',
            options: installOptions
          });
        });
        
        worker.on('exit', (code) => {
          if (isResolved) return;
          
          clearTimeout(workerTimeout);
          
          if (code !== 0) {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            logger.error(`[ElectronPnpmWorker] Worker process exited with code ${code} after ${elapsed}s`);
            
            if (!isResolved) {
              isResolved = true;
              reject(new Error(`Worker process exited with code ${code}`));
            }
          }
        });
        
        worker.on('error', (error) => {
          if (isResolved) return;
          isResolved = true;
          
          clearTimeout(workerTimeout);
          logger.error(`[ElectronPnpmWorker] Worker process error: ${error.message}`);
          reject(new Error(`Worker process error: ${error.message}`));
        });
      });
      
    } catch (error) {
      logger.error(`[ElectronPnpmWorker] Failed to create utilityProcess: ${error.message}`);
      throw new Error(`Failed to create pnpm worker: ${error.message}`);
    }
  }
}

module.exports = ElectronPnpmWorker;