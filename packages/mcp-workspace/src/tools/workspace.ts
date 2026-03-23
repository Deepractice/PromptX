/**
 * 工作区 MCP 工具定义
 *
 * 提供 AI 可调用的工具，用于操作用户绑定的本地工作区文件夹。
 */

import type { CallToolResult, Tool } from '@modelcontextprotocol/sdk/types.js';
import {
  listWorkspaces,
  listDirectory,
  readWorkspaceFile,
  writeWorkspaceFile,
  createWorkspaceDirectory,
  deleteWorkspaceItem,
} from '../service/workspace.service.js';
import {
  listMcpServers,
  addMcpServer,
  removeMcpServer,
  updateMcpServer,
} from '../service/mcp-config.service.js';
import { createLogger } from '@promptx/logger';

const logger = createLogger();

export const WORKSPACE_TOOLS: Tool[] = [
  {
    name: 'list_workspaces',
    description: `获取用户绑定的工作区文件夹列表。

返回每个工作区的 id、名称和绝对路径。
调用此工具后，可以使用 list_workspace_directory 浏览具体目录。`,
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'list_workspace_directory',
    description: `列出工作区中某个目录的内容。

返回文件和子目录列表（名称、绝对路径、大小、修改时间）。
自动跳过隐藏文件和 node_modules 等常见忽略目录。
路径必须在已绑定的工作区范围内。`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        path: {
          type: 'string',
          description: '目录的绝对路径',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'read_workspace_file',
    description: `读取工作区中某个文件的文本内容。

支持 UTF-8 编码的文本文件。二进制文件（图片、压缩包等）不支持。
大文件自动截断：最多读取前 512KB / 5000 行。
路径必须在已绑定的工作区范围内。`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        path: {
          type: 'string',
          description: '文件的绝对路径',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_workspace_file',
    description: `在工作区中创建或覆盖写入文件。

如果父目录不存在会自动递归创建。
路径必须在已绑定的工作区范围内。
⚠️ 会覆盖已有文件内容，请谨慎使用。`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        path: {
          type: 'string',
          description: '文件的绝对路径',
        },
        content: {
          type: 'string',
          description: '要写入的文件内容',
        },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'create_workspace_directory',
    description: `在工作区中创建目录（支持递归创建）。

路径必须在已绑定的工作区范围内。`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        path: {
          type: 'string',
          description: '要创建的目录绝对路径',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'delete_workspace_item',
    description: `删除工作区中的文件或目录。

目录会被递归删除。不能删除工作区根目录。
路径必须在已绑定的工作区范围内。
⚠️ 此操作不可逆，请确认后再调用。`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        path: {
          type: 'string',
          description: '要删除的文件或目录绝对路径',
        },
      },
      required: ['path'],
    },
  },

  // ── MCP 服务器配置 ──────────────────────────────────────────────────────────
  {
    name: 'list_mcp_servers',
    description: `列出所有已配置的 MCP 服务器（包括内置服务器和用户自定义服务器）。

内置服务器（builtin: true）不可删除或修改。
返回每个服务器的名称、类型、连接信息、启用状态和描述。`,
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'add_mcp_server',
    description: `添加一个新的 MCP 服务器配置。

支持两种传输类型：
- stdio: 需要 command（命令）和可选的 args（参数列表）、env（环境变量）
- http/sse: 需要 type（"http" 或 "sse"）和 url

不可添加与内置服务器同名的配置。`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: '服务器唯一名称（英文，不含空格）' },
        description: { type: 'string', description: '服务器描述（可选）' },
        enabled: { type: 'boolean', description: '是否启用，默认 true' },
        command: { type: 'string', description: 'stdio 模式：可执行命令，如 "node"、"npx"' },
        args: {
          type: 'array',
          items: { type: 'string' },
          description: 'stdio 模式：命令参数列表',
        },
        env: {
          type: 'object',
          additionalProperties: { type: 'string' },
          description: 'stdio 模式：追加的环境变量',
        },
        type: { type: 'string', enum: ['http', 'sse'], description: 'http/sse 模式：传输类型' },
        url: { type: 'string', description: 'http/sse 模式：服务器 URL' },
      },
      required: ['name'],
    },
  },
  {
    name: 'remove_mcp_server',
    description: `删除一个用户自定义的 MCP 服务器配置。

内置服务器不可删除。`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: '要删除的服务器名称' },
      },
      required: ['name'],
    },
  },
  {
    name: 'update_mcp_server',
    description: `更新一个用户自定义 MCP 服务器的配置。

内置服务器不可修改。只传入需要更新的字段。`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: '要更新的服务器名称' },
        description: { type: 'string', description: '新描述' },
        enabled: { type: 'boolean', description: '是否启用' },
        command: { type: 'string', description: 'stdio 模式：命令' },
        args: {
          type: 'array',
          items: { type: 'string' },
          description: 'stdio 模式：参数列表',
        },
        env: {
          type: 'object',
          additionalProperties: { type: 'string' },
          description: 'stdio 模式：环境变量',
        },
        type: { type: 'string', enum: ['http', 'sse'], description: 'http/sse 模式：类型' },
        url: { type: 'string', description: 'http/sse 模式：URL' },
      },
      required: ['name'],
    },
  },
];

export async function handleWorkspaceTool(
  name: string,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    switch (name) {
      case 'list_workspaces': {
        const folders = await listWorkspaces();
        return ok(folders);
      }

      case 'list_workspace_directory': {
        const path = requireString(args, 'path');
        const entries = await listDirectory(path);
        return ok(entries);
      }

      case 'read_workspace_file': {
        const path = requireString(args, 'path');
        const content = await readWorkspaceFile(path);
        return ok({ path, content });
      }

      case 'write_workspace_file': {
        const path = requireString(args, 'path');
        const content = requireString(args, 'content');
        await writeWorkspaceFile(path, content);
        return ok({ path, message: '文件已写入', bytes: content.length });
      }

      case 'create_workspace_directory': {
        const path = requireString(args, 'path');
        await createWorkspaceDirectory(path);
        return ok({ path, message: '目录已创建' });
      }

      case 'delete_workspace_item': {
        const path = requireString(args, 'path');
        await deleteWorkspaceItem(path);
        return ok({ path, message: '已删除' });
      }

      // ── MCP 服务器配置 ────────────────────────────────────────────────────
      case 'list_mcp_servers': {
        const servers = listMcpServers();
        return ok(servers);
      }

      case 'add_mcp_server': {
        const name = requireString(args, 'name');
        const entry = await addMcpServer({
          name,
          description: args.description as string | undefined,
          enabled: args.enabled !== false,
          command: args.command as string | undefined,
          args: Array.isArray(args.args) ? args.args as string[] : undefined,
          env: args.env as Record<string, string> | undefined,
          type: args.type as 'http' | 'sse' | undefined,
          url: args.url as string | undefined,
        });
        return ok({ message: `服务器 "${name}" 已添加`, server: entry });
      }

      case 'remove_mcp_server': {
        const name = requireString(args, 'name');
        await removeMcpServer(name);
        return ok({ message: `服务器 "${name}" 已删除` });
      }

      case 'update_mcp_server': {
        const name = requireString(args, 'name');
        const updated = await updateMcpServer(name, {
          description: args.description as string | undefined,
          enabled: args.enabled as boolean | undefined,
          command: args.command as string | undefined,
          args: Array.isArray(args.args) ? args.args as string[] : undefined,
          env: args.env as Record<string, string> | undefined,
          type: args.type as 'http' | 'sse' | undefined,
          url: args.url as string | undefined,
        });
        return ok({ message: `服务器 "${name}" 已更新`, server: updated });
      }

      default:
        return err(`Unknown tool: ${name}`);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`[${name}] 执行失败: ${message}`);
    return err(message);
  }
}

function requireString(args: Record<string, unknown>, key: string): string {
  const val = args[key];
  if (typeof val !== 'string' || !val.trim()) {
    throw new Error(`参数 ${key} 必填且必须是非空字符串`);
  }
  return val.trim();
}

function ok(data: unknown): CallToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify({ success: true, data }, null, 2) }],
  };
}

function err(message: string): CallToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify({ success: false, error: message }, null, 2) }],
    isError: true,
  };
}
