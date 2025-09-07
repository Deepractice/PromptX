import type { Tool, Resource, Prompt } from '@modelcontextprotocol/sdk/types.js';
import type { Logger } from '@promptx/logger';

/**
 * MCP服务器接口 - 基于Knuth形式化设计
 * 
 * 设计不变式：
 * 1. 状态机完备性：所有状态转换必须合法且可追踪
 * 2. 资源一致性：注册的资源在生命周期内必须可访问
 * 3. 并发安全性：所有操作必须线程安全
 * 4. 错误可恢复性：非致命错误必须可恢复
 */

/**
 * 服务器状态枚举
 * 状态机：IDLE -> STARTING -> RUNNING -> STOPPING -> STOPPED
 *         任何状态 -> ERROR (可恢复)
 *         任何状态 -> FATAL_ERROR (不可恢复)
 */
export type ServerState = 
  | 'IDLE'         // 初始状态
  | 'STARTING'     // 启动中
  | 'RUNNING'      // 运行中
  | 'STOPPING'     // 停止中
  | 'STOPPED'      // 已停止
  | 'ERROR'        // 错误（可恢复）
  | 'FATAL_ERROR'; // 致命错误（不可恢复）

/**
 * 工具处理器类型
 */
export type ToolHandler = (args: any) => Promise<{
  content: Array<{
    type: string;
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}>;

/**
 * 带处理器的工具定义
 */
export type ToolWithHandler = Tool & {
  handler: ToolHandler;
};

/**
 * 服务器配置选项
 */
export interface MCPServerOptions {
  name: string;
  version: string;
  logger?: Logger;
  
  // 并发控制
  maxConcurrentRequests?: number;
  requestTimeout?: number;
  
  // 会话管理
  sessionTimeout?: number;
  maxSessions?: number;
  
  // 错误恢复
  maxRetries?: number;
  retryDelay?: number;
  
  // 监控
  enableMetrics?: boolean;
  metricsInterval?: number;
}

/**
 * 健康检查结果
 */
export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  checks: {
    server: {
      status: 'up' | 'down';
      message?: string;
    };
    resources: {
      registered: number;
      available: number;
    };
    memory: {
      used: number;
      limit: number;
      percentage: number;
    };
  };
  errors?: string[];
}

/**
 * 服务器指标
 */
export interface ServerMetrics {
  requestCount: number;
  errorCount: number;
  avgResponseTime: number;
  activeConnections: number;
  memoryUsage: NodeJS.MemoryUsage;
  startTime: number;
  uptime: number;
}

/**
 * 会话上下文
 */
export interface SessionContext {
  id: string;
  createdAt: number;
  lastActivity: number;
  metadata?: Record<string, any>;
}

/**
 * MCP服务器主接口
 */
export interface MCPServer {
  // ============ 生命周期管理 ============
  /**
   * 启动服务器
   * 前置条件：state === 'IDLE' || state === 'STOPPED'
   * 后置条件：state === 'RUNNING'
   */
  start(options?: MCPServerOptions): Promise<void>;
  
  /**
   * 停止服务器
   * 前置条件：state === 'RUNNING'
   * 后置条件：state === 'STOPPED'
   */
  stop(): Promise<void>;
  
  /**
   * 优雅关闭
   * 等待pending操作完成或超时
   */
  gracefulShutdown(timeoutMs: number): Promise<void>;
  
  /**
   * 从错误状态恢复
   * 前置条件：state === 'ERROR'
   * 后置条件：state === 'RUNNING' || state === 'STOPPED'
   */
  recover(): Promise<void>;
  
  /**
   * 检查服务器是否运行中
   */
  isRunning(): boolean;
  
  /**
   * 获取当前状态
   */
  getState(): ServerState;
  
  // ============ 工具管理 ============
  /**
   * 注册工具
   * 不变式：注册后的工具必须可通过getTool获取
   */
  registerTool(tool: ToolWithHandler): void;
  
  /**
   * 注销工具
   */
  unregisterTool(name: string): void;
  
  /**
   * 获取工具定义（不含handler）
   */
  getTool(name: string): Tool | undefined;
  
  /**
   * 列出所有工具
   */
  listTools(): Tool[];
  
  /**
   * 执行工具
   * 前置条件：工具已注册且服务器运行中
   */
  executeTool(name: string, args: any): Promise<any>;
  
  // ============ 资源管理 ============
  /**
   * 注册资源
   * 不变式：注册后的资源必须可通过getResource获取
   */
  registerResource(resource: Resource): void;
  
  /**
   * 注销资源
   */
  unregisterResource(uri: string): void;
  
  /**
   * 获取资源
   */
  getResource(uri: string): Resource | undefined;
  
  /**
   * 列出所有资源
   */
  listResources(): Resource[];
  
  // ============ 提示词管理 ============
  /**
   * 注册提示词
   */
  registerPrompt(prompt: Prompt): void;
  
  /**
   * 注销提示词
   */
  unregisterPrompt(name: string): void;
  
  /**
   * 获取提示词
   */
  getPrompt(name: string): Prompt | undefined;
  
  /**
   * 列出所有提示词
   */
  listPrompts(): Prompt[];
  
  // ============ 会话管理 ============
  /**
   * 创建新会话
   */
  createSession?(metadata?: Record<string, any>): Promise<SessionContext>;
  
  /**
   * 获取会话
   */
  getSession?(sessionId: string): SessionContext | undefined;
  
  /**
   * 销毁会话
   */
  destroySession?(sessionId: string): Promise<void>;
  
  /**
   * 列出所有活跃会话
   */
  listSessions?(): SessionContext[];
  
  // ============ 监控与可观测性 ============
  /**
   * 健康检查
   */
  healthCheck(): Promise<HealthCheckResult>;
  
  /**
   * 获取指标
   */
  getMetrics(): ServerMetrics;
  
  /**
   * 事件监听
   */
  on?(event: 'request', handler: (req: any) => void): void;
  on?(event: 'response', handler: (res: any) => void): void;
  on?(event: 'error', handler: (err: Error) => void): void;
  on?(event: 'stateChange', handler: (oldState: ServerState, newState: ServerState) => void): void;
  
  /**
   * 移除事件监听
   */
  off?(event: string, handler: Function): void;
  
  /**
   * 设置日志器
   */
  setLogger?(logger: Logger): void;
}

/**
 * 传输层接口
 */
export interface MCPTransport {
  /**
   * 连接传输层
   */
  connect(): Promise<void>;
  
  /**
   * 断开连接
   */
  disconnect(): Promise<void>;
  
  /**
   * 发送消息
   */
  send(message: any): Promise<void>;
  
  /**
   * 接收消息
   */
  receive(): Promise<any>;
  
  /**
   * 检查连接状态
   */
  isConnected(): boolean;
}

/**
 * 服务器工厂接口
 */
export interface MCPServerFactory {
  /**
   * 创建服务器实例
   */
  createServer(type: 'stdio' | 'http', options: MCPServerOptions): MCPServer;
}

/**
 * 错误恢复策略
 */
export interface ErrorRecoveryStrategy {
  /**
   * 判断错误是否可恢复
   */
  isRecoverable(error: Error): boolean;
  
  /**
   * 执行恢复
   */
  recover(error: Error, context: any): Promise<void>;
  
  /**
   * 获取重试延迟
   */
  getRetryDelay(attemptNumber: number): number;
}