/**
 * @promptx/mcp-server
 * 
 * MCP (Model Context Protocol) Server implementation for PromptX
 * 
 * 基于Issue #317的重构设计，提供：
 * - 清晰的接口定义和职责分离
 * - Template Method模式的基类实现
 * - 标准输入输出和HTTP两种传输方式
 * - 完整的生命周期管理和错误恢复
 * - 会话管理和并发控制
 * - 健康检查和指标收集
 */

// 导出接口类型
export type {
  MCPServer,
  MCPServerOptions,
  MCPServerFactory,
  MCPTransport,
  ServerState,
  ToolHandler,
  ToolWithHandler,
  HealthCheckResult,
  ServerMetrics,
  SessionContext
} from '~/interfaces/MCPServer.js';

// 导出服务器实现
export { BaseMCPServer } from '~/servers/BaseMCPServer.js';
export { StdioMCPServer } from '~/servers/StdioMCPServer.js';
export { StreamableHttpMCPServer } from '~/servers/StreamableHttpMCPServer.js';

// 导出工厂类和便捷函数
export {
  MCPServerFactory,
  createStdioServer,
  createHttpServer,
  default as serverFactory
} from '~/servers/MCPServerFactory.js';

// 导出 PromptX 集成服务器
export { PromptXMCPServer, MCPServerManager } from '~/servers/PromptXMCPServer.js';
export type { PromptXServerOptions } from '~/servers/PromptXMCPServer.js';

// 重新导出SDK类型（方便使用）
export type {
  Tool,
  Resource,
  Prompt
} from '@modelcontextprotocol/sdk/types.js';

