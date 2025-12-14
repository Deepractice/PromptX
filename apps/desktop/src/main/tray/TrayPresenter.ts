import {
  BrowserWindow,
  Menu,
  MenuItem,
  Tray,
  app,
  clipboard,
  nativeImage,
  shell,
  dialog,
  nativeTheme
} from 'electron'
import { ServerStatus } from '~/main/domain/valueObjects/ServerStatus'
// import { ResultUtil } from '~/shared/Result'
import type { StartServerUseCase } from '~/main/application/useCases/StartServerUseCase'
import type { StopServerUseCase } from '~/main/application/useCases/StopServerUseCase'
import type { IServerPort } from '~/main/domain/ports/IServerPort'
import type { UpdateManager } from '~/main/application/UpdateManager'
import * as path from 'node:path'
// import * as fs from 'node:fs'
import * as logger from '@promptx/logger'
// import { createPIcon } from '~/utils/createPIcon' // Deprecated - using new icons
import { ResourceManager } from '~/main/ResourceManager'
import packageJson from '../../../package.json'
import type { NativeImage } from 'electron'
import { pathToFileURL } from 'node:url'
import { t } from '../i18n'

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
  private mainWindow: BrowserWindow | null = null
  private statusListener: (status: ServerStatus) => void
  private resourceManager: ResourceManager
  private appIcon: NativeImage | undefined
  private trayIcons: Map<string, NativeImage> = new Map()

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

    // Load all tray icons
    this.loadTrayIcons()

    // Get initial icon based on platform and theme
    const icon = this.getTrayIcon('normal')

    const tray = new Tray(icon)
    tray.setToolTip('PromptX Desktop')

    // Listen to theme changes on Windows
    if (process.platform === 'win32') {
      nativeTheme.on('updated', () => {
        this.updateTrayIcon()
      })
    }

    logger.info('Tray created with new icon')
    return tray
  }

  private loadTrayIcons(): void {
    try {
      const iconDir = path.join(__dirname, '../../assets/icons/tray')
      const iconSize = process.platform === 'darwin' ? '16x16' : '32x32'

      // Load different icon variants
      const pixelIcon = nativeImage.createFromPath(
        path.join(iconDir, `icon-pixelversion-${iconSize}.png`)
      )
      const transparentIcon = nativeImage.createFromPath(
        path.join(iconDir, `icon-transparent-${iconSize}.png`)
      )
      const whiteIcon = nativeImage.createFromPath(
        path.join(iconDir, `icon-white-${iconSize}.png`)
      )

      // Store icons for different states and themes
      this.trayIcons.set('normal-dark', pixelIcon)
      this.trayIcons.set('normal-light', whiteIcon)
      this.trayIcons.set('stopped', transparentIcon)
      this.trayIcons.set('error', pixelIcon) // Could be customized later

      // Set template image for macOS
      if (process.platform === 'darwin') {
        pixelIcon.setTemplateImage(true)
        this.trayIcons.set('normal', pixelIcon)
      }

      logger.info('Tray icons loaded successfully')
    } catch (error) {
      const err = String(error);
      logger.error('Failed to load tray icons:', err);
    }
  }

  private getTrayIcon(state: 'normal' | 'stopped' | 'error' = 'normal'): NativeImage {
    if (process.platform === 'darwin') {
      // macOS: Use template image (auto-adapts to theme)
      if (state === 'stopped') {
        return this.trayIcons.get('stopped') || this.trayIcons.get('normal')!
      }
      return this.trayIcons.get('normal')!
    } else if (process.platform === 'win32') {
      // Windows: Choose based on theme
      if (state === 'stopped') {
        return this.trayIcons.get('stopped')!
      }
      const isDark = nativeTheme.shouldUseDarkColors
      const key = isDark ? 'normal-light' : 'normal-dark'
      return this.trayIcons.get(key) || this.trayIcons.get('normal-dark')!
    }
    // Linux fallback
    return this.trayIcons.get('normal-dark')!
  }

  private updateTrayIcon(): void {
    if (!this.tray || this.tray.isDestroyed()) return

    let iconState: 'normal' | 'stopped' | 'error' = 'normal'

    switch (this.currentStatus) {
      case ServerStatus.RUNNING:
      case ServerStatus.STARTING:
        iconState = 'normal'
        break
      case ServerStatus.STOPPED:
      case ServerStatus.STOPPING:
        iconState = 'stopped'
        break
      case ServerStatus.ERROR:
        iconState = 'error'
        break
    }

    const icon = this.getTrayIcon(iconState)
    this.tray.setImage(icon)
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
        label: t('tray.menu.copyAddress'),
        click: () => this.handleCopyAddress()
      })
    }

    menuItems.push({ type: 'separator' })

    // Open main window (unified interface)
    menuItems.push({
      id: 'main-window',
      label: t('tray.menu.openMainWindow'),
      click: () => this.openMainWindow()
    })

    menuItems.push({ type: 'separator' })

    // Update-related menu items based on state
    const updateState = this.updateManager.getUpdateState()
    const updateInfo = this.updateManager.getUpdateInfo()

    switch (updateState) {
      case 'checking':
        menuItems.push({
          id: 'checking',
          label: t('tray.menu.update.checking'),
          enabled: false
        })
        break

      case 'update-available':
        menuItems.push({
          id: 'download-update',
          label: `${t('tray.menu.update.available')} (${updateInfo?.version})`,
          click: () => this.handleDownloadUpdate()
        })
        break

      case 'downloading':
        const progress = this.updateManager.getProgress()
        menuItems.push({
          id: 'downloading',
          label: `${t('tray.menu.update.downloading')} ${progress ? Math.round(progress.percent) + '%' : ''}`,
          enabled: false
        })
        break

      case 'ready-to-install':
        const version = updateInfo?.version || ''
        menuItems.push({
          id: 'install-update',
          label: version ? `${t('tray.menu.update.readyToInstall')} (${version})` : t('tray.menu.update.readyToInstall'),
          click: () => this.handleInstallUpdate()
        })
        break

      case 'error':
        menuItems.push({
          id: 'retry-update',
          label: t('tray.menu.update.error'),
          click: () => this.handleCheckForUpdates()
        })
        break

      default: // idle
        menuItems.push({
          id: 'check-updates',
          label: t('tray.menu.update.idle'),
          click: () => this.handleCheckForUpdates()
        })
        break
    }
    // About
    menuItems.push({
      id: 'about',
      label: t('tray.menu.about'),
      click: () => this.handleShowAbout()
    })

    menuItems.push({ type: 'separator' })

    // Quit
    menuItems.push({
      id: 'quit',
      label: t('tray.menu.quit'),
      click: () => this.handleQuit()
    })

    return menuItems
  }

  private getStatusLabel(status: ServerStatus): string {
    switch (status) {
      case ServerStatus.RUNNING:
        return t('tray.status.running')
      case ServerStatus.STOPPED:
        return t('tray.status.stopped')
      case ServerStatus.STARTING:
        return t('tray.status.starting')
      case ServerStatus.STOPPING:
        return t('tray.status.stopping')
      case ServerStatus.ERROR:
        return t('tray.status.error')
      default:
        return t('tray.status.unknown')
    }
  }

  private getToggleLabel(status: ServerStatus): string {
    switch (status) {
      case ServerStatus.RUNNING:
        return t('tray.menu.stopServer')
      case ServerStatus.STOPPED:
      case ServerStatus.ERROR:
        return t('tray.menu.startServer')
      case ServerStatus.STARTING:
        return t('tray.menu.starting')
      case ServerStatus.STOPPING:
        return t('tray.menu.stopping')
      default:
        return t('tray.menu.toggleServer')
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

  public openMainWindow(): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.focus()
      return
    }

    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      title: 'PromptX Desktop',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../preload/preload.cjs')
      }
    })

    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.loadURL('http://localhost:5173/#/main')
    } else {
      const indexHtmlPath = path.join(__dirname, '../renderer/index.html')
      this.mainWindow.loadFile(indexHtmlPath, { hash: '/main' })
    }

    this.mainWindow.on('closed', () => {
      this.mainWindow = null
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

  handleInstallUpdate(): void {
    logger.info('Install update triggered from tray menu')
    // Call manual check which will show install dialog if ready
    this.updateManager.checkForUpdatesManual()
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
      const err = String(error);
      logger.error('TrayPresenter: Failed to load app icon:', err);
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

    // Update icon based on new status
    this.updateTrayIcon()

    // Update tooltip
    const statusLabel = this.getStatusLabel(status)
    this.tray.setToolTip(`${t('tray.tooltip')} - ${statusLabel}`)

    // Rebuild menu
    this.initializeMenu()
  }

  /**
   * 刷新托盘菜单
   * 用于语言切换等场景下重新构建菜单
   */
  async refreshMenu(): Promise<void> {
    await this.initializeMenu()
  }

  destroy(): void {
    // Remove status listener
    if (this.statusListener) {
      this.serverPort.removeStatusListener(this.statusListener)
    }

    // Close main window if open
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.close()
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