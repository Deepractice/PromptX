/**
 * electron-pnpm-worker-script.js
 * 
 * 运行在utilityProcess中的纯净Node.js进程
 * 专门处理pnpm安装，完全隔离Electron环境
 */

const { spawn } = require('child_process');

// 监听来自主进程的消息
process.on('message', async (data) => {
  const { command, options } = data;
  
  if (command === 'install') {
    await handlePnpmInstall(options);
  } else {
    sendError(`Unknown command: ${command}`);
  }
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
      PATH: process.env.PATH,
      NODE_ENV: 'production',
      CI: '1',
      // 关键：移除所有Electron相关环境变量
      ELECTRON_RUN_AS_NODE: undefined,
      ELECTRON_NODE_PATH: undefined,
      PROMPTX_NODE_EXECUTABLE: undefined,
      PROMPTX_DISABLE_AUTO_UPDATE: undefined
    };
    
    // 构建完整的命令参数
    const fullArgs = [pnpmBinaryPath, ...pnpmArgs];
    
    sendLog(`Executing: node ${fullArgs.join(' ')}`);
    sendLog(`Working directory: ${workingDir}`);
    
    // 30秒内部超时保护
    const timeout = setTimeout(() => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      sendLog(`pnpm command timeout after ${elapsed}s, terminating...`);
      pnpm.kill('SIGTERM');
      reject(new Error(`pnpm command timeout after ${elapsed}s`));
    }, 29000); // 比外层超时稍短
    
    const pnpm = spawn('node', fullArgs, {
      cwd: workingDir,
      env: cleanEnv,
      stdio: 'pipe'
    });
    
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
  process.send({
    type: 'log',
    data: message
  });
}

/**
 * 发送成功结果到主进程
 */
function sendSuccess(data) {
  process.send({
    type: 'success',
    data: data
  });
}

/**
 * 发送错误消息到主进程
 */
function sendError(message, details = {}) {
  process.send({
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