/**
 * 工作区 MCP 工具定义
 *
 * 提供 AI 可调用的工具，用于操作用户绑定的本地工作区文件夹。
 */

import type { CallToolResult, Tool } from '@modelcontextprotocol/sdk/types.js';
import { ok, err } from '../utils/index';
import {
  listWorkspaces,
  listDirectory,
  readWorkspaceFile,
  writeWorkspaceFile,
  createWorkspaceDirectory,
  deleteWorkspaceItem,
} from '../service/workspace.service.js';
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

