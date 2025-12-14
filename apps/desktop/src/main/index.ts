// Import polyfills first, before any other modules
import '~/main/polyfills'

import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { TrayPresenter } from '~/main/tray/TrayPresenter'
import { ResourceManager } from '~/main/ResourceManager'
import { PromptXServerAdapter } from '~/main/infrastructure/adapters/PromptXServerAdapter'
import { FileConfigAdapter } from '~/main/infrastructure/adapters/FileConfigAdapter'
import { ElectronNotificationAdapter } from '~/main/infrastructure/adapters/ElectronNotificationAdapter'
import { StartServerUseCase } from '~/main/application/useCases/StartServerUseCase'
import { StopServerUseCase } from '~/main/application/useCases/StopServerUseCase'
import { UpdateManager } from '~/main/application/UpdateManager'
import { AutoStartService } from '~/main/application/AutoStartService'
import { ElectronAutoStartAdapter } from '~/main/infrastructure/adapters/ElectronAutoStartAdapter'
import { AutoStartWindow } from '~/main/windows/AutoStartWindow'
import * as logger from '@promptx/logger'
import * as path from 'node:path'
import * as fs from 'node:fs'
import { mainI18n, t } from '~/main/i18n'
import { ServerConfig } from '~/main/domain/entities/ServerConfig'

class PromptXDesktopApp {
  private trayPresenter: TrayPresenter | null = null
  private resourceManager: ResourceManager | null = null
  private serverPort: PromptXServerAdapter | null = null
  private configPort: FileConfigAdapter | null = null
  private notificationPort: ElectronNotificationAdapter | null = null
  private updateManager: UpdateManager | null = null
  private autoStartService: AutoStartService | null = null
  private autoStartWindow: AutoStartWindow | null = null

  async initialize(): Promise<void> {
    logger.info('Initializing PromptX Desktop...')

    // Setup Node.js environment for ToolSandbox
    this.setupNodeEnvironment()

    // Wait for app to be ready
    await app.whenReady()
    logger.info('Electron app ready')

    // Hide dock icon on macOS
    if (process.platform === 'darwin') {
      app.dock.hide()
      logger.info('Dock icon hidden (macOS)')
    }

    // === 先创建 autoStartService ===
    const autoStartAdapter = new ElectronAutoStartAdapter({
      name: 'PromptX Desktop',
      path: process.execPath,
      isHidden: true, // 开机启动时隐藏窗口
      mac: { useLaunchAgent: true }  // macOS: 使用 LaunchAgent 更稳定
    })
    this.autoStartService = new AutoStartService(autoStartAdapter)

    // === 创建 autoStartWindow 来处理 IPC ===
    this.autoStartWindow = new AutoStartWindow(this.autoStartService)

    // === 然后设置其他 IPC ===
    this.setupServerConfigIPC()
    this.setupLanguageIPC()
    this.setupLogsIPC()
    this.setupDialogIPC()

    // Setup infrastructure
    logger.info('Setting up infrastructure...')
    this.setupInfrastructure()

    // Setup application layer
    logger.info('Setting up application layer...')
    const { startUseCase, stopUseCase } = this.setupApplication()

    // Setup UpdateManager BEFORE presentation layer
    logger.info('Setting up update manager...')
    this.updateManager = new UpdateManager()
    logger.info('Update manager initialized')

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
      const err = String(error);
      logger.error('Failed to auto-start server:', err)
    }

    // Register global callback for second-instance to open main window
    // This is used by bootstrap.ts when user clicks shortcut while app is running
    ;(global as any).__promptxOpenMainWindow = () => {
      this.trayPresenter?.openMainWindow()
    }

    // Auto open main window on startup for better UX
    logger.info('Opening main window...')
    this.trayPresenter?.openMainWindow()

    // Auto check and download updates on startup (non-blocking)
    logger.info('Scheduling automatic update check and download...')
    setTimeout(() => {
      this.updateManager?.autoCheckAndDownload()
    }, 5000) // Delay 5 seconds to let app fully initialize
  }

  private setupNodeEnvironment(): void {
    // Set Node.js executable path for PromptX ToolSandbox
    // In Electron, use the Electron executable which contains Node.js
    process.env.PROMPTX_NODE_EXECUTABLE = process.execPath

    // NOTE: ELECTRON_RUN_AS_NODE is NOT set globally anymore
    // It will be set locally only when spawning Node.js processes in ToolSandbox
    // This prevents Chromium internal services from receiving incorrect parameters

    logger.info(`Node.js environment configured for ToolSandbox: ${process.execPath}`)
    logger.info(`ELECTRON_RUN_AS_NODE will be set locally per subprocess to avoid conflicts`)

    // Also set ELECTRON_NODE_PATH for compatibility
    process.env.ELECTRON_NODE_PATH = process.execPath

    // Pass utilityProcess to ToolSandbox via global object
    try {
      const { utilityProcess } = require('electron')
      if (utilityProcess && typeof utilityProcess.fork === 'function') {
        ; (global as any).PROMPTX_UTILITY_PROCESS = utilityProcess
        process.env.PROMPTX_UTILITY_PROCESS_AVAILABLE = 'true'
        logger.info('UtilityProcess configured for ToolSandbox')
      } else {
        logger.warn('UtilityProcess not available - will fallback to system pnpm')
        process.env.PROMPTX_UTILITY_PROCESS_AVAILABLE = 'false'
      }
    } catch (error) {
      logger.error(`Failed to configure UtilityProcess: ${error}`)
      process.env.PROMPTX_UTILITY_PROCESS_AVAILABLE = 'false'
    }

    // Update PATH to include Electron directory for child processes
    const electronDir = path.dirname(process.execPath)
    const currentPath = process.env.PATH || ''
    if (!currentPath.includes(electronDir)) {
      process.env.PATH = electronDir + path.delimiter + currentPath
      logger.debug(`Updated PATH with Electron directory: ${electronDir}`)
    }
  }

  private setupServerConfigIPC(): void {
    ipcMain.handle('server-config:get', async () => {
      if (!this.configPort) {
        return ServerConfig.default().toJSON()
      }
      const res = await this.configPort.load()
      if (res.ok) {
        return res.value.toJSON()
      }
      // 加载失败则返回默认
      return ServerConfig.default().toJSON()
    })

    ipcMain.handle('server-config:update', async (_event, payload: { host: string; port: number; debug?: boolean }) => {
      const base = ServerConfig.default().toJSON()
      const created = ServerConfig.create({
        ...base,
        host: payload.host,
        port: payload.port,
        debug: payload.debug ?? base.debug
      })
      if (!created.ok) {
        throw new Error(created.error.message)
      }
      const cfg = created.value
      // 持久化
      if (this.configPort) {
        const saveRes = await this.configPort.save(cfg)
        if (!saveRes.ok) {
          throw new Error(saveRes.error.message)
        }
      }
      // 应用配置（重启服务）
      if (this.serverPort) {
        const restartRes = await this.serverPort.restart(cfg)
        if (!restartRes.ok) {
          throw new Error(restartRes.error.message)
        }
      }
      return cfg.toJSON()
    })

    ipcMain.handle('server-config:reset', async () => {
      const cfg = ServerConfig.default()
      // 重置持久化文件
      if (this.configPort) {
        const resetRes = await this.configPort.reset()
        if (!resetRes.ok) {
          // 如果 reset 不可用或失败，则直接 save 默认
          const saveRes = await this.configPort.save(cfg)
          if (!saveRes.ok) {
            throw new Error(saveRes.error.message)
          }
        }
      }
      // 应用默认配置
      if (this.serverPort) {
        const restartRes = await this.serverPort.restart(cfg)
        if (!restartRes.ok) {
          throw new Error(restartRes.error.message)
        }
      }
      return cfg.toJSON()
    })
  }

  private setupLanguageIPC(): void {
    // 获取当前语言设置
    ipcMain.handle('settings:getLanguage', async () => {
      try {
        const configPath = path.join(app.getPath('userData'), 'language.json')
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
          return config.language || 'en'
        }
        return 'en' // 默认英文
      } catch (error) {
        logger.error('Failed to get language setting:', String(error))
        return 'en'
      }
    })

    // 设置语言
    ipcMain.handle('settings:setLanguage', async (_event, language: string) => {
      try {
        const configPath = path.join(app.getPath('userData'), 'language.json')
        const config = { language }
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
        
        // 更新主进程的i18n语言设置
        mainI18n.setLocale(language)
        
        // 如果托盘已经初始化，重新构建菜单以应用新语言
        if (this.trayPresenter) {
          await this.trayPresenter.refreshMenu()
          logger.info(`Tray menu refreshed with new language: ${language}`)
        }
        
        logger.info(`Language set to: ${language}`)
        return { success: true }
      } catch (error) {
        logger.error('Failed to set language:', String(error))
        throw new Error('Failed to save language setting')
      }
    })
  }

  private setupLogsIPC(): void {
    const os = require('os')
    const logsDir = path.join(os.homedir(), '.promptx', 'logs')

    // 获取日志文件列表
    ipcMain.handle('logs:list', async () => {
      try {
        if (!fs.existsSync(logsDir)) {
          return { success: true, logs: [] }
        }

        const files = fs.readdirSync(logsDir)
        const logs = files
          .filter(file => file.startsWith('promptx-') && file.endsWith('.log'))
          .map(file => {
            const filePath = path.join(logsDir, file)
            try {
              const stats = fs.statSync(filePath)
              const isError = file.includes('error')

              return {
                name: file,
                path: filePath,
                size: stats.size,
                modified: stats.mtime,
                type: isError ? 'error' : 'normal'
              }
            } catch {
              // 文件可能在读取期间被删除或锁定，跳过
              return null
            }
          })
          .filter((log): log is NonNullable<typeof log> => log !== null)
          .sort((a, b) => b.modified.getTime() - a.modified.getTime())

        return { success: true, logs }
      } catch (error) {
        logger.error('Failed to list logs:', String(error))
        return { success: false, error: String(error) }
      }
    })

    // 读取日志文件内容
    ipcMain.handle('logs:read', async (_event, filename: string) => {
      try {
        const filePath = path.join(logsDir, filename)

        if (!fs.existsSync(filePath)) {
          return { success: false, error: 'Log file not found' }
        }

        const content = fs.readFileSync(filePath, 'utf-8')
        return { success: true, content }
      } catch (error) {
        logger.error('Failed to read log:', String(error))
        return { success: false, error: String(error) }
      }
    })

    // 删除日志文件
    ipcMain.handle('logs:delete', async (_event, filename: string) => {
      try {
        const filePath = path.join(logsDir, filename)

        if (!fs.existsSync(filePath)) {
          return { success: false, error: 'Log file not found' }
        }

        fs.unlinkSync(filePath)
        logger.info(`Log file deleted: ${filename}`)
        return { success: true }
      } catch (error) {
        logger.error('Failed to delete log:', String(error))
        return { success: false, error: String(error) }
      }
    })

    // 清空所有日志
    ipcMain.handle('logs:clear', async () => {
      try {
        if (!fs.existsSync(logsDir)) {
          return { success: true, deleted: 0 }
        }

        const files = fs.readdirSync(logsDir)
        let deleted = 0
        let skipped = 0

        for (const file of files) {
          if (file.startsWith('promptx-') && file.endsWith('.log')) {
            const filePath = path.join(logsDir, file)
            try {
              fs.unlinkSync(filePath)
              deleted++
            } catch {
              // 文件可能被锁定（如当前正在写入的日志），跳过
              skipped++
            }
          }
        }

        if (deleted > 0 || skipped === 0) {
          logger.info(`Cleared ${deleted} log files${skipped > 0 ? `, ${skipped} skipped (in use)` : ''}`)
        }
        return { success: true, deleted }
      } catch (error) {
        logger.error('Failed to clear logs:', String(error))
        return { success: false, error: String(error) }
      }
    })
  }

  private setupDialogIPC(): void {
    // 打开文件选择对话框
    ipcMain.handle('dialog:openFile', async (_event, options?: any) => {
      try {
        const result = await dialog.showOpenDialog(options || {})
        return result
      } catch (error) {
        logger.error('Failed to open file dialog:', String(error))
        return { canceled: true, filePaths: [] }
      }
    })
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
    if (!this.serverPort || !this.updateManager) {
      throw new Error('Infrastructure not fully initialized')
    }

    this.trayPresenter = new TrayPresenter(
      startUseCase,
      stopUseCase,
      this.serverPort,
      this.updateManager
    )
  }

  private setupAppEvents(): void {
    // NOTE: second-instance handler is set up in bootstrap.ts
    // to ensure it's registered before app initialization completes

    // Prevent app from quitting when all windows are closed
    app.on('window-all-closed', () => {
      // Keep app running in system tray on all platforms
      // Do nothing - app stays in system tray
      // User can quit from tray menu
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
      const err = String(error)
      logger.error('Error stopping server:', err)
    }

    // Cleanup UI components
    this.cleanup()
  }

  private cleanup(): void {
    if (this.trayPresenter) {
      this.trayPresenter.destroy()
      this.trayPresenter = null
    }

    if (this.autoStartWindow) {
      this.autoStartWindow.cleanup()
      this.autoStartWindow = null
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
// Single instance lock is already checked in bootstrap.ts
const application = new PromptXDesktopApp()

application.initialize().catch((error) => {
  logger.error('Failed to initialize application:', error)
  app.quit()
})