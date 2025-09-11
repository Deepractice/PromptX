import { app } from 'electron'
import * as logger from '@promptx/logger'
import { 
  AppUpdater, 
  UpdateState, 
  UpdateInfo, 
  UpdateProgress, 
  UpdateCheckResult,
  UpdateEvent,
  UpdateCallback,
  UpdaterOptions,
  UpdateError
} from './types'
import { UpdateStateMachine } from './StateMachine'
import { UpdaterStorage } from './Storage'

let autoUpdater: any

export class ElectronUpdater implements AppUpdater {
  private stateMachine: UpdateStateMachine
  private storage: UpdaterStorage
  private updateInfo: UpdateInfo | null = null
  private progress: UpdateProgress | null = null
  private options: UpdaterOptions
  private checkTimer?: NodeJS.Timeout
  private retryCount = 0
  private maxRetries = 3
  private retryDelay = 5000
  private initPromise: Promise<void>

  constructor(options: UpdaterOptions = {}) {
    this.options = {
      autoDownload: false,
      autoInstallOnAppQuit: true,
      checkInterval: 3600000,
      ...options
    }
    
    this.stateMachine = new UpdateStateMachine()
    this.storage = new UpdaterStorage()
    this.initPromise = this.initializeUpdater().catch(error => {
      logger.error('ElectronUpdater: Failed to initialize:', error)
      throw error
    })
  }

  private async initializeUpdater(): Promise<void> {
    // Initialize storage first
    await this.storage.init()
    
    // Dynamically import electron-updater (CommonJS module)
    try {
      const electronUpdater = await import('electron-updater')
      // Use destructuring to access autoUpdater - this is the ESM compatibility solution
      const { autoUpdater: updater } = electronUpdater as any
      autoUpdater = updater || electronUpdater.autoUpdater || electronUpdater.default?.autoUpdater
      
      logger.info('ElectronUpdater: Module loaded:', {
        hasDefault: !!electronUpdater.default,
        hasAutoUpdater: !!electronUpdater.autoUpdater,
        keys: Object.keys(electronUpdater)
      })
      
      if (!autoUpdater) {
        // Try another way
        autoUpdater = (electronUpdater as any).autoUpdater
      }
      
      logger.info('ElectronUpdater: autoUpdater loaded successfully:', !!autoUpdater)
    } catch (error) {
      logger.error('ElectronUpdater: Failed to import electron-updater:', error)
      throw error
    }
    
    // Ensure autoUpdater is loaded
    if (!autoUpdater) {
      throw new Error('autoUpdater failed to load - tried all import methods')
    }
    
    // Now it's safe to use autoUpdater
    await this.restoreState()
    this.setupAutoUpdater()
    this.bindEvents()
    this.startPeriodicCheck()
  }

  private async restoreState(): Promise<void> {
    const state = await this.storage.loadState()
    if (state) {
      logger.info('ElectronUpdater: Restoring state:', state.currentState)
      
      // Restore state machine
      if (state.currentState === UpdateState.DOWNLOADING) {
        // electron-updater will automatically resume download
        this.stateMachine.transition(UpdateState.CHECKING)
      } else if (state.currentState === UpdateState.ERROR) {
        this.stateMachine.transition(UpdateState.IDLE)
      } else {
        this.stateMachine.transition(state.currentState)
      }
      
      this.updateInfo = state.updateInfo || null
    }
  }

  private setupAutoUpdater(): void {
    autoUpdater.autoDownload = this.options.autoDownload ?? false
    autoUpdater.autoInstallOnAppQuit = this.options.autoInstallOnAppQuit ?? true
    
    if (this.options.feedURL) {
      autoUpdater.setFeedURL(this.options.feedURL)
    } else if (this.options.repo) {
      autoUpdater.setFeedURL({
        provider: 'github',
        owner: this.options.repo.split('/')[0],
        repo: this.options.repo.split('/')[1]
      })
    }
    
    autoUpdater.logger = this.options.logger as any || logger
  }

  private bindEvents(): void {
    // Listen to state changes for persistence
    this.stateMachine.on('state-changed', async () => {
      await this.saveState()
    })
    
    autoUpdater.on('checking-for-update', () => {
      logger.info('ElectronUpdater: Checking for update...')
      this.stateMachine.transition(UpdateState.CHECKING)
      this.stateMachine.emit('checking-for-update')
    })
    
    autoUpdater.on('update-available', (info: any) => {
      logger.info('ElectronUpdater: Update available:', info.version)
      this.updateInfo = this.normalizeUpdateInfo(info)
      this.stateMachine.transition(UpdateState.UPDATE_AVAILABLE)
      this.stateMachine.emit('update-available', this.updateInfo)
    })
    
    autoUpdater.on('update-not-available', (info: any) => {
      logger.info('ElectronUpdater: Current version is up-to-date')
      this.updateInfo = null
      this.stateMachine.transition(UpdateState.IDLE)
      this.stateMachine.emit('update-not-available', info)
    })
    
    autoUpdater.on('download-progress', (progressObj: any) => {
      this.progress = {
        bytesPerSecond: progressObj.bytesPerSecond,
        percent: progressObj.percent,
        transferred: progressObj.transferred,
        total: progressObj.total,
        remainingTime: this.calculateRemainingTime(progressObj)
      }
      
      if (this.stateMachine.getCurrentState() !== UpdateState.DOWNLOADING) {
        this.stateMachine.transition(UpdateState.DOWNLOADING)
      }
      
      logger.info(`ElectronUpdater: Download progress: ${Math.round(progressObj.percent)}%`)
      this.stateMachine.emit('download-progress', this.progress)
    })
    
    autoUpdater.on('update-downloaded', (info: any) => {
      logger.info('ElectronUpdater: Update downloaded successfully')
      this.stateMachine.transition(UpdateState.READY_TO_INSTALL)
      this.stateMachine.emit('update-downloaded', info)
    })
    
    autoUpdater.on('error', (error: Error) => {
      logger.error('ElectronUpdater: Error occurred:', error)
      const updateError = this.normalizeError(error)
      this.stateMachine.transition(UpdateState.ERROR)
      this.stateMachine.emit('error', updateError)
      
      if (updateError.retryable && this.retryCount < this.maxRetries) {
        this.scheduleRetry()
      }
    })
  }

  private async saveState(): Promise<void> {
    await this.storage.saveState({
      currentState: this.stateMachine.getCurrentState(),
      lastCheck: Date.now(),
      updateInfo: this.updateInfo || undefined,
      lastError: this.stateMachine.getCurrentState() === UpdateState.ERROR
        ? { message: 'Update error', timestamp: Date.now() }
        : undefined
    })
  }

  private normalizeUpdateInfo(info: any): UpdateInfo {
    return {
      version: info.version,
      releaseNotes: info.releaseNotes,
      releaseDate: info.releaseDate,
      files: info.files?.map((f: any) => ({
        url: f.url,
        size: f.size
      }))
    }
  }

  private normalizeError(error: any): UpdateError {
    const updateError: UpdateError = new Error(error.message || 'Unknown error')
    updateError.code = error.code
    updateError.statusCode = error.statusCode
    updateError.retryable = this.isRetryableError(error)
    return updateError
  }

  private isRetryableError(error: any): boolean {
    const retryableCodes = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ENETUNREACH']
    const retryableStatusCodes = [408, 429, 500, 502, 503, 504]
    
    return retryableCodes.includes(error.code) || 
           retryableStatusCodes.includes(error.statusCode)
  }

  private calculateRemainingTime(progress: any): number | undefined {
    if (progress.bytesPerSecond > 0) {
      const remaining = progress.total - progress.transferred
      return Math.round(remaining / progress.bytesPerSecond)
    }
    return undefined
  }

  private scheduleRetry(): void {
    this.retryCount++
    const delay = this.retryDelay * Math.pow(2, this.retryCount - 1)
    
    logger.info(`ElectronUpdater: Scheduling retry ${this.retryCount}/${this.maxRetries} in ${delay}ms`)
    
    setTimeout(() => {
      this.checkForUpdates().catch(error => {
        logger.error('ElectronUpdater: Retry failed:', error)
      })
    }, delay)
  }

  private startPeriodicCheck(): void {
    if (!app.isPackaged || !this.options.checkInterval) {
      return
    }
    
    this.checkTimer = setInterval(() => {
      this.checkForUpdates().catch(error => {
        logger.error('ElectronUpdater: Periodic check failed:', error)
      })
    }, this.options.checkInterval)
  }

  async checkForUpdates(): Promise<UpdateCheckResult> {
    // Wait for initialization to complete
    await this.initPromise
    
    logger.info('ElectronUpdater: checkForUpdates called, isPackaged:', app.isPackaged)
    
    if (!app.isPackaged) {
      logger.warn('ElectronUpdater: Running in development mode')
      return { updateAvailable: false }
    }
    
    if (!autoUpdater) {
      logger.error('ElectronUpdater: autoUpdater is not initialized')
      return { updateAvailable: false }
    }
    
    try {
      this.retryCount = 0
      logger.info('ElectronUpdater: Calling autoUpdater.checkForUpdatesAndNotify()...')
      const result = await autoUpdater.checkForUpdatesAndNotify()
      
      logger.info('ElectronUpdater: Check result:', {
        hasResult: !!result,
        hasUpdateInfo: !!result?.updateInfo,
        currentVersion: app.getVersion(),
        updateVersion: result?.updateInfo?.version
      })
      
      return {
        updateAvailable: result?.updateInfo != null,
        updateInfo: result?.updateInfo ? this.normalizeUpdateInfo(result.updateInfo) : undefined
      }
    } catch (error) {
      logger.error('ElectronUpdater: Check for updates failed:', error instanceof Error ? error.message : String(error))
      logger.error('ElectronUpdater: Error details:', error)
      return {
        updateAvailable: false,
        error: error as Error
      }
    }
  }

  async downloadUpdate(): Promise<void> {
    await this.initPromise
    
    if (this.stateMachine.getCurrentState() !== UpdateState.UPDATE_AVAILABLE) {
      throw new Error('No update available to download')
    }
    
    try {
      await autoUpdater.downloadUpdate()
    } catch (error) {
      logger.error('ElectronUpdater: Download failed:', error)
      throw error
    }
  }

  async quitAndInstall(): Promise<void> {
    await this.initPromise
    
    if (this.stateMachine.getCurrentState() !== UpdateState.READY_TO_INSTALL) {
      logger.warn('ElectronUpdater: Cannot install - update not downloaded')
      return
    }
    
    logger.info('ElectronUpdater: Quitting and installing update...')
    autoUpdater.quitAndInstall()
  }

  getCurrentState(): UpdateState {
    return this.stateMachine.getCurrentState()
  }

  isUpdateAvailable(): boolean {
    return this.stateMachine.getCurrentState() === UpdateState.UPDATE_AVAILABLE ||
           this.stateMachine.getCurrentState() === UpdateState.DOWNLOADING ||
           this.stateMachine.getCurrentState() === UpdateState.READY_TO_INSTALL
  }

  getUpdateInfo(): UpdateInfo | null {
    return this.updateInfo
  }

  getProgress(): UpdateProgress | null {
    return this.progress
  }

  on(event: UpdateEvent, callback: UpdateCallback): void {
    this.stateMachine.on(event, callback)
  }

  off(event: UpdateEvent, callback: UpdateCallback): void {
    this.stateMachine.off(event, callback)
  }

  once(event: UpdateEvent, callback: UpdateCallback): void {
    this.stateMachine.once(event, callback)
  }

  setFeedURL(url: string): void {
    autoUpdater.setFeedURL(url)
  }

  setAutoDownload(enabled: boolean): void {
    autoUpdater.autoDownload = enabled
  }

  setAutoInstallOnAppQuit(enabled: boolean): void {
    autoUpdater.autoInstallOnAppQuit = enabled
  }

  destroy(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer)
      this.checkTimer = undefined
    }
    autoUpdater.removeAllListeners()
  }
}