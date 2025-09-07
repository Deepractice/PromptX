/**
 * MCPStdioServerInterface - MCP Stdio服务器接口规范
 * 定义标准输入输出传输的MCP服务器接口
 */

/**
 * Stdio MCP服务器接口规范定义
 */
const MCP_STDIO_SERVER_INTERFACE = {
  // 必须实现的方法
  required: [
    {
      name: 'getMetadata',
      signature: '() => Object',
      description: '获取服务器元信息',
      returns: {
        name: 'string - 服务器名称',
        version: 'string - 版本号',
        transport: 'string - 传输类型（stdio）',
        capabilities: 'Object - 服务器能力描述'
      }
    },
    {
      name: 'start',
      signature: '(options?: Object) => Promise<void>',
      description: '启动Stdio服务器',
      parameters: {
        options: {
          inputStream: 'Stream - 输入流（默认：process.stdin）',
          outputStream: 'Stream - 输出流（默认：process.stdout）',
          errorStream: 'Stream - 错误流（默认：process.stderr）',
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
          inputSchema: 'Object - 参数JSON Schema',
          handler: 'Function - 处理函数（可选）',
          command: 'string - CLI命令（可选）'
        }
      },
      returns: 'void'
    },
    {
      name: 'handleStdioMessage',
      signature: '(message: Object) => Promise<Object>',
      description: '处理stdio消息',
      parameters: {
        message: 'Object - JSON-RPC格式的消息'
      },
      returns: 'Promise<Object> - 处理结果'
    },
    {
      name: 'getStatus',
      signature: '() => Object',
      description: '获取服务器状态',
      returns: {
        running: 'boolean - 是否运行中',
        transport: 'string - 传输类型',
        tools: 'number - 注册的工具数量',
        streams: {
          input: 'boolean - 输入流是否就绪',
          output: 'boolean - 输出流是否就绪'
        },
        startTime: 'string - 启动时间',
        processedMessages: 'number - 已处理消息数'
      }
    }
  ],

  // 可选实现的方法
  optional: [
    {
      name: 'setStreamHandlers',
      signature: '(handlers: Object) => void',
      description: '设置流处理器',
      parameters: {
        handlers: {
          onData: 'Function - 数据接收处理器',
          onError: 'Function - 错误处理器',
          onClose: 'Function - 关闭处理器'
        }
      },
      returns: 'void'
    },
    {
      name: 'enableLogging',
      signature: '(config?: Object) => void',
      description: '启用日志记录',
      parameters: {
        config: {
          level: 'string - 日志级别（debug/info/warn/error）',
          logFile: 'string - 日志文件路径（可选）',
          includeTimestamp: 'boolean - 是否包含时间戳'
        }
      },
      returns: 'void'
    },
    {
      name: 'registerMessageInterceptor',
      signature: '(interceptor: Function) => void',
      description: '注册消息拦截器',
      parameters: {
        interceptor: 'Function - 消息拦截函数'
      },
      returns: 'void'
    },
    {
      name: 'getMetrics',
      signature: '() => Object',
      description: '获取性能指标',
      returns: {
        messagesReceived: 'number - 接收消息数',
        messagesSent: 'number - 发送消息数',
        averageResponseTime: 'number - 平均响应时间（ms）',
        errors: 'number - 错误次数',
        uptime: 'number - 运行时间（秒）'
      }
    }
  ]
};

/**
 * Stdio特定的错误代码
 */
const STDIO_ERROR_CODES = {
  STREAM_ERROR: 'STREAM_ERROR',           // 流错误
  MESSAGE_PARSE_ERROR: 'MESSAGE_PARSE_ERROR', // 消息解析错误
  STREAM_CLOSED: 'STREAM_CLOSED',         // 流已关闭
  INVALID_MESSAGE: 'INVALID_MESSAGE',     // 无效消息格式
  STREAM_NOT_READY: 'STREAM_NOT_READY'    // 流未就绪
};

/**
 * 示例实现
 */
const EXAMPLE_STDIO_SERVER = `
const { FastMCP } = require('fastmcp');

class StdioMCPServer {
  constructor() {
    this.server = null;
    this.tools = new Map();
    this.status = {
      running: false,
      startTime: null,
      processedMessages: 0
    };
  }

  getMetadata() {
    return {
      name: 'stdio-mcp-server',
      version: '1.0.0',
      transport: 'stdio',
      capabilities: {
        tools: true,
        resources: false,
        prompts: false
      }
    };
  }

  async start(options = {}) {
    const {
      inputStream = process.stdin,
      outputStream = process.stdout,
      debug = false
    } = options;

    // 使用 FastMCP 创建服务器
    this.server = new FastMCP({
      name: this.getMetadata().name,
      version: this.getMetadata().version,
      logger: debug ? console : undefined
    });

    // 注册所有工具
    for (const [name, tool] of this.tools) {
      this.server.addTool(tool);
    }

    // 启动 stdio 传输
    await this.server.start({
      transportType: 'stdio',
      stdio: {
        inputStream,
        outputStream
      }
    });

    this.status.running = true;
    this.status.startTime = new Date().toISOString();
  }

  async stop() {
    if (this.server) {
      await this.server.stop();
      this.status.running = false;
    }
  }

  registerTool(tool) {
    this.tools.set(tool.name, tool);
    if (this.server) {
      this.server.addTool(tool);
    }
  }

  async handleStdioMessage(message) {
    this.status.processedMessages++;
    // FastMCP 自动处理消息
    return { handled: true };
  }

  getStatus() {
    return {
      running: this.status.running,
      transport: 'stdio',
      tools: this.tools.size,
      streams: {
        input: true,
        output: true
      },
      startTime: this.status.startTime,
      processedMessages: this.status.processedMessages
    };
  }
}

module.exports = StdioMCPServer;
`;

module.exports = {
  MCP_STDIO_SERVER_INTERFACE,
  STDIO_ERROR_CODES,
  EXAMPLE_STDIO_SERVER
};