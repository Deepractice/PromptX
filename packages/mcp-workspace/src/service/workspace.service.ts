/**
 * 工作区文件操作服务
 *
 * 直接操作本地文件系统，读取 ~/.promptx/workspaces.json 获取工作区配置。
 * 所有路径操作都会校验是否在已绑定的工作区范围内。
 */

import { readFileSync, existsSync, createReadStream } from 'node:fs';
import { readdir, stat, rm, unlink, mkdir, writeFile } from 'node:fs/promises';
import { join, basename, resolve, normalize } from 'node:path';
import { homedir } from 'node:os';
import { createLogger } from '@promptx/logger';

const logger = createLogger();

interface WorkspaceFolder {
  id: string;
  path: string;
  name: string;
  added_at: string;
}

interface WorkspaceConfig {
  folders: WorkspaceFolder[];
}

interface DirEntry {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  modified: string | null;
}

const CONFIG_PATH = join(homedir(), '.promptx', 'workspaces.json');

const HIDDEN_DIRS = new Set([
  'node_modules', '__pycache__', 'target', '.git', '.svn',
  '.hg', '.DS_Store', 'Thumbs.db', '.idea', '.vscode',
]);

const BINARY_EXTS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'ico', 'svg',
  'mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'webm',
  'mp3', 'wav', 'flac', 'aac', 'ogg', 'wma',
  'zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz',
  'exe', 'dll', 'so', 'dylib', 'bin',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'woff', 'woff2', 'ttf', 'otf', 'eot',
  'db', 'sqlite', 'sqlite3',
  'psd', 'ai', 'sketch', 'fig',
]);

const MAX_READ_BYTES = 512 * 1024;
const MAX_LINES = 5_000;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function loadConfig(): WorkspaceConfig {
  try {
    if (existsSync(CONFIG_PATH)) {
      const raw = readFileSync(CONFIG_PATH, 'utf-8');
      return JSON.parse(raw) as WorkspaceConfig;
    }
  } catch {
    logger.warn('Failed to load workspace config');
  }
  return { folders: [] };
}

function assertWithinWorkspace(filePath: string, config: WorkspaceConfig): void {
  const normalized = normalize(resolve(filePath));
  const isWithin = config.folders.some(f => normalized.startsWith(normalize(resolve(f.path))));
  if (!isWithin) {
    throw new Error(`路径不在任何工作区内: ${filePath}`);
  }
}

function getExt(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.slice(dot + 1).toLowerCase();
}

function isBinaryExt(name: string): boolean {
  return BINARY_EXTS.has(getExt(name));
}

function formatDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export async function listWorkspaces(): Promise<WorkspaceFolder[]> {
  const config = loadConfig();
  logger.info(`[listWorkspaces] ${config.folders.length} folders`);
  return config.folders;
}

export async function listDirectory(dirPath: string): Promise<DirEntry[]> {
  const config = loadConfig();
  assertWithinWorkspace(dirPath, config);

  const entries = await readdir(dirPath, { withFileTypes: true });
  const results: DirEntry[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.') || HIDDEN_DIRS.has(entry.name)) continue;

    const fullPath = join(dirPath, entry.name);
    try {
      const s = await stat(fullPath);
      results.push({
        name: entry.name,
        path: fullPath,
        is_dir: entry.isDirectory(),
        size: s.size,
        modified: formatDate(s.mtime),
      });
    } catch {
      // skip inaccessible entries
    }
  }

  results.sort((a, b) => {
    if (a.is_dir !== b.is_dir) return a.is_dir ? -1 : 1;
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  });

  logger.info(`[listDirectory] ${dirPath} → ${results.length} entries`);
  return results;
}

export async function readWorkspaceFile(filePath: string): Promise<string> {
  const config = loadConfig();
  assertWithinWorkspace(filePath, config);

  const s = await stat(filePath);
  if (!s.isFile()) throw new Error(`不是文件: ${filePath}`);

  if (s.size === 0) {
    logger.info(`[readWorkspaceFile] ${filePath} (empty file)`);
    return '（空文件）';
  }

  if (isBinaryExt(basename(filePath))) {
    throw new Error('二进制文件无法作为文本读取，请使用其他方式处理');
  }

  const fileSize = s.size;
  if (fileSize > MAX_FILE_SIZE) {
    throw new Error(`文件过大 (${(fileSize / 1024 / 1024).toFixed(1)}MB)，超过 ${MAX_FILE_SIZE / 1024 / 1024}MB 限制`);
  }

  const readSize = Math.min(fileSize, MAX_READ_BYTES);
  const buffer = Buffer.alloc(readSize);

  await new Promise<void>((resolve, reject) => {
    let offset = 0;
    const stream = createReadStream(filePath, { start: 0, end: readSize - 1 });
    stream.on('data', (chunk: Buffer | string) => {
      const buf = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
      buf.copy(buffer, offset);
      offset += buf.length;
    });
    stream.on('end', resolve);
    stream.on('error', reject);
  });

  const text = buffer.toString('utf-8');
  const lines = text.split('\n');
  const wasTruncatedBySize = fileSize > MAX_READ_BYTES;
  const wasTruncatedByLines = lines.length > MAX_LINES;
  const displayLines = wasTruncatedByLines ? lines.slice(0, MAX_LINES) : lines;
  let result = displayLines.join('\n');

  if (wasTruncatedBySize || wasTruncatedByLines) {
    result += `\n\n─── 文件已截断（原始大小 ${(fileSize / 1024 / 1024).toFixed(1)}MB，显示前 ${displayLines.length} 行）───`;
  }

  logger.info(`[readWorkspaceFile] ${filePath} (${(readSize / 1024).toFixed(0)}KB read)`);
  return result;
}

export async function writeWorkspaceFile(filePath: string, content: string): Promise<void> {
  const config = loadConfig();
  assertWithinWorkspace(filePath, config);

  const dir = join(filePath, '..');
  await mkdir(dir, { recursive: true });
  await writeFile(filePath, content, 'utf-8');

  logger.info(`[writeWorkspaceFile] ${filePath} (${content.length} bytes)`);
}

export async function createWorkspaceDirectory(dirPath: string): Promise<void> {
  const config = loadConfig();
  assertWithinWorkspace(dirPath, config);

  await mkdir(dirPath, { recursive: true });
  logger.info(`[createWorkspaceDirectory] ${dirPath}`);
}

export async function deleteWorkspaceItem(itemPath: string): Promise<void> {
  const config = loadConfig();
  assertWithinWorkspace(itemPath, config);

  if (config.folders.some(f => normalize(resolve(f.path)) === normalize(resolve(itemPath)))) {
    throw new Error('不能删除工作区根目录，请使用移除工作区功能');
  }

  const s = await stat(itemPath);
  if (s.isDirectory()) {
    await rm(itemPath, { recursive: true, force: true });
  } else {
    await unlink(itemPath);
  }

  logger.info(`[deleteWorkspaceItem] ${itemPath}`);
}
