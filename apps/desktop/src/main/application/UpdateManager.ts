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
    // 监听更新事件，可以发送到渲染进程
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
      
      // 可选：显示对话框提示用户重启
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
      title: '更新已下载',
      message: '新版本已下载完成，是否立即重启应用？',
      buttons: ['立即重启', '稍后'],
      defaultId: 0,
      cancelId: 1
    })

    if (response === 0) {
      this.updater.quitAndInstall()
    }
  }

  async checkForUpdates(): Promise<void> {
    // 临时注释，允许开发模式测试
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
    
    // 临时注释，允许开发模式测试
    // if (!app.isPackaged) {
    //   dialog.showMessageBox({
    //     type: 'info',
    //     title: '开发模式',
    //     message: '更新功能在开发模式下不可用'
    //   })
    //   return
    // }

    const state = this.updater.getCurrentState()
    
    if (state === UpdateState.CHECKING || state === UpdateState.DOWNLOADING) {
      dialog.showMessageBox({
        type: 'info',
        title: '检查更新',
        message: '正在检查更新，请稍候...'
      })
      return
    }

    try {
      const result = await this.updater.checkForUpdates()
      
      if (!result.updateAvailable) {
        dialog.showMessageBox({
          type: 'info',
          title: '检查更新',
          message: '当前已是最新版本'
        })
      }
    } catch (error) {
      dialog.showMessageBox({
        type: 'error',
        title: '检查更新失败',
        message: `无法检查更新: ${error}`
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