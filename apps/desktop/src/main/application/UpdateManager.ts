import { app, BrowserWindow, dialog } from 'electron'
import * as logger from '@promptx/logger'
import { createUpdater } from '../updater'
import { UpdateState, UpdateEvent } from '../updater/types'

export class UpdateManager {
  private updater = createUpdater({
    repo: 'Deepractice/PromptX',
    autoDownload: true,
    autoInstallOnAppQuit: true,
    checkInterval: 3600000 // 1 hour
  })

  constructor() {
    this.setupEventListeners()
    this.checkForUpdates()
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
      
      // Optional: show dialog to prompt user to restart
      if (app.isPackaged) {
        this.showUpdateDialog()
      }
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

  private showUpdateDialog(): void {
    const response = dialog.showMessageBoxSync({
      type: 'info',
      title: 'Update Downloaded',
      message: 'A new version has been downloaded. Would you like to restart the app now?',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
      cancelId: 1
    })

    if (response === 0) {
      this.updater.quitAndInstall()
    }
  }

  async checkForUpdates(): Promise<void> {
    // Temporarily commented to allow development mode testing
    // if (!app.isPackaged) {
    //   logger.info('UpdateManager: Skipping update check in development mode')
    //   return
    // }

    try {
      const result = await this.updater.checkForUpdates()
      if (result.updateAvailable) {
        logger.info('UpdateManager: Update found:', result.updateInfo?.version)
      } else {
        logger.info('UpdateManager: No updates available')
      }
    } catch (error) {
      logger.error('UpdateManager: Check for updates failed:', error)
    }
  }

  async checkForUpdatesManual(): Promise<void> {
    logger.info('UpdateManager: Manual update check requested')
    
    // Temporarily commented to allow development mode testing
    // if (!app.isPackaged) {
    //   dialog.showMessageBox({
    //     type: 'info',
    //     title: 'Development Mode',
    //     message: 'Update feature is not available in development mode'
    //   })
    //   return
    // }

    const state = this.updater.getCurrentState()
    
    if (state === UpdateState.CHECKING || state === UpdateState.DOWNLOADING) {
      dialog.showMessageBox({
        type: 'info',
        title: 'Check for Updates',
        message: 'Checking for updates, please wait...'
      })
      return
    }

    try {
      const result = await this.updater.checkForUpdates()
      
      if (!result.updateAvailable) {
        dialog.showMessageBox({
          type: 'info',
          title: 'Check for Updates',
          message: 'You are already running the latest version'
        })
      }
    } catch (error) {
      dialog.showMessageBox({
        type: 'error',
        title: 'Update Check Failed',
        message: `Failed to check for updates: ${error}`
      })
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
}