const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { cli } = require('../core/pouch');
const { MCPOutputAdapter } = require('../adapters/MCPOutputAdapter');
const { getExecutionContext, getDebugInfo } = require('../utils/executionContext');
const { getToolDefinitions } = require('../mcp/toolDefinitions');
const treeKill = require('tree-kill');

/**
 * MCP Server 适配器 - 函数调用架构
 * 将MCP协议请求转换为PromptX函数调用，实现零开销适配
 * 支持智能工作目录检测，确保MCP和CLI模式下的一致性
 */
class MCPServerCommand {
  constructor() {
    this.name = 'promptx-mcp-server';
    this.version = '1.0.0';
    this.debug = process.env.MCP_DEBUG === 'true';
    
    // 智能检测执行上下文
    this.executionContext = getExecutionContext();
    
    // 调试信息输出
    this.log(`🎯 检测到执行模式: ${this.executionContext.mode}`);
    this.log(`📍 原始工作目录: ${this.executionContext.originalCwd}`);
    this.log(`📁 目标工作目录: ${this.executionContext.workingDirectory}`);
    
    // 如果需要切换工作目录
    if (this.executionContext.workingDirectory !== this.executionContext.originalCwd) {
      this.log(`🔄 切换工作目录: ${this.executionContext.originalCwd} -> ${this.executionContext.workingDirectory}`);
      try {
        process.chdir(this.executionContext.workingDirectory);
        this.log(`✅ 工作目录切换成功`);
      } catch (error) {
        this.log(`❌ 工作目录切换失败: ${error.message}`);
        this.log(`🔄 继续使用原始目录: ${this.executionContext.originalCwd}`);
      }
    }
    
    // 基本调试信息
    this.log(`📂 最终工作目录: ${process.cwd()}`);
    this.log(`📋 预期记忆文件路径: ${require('path').join(process.cwd(), '.promptx/memory/declarative.md')}`);
    
    // DirectoryService路径信息将在需要时异步获取
    
    // 输出完整调试信息
    if (this.debug) {
      this.log(`🔍 完整调试信息: ${JSON.stringify(getDebugInfo(), null, 2)}`);
    }
    
    // 创建输出适配器
    this.outputAdapter = new MCPOutputAdapter();
    
    // 创建MCP服务器实例 - 使用正确的API
    this.server = new Server(
      {
        name: this.name,
        version: this.version
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );
    
    this.setupHandlers();
  }
  
  /**
   * 调试日志 - 输出到stderr，不影响MCP协议
   */
  log(message) {
    if (this.debug) {
      console.error(`[MCP DEBUG] ${message}`);
    }
  }
  
  /**
   * 启动MCP Server
   */
  async execute(options = {}) {
    try {
      // 设置进程清理处理器
      this.setupProcessCleanup();
      
      // 如果需要启动DACP服务
      if (options.withDacp) {
        await this.startDACPService();
      }
      
      this.log('🚀 启动MCP Server...');
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      this.log('✅ MCP Server 已启动，等待连接...');
      
      // 保持进程运行
      return new Promise((resolve) => {
        // MCP服务器现在正在运行，监听stdin输入
        process.on('SIGINT', () => {
          this.log('🛑 收到SIGINT信号，正在关闭...');
          this.cleanup();
          resolve();
        });
        
        process.on('SIGTERM', () => {
          this.log('🛑 收到SIGTERM信号，正在关闭...');
          this.cleanup();
          resolve();
        });
      });
    } catch (error) {
      // 输出到stderr
      console.error(`❌ MCP Server 启动失败: ${error.message}`);
      this.cleanup();
      throw error;
    }
  }
  
  /**
   * 设置进程清理处理器
   */
  setupProcessCleanup() {
    // 处理各种退出情况
    const exitHandler = (signal) => {
      this.log(`收到信号: ${signal}`);
      this.cleanup();
      process.exit(0);
    };
    
    // 捕获所有可能的退出信号
    process.on('exit', () => this.cleanup());
    process.on('SIGHUP', () => exitHandler('SIGHUP'));
    process.on('SIGQUIT', () => exitHandler('SIGQUIT'));
    process.on('uncaughtException', (err) => {
      console.error('未捕获的异常:', err);
      this.cleanup();
      process.exit(1);
    });
    process.on('unhandledRejection', (reason, promise) => {
      console.error('未处理的Promise拒绝:', reason);
      this.cleanup();
      process.exit(1);
    });
  }
  
  /**
   * 清理子进程
   */
  cleanup() {
    if (this.dacpProcess && !this.dacpProcess.killed && this.dacpProcess.pid) {
      this.log('🛑 正在终止DACP服务及其所有子进程...');
      
      // 使用 tree-kill 终止整个进程树
      treeKill(this.dacpProcess.pid, 'SIGTERM', (err) => {
        if (err) {
          this.log(`⚠️ 优雅终止失败: ${err.message}`);
          
          // 3秒后强制终止
          setTimeout(() => {
            if (this.dacpProcess && !this.dacpProcess.killed && this.dacpProcess.pid) {
              this.log('⚠️ DACP服务未响应SIGTERM，强制终止整个进程树...');
              treeKill(this.dacpProcess.pid, 'SIGKILL', (killErr) => {
                if (killErr) {
                  this.log(`❌ 强制终止失败: ${killErr.message}`);
                } else {
                  this.log('✅ DACP服务进程树已强制终止');
                }
              });
            }
          }, 3000);
        } else {
          this.log('✅ DACP服务进程树已优雅终止');
        }
      });
    }
  }
  
  /**
   * 检测DACP服务是否已经运行
   * @param {string} host - 主机地址
   * @param {number} port - 端口号
   * @returns {Promise<boolean>} 服务是否运行
   */
  async isDACPServiceRunning(host = 'localhost', port = 3002) {
    const http = require('http');
    
    return new Promise((resolve) => {
      const options = {
        hostname: host,
        port: port,
        path: '/health',
        method: 'GET',
        timeout: 2000 // 2秒超时
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const healthData = JSON.parse(data);
            // 检查是否是DACP服务且状态健康
            const isHealthy = healthData.status === 'healthy';
            const isDACPService = healthData.service && healthData.service.includes('DACP');
            resolve(isHealthy && isDACPService);
          } catch (error) {
            resolve(false);
          }
        });
      });

      req.on('error', () => {
        resolve(false);
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });

      req.end();
    });
  }

  /**
   * 获取DACP服务信息
   * @param {string} host - 主机地址  
   * @param {number} port - 端口号
   * @returns {Promise<Object|null>} 服务信息
   */
  async getDACPServiceInfo(host = 'localhost', port = 3002) {
    const http = require('http');
    
    return new Promise((resolve) => {
      const options = {
        hostname: host,
        port: port,
        path: '/info',
        method: 'GET',
        timeout: 2000
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const serviceInfo = JSON.parse(data);
            resolve(serviceInfo);
          } catch (error) {
            resolve(null);
          }
        });
      });

      req.on('error', () => {
        resolve(null);
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });

      req.end();
    });
  }

  /**
   * 启动DACP服务
   */
  async startDACPService() {
    const { spawn } = require('child_process');
    const path = require('path');
    
    try {
      this.log('🔍 检测DACP服务状态...');
      
      // 先检测是否已有DACP服务运行
      const isRunning = await this.isDACPServiceRunning();
      
      if (isRunning) {
        // 服务已存在，获取服务信息并直接使用
        const serviceInfo = await this.getDACPServiceInfo();
        console.error(''); // 空行分隔
        console.error('=====================================');
        console.error('🔄 发现现有DACP服务，直接复用');
        console.error('📍 DACP服务地址: http://localhost:3002');
        if (serviceInfo) {
          console.error(`🏷️ 服务名称: ${serviceInfo.service?.name || 'Unknown'}`);
          console.error(`📦 服务版本: ${serviceInfo.service?.version || 'Unknown'}`);
          console.error(`🔧 可用操作: ${serviceInfo.available_actions?.join(', ') || 'Unknown'}`);
        }
        console.error('=====================================');
        console.error(''); // 空行分隔
        return; // 直接返回，不启动新服务
      }
      
      this.log('🚀 启动新的DACP服务...');
      
      // DACP服务路径
      const dacpPath = path.join(__dirname, '../../dacp/dacp-promptx-service');
      
      // 启动DACP服务作为子进程
      // 注意：不能直接使用 'inherit'，因为会干扰MCP的stdio通信
      // 但我们需要看到DACP的启动信息
      this.dacpProcess = spawn('node', ['server.js'], {
        cwd: dacpPath,
        stdio: ['ignore', 'pipe', 'pipe'], // stdin忽略, stdout和stderr都输出到pipe
        shell: true,
        detached: false // tree-kill 会处理整个进程树，不需要 detached
      });
      
      // 将DACP的输出转发到stderr（这样不会干扰MCP的stdout）
      this.dacpProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
          console.error(`[DACP] ${output}`);
        }
      });
      
      this.dacpProcess.stderr.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
          console.error(`[DACP ERROR] ${output}`);
        }
      });
      
      // 监听子进程退出
      this.dacpProcess.on('exit', (code, signal) => {
        this.log(`DACP服务已退出 (code: ${code}, signal: ${signal})`);
        this.dacpProcess = null;
      });
      
      // 监听子进程错误
      this.dacpProcess.on('error', (err) => {
        console.error(`DACP进程错误: ${err.message}`);
      });
      
      // 等待服务启动 - 通过监听输出来判断
      await new Promise((resolve, reject) => {
        let started = false;
        const timeout = setTimeout(() => {
          if (!started) {
            reject(new Error('DACP服务启动超时'));
          }
        }, 10000); // 10秒超时
        
        // 监听输出，判断服务是否启动
        const checkStarted = (data) => {
          const output = data.toString();
          // 检查是否包含启动成功的标志
          if (output.includes('Running at http://localhost:') || 
              output.includes('🚀') || 
              output.includes('DACP') ||
              output.includes('3002')) {
            if (!started) {
              started = true;
              clearTimeout(timeout);
              console.error(''); // 空行分隔
              console.error('=====================================');
              console.error('✅ DACP服务启动成功');
              console.error('📍 DACP服务地址: http://localhost:3002');
              console.error('🔧 支持的Actions: send_email, schedule_meeting, create_document');
              console.error('=====================================');
              console.error(''); // 空行分隔
              resolve();
            }
          }
        };
        
        this.dacpProcess.stdout.on('data', checkStarted);
        
        this.dacpProcess.on('error', (err) => {
          clearTimeout(timeout);
          reject(new Error(`DACP服务启动失败: ${err.message}`));
        });
        
        this.dacpProcess.on('exit', (code) => {
          if (!started) {
            clearTimeout(timeout);
            reject(new Error(`DACP服务意外退出，退出码: ${code}`));
          }
        });
      });
      
    } catch (error) {
      this.log(`❌ DACP服务启动失败: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * 设置MCP工具处理程序 - 使用正确的MCP SDK API
   */
  setupHandlers() {
    // 使用Schema常量进行注册
    const { 
      ListToolsRequestSchema, 
      CallToolRequestSchema 
    } = require('@modelcontextprotocol/sdk/types.js');
    
    // 注册工具列表处理程序
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      this.log('📋 收到工具列表请求');
      return {
        tools: this.getToolDefinitions()
      };
    });
    
    // 注册工具调用处理程序
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      this.log(`🔧 调用工具: ${name} 参数: ${JSON.stringify(args)}`);
      return await this.callTool(name, args || {});
    });
  }
  
  /**
   * 获取工具定义
   */
  getToolDefinitions() {
    return getToolDefinitions();
  }
  
  /**
   * 执行工具调用
   */
  async callTool(toolName, args) {
    try {
      // 将MCP参数转换为CLI函数调用参数
      const cliArgs = this.convertMCPToCliParams(toolName, args);
      this.log(`🎯 CLI调用: ${toolName} -> ${JSON.stringify(cliArgs)}`);
      this.log(`🗂️ 当前工作目录: ${process.cwd()}`);
      
      // 直接调用PromptX CLI函数 - 启用静默模式避免console.log干扰MCP协议
      const result = await cli.execute(toolName.replace('promptx_', ''), cliArgs, true);
      this.log(`✅ CLI执行完成: ${toolName}`);
      
      // 使用输出适配器转换为MCP响应格式
      return this.outputAdapter.convertToMCPFormat(result);
      
    } catch (error) {
      this.log(`❌ 工具调用失败: ${toolName} - ${error.message}`);
      return this.outputAdapter.handleError(error);
    }
  }
  
  /**
   * 转换MCP参数为CLI函数调用参数
   */
  convertMCPToCliParams(toolName, mcpArgs) {
    const paramMapping = {
      'promptx_init': (args) => args.workingDirectory ? [args] : [],
      
      'promptx_welcome': () => [],
      
      'promptx_action': (args) => [args.role],
      
      'promptx_learn': (args) => args.resource ? [args.resource] : [],
      
      'promptx_recall': (args) => {
        // 忽略random_string dummy参数，只处理query
        // 处理各种空值情况：undefined、null、空对象、空字符串
        if (!args || !args.query || typeof args.query !== 'string' || args.query.trim() === '') {
          return [];
        }
        return [args.query];
      },
      
      'promptx_remember': (args) => {
        const result = [args.content];
        if (args.tags) {
          result.push('--tags', args.tags);
        }
        return result;
      },
      
      'promptx_dacp': (args) => [args]
    };
    
    const mapper = paramMapping[toolName];
    if (!mapper) {
      throw new Error(`未知工具: ${toolName}`);
    }
    
    return mapper(mcpArgs);
  }
}

module.exports = { MCPServerCommand }; 