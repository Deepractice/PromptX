#!/usr/bin/env node

/**
 * Workspace MCP CLI 入口
 *
 * 用法:
 *   mcp-workspace                                    # 默认启动 HTTP 服务
 *   mcp-workspace --transport stdio                  # stdio 模式
 *   mcp-workspace --url http://host:port/mcp         # 指定 HTTP URL
 *
 * 环境变量:
 *   WORKSPACE_MCP_URL       - 指定 MCP 服务 URL (默认: http://127.0.0.1:18062/mcp)
 *   WORKSPACE_MCP_TRANSPORT - 指定传输模式 stdio|http (默认: http)
 */

import { startHttpServer } from '../http-server.js';
import { startStdioServer } from '../stdio-server.js';
import { createLogger } from '@promptx/logger';

const logger = createLogger();

const DEFAULT_MCP_URL = 'http://127.0.0.1:18062/mcp';

function parseArgs(): { mcpUrl: string; transport: 'http' | 'stdio' } {
  const args = process.argv.slice(2);
  let mcpUrl = process.env.WORKSPACE_MCP_URL || DEFAULT_MCP_URL;
  let transport: 'http' | 'stdio' =
    (process.env.WORKSPACE_MCP_TRANSPORT as 'http' | 'stdio') || 'http';

  for (let i = 0; i < args.length; i++) {
    if (args[i]!.startsWith('--url=')) {
      mcpUrl = args[i]!.slice('--url='.length);
    } else if (args[i] === '--url' && args[i + 1]) {
      mcpUrl = args[++i]!;
    } else if (args[i]!.startsWith('--transport=')) {
      transport = args[i]!.slice('--transport='.length) as 'http' | 'stdio';
    } else if (args[i] === '--transport' && args[i + 1]) {
      transport = args[++i]! as 'http' | 'stdio';
    }
  }

  return { mcpUrl, transport };
}

async function main() {
  const { mcpUrl, transport } = parseArgs();
  logger.info('Workspace MCP starting...');

  if (transport === 'stdio') {
    await startStdioServer();
  } else {
    await startHttpServer({ mcpUrl });
  }
}

main().catch((err) => {
  logger.error('Fatal:', err);
  process.exit(1);
});
