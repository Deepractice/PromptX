/**
 * electron-pnpm-worker-script.js
 * 
 * 运行在utilityProcess中的纯净Node.js进程
 * 专门处理pnpm安装，完全隔离Electron环境
 */

const { spawn } = require('child_process');

// 启动消息
console.log('UtilityProcess worker script started');

// 监听来自主进程的消息 - 使用标准的parentPort通信
process.parentPort.on('message', async (e) => {
  try {
    console.log('Raw message received:', e);
    
    // utilityProcess 的消息格式可能直接在 e 中，或者在 e.data 中
    const data = e.data || e;
    
    console.log('Processed data:', data);
    console.log('Data type:', typeof data);
    console.log('Data keys:', Object.keys(data || {}));
    
    const { command, options } = data;
    
    if (command === 'install') {
      await handlePnpmInstall(options);
    } else {
      sendError(`Unknown command: ${command}`);
    }
  } catch (error) {
    sendError(`Worker script error: ${error.message}`, { stack: error.stack });
  }
});

// 监听未捕获的错误
process.on('uncaughtException', (error) => {
  sendError(`Uncaught exception: ${error.message}`, { stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  sendError(`Unhandled rejection: ${reason}`, { promise: promise.toString() });
  process.exit(1);
});

/**
 * 处理pnpm安装命令
 * @param {Object} options - 安装选项
 */
async function handlePnpmInstall(options) {
  const { workingDir, pnpmBinaryPath, pnpmArgs, depsList } = options;
  const startTime = Date.now();
  
  sendLog(`Starting pnpm install in: ${workingDir}`);
  sendLog(`Dependencies: [${depsList}]`);
  sendLog(`Command: node ${pnpmBinaryPath} ${pnpmArgs.join(' ')}`);
  
  try {
    const result = await runPnpmCommand(pnpmBinaryPath, pnpmArgs, workingDir, startTime);
    
    sendSuccess({
      message: `Dependencies installed successfully in ${result.elapsed}s`,
      stdout: result.stdout,
      stderr: result.stderr,
      elapsed: result.elapsed
    });
    
  } catch (error) {
    sendError(`pnpm install failed: ${error.message}`, {
      workingDir,
      depsList,
      elapsed: ((Date.now() - startTime) / 1000).toFixed(1)
    });
  }
}

/**
 * 执行pnpm命令
 * @param {string} pnpmBinaryPath - pnpm二进制路径
 * @param {string[]} pnpmArgs - pnpm参数
 * @param {string} workingDir - 工作目录
 * @param {number} startTime - 开始时间
 * @returns {Promise<Object>} 执行结果
 */
function runPnpmCommand(pnpmBinaryPath, pnpmArgs, workingDir, startTime) {
  return new Promise((resolve, reject) => {
    // 使用完全纯净的Node.js环境
    const cleanEnv = {
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
      
      // 设置pnpm配置
      PNPM_HOME: process.env.PNPM_HOME,
      
      // 确保非交互模式
      npm_config_yes: 'true',
      npm_config_audit: 'false'
      
      // 注意：不设置任何Electron相关环境变量
      // ELECTRON_RUN_AS_NODE、ELECTRON_NODE_PATH等被自动排除
    };
    
    // 构建完整的命令参数
    const fullArgs = [pnpmBinaryPath, ...pnpmArgs];
    
    sendLog(`Executing: node ${fullArgs.join(' ')}`);
    sendLog(`Working directory: ${workingDir}`);
    
    const pnpm = spawn('node', fullArgs, {
      cwd: workingDir,
      env: cleanEnv,
      stdio: 'pipe'
    });
    
    // 30秒内部超时保护
    const timeout = setTimeout(() => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      sendLog(`pnpm command timeout after ${elapsed}s, terminating...`);
      pnpm.kill('SIGTERM');
      reject(new Error(`pnpm command timeout after ${elapsed}s`));
    }, 29000); // 比外层超时稍短
    
    let stdout = '';
    let stderr = '';
    
    pnpm.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      // 只记录重要输出，避免日志过多
      if (output.includes('Progress:') || output.includes('Done') || output.includes('error')) {
        sendLog(`stdout: ${output.trim()}`);
      }
    });
    
    pnpm.stderr.on('data', (data) => {
      const error = data.toString();
      stderr += error;
      sendLog(`stderr: ${error.trim()}`);
    });
    
    pnpm.on('close', (code) => {
      clearTimeout(timeout);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      
      if (code === 0) {
        sendLog(`pnpm completed successfully in ${elapsed}s`);
        resolve({ stdout, stderr, elapsed });
      } else {
        sendLog(`pnpm failed with exit code ${code} after ${elapsed}s`);
        reject(new Error(`pnpm exited with code ${code}: ${stderr}`));
      }
    });
    
    pnpm.on('error', (error) => {
      clearTimeout(timeout);
      sendLog(`Failed to spawn pnpm: ${error.message}`);
      reject(new Error(`Failed to spawn pnpm: ${error.message}`));
    });
  });
}

/**
 * 发送日志消息到主进程
 */
function sendLog(message) {
  process.parentPort.postMessage({
    type: 'log',
    data: message
  });
}

/**
 * 发送成功结果到主进程
 */
function sendSuccess(data) {
  process.parentPort.postMessage({
    type: 'success',
    data: data
  });
}

/**
 * 发送错误消息到主进程
 */
function sendError(message, details = {}) {
  process.parentPort.postMessage({
    type: 'error',
    error: message,
    details: details
  });
}

// 处理进程退出信号
process.on('SIGTERM', () => {
  sendLog('Worker received SIGTERM, exiting...');
  process.exit(0);
});

process.on('SIGINT', () => {
  sendLog('Worker received SIGINT, exiting...');
  process.exit(0);
});

// 启动完成
sendLog('Electron pnpm worker started and ready');