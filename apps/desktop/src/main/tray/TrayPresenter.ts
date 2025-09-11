import { 
  BrowserWindow, 
  Menu, 
  MenuItem, 
  Tray,
  app, 
  clipboard, 
  nativeImage,
  shell,
  dialog 
} from 'electron'
import { ServerStatus } from '~/main/domain/valueObjects/ServerStatus'
import { ResultUtil } from '~/shared/Result'
import type { StartServerUseCase } from '~/main/application/useCases/StartServerUseCase'
import type { StopServerUseCase } from '~/main/application/useCases/StopServerUseCase'
import type { IServerPort } from '~/main/domain/ports/IServerPort'
import type { UpdateManager } from '~/main/application/UpdateManager'
import * as path from 'node:path'
import * as fs from 'node:fs'
import * as logger from '@promptx/logger'
import { createPIcon } from '~/utils/createPIcon'
import { ResourceManager } from '~/main/ResourceManager'
import packageJson from '../../../package.json'

interface TrayMenuItem {
  id?: string
  label?: string
  type?: 'normal' | 'separator' | 'submenu' | 'checkbox' | 'radio'
  enabled?: boolean
  click?: () => void
  submenu?: TrayMenuItem[]
}

export class TrayPresenter {
  private tray: Tray
  private currentStatus: ServerStatus = ServerStatus.STOPPED
  private logsWindow: BrowserWindow | null = null
  private statusListener: (status: ServerStatus) => void
  private resourceManager: ResourceManager
  private appIcon: nativeImage | undefined

  constructor(
    private readonly startServerUseCase: StartServerUseCase,
    private readonly stopServerUseCase: StopServerUseCase,
    private readonly serverPort: IServerPort,
    private readonly updateManager: UpdateManager
  ) {
    // Initialize resource manager
    this.resourceManager = new ResourceManager()
    // Create tray icon
    this.tray = this.createTray()
    // Load app icon for dialogs
    this.loadAppIcon()
    
    // Setup status listener
    this.statusListener = (status) => this.updateStatus(status)
    this.serverPort.onStatusChange(this.statusListener)

    // Setup update listeners to refresh menu on state changes
    this.updateManager.onUpdateAvailable(() => {
      this.initializeMenu()
    })
    
    // Listen to all state changes to update menu
    this.updateManager.updater.on('state-changed', () => {
      this.initializeMenu()
    })
    
    // Listen to download progress to update menu
    this.updateManager.updater.on('download-progress', () => {
      this.initializeMenu()
    })
    
    // Initialize menu
    this.initializeMenu()
  }

  private createTray(): Tray {
    logger.debug('Creating tray icon...')
    
    // Create P icon programmatically
    logger.info('Creating P icon for tray')
    const icon = createPIcon()
    
    const tray = new Tray(icon)
    tray.setToolTip('PromptX Desktop')
    
    logger.info('Tray created with P icon')
    return tray
  }


  private async initializeMenu(): Promise<void> {
    const menuItems = await this.buildMenu()
    const menu = Menu.buildFromTemplate(menuItems as any)
    this.tray.setContextMenu(menu)
  }

  async buildMenu(): Promise<TrayMenuItem[]> {
    const statusResult = await this.serverPort.getStatus()
    const status = statusResult.ok ? statusResult.value : ServerStatus.ERROR
    
    const menuItems: TrayMenuItem[] = []

    // Status indicator
    if (status === ServerStatus.RUNNING) {
      const addressResult = await this.serverPort.getAddress()
      if (addressResult.ok) {
        menuItems.push({
          id: 'address',
          label: addressResult.value,
          enabled: false
        })
      }
    } else {
      menuItems.push({
        id: 'status',
        label: `Status: ${this.getStatusLabel(status)}`,
        enabled: false
      })
    }

    menuItems.push({ type: 'separator' })

    // Toggle server
    menuItems.push({
      id: 'toggle',
      label: this.getToggleLabel(status),
      enabled: this.canToggle(status),
      click: () => this.handleToggleServer()
    })

    // Copy address (only when running)
    if (status === ServerStatus.RUNNING) {
      menuItems.push({
        id: 'copy',
        label: 'Copy Server Address',
        click: () => this.handleCopyAddress()
      })
    }

    menuItems.push({ type: 'separator' })
    
    // Resource management (roles and tools)
    menuItems.push({
      id: 'resources',
      label: 'Manage Resources',
      click: () => this.handleShowResources()
    })

    menuItems.push({ type: 'separator' })

    // Show logs
    menuItems.push({
      id: 'logs',
      label: 'Show Logs',
      click: () => this.handleShowLogs()
    })

    // Settings (future)
    menuItems.push({
      id: 'settings',
      label: 'Settings...',
      enabled: false // TODO: Implement settings window
    })

    menuItems.push({ type: 'separator' })

    // Update-related menu items based on state
    const updateState = this.updateManager.getUpdateState()
    const updateInfo = this.updateManager.getUpdateInfo()
    
    switch (updateState) {
      case 'checking':
        menuItems.push({
          id: 'checking',
          label: 'Checking for Updates...',
          enabled: false
        })
        break
        
      case 'update-available':
        menuItems.push({
          id: 'download-update',
          label: `Download Update (${updateInfo?.version})`,
          click: () => this.handleDownloadUpdate()
        })
        break
        
      case 'downloading':
        const progress = this.updateManager.getProgress()
        menuItems.push({
          id: 'downloading',
          label: `Downloading... ${progress ? Math.round(progress.percent) + '%' : ''}`,
          enabled: false
        })
        break
        
      case 'ready-to-install':
        menuItems.push({
          id: 'restart-install',
          label: 'Restart and Install Update',
          click: () => this.handleRestartAndInstall()
        })
        break
        
      case 'error':
        menuItems.push({
          id: 'retry-update',
          label: 'Retry Update Check',
          click: () => this.handleCheckForUpdates()
        })
        break
        
      default: // idle
        menuItems.push({
          id: 'check-updates',
          label: 'Check for Updates...',
          click: () => this.handleCheckForUpdates()
        })
        break
    }

    // About
    menuItems.push({
      id: 'about',
      label: 'About PromptX',
      click: () => this.handleShowAbout()
    })

    menuItems.push({ type: 'separator' })

    // Quit
    menuItems.push({
      id: 'quit',
      label: 'Quit PromptX',
      click: () => this.handleQuit()
    })

    return menuItems
  }

  private getStatusLabel(status: ServerStatus): string {
    switch (status) {
      case ServerStatus.RUNNING:
        return 'Running'
      case ServerStatus.STOPPED:
        return 'Stopped'
      case ServerStatus.STARTING:
        return 'Starting...'
      case ServerStatus.STOPPING:
        return 'Stopping...'
      case ServerStatus.ERROR:
        return 'Error'
      default:
        return 'Unknown'
    }
  }

  private getToggleLabel(status: ServerStatus): string {
    switch (status) {
      case ServerStatus.RUNNING:
        return 'Stop Server'
      case ServerStatus.STOPPED:
      case ServerStatus.ERROR:
        return 'Start Server'
      case ServerStatus.STARTING:
        return 'Starting...'
      case ServerStatus.STOPPING:
        return 'Stopping...'
      default:
        return 'Toggle Server'
    }
  }

  private canToggle(status: ServerStatus): boolean {
    return status === ServerStatus.RUNNING || 
           status === ServerStatus.STOPPED ||
           status === ServerStatus.ERROR
  }

  async handleToggleServer(): Promise<void> {
    const statusResult = await this.serverPort.getStatus()
    if (!statusResult.ok) {
return
}

    const status = statusResult.value
    
    if (status === ServerStatus.RUNNING) {
      await this.stopServerUseCase.execute()
    } else if (status === ServerStatus.STOPPED || status === ServerStatus.ERROR) {
      await this.startServerUseCase.execute()
    }
  }

  async handleCopyAddress(): Promise<void> {
    const addressResult = await this.serverPort.getAddress()
    if (addressResult.ok) {
      clipboard.writeText(addressResult.value)
    }
  }

  async handleShowResources(): Promise<void> {
    this.resourceManager.showResourceList()
  }

  async handleShowLogs(): Promise<void> {
    if (this.logsWindow && !this.logsWindow.isDestroyed()) {
      this.logsWindow.focus()
      return
    }

    this.logsWindow = new BrowserWindow({
      width: 800,
      height: 600,
      title: 'PromptX Logs',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    })

    // TODO: Load actual logs content
    this.logsWindow.loadURL('data:text/html,<h1>Logs Window (TODO)</h1>')

    this.logsWindow.on('closed', () => {
      this.logsWindow = null
    })
  }


  handleQuit(): void {
    app.quit()
  }

  async handleCheckForUpdates(): Promise<void> {
    logger.info('Manual update check triggered from tray menu')
    await this.updateManager.checkForUpdatesManual()
  }

  async handleDownloadUpdate(): Promise<void> {
    logger.info('Download update triggered from tray menu')
    await this.updateManager.downloadUpdate()
  }

  handleRestartAndInstall(): void {
    logger.info('Restart and install triggered from tray menu')
    this.updateManager.quitAndInstall()
  }

  async handleShowAbout(): Promise<void> {
    const aboutInfo = this.getAboutInfo()
    
    const result = await dialog.showMessageBox({
      type: 'info',
      title: 'About PromptX',
      message: aboutInfo.appName,
      detail: [
        `Version: ${aboutInfo.version}`,
        `Node.js: ${aboutInfo.nodeVersion}`,
        `Electron: ${aboutInfo.electronVersion}`,
        `Platform: ${aboutInfo.platform}`,
        ``,
        `Developed by Deepractice AI`,
        `Open source under MIT license`
      ].join('\n'),
      buttons: ['Visit GitHub', 'OK'],
      defaultId: 1,
      cancelId: 1,
      icon: this.appIcon
    })

    if (result.response === 0) {
      // Visit GitHub
      shell.openExternal(aboutInfo.homepage)
    }
  }

  private loadAppIcon(): void {
    try {
      const iconPath = path.join(__dirname, '../../assets/icons/icon-128x128.png')
      this.appIcon = nativeImage.createFromPath(iconPath)
      logger.info('TrayPresenter: App icon loaded successfully')
    } catch (error) {
      logger.error('TrayPresenter: Failed to load app icon:', error)
    }
  }

  private getAboutInfo() {
    return {
      appName: 'PromptX Desktop',
      version: packageJson.version,
      nodeVersion: process.version,
      electronVersion: process.versions.electron,
      platform: `${process.platform} ${process.arch}`,
      homepage: packageJson.homepage,
      author: packageJson.author.name
    }
  }

  updateStatus(status: ServerStatus): void {
    this.currentStatus = status
    
    // For now, keep the same icon for all statuses
    // TODO: Create different colored versions of the logo for different statuses
    
    // Update tooltip
    const statusLabel = this.getStatusLabel(status)
    this.tray.setToolTip(`PromptX Desktop - ${statusLabel}`)
    
    // Rebuild menu
    this.initializeMenu()
  }

  destroy(): void {
    // Remove status listener
    if (this.statusListener) {
      this.serverPort.removeStatusListener(this.statusListener)
    }

    // Close logs window if open
    if (this.logsWindow && !this.logsWindow.isDestroyed()) {
      this.logsWindow.close()
    }

    // Destroy resource manager
    if (this.resourceManager) {
      this.resourceManager.destroy()
    }

    // Destroy tray
    if (this.tray && !this.tray.isDestroyed()) {
      this.tray.destroy()
    }
  }
}