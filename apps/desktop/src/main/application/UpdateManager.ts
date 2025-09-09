import { updateElectronApp } from 'update-electron-app'
import { app } from 'electron'
import * as logger from '@promptx/logger'

export class UpdateManager {

  constructor() {
    this.setupUpdater()
  }

  private setupUpdater(): void {
    // Only enable auto-updater for packaged apps
    if (!app.isPackaged) {
      logger.info('UpdateManager: Skipping auto-updater setup in development mode')
      return
    }

    try {
      // Simple setup with update-electron-app
      updateElectronApp({
        repo: 'Deepractice/PromptX',
        updateInterval: '1 hour'
      })
      
      logger.info('UpdateManager: Auto-updater initialized with update-electron-app')
      logger.info('UpdateManager: Update check interval set to 1 hour')
      logger.info('UpdateManager: Repository: Deepractice/PromptX')
      
      // Setup detailed event listeners using electron's autoUpdater
      const { autoUpdater } = require('electron')
      
      autoUpdater.on('checking-for-update', () => {
        logger.info('UpdateManager: Checking for update...')
      })
      
      autoUpdater.on('update-available', (info: any) => {
        logger.info('UpdateManager: Update available - version:', info.version)
        if (info.releaseDate) {
          logger.info('UpdateManager: Release date:', info.releaseDate)
        }
      })
      
      autoUpdater.on('update-not-available', () => {
        logger.info('UpdateManager: Current version is up-to-date')
      })
      
      autoUpdater.on('download-progress', (progressObj: any) => {
        const percent = Math.round(progressObj.percent)
        const transferred = Math.round(progressObj.transferred / 1024 / 1024 * 100) / 100
        const total = Math.round(progressObj.total / 1024 / 1024 * 100) / 100
        logger.info(`UpdateManager: Download progress: ${percent}% (${transferred}MB / ${total}MB)`)
      })
      
      autoUpdater.on('update-downloaded', (releaseNotes: string, releaseName: string) => {
        logger.info('UpdateManager: Update downloaded successfully')
        logger.info('UpdateManager: Release name:', releaseName)
        if (releaseNotes) {
          logger.info('UpdateManager: Release notes available')
        }
      })
      
      autoUpdater.on('error', (error: any) => {
        logger.error('UpdateManager: Auto-updater error:', error.message || error.toString())
      })
      
    } catch (error) {
      logger.error('UpdateManager: Failed to initialize auto-updater:', error)
    }
  }

  // Check for updates on startup (simplified)
  async checkForUpdates(): Promise<void> {
    if (app.isPackaged) {
      logger.info('UpdateManager: Auto-updater is running, updates will be checked automatically')
    } else {
      logger.info('UpdateManager: Skipping update check in development mode')
    }
  }

  // Manual check for updates (deprecated - button removed from UI)
  async checkForUpdatesManual(): Promise<void> {
    logger.info('UpdateManager: Manual update check called (deprecated)')
    logger.info('UpdateManager: Auto-updater runs every 1 hour automatically')
    logger.info('UpdateManager: Check logs for update status and progress')
    
    if (!app.isPackaged) {
      logger.info('UpdateManager: Running in development mode - updates disabled')
      return
    }
    
    // No longer show dialogs - rely on automatic updates and logging
    logger.info('UpdateManager: Manual check completed - relying on automatic updates')
  }


  // Legacy methods for tray menu compatibility
  isUpdateAvailable(): boolean {
    // update-electron-app handles this internally
    return false
  }

  onUpdateAvailable(_callback: () => void): void {
    // update-electron-app handles this internally
    logger.info('UpdateManager: onUpdateAvailable callback registered (handled by update-electron-app)')
  }
}