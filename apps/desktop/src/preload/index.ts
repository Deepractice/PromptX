import { contextBridge, ipcRenderer, shell } from 'electron'

/**
 * Preload Script - 安全的IPC通信桥接
 * 遵循Electron安全最佳实践
 */

// 定义API接口
interface MCPServerConfig {
  name: string
  // stdio 类型
  command?: string
  args?: string[]
  env?: Record<string, string>
  // http/sse 类型
  type?: "http" | "sse"
  url?: string
  // 通用
  enabled: boolean
  builtin?: boolean
  description?: string
  [key: string]: unknown
}

interface AgentXProfile {
  id: string
  name: string
  apiKey: string
  baseUrl: string
  model: string
}

interface AgentXConfig {
  apiKey: string
  baseUrl: string
  model: string
  mcpServers?: MCPServerConfig[]
  profiles?: AgentXProfile[]
  activeProfileId?: string
}

interface OpenDialogOptions {
  defaultPath?: string
  filters?: { name: string; extensions: string[] }[]
  properties?: ('openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles')[]
}

interface WorkspaceFolder {
  id: string
  name: string
  path: string
}

interface DirEntry {
  name: string
  path: string
  is_dir: boolean
  size: number
  modified: string | null
}

interface OpenDialogResult {
  canceled: boolean
  filePaths: string[]
}

interface ReadFileResult {
  success: boolean
  data?: string
  fileName?: string
  mimeType?: string
  size?: number
  error?: string
}

interface ElectronAPI {
  getGroupedResources: () => Promise<any>
  searchResources: (query: string) => Promise<any>
  getStatistics: () => Promise<any>
  activateRole: (roleId: string) => Promise<any>
  executeTool: (toolId: string, parameters?: any) => Promise<any>
  getToolManual: (toolId: string) => Promise<any>
  getToolSchema: (payload: { id: string; source?: string }) => Promise<any>
  getRolePrompt: (roleId: string, source: string, options?: { roleResources?: string }) => Promise<any>
  getRoleAvatar: (payload: { id: string; source?: string }) => Promise<{ success: boolean; data: string | null }>
  uploadRoleAvatar: (payload: { id: string; source?: string; imagePath: string }) => Promise<{ success: boolean; message?: string }>
  invoke: (channel: string, ...args: any[]) => Promise<any>
  // Dialog API
  dialog: {
    openFile: (options?: OpenDialogOptions) => Promise<OpenDialogResult>
    readFile: (filePath: string) => Promise<ReadFileResult>
  }
  // AgentX API
  agentx: {
    getServerUrl: () => Promise<string>
    getStatus: () => Promise<boolean>
    start: () => Promise<{ success: boolean; error?: string }>
    stop: () => Promise<{ success: boolean; error?: string }>
    getConfig: () => Promise<AgentXConfig>
    updateConfig: (config: Partial<AgentXConfig>) => Promise<{ success: boolean; error?: string }>
    testConnection: (config: Partial<AgentXConfig>) => Promise<{ success: boolean; error?: string }>
    getMcpServers: () => Promise<MCPServerConfig[]>
    updateMcpServers: (servers: MCPServerConfig[]) => Promise<{ success: boolean; error?: string }>
    // Skills API
    getAvailableSkills: () => Promise<{ name: string; description: string; version?: string }[]>
    getEnabledSkills: () => Promise<string[]>
    updateEnabledSkills: (skills: string[]) => Promise<{ success: boolean; error?: string }>
    importSkill: (zipPath: string) => Promise<{ success: boolean; skillName?: string; error?: string }>
    deleteSkill: (skillName: string) => Promise<{ success: boolean; error?: string }>
  }
  // Web Access API
  webAccess: {
    getStatus: () => Promise<{ enabled: boolean; externalAccess: boolean }>
    enable: (port?: number) => Promise<{ success: boolean; enabled?: boolean; url?: string; qrCodeDataUrl?: string; port?: number; token?: string; error?: string }>
    disable: () => Promise<{ success: boolean; error?: string }>
  }
  // Cognition API
  cognition: {
    getOverview: (roleId: string) => Promise<any>
    listEngrams: (roleId: string, page?: number, pageSize?: number, type?: string, keyword?: string) => Promise<any>
    getNetwork: (roleId: string, limit?: number) => Promise<any>
    getCueDetail: (roleId: string, cueWord: string) => Promise<any>
    updateEngram: (roleId: string, engramId: number, updates: { content?: string; type?: string; strength?: number; schema?: string }) => Promise<any>
    deleteEngram: (roleId: string, engramId: number) => Promise<any>
    deleteCue: (roleId: string, cueWord: string) => Promise<any>
  }
  // Shell API
  shell: {
    openExternal: (url: string) => Promise<void>
  }
  // Workspace API
  workspace: {
    getFolders: () => Promise<WorkspaceFolder[]>
    addFolder: (path: string, name: string) => Promise<WorkspaceFolder>
    removeFolder: (id: string) => Promise<void>
    pickFolder: () => Promise<{ path: string; name: string } | null>
    listDir: (dirPath: string) => Promise<DirEntry[]>
    readFile: (filePath: string) => Promise<string>
    readFileBase64: (filePath: string) => Promise<string>
    writeFile: (filePath: string, content: string) => Promise<void>
    createDir: (dirPath: string) => Promise<void>
    deleteItem: (itemPath: string) => Promise<void>
  }
  // System API
  system: {
    checkGit: () => Promise<{ installed: boolean }>
  }
  // System info
  platform: string
}

contextBridge.exposeInMainWorld('electronAPI', {
  getGroupedResources: () => ipcRenderer.invoke('resources:getGrouped'),
  searchResources: (query: string) => ipcRenderer.invoke('resources:search', query),
  getStatistics: () => ipcRenderer.invoke('resources:getStatistics'),
  activateRole: (roleId: string) => ipcRenderer.invoke('resources:activateRole', roleId),
  executeTool: (toolId: string, parameters?: any) => ipcRenderer.invoke('resources:executeTool', toolId, parameters),
  getToolManual: (toolId: string) => ipcRenderer.invoke('resources:getToolManual', toolId),
  getToolSchema: (payload: { id: string; source?: string }) => ipcRenderer.invoke('resources:getToolSchema', payload),
  getRolePrompt: (roleId: string, source: string, options?: { roleResources?: string }) => ipcRenderer.invoke('resources:previewPrompt', { id: roleId, type: 'role', source, roleResources: options?.roleResources }),
  getRoleAvatar: (payload: { id: string; source?: string }) => ipcRenderer.invoke('resources:getRoleAvatar', payload),
  uploadRoleAvatar: (payload: { id: string; source?: string; imagePath: string }) => ipcRenderer.invoke('resources:uploadRoleAvatar', payload),
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
  // Dialog API
  dialog: {
    openFile: (options?: OpenDialogOptions) => ipcRenderer.invoke('dialog:openFile', options),
    readFile: (filePath: string) => ipcRenderer.invoke('dialog:readFile', filePath),
  },
  // AgentX API
  agentx: {
    getServerUrl: () => ipcRenderer.invoke('agentx:getServerUrl'),
    getStatus: () => ipcRenderer.invoke('agentx:getStatus'),
    start: () => ipcRenderer.invoke('agentx:start'),
    stop: () => ipcRenderer.invoke('agentx:stop'),
    getConfig: () => ipcRenderer.invoke('agentx:getConfig'),
    updateConfig: (config: Partial<AgentXConfig>) => ipcRenderer.invoke('agentx:updateConfig', config),
    testConnection: (config: Partial<AgentXConfig>) => ipcRenderer.invoke('agentx:testConnection', config),
    getMcpServers: () => ipcRenderer.invoke('agentx:getMcpServers'),
    updateMcpServers: (servers: MCPServerConfig[]) => ipcRenderer.invoke('agentx:updateMcpServers', servers),
    // Skills API
    getAvailableSkills: () => ipcRenderer.invoke('agentx:getAvailableSkills'),
    getEnabledSkills: () => ipcRenderer.invoke('agentx:getEnabledSkills'),
    updateEnabledSkills: (skills: string[]) => ipcRenderer.invoke('agentx:updateEnabledSkills', skills),
    importSkill: (zipPath: string) => ipcRenderer.invoke('agentx:importSkill', zipPath),
    deleteSkill: (skillName: string) => ipcRenderer.invoke('agentx:deleteSkill', skillName),
  },
  // Web Access API
  webAccess: {
    getStatus: () => ipcRenderer.invoke('webAccess:getStatus'),
    enable: (port?: number) => ipcRenderer.invoke('webAccess:enable', port),
    disable: () => ipcRenderer.invoke('webAccess:disable'),
  },
  // Cognition API
  cognition: {
    getOverview: (roleId: string) => ipcRenderer.invoke('cognition:getOverview', roleId),
    listEngrams: (roleId: string, page?: number, pageSize?: number, type?: string, keyword?: string) =>
      ipcRenderer.invoke('cognition:listEngrams', roleId, page, pageSize, type, keyword),
    getNetwork: (roleId: string, limit?: number) => ipcRenderer.invoke('cognition:getNetwork', roleId, limit),
    getCueDetail: (roleId: string, cueWord: string) => ipcRenderer.invoke('cognition:getCueDetail', roleId, cueWord),
    updateEngram: (roleId: string, engramId: number, updates: { content?: string; type?: string; strength?: number; schema?: string }) =>
      ipcRenderer.invoke('cognition:updateEngram', roleId, engramId, updates),
    deleteEngram: (roleId: string, engramId: number) => ipcRenderer.invoke('cognition:deleteEngram', roleId, engramId),
    deleteCue: (roleId: string, cueWord: string) => ipcRenderer.invoke('cognition:deleteCue', roleId, cueWord),
  },
  // Shell API
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
  },
  // Workspace API
  workspace: {
    getFolders: () => ipcRenderer.invoke('workspace:getFolders'),
    addFolder: (path: string, name: string) => ipcRenderer.invoke('workspace:addFolder', path, name),
    removeFolder: (id: string) => ipcRenderer.invoke('workspace:removeFolder', id),
    pickFolder: () => ipcRenderer.invoke('workspace:pickFolder'),
    listDir: (dirPath: string) => ipcRenderer.invoke('workspace:listDir', dirPath),
    readFile: (filePath: string) => ipcRenderer.invoke('workspace:readFile', filePath),
    readFileBase64: (filePath: string) => ipcRenderer.invoke('workspace:readFileBase64', filePath),
    writeFile: (filePath: string, content: string) => ipcRenderer.invoke('workspace:writeFile', filePath, content),
    createDir: (dirPath: string) => ipcRenderer.invoke('workspace:createDir', dirPath),
    deleteItem: (itemPath: string) => ipcRenderer.invoke('workspace:deleteItem', itemPath),
  },
  // System API
  system: {
    checkGit: () => ipcRenderer.invoke('system:checkGit'),
  },
  // System info
  platform: process.platform,
} as ElectronAPI)

// 为window对象添加类型定义
declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}