import { contextBridge, ipcRenderer } from 'electron'

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

interface AgentXConfig {
  apiKey: string
  baseUrl: string
  model: string
  mcpServers?: MCPServerConfig[]
}

interface OpenDialogOptions {
  title?: string
  defaultPath?: string
  filters?: { name: string; extensions: string[] }[]
  properties?: ('openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles')[]
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
}

contextBridge.exposeInMainWorld('electronAPI', {
  getGroupedResources: () => ipcRenderer.invoke('resources:getGrouped'),
  searchResources: (query: string) => ipcRenderer.invoke('resources:search', query),
  getStatistics: () => ipcRenderer.invoke('resources:getStatistics'),
  activateRole: (roleId: string) => ipcRenderer.invoke('resources:activateRole', roleId),
  executeTool: (toolId: string, parameters?: any) => ipcRenderer.invoke('resources:executeTool', toolId, parameters),
  getToolManual: (toolId: string) => ipcRenderer.invoke('resources:getToolManual', toolId),
  getToolSchema: (payload: { id: string; source?: string }) => ipcRenderer.invoke('resources:getToolSchema', payload),
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
  }
} as ElectronAPI)

// 为window对象添加类型定义
declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}