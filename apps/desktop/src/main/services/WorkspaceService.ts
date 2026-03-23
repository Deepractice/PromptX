import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { homedir } from 'node:os'
import { randomUUID } from 'node:crypto'

export interface WorkspaceFolder {
  id: string
  name: string
  path: string
  added_at: string
}

interface WorkspaceFoldersConfig {
  folders: WorkspaceFolder[]
}

export class WorkspaceService {
  private configPath: string

  constructor() {
    this.configPath = path.join(homedir(), '.promptx', 'workspaces.json')
  }

  async getFolders(): Promise<WorkspaceFolder[]> {
    try {
      const raw = await fs.readFile(this.configPath, 'utf-8')
      const cfg: WorkspaceFoldersConfig = JSON.parse(raw)
      return cfg.folders || []
    } catch {
      return []
    }
  }

  async addFolder(folderPath: string, name: string): Promise<WorkspaceFolder> {
    const folders = await this.getFolders()
    const folder: WorkspaceFolder = { id: randomUUID(), name, path: folderPath, added_at: new Date().toISOString() }
    folders.push(folder)
    await this.saveFolders(folders)
    return folder
  }

  async removeFolder(id: string): Promise<void> {
    const folders = await this.getFolders()
    await this.saveFolders(folders.filter(f => f.id !== id))
  }

  async listDir(dirPath: string): Promise<DirEntry[]> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })
    const IGNORE = new Set(['node_modules', '.git', '.DS_Store', 'Thumbs.db', 'dist', '.next', '__pycache__'])
    const result: DirEntry[] = []
    for (const e of entries) {
      if (IGNORE.has(e.name)) continue
      try {
        const stat = await fs.stat(path.join(dirPath, e.name))
        result.push({
          name: e.name,
          path: path.join(dirPath, e.name),
          is_dir: e.isDirectory(),
          size: stat.isFile() ? stat.size : 0,
          modified: stat.mtime.toISOString(),
        })
      } catch { /* skip inaccessible */ }
    }
    result.sort((a, b) => {
      if (a.is_dir !== b.is_dir) return a.is_dir ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    return result
  }

  async readFile(filePath: string): Promise<string> {
    const MAX = 512 * 1024 // 512KB
    const buf = await fs.readFile(filePath)
    if (buf.length > MAX) return buf.subarray(0, MAX).toString('utf-8') + '\n\n[文件已截断]'
    return buf.toString('utf-8')
  }

  async readFileBase64(filePath: string): Promise<string> {
    const buf = await fs.readFile(filePath)
    return buf.toString('base64')
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, content, 'utf-8')
  }

  async createDir(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true })
  }

  async deleteItem(itemPath: string): Promise<void> {
    await fs.rm(itemPath, { recursive: true, force: true })
  }

  private async saveFolders(folders: WorkspaceFolder[]): Promise<void> {
    await fs.mkdir(path.dirname(this.configPath), { recursive: true })
    await fs.writeFile(this.configPath, JSON.stringify({ folders }, null, 2), 'utf-8')
  }
}

export interface DirEntry {
  name: string
  path: string
  is_dir: boolean
  size: number
  modified: string | null
}

export const workspaceService = new WorkspaceService()
