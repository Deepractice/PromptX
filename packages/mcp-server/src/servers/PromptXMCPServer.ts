import { StdioMCPServer } from './StdioMCPServer.js';
import { StreamableHttpMCPServer } from './StreamableHttpMCPServer.js';
import { allTools } from '../tools/index.js';
import type { MCPServer } from '../interfaces/MCPServer.js';
import resourcePackage from '@promptx/resource';
import logger from '@promptx/logger';

export interface PromptXServerOptions {
  transport: 'stdio' | 'http';
  name?: string;
  version?: string;
  port?: number;
  host?: string;
  corsEnabled?: boolean;
  cors?: boolean;
  workingDirectory?: string;
  ideType?: string;
  debug?: boolean;
}

export class PromptXMCPServer {
  private server: MCPServer;
  private options: PromptXServerOptions;

  constructor(options: PromptXServerOptions) {
    this.options = { ...options };
    if (options.cors !== undefined && options.corsEnabled === undefined) this.options.corsEnabled = options.cors;

    const name = options.name || 'promptx-mcp-server';
    const version = options.version || process.env.npm_package_version || '1.0.0';

    if (this.options.transport === 'stdio') {
      this.server = new StdioMCPServer({ name, version });
    } else {
      this.server = new StreamableHttpMCPServer({
        name, version,
        port: options.port || 5203,
        host: options.host || (process.env.DOCKER_CONTAINER ? '0.0.0.0' : 'localhost'),
        corsEnabled: !!this.options.corsEnabled
      });
    }
    this.registerResources();
  }

  private registerResources(): void {
    // 註冊 Tools
    allTools.forEach(tool => this.server.registerTool(tool));
    logger.info(`Registered ${allTools.length} tools`);

    // 註冊 Prompts (修復 list_prompts 為空的問題)
    const resources = resourcePackage.getAllResources();
    let promptCount = 0;
    resources.forEach(res => {
      if (res.protocol === 'prompt' && (this.server as any).registerPrompt) {
        (this.server as any).registerPrompt({
          name: res.id,
          description: res.description,
          arguments: (res as any).arguments
        });
        promptCount++;
      }
    });
    logger.info(`Registered ${promptCount} prompts from registry`);
  }

  async start(): Promise<void> { await this.server.start(); }
  async stop(): Promise<void> { await this.server.stop(); }
  async gracefulShutdown(timeoutMs?: number): Promise<void> { await this.server.gracefulShutdown(timeoutMs || 5000); }
  getServer(): MCPServer { return this.server; }

  static async launch(options: PromptXServerOptions): Promise<PromptXMCPServer> {
    // 支援環境變數覆蓋，解決 Issue #530
    const transport = (process.env.MCP_TRANSPORT as any) || options.transport;
    if (transport === 'stdio') {
      const originalLog = console.log;
      console.log = console.error;
      console.info = console.error;
      (console as any)._originalLog = originalLog;
    }

    const server = new PromptXMCPServer({ ...options, transport });
    const shutdown = async (sig: string) => {
      logger.info(`Received ${sig}, shutting down...`);
      await server.gracefulShutdown(5000);
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    await server.start();
    if (transport === 'stdio') {
      logger.info('STDIO Server Ready');
      await new Promise(() => {}); 
    } else {
      logger.info(`HTTP Server Ready at ${options.host || 'localhost'}:${options.port || 5203}`);
    }
    return server;
  }
}

export { PromptXMCPServer as MCPServerManager };
export default PromptXMCPServer;
