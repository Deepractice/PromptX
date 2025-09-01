// Import polyfills first, before any other modules
import '~/main/polyfills'

import { BrowserWindow, app, dialog, ipcMain } from 'electron'
import { TrayPresenter } from '~/main/tray/TrayPresenter'
import { ResourceManager } from '~/main/ResourceManager'
import { PromptXServerAdapter } from '~/main/infrastructure/adapters/PromptXServerAdapter'
import { FileConfigAdapter } from '~/main/infrastructure/adapters/FileConfigAdapter'
import { ElectronNotificationAdapter } from '~/main/infrastructure/adapters/ElectronNotificationAdapter'
import { StartServerUseCase } from '~/main/application/useCases/StartServerUseCase'
import { StopServerUseCase } from '~/main/application/useCases/StopServerUseCase'
import * as logger from '@promptx/logger'
import * as path from 'node:path'

class PromptXDesktopApp {
  private trayPresenter: TrayPresenter | null = null
  private resourceManager: ResourceManager | null = null
  private serverPort: PromptXServerAdapter | null = null
  private configPort: FileConfigAdapter | null = null
  private notificationPort: ElectronNotificationAdapter | null = null

  async initialize(): Promise<void> {
    logger.info('Initializing PromptX Desktop...')
    
    // Setup Node.js environment for ToolSandbox
    this.setupNodeEnvironment()
    
    // Remove IPC logging handler as renderers will use console directly
    
    // Wait for app to be ready
    await app.whenReady()
    logger.info('Electron app ready')

    // Hide dock icon on macOS
    if (process.platform === 'darwin') {
      app.dock.hide()
      logger.info('Dock icon hidden (macOS)')
    }

    // Setup infrastructure
    logger.info('Setting up infrastructure...')
    this.setupInfrastructure()

    // Setup application layer
    logger.info('Setting up application layer...')
    const { startUseCase, stopUseCase } = this.setupApplication()

    // Setup presentation layer
    logger.info('Setting up presentation layer...')
    this.setupPresentation(startUseCase, stopUseCase)
    
    // Setup ResourceManager for roles and tools
    logger.info('Setting up resource manager...')
    this.resourceManager = new ResourceManager()
    logger.info('Resource manager initialized')

    // Handle app events
    logger.info('Setting up app events...')
    this.setupAppEvents()
    
    logger.info('PromptX Desktop initialized successfully')
    
    // Auto-start server on app launch
    logger.info('Auto-starting PromptX server...')
    try {
      await startUseCase.execute()
      logger.info('PromptX server started automatically')
    } catch (error) {
      logger.error('Failed to auto-start server:', error)
    }
  }

  private setupNodeEnvironment(): void {
    // Set Node.js executable path for PromptX ToolSandbox
    // In Electron, use the Electron executable which contains Node.js
    process.env.PROMPTX_NODE_EXECUTABLE = process.execPath
    
    // CRITICAL: Set ELECTRON_RUN_AS_NODE to make Electron behave as pure Node.js
    // This prevents the full Electron app from launching when spawning child processes
    process.env.ELECTRON_RUN_AS_NODE = '1'
    
    logger.info(`Node.js environment configured for ToolSandbox: ${process.execPath}`)
    logger.info(`ELECTRON_RUN_AS_NODE set to prevent full app launch in child processes`)
    
    // Also set ELECTRON_NODE_PATH for compatibility
    process.env.ELECTRON_NODE_PATH = process.execPath
    
    // Update PATH to include Electron directory for child processes
    const electronDir = path.dirname(process.execPath)
    const currentPath = process.env.PATH || ''
    if (!currentPath.includes(electronDir)) {
      process.env.PATH = electronDir + path.delimiter + currentPath
      logger.debug(`Updated PATH with Electron directory: ${electronDir}`)
    }
  }

  private setupInfrastructure(): void {
    // Create adapters
    this.serverPort = new PromptXServerAdapter()
    this.configPort = new FileConfigAdapter(
      path.join(app.getPath('userData'), 'config.json')
    )
    this.notificationPort = new ElectronNotificationAdapter()
  }

  private setupApplication(): {
    startUseCase: StartServerUseCase
    stopUseCase: StopServerUseCase
  } {
    if (!this.serverPort || !this.configPort || !this.notificationPort) {
      throw new Error('Infrastructure not initialized')
    }

    const startUseCase = new StartServerUseCase(
      this.serverPort,
      this.configPort,
      this.notificationPort
    )

    const stopUseCase = new StopServerUseCase(
      this.serverPort,
      this.notificationPort
    )

    return { startUseCase, stopUseCase }
  }

  private setupPresentation(
    startUseCase: StartServerUseCase,
    stopUseCase: StopServerUseCase
  ): void {
    if (!this.serverPort) {
      throw new Error('Server port not initialized')
    }

    this.trayPresenter = new TrayPresenter(
      startUseCase,
      stopUseCase,
      this.serverPort
    )
  }

  private setupAppEvents(): void {
    // Prevent app from quitting when all windows are closed
    app.on('window-all-closed', () => {
      // On macOS, keep app running in background
      if (process.platform !== 'darwin') {
        app.quit()
      }
      // On macOS, do nothing - app stays in menu bar
    })

    // Handle app quit - use synchronous cleanup
    let isQuitting = false
    app.on('before-quit', (event) => {
      if (!isQuitting) {
        event.preventDefault()
        isQuitting = true
        
        // Perform cleanup
        this.performCleanup().then(() => {
          logger.info('Cleanup completed, exiting...')
          app.exit(0)
        }).catch((error) => {
          logger.error('Error during cleanup:', error)
          app.exit(0)
        })
      }
    })

    // Handle activation (macOS)
    app.on('activate', () => {
      // Show tray menu if needed
    })
  }

  private async performCleanup(): Promise<void> {
    try {
      // Stop server if running
      if (this.serverPort) {
        const statusResult = await this.serverPort.getStatus()
        if (statusResult.ok && statusResult.value === 'running') {
          logger.info('Stopping server before quit...')
          await this.serverPort.stop()
        }
      }
    } catch (error) {
      logger.error('Error stopping server:', error)
    }

    // Cleanup UI components
    this.cleanup()
  }

  private cleanup(): void {
    if (this.trayPresenter) {
      this.trayPresenter.destroy()
      this.trayPresenter = null
    }
  }
}

// Global error handlers for uncaught exceptions and rejections
process.on('uncaughtException', (error: Error) => {
  // Ignore EPIPE errors globally
  if (error.message && error.message.includes('EPIPE')) {
    logger.debug('Ignoring EPIPE error:', error.message)
    return
  }
  
  // Log other errors but don't crash
  logger.error('Uncaught exception:', error)
  
  // For critical errors, show dialog
  if (!error.message?.includes('write') && !error.message?.includes('stream')) {
    dialog.showErrorBox('Unexpected Error', error.message)
    app.quit()
  }
})

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  // Ignore EPIPE errors
  if (reason?.message && reason.message.includes('EPIPE')) {
    logger.debug('Ignoring unhandled EPIPE rejection:', reason.message)
    return
  }
  
  logger.error('Unhandled promise rejection:', reason)
})

// Handle write stream errors specifically
process.stdout.on('error', (error: any) => {
  if (error.code === 'EPIPE') {
    // Ignore EPIPE on stdout
    return
  }
  logger.error('stdout error:', error)
})

process.stderr.on('error', (error: any) => {
  if (error.code === 'EPIPE') {
    // Ignore EPIPE on stderr
    return
  }
  logger.error('stderr error:', error)
})

// Application entry point
const application = new PromptXDesktopApp()

application.initialize().catch((error) => {
  logger.error('Failed to initialize application:', error)
  app.quit()
})