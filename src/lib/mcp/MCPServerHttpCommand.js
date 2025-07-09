const express = require('express');
const { randomUUID } = require('node:crypto');
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const { SSEServerTransport } = require('@modelcontextprotocol/sdk/server/sse.js');
const { isInitializeRequest } = require('@modelcontextprotocol/sdk/types.js');
const { cli } = require('../core/pouch');
const { MCPOutputAdapter } = require('../mcp/MCPOutputAdapter');
const { getToolDefinitions, getToolDefinition, getToolCliConverter } = require('../mcp/toolDefinitions');
const ProjectManager = require('../utils/ProjectManager');
const { getGlobalProjectManager } = require('../utils/ProjectManager');
const { getGlobalServerEnvironment } = require('../utils/ServerEnvironment');
const logger = require('../utils/logger');

/**
 * MCP HTTP Server Command
 * 实现基于 HTTP 协议的 MCP 服务器
 * 支持 Streamable HTTP 和 SSE 两种传输方式
 */
class MCPServerHttpCommand {
  constructor() {
    this.name = 'promptx-mcp-streamable-http-server';
    this.version = '1.0.0';
    this.transport = 'http';
    this.port = 3000;
    this.host = 'localhost';
    this.transports = {}; // 存储会话传输
    this.outputAdapter = new MCPOutputAdapter();
    this.debug = process.env.MCP_DEBUG === 'true';
  }

  /**
   * 执行命令
   */
  async execute(options = {}) {
    const { 
      transport = 'http', 
      port = 3000, 
      host = 'localhost' 
    } = options;

    // 🚀 初始化ServerEnvironment - 在所有逻辑之前装配服务环境
    const serverEnv = getGlobalServerEnvironment();
    serverEnv.initialize({ transport, host, port });

    // 验证传输类型
    if (!['http', 'sse'].includes(transport)) {
      throw new Error(`Unsupported transport: ${transport}`);
    }

    // 验证配置
    this.validatePort(port);
    this.validateHost(host);

    if (transport === 'http') {
      return this.startStreamableHttpServer(port, host);
    } else if (transport === 'sse') {
      return this.startSSEServer(port, host);
    }
  }

  /**
   * 启动 Streamable HTTP 服务器
   */
  async startStreamableHttpServer(port, host) {
    this.log(`🚀 启动 Streamable HTTP MCP Server...`);
    
    const app = express();
    
    // 中间件设置
    app.use(express.json());
    app.use(this.corsMiddleware.bind(this));

    // 健康检查端点
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        name: this.name, 
        version: this.version, 
        transport: 'http' 
      });
    });

    // OAuth 支持端点 (简化实现)
    app.get('/.well-known/oauth-authorization-server', this.handleOAuthMetadata.bind(this));
    app.get('/.well-known/openid-configuration', this.handleOAuthMetadata.bind(this));
    app.post('/register', this.handleDynamicRegistration.bind(this));
    app.get('/authorize', this.handleAuthorize.bind(this));
    app.post('/token', this.handleToken.bind(this));

    // MCP 端点
    app.post('/mcp', this.handleMCPPostRequest.bind(this));
    app.get('/mcp', this.handleMCPGetRequest.bind(this));
    app.delete('/mcp', this.handleMCPDeleteRequest.bind(this));

    // 错误处理中间件
    app.use(this.errorHandler.bind(this));

    return new Promise((resolve, reject) => {
      const server = app.listen(port, host, () => {
        this.log(`✅ Streamable HTTP MCP Server 运行在 http://${host}:${port}`);
        this.server = server;
        resolve(server);
      });

      server.on('error', reject);
    });
  }

  /**
   * CORS 中间件
   */
  corsMiddleware(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, mcp-session-id');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    
    next();
  }

  /**
   * 错误处理中间件
   */
  errorHandler(error, req, res, next) {
    this.log('Express 错误处理:', error);
    
    if (!res.headersSent) {
      // 检查是否是JSON解析错误
      if (error.type === 'entity.parse.failed' || error.message?.includes('JSON')) {
        res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32700,
            message: 'Parse error: Invalid JSON'
          },
          id: null
        });
      } else {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error'
          },
          id: null
        });
      }
    }
  }

  /**
   * 启动 SSE 服务器
   */
  async startSSEServer(port, host) {
    const app = express();
    app.use(express.json());

    this.log(`🚀 启动 SSE MCP Server...`);
    
    // 健康检查端点
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', name: this.name, version: this.version, transport: 'sse' });
    });

    // SSE 端点 - 建立事件流
    app.get('/mcp', async (req, res) => {
      await this.handleSSEConnection(req, res);
    });

    // 消息端点 - 接收客户端 JSON-RPC 消息
    app.post('/messages', async (req, res) => {
      await this.handleSSEMessage(req, res);
    });

    return new Promise((resolve, reject) => {
      const server = app.listen(port, host, () => {
        this.log(`✅ SSE MCP Server 运行在 http://${host}:${port}`);
        resolve(server);
      });

      server.on('error', reject);
      this.server = server;
    });
  }

  /**
   * 处理 SSE 连接建立
   */
  async handleSSEConnection(req, res) {
    this.log('建立 SSE 连接');
    
    try {
      // 创建 SSE 传输
      const transport = new SSEServerTransport('/messages', res);
      const sessionId = transport.sessionId;
      
      // 存储传输
      this.transports[sessionId] = transport;
      
      // 设置关闭处理程序
      transport.onclose = () => {
        this.log(`SSE 传输关闭: ${sessionId}`);
        delete this.transports[sessionId];
      };

      // 连接到 MCP 服务器
      const server = this.setupMCPServer();
      await server.connect(transport);
      
      this.log(`SSE 流已建立，会话ID: ${sessionId}`);
    } catch (error) {
      this.log('建立 SSE 连接错误:', error);
      if (!res.headersSent) {
        res.status(500).send('Error establishing SSE connection');
      }
    }
  }

  /**
   * 处理 SSE 消息
   */
  async handleSSEMessage(req, res) {
    this.log('收到 SSE 消息:', req.body);

    try {
      // 从查询参数获取会话ID
      const sessionId = req.query.sessionId;
      
      if (!sessionId) {
        res.status(400).send('Missing sessionId parameter');
        return;
      }

      const transport = this.transports[sessionId];
      if (!transport) {
        res.status(404).send('Session not found');
        return;
      }

      // 处理消息
      await transport.handlePostMessage(req, res, req.body);
    } catch (error) {
      this.log('处理 SSE 消息错误:', error);
      if (!res.headersSent) {
        res.status(500).send('Error handling request');
      }
    }
  }

  /**
   * 设置 MCP 服务器 - 使用与 stdio 模式完全相同的低级 API
   */
  setupMCPServer() {
    const server = new Server({
      name: this.name,
      version: this.version
    }, {
      capabilities: {
        tools: {}
      }
    });

    // ✨ 使用与 stdio 模式相同的低级 API 注册处理器
    this.setupMCPHandlers(server);

    return server;
  }

  /**
   * 设置 MCP 处理器 - 与 stdio 模式完全一致的实现
   */
  setupMCPHandlers(server) {
    const { 
      ListToolsRequestSchema, 
      CallToolRequestSchema 
    } = require('@modelcontextprotocol/sdk/types.js');
    
    // 注册工具列表处理程序 - 与 stdio 模式完全相同
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      this.log('📋 收到工具列表请求');
      return {
        tools: this.getToolDefinitions()  // ✅ 直接返回完整工具定义
      };
    });
    
    // 注册工具调用处理程序 - 与 stdio 模式完全相同
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      this.log(`🔧 调用工具: ${name} 参数: ${JSON.stringify(args)}`);
      console.log(`🔧 [强制调试] 工具: ${name} 正确参数: ${JSON.stringify(args)}`);
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
   * 处理 MCP POST 请求
   */
  async handleMCPPostRequest(req, res) {
    this.log('收到 MCP 请求:', req.body);

    try {
      // 检查现有会话 ID
      const sessionId = req.headers['mcp-session-id'];
      let transport;

      if (sessionId && this.transports[sessionId]) {
        // 复用现有传输
        transport = this.transports[sessionId];
      } else if (!sessionId && isInitializeRequest(req.body)) {
        // 新的初始化请求
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          enableJsonResponse: true,
          onsessioninitialized: (sessionId) => {
            this.log(`会话初始化: ${sessionId}`);
            this.transports[sessionId] = transport;
          }
        });

        // 设置关闭处理程序
        transport.onclose = () => {
          const sid = transport.sessionId;
          if (sid && this.transports[sid]) {
            this.log(`传输关闭: ${sid}`);
            delete this.transports[sid];
          }
        };

        // 连接到 MCP 服务器
        const server = this.setupMCPServer();
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
        return;
      } else if (!sessionId && this.isStatelessRequest(req.body)) {
        // 无状态请求（如 tools/list, prompts/list 等）- 使用官方推荐方式
        console.log(`🎯 [官方模式] 无状态请求: ${req.body.method}`);
        
        try {
          const server = this.setupMCPServer();
          const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined, // 无状态模式
            enableJsonResponse: true
          });
          
          // 请求结束时清理资源
          res.on('close', () => {
            console.log('🧹 清理无状态请求资源');
            transport.close && transport.close();
            server.close && server.close();
          });
          
          await server.connect(transport);
          await transport.handleRequest(req, res, req.body);
          return;
        } catch (error) {
          console.error('🔥 无状态请求处理错误:', error);
          throw error;
        }
      } else if (sessionId && !this.transports[sessionId] && this.isStatelessRequest(req.body)) {
        // 🔧 修复：sessionId已失效但是无状态请求，可以处理
        console.log(`🔄 [修复模式] Session已失效，转为无状态处理: ${req.body.method}`);
        
        try {
          const server = this.setupMCPServer();
          const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined, // 无状态模式
            enableJsonResponse: true
          });
          
          await server.connect(transport);
          await transport.handleRequest(req, res, req.body);
          return;
        } catch (error) {
          console.error('🔥 Session修复模式处理错误:', error);
          throw error;
        }
      } else {
        // 无效请求 - 只有真正无法处理的情况才报错
        return res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: `Bad Request: ${sessionId ? 'Invalid session ID' : 'No valid session ID provided'}. Method: ${req.body?.method || 'unknown'}`
          },
          id: req.body?.id || null
        });
      }

      // 处理现有传输的请求
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      this.log('处理 MCP 请求错误:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error'
          },
          id: req.body?.id || null
        });
      }
    }
  }

  /**
   * 处理 MCP GET 请求（SSE）
   */
  async handleMCPGetRequest(req, res) {
    const sessionId = req.headers['mcp-session-id'];
    if (!sessionId || !this.transports[sessionId]) {
      return res.status(400).json({
        error: 'Invalid or missing session ID'
      });
    }

    this.log(`建立 SSE 流: ${sessionId}`);
    const transport = this.transports[sessionId];
    await transport.handleRequest(req, res);
  }

  /**
   * 处理 MCP DELETE 请求（会话终止）
   */
  async handleMCPDeleteRequest(req, res) {
    const sessionId = req.headers['mcp-session-id'];
    if (!sessionId || !this.transports[sessionId]) {
      return res.status(400).json({
        error: 'Invalid or missing session ID'
      });
    }

    this.log(`终止会话: ${sessionId}`);
    try {
      const transport = this.transports[sessionId];
      await transport.handleRequest(req, res);
    } catch (error) {
      this.log('处理会话终止错误:', error);
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Error processing session termination'
        });
      }
    }
  }

  /**
   * 调用工具
   */
  async callTool(toolName, args) {
    try {
      // 将 MCP 参数转换为 CLI 函数调用参数
      console.log(`🎯 [强制调试] 收到MCP参数: ${JSON.stringify(args)}`);
      const cliArgs = this.convertMCPToCliParams(toolName, args);
      console.log(`🎯 [强制调试] 转换后CLI参数: ${JSON.stringify(cliArgs)}`);
      this.log(`🎯 CLI调用: ${toolName} -> ${JSON.stringify(cliArgs)}`);
      
      // 直接调用 PromptX CLI 函数
      this.log(`🎯 传递给CLI的参数: ${JSON.stringify(cliArgs)}`);
      const result = await cli.execute(toolName.replace('promptx_', ''), cliArgs, true);
      this.log(`✅ CLI执行完成: ${toolName}`);
      
      // 使用输出适配器转换为MCP响应格式（与stdio模式保持一致）
      return this.outputAdapter.convertToMCPFormat(result);
      
    } catch (error) {
      this.log(`❌ 工具调用失败: ${toolName} - ${error.message}`);
      return this.outputAdapter.handleError(error);
    }
  }

  /**
   * 转换 MCP 参数为 CLI 函数调用参数 - 使用统一转换逻辑
   */
  convertMCPToCliParams(toolName, mcpArgs) {
    const converter = getToolCliConverter(toolName);
    if (!converter) {
      throw new Error(`未知工具: ${toolName}`);
    }
    
    return converter(mcpArgs || {});
  }

  /**
   * 调试日志
   */
  log(message, ...args) {
    if (this.debug) {
      logger.debug(`[MCP DEBUG] ${message}`, ...args);
    }
  }

  /**
   * 验证端口号
   */
  validatePort(port) {
    if (typeof port !== 'number') {
      throw new Error('Port must be a number');
    }
    if (port < 1 || port > 65535) {
      throw new Error('Port must be between 1 and 65535');
    }
  }

  /**
   * 验证主机地址
   */
  validateHost(host) {
    if (!host || typeof host !== 'string' || host.trim() === '') {
      throw new Error('Host cannot be empty');
    }
  }

  /**
   * 判断是否为无状态请求（不需要会话ID）
   */
  isStatelessRequest(requestBody) {
    if (!requestBody || !requestBody.method) {
      return false;
    }

    // 这些方法可以无状态处理 - 按照官方标准扩展支持所有工具调用
    const statelessMethods = [
      'tools/list',
      'prompts/list', 
      'resources/list',
      'tools/call'  // ✨ 添加工具调用支持无状态模式
    ];

    return statelessMethods.includes(requestBody.method);
  }

  /**
   * OAuth 元数据端点 - 简化实现
   */
  handleOAuthMetadata(req, res) {
    const baseUrl = `http://${req.get('host')}`;
    
    res.json({
      issuer: baseUrl,
      authorization_endpoint: `${baseUrl}/authorize`,
      token_endpoint: `${baseUrl}/token`,
      registration_endpoint: `${baseUrl}/register`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code"],
      code_challenge_methods_supported: ["S256"],
      client_registration_types_supported: ["dynamic"]
    });
  }

  /**
   * 动态客户端注册 - 简化实现
   */
  handleDynamicRegistration(req, res) {
    // 简化实现：直接返回一个客户端ID
    const clientId = `promptx-client-${Date.now()}`;
    const baseUrl = `http://${req.get('host')}`;
    
    res.json({
      client_id: clientId,
      client_secret: "not-required", // 简化实现
      registration_access_token: `reg-token-${Date.now()}`,
      registration_client_uri: `${baseUrl}/register/${clientId}`,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_secret_expires_at: 0, // 永不过期
      redirect_uris: [
        `${baseUrl}/callback`,
        "urn:ietf:wg:oauth:2.0:oob"
      ],
      response_types: ["code"],
      grant_types: ["authorization_code"],
      token_endpoint_auth_method: "none"
    });
  }

  /**
   * OAuth 授权端点 - 简化实现
   */
  handleAuthorize(req, res) {
    // 简化实现：直接返回授权码
    const code = `auth-code-${Date.now()}`;
    const baseUrl = `http://${req.get('host')}`;
    const redirectUri = req.query.redirect_uri || `${baseUrl}/callback`;
    
    res.redirect(`${redirectUri}?code=${code}&state=${req.query.state || ''}`);
  }

  /**
   * OAuth 令牌端点 - 简化实现
   */
  handleToken(req, res) {
    // 简化实现：直接返回访问令牌
    res.json({
      access_token: `access-token-${Date.now()}`,
      token_type: "Bearer",
      expires_in: 3600,
      scope: "mcp"
    });
  }
}

module.exports = { MCPServerHttpCommand };