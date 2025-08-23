/**
 * 服务管理器 - 用于BDD测试中管理PromptX服务的生命周期
 */
const { spawn } = require('child_process');
const path = require('path');
const axios = require('axios');
const net = require('net');

class ServiceManager {
  constructor() {
    this.serverProcess = null;
    this.port = null;
    this.baseUrl = null;
    this.startTimeout = 5000; // 默认5秒启动超时
    this.stopTimeout = 5000;  // 默认5秒停止超时
  }

  /**
   * 启动PromptX HTTP服务
   */
  async start(port = 4001, options = {}) {
    if (this.serverProcess) {
      throw new Error('服务已经在运行');
    }

    // 先检查端口是否被占用
    const isPortFree = await this.checkPortFree(port);
    if (!isPortFree) {
      throw new Error(`端口 ${port} 已被占用`);
    }

    this.port = port;
    this.baseUrl = `http://localhost:${port}`;

    // 获取promptx可执行文件路径
    const promptxPath = path.join(__dirname, '../../src/bin/promptx.js');
    
    // 启动服务进程
    this.serverProcess = spawn('node', [
      promptxPath,
      'mcp-server',
      '-t', 'http',
      '-p', port.toString(),
      '--debug'
    ], {
      env: { ...process.env, MCP_DEBUG: 'false' },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    // 标记启动错误
    let startupError = null;

    // 收集输出用于调试
    this.serverProcess.stdout.on('data', (data) => {
      if (process.env.DEBUG_BDD) {
        console.log(`[SERVER OUT] ${data.toString()}`);
      }
    });

    this.serverProcess.stderr.on('data', (data) => {
      const output = data.toString();
      if (process.env.DEBUG_BDD) {
        console.error(`[SERVER ERR] ${output}`);
      }
      // 检查端口占用错误
      if (output.includes('EADDRINUSE') || output.includes('address already in use')) {
        startupError = new Error(`端口 ${port} 已被占用`);
      }
    });

    // 监听进程退出
    this.serverProcess.once('exit', (code, signal) => {
      if (code !== 0 && !startupError) {
        startupError = new Error(`服务启动失败，退出码: ${code}`);
      }
    });

    // 等待服务启动
    try {
      await this.waitForServerReady(options.timeout || this.startTimeout);
      
      // 如果有启动错误，抛出
      if (startupError) {
        this.serverProcess = null;
        throw startupError;
      }
      
      return {
        pid: this.serverProcess.pid,
        port: this.port,
        baseUrl: this.baseUrl
      };
    } catch (error) {
      // 清理进程
      if (this.serverProcess) {
        this.serverProcess.kill('SIGKILL');
        this.serverProcess = null;
      }
      throw error;
    }
  }

  /**
   * 停止服务
   */
  async stop(options = {}) {
    if (!this.serverProcess) {
      return { message: '服务未运行' };
    }

    const timeout = options.timeout || this.stopTimeout;
    
    return new Promise((resolve, reject) => {
      let killed = false;

      // 设置超时
      const timer = setTimeout(() => {
        if (!killed) {
          this.serverProcess.kill('SIGKILL');
          reject(new Error('服务停止超时，强制终止'));
        }
      }, timeout);

      // 监听进程退出
      this.serverProcess.once('exit', (code, signal) => {
        killed = true;
        clearTimeout(timer);
        this.serverProcess = null;
        this.port = null;
        this.baseUrl = null;
        resolve({
          code,
          signal,
          message: '服务已停止'
        });
      });

      // 发送优雅关闭信号
      this.serverProcess.kill('SIGTERM');
    });
  }

  /**
   * 检查服务是否在运行
   */
  isRunning() {
    return this.serverProcess !== null && !this.serverProcess.killed;
  }

  /**
   * 获取服务进程ID
   */
  getPid() {
    return this.serverProcess ? this.serverProcess.pid : null;
  }

  /**
   * 等待服务就绪
   */
  async waitForServerReady(timeout = 5000) {
    const startTime = Date.now();
    const checkInterval = 100;

    while (Date.now() - startTime < timeout) {
      try {
        // 尝试发送一个简单的MCP请求来检查服务是否就绪
        const response = await axios.post(`${this.baseUrl}/mcp`, {
          jsonrpc: '2.0',
          method: 'initialize',
          params: {
            protocolVersion: '0.1.0',
            capabilities: {},
            clientInfo: {
              name: 'bdd-test',
              version: '1.0.0'
            }
          },
          id: 'test-ready'
        }, {
          timeout: 1000,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.data && (response.data.result || response.data.error)) {
          return true;
        }
      } catch (error) {
        // 426 Upgrade Required 是HTTP Stream的正常响应
        // 406 Not Acceptable 也表示服务在运行
        if (error.response && (error.response.status === 426 || error.response.status === 406)) {
          return true;
        }
        // 服务还未就绪，继续等待
        if (process.env.DEBUG_BDD) {
          console.log(`等待服务就绪: ${error.message}`);
        }
      }

      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }

    throw new Error(`服务在${timeout}ms内未能启动`);
  }

  /**
   * 检查端口是否可访问
   */
  async isPortAccessible(port = null) {
    const targetPort = port || this.port;
    if (!targetPort) {
      return false;
    }

    try {
      // 尝试发送一个OPTIONS请求来检查服务是否响应
      const response = await axios.options(`http://localhost:${targetPort}/mcp`, {
        timeout: 1000
      });
      return true;
    } catch (error) {
      // 如果是CORS错误或其他HTTP错误，说明服务在运行
      if (error.response) {
        return true;
      }
      return false;
    }
  }

  /**
   * 发送MCP初始化请求
   */
  async sendMcpInitialize() {
    if (!this.baseUrl) {
      throw new Error('服务未运行');
    }

    const response = await axios.post(`${this.baseUrl}/mcp`, {
      jsonrpc: '2.0',
      method: 'initialize',
      params: {
        protocolVersion: '0.1.0',
        capabilities: {
          roots: { listChanged: false },
          sampling: {}
        },
        clientInfo: {
          name: 'bdd-test-client',
          version: '1.0.0'
        }
      },
      id: 1
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  }

  /**
   * 获取服务健康状态
   */
  async getHealth() {
    if (!this.baseUrl) {
      throw new Error('服务未运行');
    }

    const response = await axios.get(`${this.baseUrl}/health`);
    return response.data;
  }

  /**
   * 强制终止服务（用于清理）
   */
  forceKill() {
    if (this.serverProcess && !this.serverProcess.killed) {
      this.serverProcess.kill('SIGKILL');
      this.serverProcess = null;
      this.port = null;
      this.baseUrl = null;
    }
  }

  /**
   * 检查端口是否空闲
   */
  checkPortFree(port) {
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          resolve(false);
        } else {
          resolve(false);
        }
      });
      
      server.once('listening', () => {
        server.close();
        resolve(true);
      });
      
      server.listen(port);
    });
  }
}

module.exports = ServiceManager;