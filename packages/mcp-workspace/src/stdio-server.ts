/**
 * Workspace MCP Stdio 服务器
 *
 * 基于标准输入输出的 MCP 服务，复用现有 tools/service 层。
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
} from '@modelcontextprotocol/sdk/types.js';

import { WORKSPACE_TOOLS, handleWorkspaceTool } from './tools/index.js';
import { createLogger } from '@promptx/logger';

const logger = createLogger();
const MCP_VERSION = '1.0.0';

export async function startStdioServer(): Promise<void> {
  const server = new Server(
    { name: 'workspace-mcp', version: MCP_VERSION },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: WORKSPACE_TOOLS,
  }));

  server.setRequestHandler(
    CallToolRequestSchema,
    async (request: CallToolRequest) => {
      const { name, arguments: args } = request.params;
      logger.info(`Tool call: ${name}`);
      return handleWorkspaceTool(name, args || {});
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info(`Starting v${MCP_VERSION} (stdio)...`);
  logger.info('Ready');
}
