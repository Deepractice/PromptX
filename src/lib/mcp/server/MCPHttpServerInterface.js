/**
 * MCPHttpServerInterface - MCP HTTP 服务器接口规范
 * 定义 HTTP/SSE 传输的 MCP 服务器接口
 */

/**
 * HTTP MCP 服务器接口规范定义
 */
const MCP_HTTP_SERVER_INTERFACE = {
  // 必须实现的方法
  required: [
    {
      name: 'getMetadata',
      signature: '() => Object',
      description: '获取服务器元信息',
      returns: {
        name: 'string - 服务器名称',
        version: 'string - 版本号',
        transport: 'string - 传输类型（http/sse）',
        capabilities: 'Object - 服务器能力描述'
      }
    },
    {
      name: 'start',
      signature: '(options?: Object) => Promise<void>',
      description: '启动 HTTP 服务器',
      parameters: {
        options: {
          port: 'number - 监听端口（默认：3000）',
          host: 'string - 监听地址（默认：localhost）',
          endpoint: 'string - MCP 端点路径（默认：/mcp）',
          stateless: 'boolean - 是否无状态模式（默认：false）',
          cors: 'Object - CORS 配置',
          auth: 'Object - 认证配置',
          ssl: 'Object - SSL/TLS 配置',
          debug: 'boolean - 是否启用调试模式'
        }
      },
      returns: 'Promise<void>'
    },
    {
      name: 'stop',
      signature: '() => Promise<void>',
      description: '停止服务器',
      returns: 'Promise<void>'
    },
    {
      name: 'registerTool',
      signature: '(tool: Object) => void',
      description: '注册工具',
      parameters: {
        tool: {
          name: 'string - 工具名称',
          description: 'string - 工具描述',
          inputSchema: 'Object - 参数 Schema',
          handler: 'Function - 工具处理函数'
        }
      }
    },
    {
      name: 'handleHttpRequest',
      signature: '(request: Object, response: Object) => Promise<void>',
      description: '处理 HTTP 请求',
      parameters: {
        request: 'HTTP Request 对象',
        response: 'HTTP Response 对象'
      },
      returns: 'Promise<void>'
    },
    {
      name: 'getStatus',
      signature: '() => Object',
      description: '获取服务器状态',
      returns: {
        running: 'boolean - 是否运行中',
        transport: 'string - 传输类型',
        endpoint: 'string - 服务端点',
        port: 'number - 监听端口',
        host: 'string - 监听地址',
        connections: 'number - 当前连接数',
        sessions: 'Object - 会话信息（stateful 模式）'
      }
    }
  ],
  
  // 可选实现的方法
  optional: [
    {
      name: 'handleSseConnection',
      signature: '(request: Object, response: Object) => void',
      description: '处理 SSE 连接',
      parameters: {
        request: 'HTTP Request 对象',
        response: 'HTTP Response 对象（SSE）'
      }
    },
    {
      name: 'authenticateRequest',
      signature: '(request: Object) => Promise<boolean>',
      description: '认证请求',
      parameters: {
        request: 'HTTP Request 对象'
      },
      returns: 'Promise<boolean> - 是否认证成功'
    },
    {
      name: 'createSession',
      signature: '(sessionId: string) => Object',
      description: '创建会话（stateful 模式）',
      parameters: {
        sessionId: 'string - 会话 ID'
      },
      returns: 'Object - 会话对象'
    },
    {
      name: 'getSession',
      signature: '(sessionId: string) => Object',
      description: '获取会话',
      parameters: {
        sessionId: 'string - 会话 ID'
      },
      returns: 'Object - 会话对象或 null'
    },
    {
      name: 'deleteSession',
      signature: '(sessionId: string) => void',
      description: '删除会话',
      parameters: {
        sessionId: 'string - 会话 ID'
      }
    },
    {
      name: 'configureCors',
      signature: '(corsOptions: Object) => void',
      description: '配置 CORS',
      parameters: {
        corsOptions: {
          origin: 'string | string[] | Function - 允许的源',
          methods: 'string[] - 允许的方法',
          allowedHeaders: 'string[] - 允许的请求头',
          exposedHeaders: 'string[] - 暴露的响应头',
          credentials: 'boolean - 是否允许凭证',
          maxAge: 'number - 预检请求缓存时间'
        }
      }
    },
    {
      name: 'configureRateLimit',
      signature: '(rateLimitOptions: Object) => void',
      description: '配置速率限制',
      parameters: {
        rateLimitOptions: {
          windowMs: 'number - 时间窗口（毫秒）',
          max: 'number - 最大请求数',
          message: 'string - 超限错误消息',
          skipSuccessfulRequests: 'boolean - 跳过成功请求',
          keyGenerator: 'Function - 生成限流键的函数'
        }
      }
    },
    {
      name: 'getHealthCheck',
      signature: '() => Object',
      description: '健康检查',
      returns: {
        status: 'string - 健康状态（healthy/unhealthy）',
        uptime: 'number - 运行时间（秒）',
        memory: 'Object - 内存使用情况',
        tools: 'number - 已注册工具数',
        errors: 'number - 错误计数'
      }
    },
    {
      name: 'getMetrics',
      signature: '() => Object',
      description: '获取指标',
      returns: {
        requestsTotal: 'number - 总请求数',
        requestsPerSecond: 'number - 每秒请求数',
        averageResponseTime: 'number - 平均响应时间（毫秒）',
        activeConnections: 'number - 活跃连接数',
        toolExecutions: 'Object - 工具执行统计'
      }
    }
  ]
};

/**
 * HTTP 特定错误代码
 */
const HTTP_ERROR_CODES = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

/**
 * 示例 HTTP 服务器实现模板
 */
const EXAMPLE_HTTP_SERVER = `
/**
 * 示例 MCP HTTP 服务器实现
 */
class ExampleMCPHttpServer {
  constructor(options = {}) {
    this.name = options.name || 'example-mcp-http-server';
    this.version = options.version || '1.0.0';
    this.port = options.port || 3000;
    this.host = options.host || 'localhost';
    this.endpoint = options.endpoint || '/mcp';
    this.stateless = options.stateless || false;
    
    this.server = null;
    this.tools = new Map();
    this.sessions = new Map();
    this.status = {
      running: false,
      connections: 0,
      startTime: null
    };
  }

  getMetadata() {
    return {
      name: this.name,
      version: this.version,
      transport: 'http',
      capabilities: {
        tools: true,
        resources: true,
        prompts: false,
        stateless: this.stateless,
        sse: true
      }
    };
  }

  async start(options = {}) {
    const { port, host, endpoint, stateless, cors, auth } = options;
    
    // 更新配置
    this.port = port || this.port;
    this.host = host || this.host;
    this.endpoint = endpoint || this.endpoint;
    this.stateless = stateless !== undefined ? stateless : this.stateless;
    
    // 创建 HTTP 服务器
    // 配置 CORS
    // 配置认证
    // 启动监听
    
    this.status.running = true;
    this.status.startTime = new Date();
  }

  async stop() {
    if (this.server) {
      // 关闭服务器
      // 清理资源
      this.status.running = false;
    }
  }

  registerTool(tool) {
    this.tools.set(tool.name, tool);
  }

  async handleHttpRequest(request, response) {
    // 处理 MCP 协议请求
    // 路由到对应的处理器
    // 返回响应
  }

  getStatus() {
    return {
      running: this.status.running,
      transport: 'http',
      endpoint: this.endpoint,
      port: this.port,
      host: this.host,
      connections: this.status.connections,
      sessions: this.stateless ? null : {
        count: this.sessions.size,
        ids: Array.from(this.sessions.keys())
      }
    };
  }

  // 可选方法实现...
  
  handleSseConnection(request, response) {
    // 设置 SSE 响应头
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    
    // 处理 SSE 消息流
  }

  async authenticateRequest(request) {
    // 实现认证逻辑
    // 检查 token、API key 等
    return true;
  }

  configureCors(corsOptions) {
    // 配置 CORS 中间件
  }

  getHealthCheck() {
    const uptime = this.status.startTime 
      ? (Date.now() - new Date(this.status.startTime).getTime()) / 1000 
      : 0;
    
    return {
      status: 'healthy',
      uptime,
      memory: process.memoryUsage(),
      tools: this.tools.size,
      errors: 0
    };
  }
}

module.exports = ExampleMCPHttpServer;
`;

module.exports = {
  MCP_HTTP_SERVER_INTERFACE,
  HTTP_ERROR_CODES,
  EXAMPLE_HTTP_SERVER
};