/**
 * MCP 服务器配置管理服务
 *
 * 管理 ~/.promptx/mcp-servers.json，并合并内置服务器。
 * 内置服务器 (builtin: true) 不可删除/修改。
 */

import { readFileSync, existsSync } from 'node:fs';
import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createLogger } from '@promptx/logger';

const logger = createLogger();

const CONFIG_PATH = join(homedir(), '.promptx', 'mcp-servers.json');
const PROMPTX_CONFIG_PATH = join(homedir(), '.promptx', 'config.json');

export interface McpServerConfig {
  name: string;
  description?: string;
  builtin?: boolean;
  enabled: boolean;
  // stdio 类型
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  // http/sse 类型
  type?: 'http' | 'sse';
  url?: string;
}

interface McpConfigFile {
  servers: McpServerConfig[];
}

// ── 内置服务器 ────────────────────────────────────────────────────────────────

function getPromptXUrl(): string {
  try {
    if (existsSync(PROMPTX_CONFIG_PATH)) {
      const raw = readFileSync(PROMPTX_CONFIG_PATH, 'utf-8');
      const cfg = JSON.parse(raw) as { host?: string; port?: number };
      const host = cfg.host || '127.0.0.1';
      const port = cfg.port || 5276;
      return `http://${host}:${port}/mcp`;
    }
  } catch {
    // ignore
  }
  return 'http://127.0.0.1:5276/mcp';
}

function getMcpOfficePath(): string | null {
  // 1. 环境变量优先
  if (process.env.MCP_OFFICE_PATH) return process.env.MCP_OFFICE_PATH;

  try {
    // 2. 相对于本文件在 monorepo 中的位置
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    // dist/service/ → ../../ → dist/ → ../../../ → packages/mcp-workspace/
    // packages/mcp-office/dist/index.js
    const candidates = [
      join(__dirname, '../../../mcp-office/dist/index.js'),          // monorepo dist
      join(__dirname, '../../../../mcp-office/dist/index.js'),       // one level deeper
      join(process.cwd(), 'packages/mcp-office/dist/index.js'),      // cwd fallback
    ];
    for (const p of candidates) {
      if (existsSync(p)) return p;
    }
  } catch {
    // ignore
  }
  return null;
}

function getBuiltinServers(): McpServerConfig[] {
  const servers: McpServerConfig[] = [
    {
      name: 'promptx',
      description: 'PromptX MCP Server (Roles, Tools, Memory)',
      builtin: true,
      enabled: true,
      type: 'http',
      url: getPromptXUrl(),
    },
  ];

  const officePath = getMcpOfficePath();
  if (officePath) {
    servers.push({
      name: 'mcp-office',
      description: 'Office document reader (Word, Excel, PDF)',
      builtin: true,
      enabled: true,
      command: 'node',
      args: [officePath],
    });
  }

  return servers;
}

// ── 持久化 ────────────────────────────────────────────────────────────────────

function loadConfig(): McpConfigFile {
  try {
    if (existsSync(CONFIG_PATH)) {
      const raw = readFileSync(CONFIG_PATH, 'utf-8');
      return JSON.parse(raw) as McpConfigFile;
    }
  } catch {
    logger.warn('Failed to load mcp-servers.json');
  }
  return { servers: [] };
}

async function saveConfig(cfg: McpConfigFile): Promise<void> {
  await mkdir(dirname(CONFIG_PATH), { recursive: true });
  await writeFile(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf-8');
}

// ── 公开 API ──────────────────────────────────────────────────────────────────

export function listMcpServers(): McpServerConfig[] {
  const builtins = getBuiltinServers();
  const userCfg = loadConfig();
  // 用户服务器放在内置之后，过滤掉与内置同名的
  const builtinNames = new Set(builtins.map(s => s.name));
  const userServers = userCfg.servers.filter(s => !builtinNames.has(s.name));
  return [...builtins, ...userServers];
}

export async function addMcpServer(config: Omit<McpServerConfig, 'builtin'>): Promise<McpServerConfig> {
  const builtins = getBuiltinServers();
  if (builtins.some(s => s.name === config.name)) {
    throw new Error(`内置服务器 "${config.name}" 已存在，不可覆盖`);
  }

  const cfg = loadConfig();
  if (cfg.servers.some(s => s.name === config.name)) {
    throw new Error(`服务器 "${config.name}" 已存在`);
  }

  const entry: McpServerConfig = { ...config, builtin: false };
  cfg.servers.push(entry);
  await saveConfig(cfg);

  logger.info(`[addMcpServer] Added: ${config.name}`);
  return entry;
}

export async function removeMcpServer(name: string): Promise<void> {
  const builtins = getBuiltinServers();
  if (builtins.some(s => s.name === name)) {
    throw new Error(`内置服务器 "${name}" 不可删除`);
  }

  const cfg = loadConfig();
  const before = cfg.servers.length;
  cfg.servers = cfg.servers.filter(s => s.name !== name);

  if (cfg.servers.length === before) {
    throw new Error(`服务器 "${name}" 不存在`);
  }

  await saveConfig(cfg);
  logger.info(`[removeMcpServer] Removed: ${name}`);
}

export async function updateMcpServer(
  name: string,
  updates: Partial<Omit<McpServerConfig, 'name' | 'builtin'>>
): Promise<McpServerConfig> {
  const builtins = getBuiltinServers();
  if (builtins.some(s => s.name === name)) {
    throw new Error(`内置服务器 "${name}" 不可修改`);
  }

  const cfg = loadConfig();
  const idx = cfg.servers.findIndex(s => s.name === name);
  if (idx === -1) {
    throw new Error(`服务器 "${name}" 不存在`);
  }

  cfg.servers[idx] = { ...cfg.servers[idx]!, ...updates, name, builtin: false };
  await saveConfig(cfg);

  logger.info(`[updateMcpServer] Updated: ${name}`);
  return cfg.servers[idx]!;
}
