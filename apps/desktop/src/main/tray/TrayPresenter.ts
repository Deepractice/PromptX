import { 
  app, 
  Tray, 
  Menu, 
  MenuItem,
  nativeImage, 
  clipboard, 
  shell,
  BrowserWindow 
} from 'electron'
import { ServerStatus } from '~/main/domain/valueObjects/ServerStatus'
import { ResultUtil } from '~/shared/Result'
import type { StartServerUseCase } from '~/main/application/useCases/StartServerUseCase'
import type { StopServerUseCase } from '~/main/application/useCases/StopServerUseCase'
import type { IServerPort } from '~/main/domain/ports/IServerPort'
import * as path from 'node:path'
import * as fs from 'node:fs'
import { logger } from '~/shared/logger'
import { createPIcon } from '~/utils/createPIcon'
import { ResourceManager } from '~/main/ResourceManager'

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

  constructor(
    private readonly startServerUseCase: StartServerUseCase,
    private readonly stopServerUseCase: StopServerUseCase,
    private readonly serverPort: IServerPort
  ) {
    // Initialize resource manager
    this.resourceManager = new ResourceManager()
    // Create tray icon
    this.tray = this.createTray()
    
    // Setup status listener
    this.statusListener = (status) => this.updateStatus(status)
    this.serverPort.onStatusChange(this.statusListener)
    
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
    
    logger.success('Tray created with P icon')
    return tray
  }

  private getIconPath(status: ServerStatus): string {
    // TODO: Add actual icon paths
    const iconName = this.getIconName(status)
    return path.join(__dirname, '..', '..', '..', 'assets', 'icons', iconName)
  }

  private getIconName(status: ServerStatus): string {
    switch (status) {
      case ServerStatus.RUNNING:
        return 'tray-running.png'
      case ServerStatus.STOPPED:
        return 'tray-stopped.png'
      case ServerStatus.STARTING:
      case ServerStatus.STOPPING:
        return 'tray-loading.png'
      case ServerStatus.ERROR:
        return 'tray-error.png'
      default:
        return 'tray-default.png'
    }
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
    
    // Test IPC - for debugging
    menuItems.push({
      id: 'test-ipc',
      label: 'Test IPC (调试)',
      click: () => {
        const { BrowserWindow, app } = require('electron')
        const path = require('path')
        const fs = require('fs')
        
        const testWindow = new BrowserWindow({
          width: 600,
          height: 500,
          webPreferences: {
            preload: path.join(__dirname, '../preload/preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false
          }
        })
        
        // Use absolute path from app root
        const testFilePath = path.join(app.getAppPath(), 'src/renderer/test.html')
        console.log('Loading test file from:', testFilePath)
        
        if (fs.existsSync(testFilePath)) {
          testWindow.loadFile(testFilePath)
        } else {
          // Try to load via URL if file doesn't exist
          testWindow.loadURL(`http://localhost:5173/test.html`)
        }
        testWindow.webContents.openDevTools()
      }
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
    if (!statusResult.ok) return

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