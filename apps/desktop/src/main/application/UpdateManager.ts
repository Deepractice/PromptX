import { BrowserWindow, dialog } from 'electron'
import * as logger from '@promptx/logger'
import { createUpdater } from '../updater'
import { UpdateState, UpdateEvent } from '../updater/types'

export class UpdateManager {
  public readonly updater = createUpdater({
    // No repo/feedURL config - use electron-builder.yml publish config
    // This ensures CDN (promptx.deepractice.ai) is tried first, then GitHub as fallback
    autoDownload: true, // Auto-download when update is found
    autoInstallOnAppQuit: true,
    checkInterval: 0 // No periodic checks, only on startup and manual
  })
  
  constructor() {
    this.setupEventListeners()
    // No automatic operations - all actions must be triggered explicitly
  }

  private setupEventListeners(): void {
    // Listen to update events, can send to renderer process
    this.updater.on('checking-for-update', () => {
      logger.info('UpdateManager: Checking for updates...')
      this.sendToAllWindows('update-checking')
    })

    this.updater.on('update-available', (info) => {
      logger.info('UpdateManager: Update available:', info.version)
      this.sendToAllWindows('update-available', info)
    })

    this.updater.on('update-not-available', () => {
      logger.info('UpdateManager: Current version is up to date')
      this.sendToAllWindows('update-not-available')
    })

    this.updater.on('download-progress', (progress) => {
      logger.info(`UpdateManager: Download progress: ${Math.round(progress.percent)}%`)
      this.sendToAllWindows('update-download-progress', progress)
    })

    this.updater.on('update-downloaded', (info) => {
      logger.info('UpdateManager: Update downloaded, ready to install')
      this.sendToAllWindows('update-downloaded', info)
      // No automatic dialog - let UI or user decide what to do
    })

    this.updater.on('error', (error) => {
      logger.error('UpdateManager: Update error:', error)
      this.sendToAllWindows('update-error', error.message)
    })

    this.updater.on('state-changed' as UpdateEvent, ({ from, to }) => {
      logger.info(`UpdateManager: State changed from ${from} to ${to}`)
      this.sendToAllWindows('update-state-changed', { from, to })
    })
  }

  private sendToAllWindows(channel: string, data?: any): void {
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send(channel, data)
    })
  }

  // Removed automatic dialog - all UI interactions should be triggered explicitly

  async checkForUpdates(): Promise<any> {
    try {
      const result = await this.updater.checkForUpdates()
      if (result.updateAvailable) {
        logger.info('UpdateManager: Update found:', result.updateInfo?.version)
      } else {
        logger.info('UpdateManager: No updates available')
      }
      return result
    } catch (error) {
      logger.error('UpdateManager: Check for updates failed:', String(error))
      throw error
    }
  }

  async autoCheckAndDownload(): Promise<void> {
    // Check if update is already downloaded
    const currentState = this.updater.getCurrentState()
    if (currentState === UpdateState.READY_TO_INSTALL) {
      logger.info('UpdateManager: Update already downloaded and ready to install')
      return // Skip auto-check, update is ready
    }

    logger.info('UpdateManager: Starting automatic check and download')
    try {
      const result = await this.checkForUpdates()
      if (result.updateAvailable) {
        logger.info('UpdateManager: Update available, starting download')
        await this.downloadUpdate()
      }
    } catch (error) {
      logger.error('UpdateManager: Auto check and download failed:', String(error))
    }
  }

  async checkForUpdatesManual(): Promise<void> {
    logger.info('UpdateManager: Manual update check requested')
    
    const state = this.updater.getCurrentState()
    
    // If already downloaded, ask to install
    if (state === UpdateState.READY_TO_INSTALL) {
      this.showInstallDialog()
      return
    }
    
    // If checking or downloading, show progress
    if (state === UpdateState.CHECKING) {
      dialog.showMessageBox({
        type: 'info',
        title: 'Check for Updates',
        message: 'Checking for updates, please wait...'
      })
      return
    }
    
    if (state === UpdateState.DOWNLOADING) {
      const progress = this.updater.getProgress()
      const percent = progress ? Math.round(progress.percent) : 0
      dialog.showMessageBox({
        type: 'info',
        title: 'Downloading Update',
        message: `Downloading update... ${percent}%`
      })
      return
    }

    // Perform check and download if available
    const result = await this.updater.checkForUpdates()

    // Check if there was an error during the check
    if (result.error) {
      dialog.showMessageBox({
        type: 'error',
        title: 'Update Check Failed',
        message: `Failed to check for updates: ${result.error.message || result.error}`
      })
      return
    }

    // Check if update is available
    if (result.updateAvailable) {
      try {
        // Auto-download when manually checking
        await this.downloadUpdate()
        // After download, show install dialog
        this.showInstallDialog()
      } catch (error) {
        dialog.showMessageBox({
          type: 'error',
          title: 'Download Failed',
          message: `Failed to download update: ${error}`
        })
      }
    } else {
      // No update available - show info dialog
      dialog.showMessageBox({
        type: 'info',
        title: 'Check for Updates',
        message: 'You are already running the latest version'
      })
    }
  }

  private showInstallDialog(): void {
    const updateInfo = this.updater.getUpdateInfo()
    const version = updateInfo?.version || 'new version'
    
    const response = dialog.showMessageBoxSync({
      type: 'info',
      title: 'Update Ready',
      message: `Version ${version} is ready to install. Would you like to restart and install now?`,
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
      cancelId: 1
    })

    if (response === 0) {
      this.quitAndInstall()
    }
  }

  isUpdateAvailable(): boolean {
    return this.updater.isUpdateAvailable()
  }

  onUpdateAvailable(callback: () => void): void {
    this.updater.on('update-available', callback)
  }

  getUpdateState(): UpdateState {
    return this.updater.getCurrentState()
  }

  downloadUpdate(): Promise<void> {
    return this.updater.downloadUpdate()
  }

  quitAndInstall(): void {
    this.updater.quitAndInstall()
  }

  getUpdateInfo() {
    return this.updater.getUpdateInfo()
  }

  getProgress() {
    return this.updater.getProgress()
  }

  showInstallDialogIfReady(): void {
    if (this.updater.getCurrentState() === UpdateState.READY_TO_INSTALL) {
      this.showInstallDialog()
    }
  }
}