export enum UpdateState {
  IDLE = 'idle',                  // Can check for updates
  CHECKING = 'checking',          // Checking for updates
  UPDATE_AVAILABLE = 'update-available', // Update found, can download
  DOWNLOADING = 'downloading',     // Downloading update
  READY_TO_INSTALL = 'ready-to-install', // Downloaded, ready to restart
  ERROR = 'error'                 // Error occurred
}

export interface UpdateInfo {
  version: string
  releaseNotes?: string
  releaseDate?: string
  files?: Array<{
    url: string
    size: number
  }>
}

export interface UpdateProgress {
  bytesPerSecond: number
  percent: number
  transferred: number
  total: number
  remainingTime?: number
}

export interface UpdateCheckResult {
  updateAvailable: boolean
  updateInfo?: UpdateInfo
  error?: Error
}

export type UpdateEvent = 
  | 'checking-for-update'
  | 'update-available'
  | 'update-not-available'
  | 'download-progress'
  | 'update-downloaded'
  | 'error'
  | 'state-changed'

export type UpdateCallback = (data?: any) => void

export interface UpdateError extends Error {
  code?: string
  statusCode?: number
  retryable?: boolean
}

export interface AppUpdater {
  checkForUpdates(): Promise<UpdateCheckResult>
  downloadUpdate(): Promise<void>
  quitAndInstall(): void | Promise<void>
  
  getCurrentState(): UpdateState
  isUpdateAvailable(): boolean
  getUpdateInfo(): UpdateInfo | null
  getProgress(): UpdateProgress | null
  
  on(event: UpdateEvent, callback: UpdateCallback): void
  off(event: UpdateEvent, callback: UpdateCallback): void
  once(event: UpdateEvent, callback: UpdateCallback): void
  
  setFeedURL?(url: string): void
  setAutoDownload?(enabled: boolean): void
  setAutoInstallOnAppQuit?(enabled: boolean): void
}

export interface UpdaterOptions {
  repo?: string
  feedURL?: string
  autoDownload?: boolean
  autoInstallOnAppQuit?: boolean
  checkInterval?: number
  logger?: {
    info: (message: string, ...args: any[]) => void
    error: (message: string, ...args: any[]) => void
    debug: (message: string, ...args: any[]) => void
  }
}