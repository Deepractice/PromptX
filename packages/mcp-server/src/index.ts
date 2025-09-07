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
  SessionContext,
  ErrorRecoveryStrategy
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

// 重新导出SDK类型（方便使用）
export type {
  Tool,
  Resource,
  Prompt
} from '@modelcontextprotocol/sdk/types.js';

// 保留旧的导出以保持向后兼容（标记为deprecated）
// TODO: 修复 legacy 代码的构建问题后再启用
// /** @deprecated Use StdioMCPServer instead */
// export { FastMCPStdioServer } from './legacy/server/FastMCPStdioServer';
// /** @deprecated Use StreamableHttpMCPServer instead */
// export { FastMCPHttpServer } from './legacy/server/FastMCPHttpServer';
// /** @deprecated Use the new server implementations */
// export { MCPOutputAdapter } from './legacy/MCPOutputAdapter';
// /** @deprecated Use MCPServerFactory instead */
// export { MCPServerManager } from './legacy/MCPServerManager';
// /** @deprecated Use definitions from the new structure */
// export * as definitions from './legacy/definitions/index';