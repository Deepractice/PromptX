// Import polyfills first, before any other modules
import './polyfills.js'

import { app, BrowserWindow } from 'electron'
import { TrayPresenter } from './presentation/tray/TrayPresenter.js'
import { PromptXServerAdapter } from './infrastructure/adapters/PromptXServerAdapter.js'
import { FileConfigAdapter } from './infrastructure/adapters/FileConfigAdapter.js'
import { ElectronNotificationAdapter } from './infrastructure/adapters/ElectronNotificationAdapter.js'
import { StartServerUseCase } from './application/useCases/StartServerUseCase.js'
import { StopServerUseCase } from './application/useCases/StopServerUseCase.js'
import { logger } from './shared/logger.js'
import * as path from 'node:path'

class PromptXDesktopApp {
  private trayPresenter: TrayPresenter | null = null
  private serverPort: PromptXServerAdapter | null = null
  private configPort: FileConfigAdapter | null = null
  private notificationPort: ElectronNotificationAdapter | null = null

  async initialize(): Promise<void> {
    logger.info('Initializing PromptX Desktop...')
    
    // Wait for app to be ready
    await app.whenReady()
    logger.success('Electron app ready')

    // Hide dock icon on macOS
    if (process.platform === 'darwin') {
      app.dock.hide()
      logger.info('Dock icon hidden (macOS)')
    }

    // Setup infrastructure
    logger.step('Setting up infrastructure...')
    this.setupInfrastructure()

    // Setup application layer
    logger.step('Setting up application layer...')
    const { startUseCase, stopUseCase } = this.setupApplication()

    // Setup presentation layer
    logger.step('Setting up presentation layer...')
    this.setupPresentation(startUseCase, stopUseCase)

    // Handle app events
    logger.step('Setting up app events...')
    this.setupAppEvents()
    
    logger.success('PromptX Desktop initialized successfully')
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

    // Handle app quit
    app.on('before-quit', async () => {
      // Stop server if running
      if (this.serverPort) {
        const statusResult = await this.serverPort.getStatus()
        if (statusResult.ok && statusResult.value === 'running') {
          await this.serverPort.stop()
        }
      }

      // Cleanup
      this.cleanup()
    })

    // Handle activation (macOS)
    app.on('activate', () => {
      // Show tray menu if needed
    })
  }

  private cleanup(): void {
    if (this.trayPresenter) {
      this.trayPresenter.destroy()
      this.trayPresenter = null
    }
  }
}

// Application entry point
const application = new PromptXDesktopApp()

application.initialize().catch((error) => {
  logger.error('Failed to initialize application:', error)
  app.quit()
})