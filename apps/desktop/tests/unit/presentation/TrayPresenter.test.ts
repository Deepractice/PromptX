import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { TrayPresenter } from '../../../src/presentation/tray/TrayPresenter.js'
import { ServerStatus } from '../../../src/domain/valueObjects/ServerStatus.js'
import { ResultUtil } from '../../../src/shared/Result.js'
import type { StartServerUseCase } from '../../../src/application/useCases/StartServerUseCase.js'
import type { StopServerUseCase } from '../../../src/application/useCases/StopServerUseCase.js'
import type { IServerPort } from '../../../src/domain/ports/IServerPort.js'

// Mock Electron
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/mock/path'),
    getVersion: vi.fn(() => '0.1.0'),
    quit: vi.fn()
  },
  Tray: vi.fn().mockImplementation(() => ({
    setContextMenu: vi.fn(),
    setToolTip: vi.fn(),
    setImage: vi.fn(),
    destroy: vi.fn(),
    isDestroyed: vi.fn(() => false)
  })),
  Menu: {
    buildFromTemplate: vi.fn(() => ({}))
  },
  nativeImage: {
    createFromPath: vi.fn(() => ({}))
  },
  clipboard: {
    writeText: vi.fn()
  },
  shell: {
    openExternal: vi.fn()
  },
  BrowserWindow: vi.fn().mockImplementation(() => ({
    loadURL: vi.fn(),
    on: vi.fn(),
    close: vi.fn(),
    destroy: vi.fn(),
    focus: vi.fn(),
    isDestroyed: vi.fn(() => false)
  })),
  Notification: vi.fn().mockImplementation(() => ({
    show: vi.fn(),
    close: vi.fn()
  }))
}))

describe('TrayPresenter', () => {
  let presenter: TrayPresenter
  let startServerUseCase: StartServerUseCase
  let stopServerUseCase: StopServerUseCase
  let serverPort: IServerPort
  let mockTray: any

  beforeEach(() => {
    // Reset modules to ensure clean state
    vi.resetModules()

    // Create mock use cases
    startServerUseCase = {
      execute: vi.fn(),
      executeWithCustomConfig: vi.fn()
    } as any

    stopServerUseCase = {
      execute: vi.fn()
    } as any

    serverPort = {
      start: vi.fn(),
      stop: vi.fn(),
      restart: vi.fn(),
      getStatus: vi.fn(),
      getAddress: vi.fn(),
      getMetrics: vi.fn(),
      updateConfig: vi.fn(),
      onStatusChange: vi.fn(),
      removeStatusListener: vi.fn()
    }

    presenter = new TrayPresenter(
      startServerUseCase,
      stopServerUseCase,
      serverPort
    )

    // Get reference to mock tray
    mockTray = presenter['tray']
  })

  afterEach(() => {
    presenter.destroy()
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should create tray with correct icon', () => {
      expect(mockTray).toBeDefined()
      expect(mockTray.setToolTip).toHaveBeenCalledWith('PromptX Desktop')
    })

    it('should register status change listener', () => {
      expect(serverPort.onStatusChange).toHaveBeenCalled()
    })

    it('should build initial menu', () => {
      expect(mockTray.setContextMenu).toHaveBeenCalled()
    })
  })

  describe('menu actions', () => {
    it('should start server when clicking start', async () => {
      vi.mocked(serverPort.getStatus).mockResolvedValue(
        ResultUtil.ok(ServerStatus.STOPPED)
      )
      vi.mocked(startServerUseCase.execute).mockResolvedValue(
        ResultUtil.ok(undefined)
      )

      await presenter.handleToggleServer()

      expect(startServerUseCase.execute).toHaveBeenCalled()
    })

    it('should stop server when clicking stop', async () => {
      vi.mocked(serverPort.getStatus).mockResolvedValue(
        ResultUtil.ok(ServerStatus.RUNNING)
      )
      vi.mocked(stopServerUseCase.execute).mockResolvedValue(
        ResultUtil.ok(undefined)
      )

      await presenter.handleToggleServer()

      expect(stopServerUseCase.execute).toHaveBeenCalled()
    })

    it('should copy server address to clipboard', async () => {
      const { clipboard } = await import('electron')
      vi.mocked(serverPort.getAddress).mockResolvedValue(
        ResultUtil.ok('http://localhost:3000')
      )

      await presenter.handleCopyAddress()

      expect(clipboard.writeText).toHaveBeenCalledWith('http://localhost:3000')
    })

    it('should open logs window', async () => {
      await presenter.handleShowLogs()
      
      // Should create or show logs window
      expect(presenter['logsWindow']).toBeDefined()
    })

    it('should quit application', () => {
      const { app } = require('electron')
      
      presenter.handleQuit()

      expect(app.quit).toHaveBeenCalled()
    })
  })

  describe('status updates', () => {
    it('should update icon when status changes to running', () => {
      presenter.updateStatus(ServerStatus.RUNNING)

      expect(mockTray.setImage).toHaveBeenCalled()
      expect(mockTray.setToolTip).toHaveBeenCalledWith(
        'PromptX Desktop - Running'
      )
    })

    it('should update icon when status changes to stopped', () => {
      presenter.updateStatus(ServerStatus.STOPPED)

      expect(mockTray.setImage).toHaveBeenCalled()
      expect(mockTray.setToolTip).toHaveBeenCalledWith(
        'PromptX Desktop - Stopped'
      )
    })

    it('should update icon when status changes to error', () => {
      presenter.updateStatus(ServerStatus.ERROR)

      expect(mockTray.setImage).toHaveBeenCalled()
      expect(mockTray.setToolTip).toHaveBeenCalledWith(
        'PromptX Desktop - Error'
      )
    })

    it('should rebuild menu when status changes', () => {
      const initialCallCount = mockTray.setContextMenu.mock.calls.length

      presenter.updateStatus(ServerStatus.RUNNING)

      expect(mockTray.setContextMenu).toHaveBeenCalledTimes(
        initialCallCount + 1
      )
    })
  })

  describe('menu structure', () => {
    it('should show "Start Server" when stopped', async () => {
      vi.mocked(serverPort.getStatus).mockResolvedValue(
        ResultUtil.ok(ServerStatus.STOPPED)
      )

      const menu = await presenter.buildMenu()

      const toggleItem = menu.find(item => item.id === 'toggle')
      expect(toggleItem?.label).toBe('Start Server')
    })

    it('should show "Stop Server" when running', async () => {
      vi.mocked(serverPort.getStatus).mockResolvedValue(
        ResultUtil.ok(ServerStatus.RUNNING)
      )
      vi.mocked(serverPort.getAddress).mockResolvedValue(
        ResultUtil.ok('http://localhost:3000')
      )

      const menu = await presenter.buildMenu()

      const toggleItem = menu.find(item => item.id === 'toggle')
      expect(toggleItem?.label).toBe('Stop Server')
    })

    it('should disable toggle during starting', async () => {
      vi.mocked(serverPort.getStatus).mockResolvedValue(
        ResultUtil.ok(ServerStatus.STARTING)
      )

      const menu = await presenter.buildMenu()

      const toggleItem = menu.find(item => item.id === 'toggle')
      expect(toggleItem?.enabled).toBe(false)
    })

    it('should show server address when running', async () => {
      vi.mocked(serverPort.getStatus).mockResolvedValue(
        ResultUtil.ok(ServerStatus.RUNNING)
      )
      vi.mocked(serverPort.getAddress).mockResolvedValue(
        ResultUtil.ok('http://localhost:3000')
      )

      const menu = await presenter.buildMenu()

      const addressItem = menu.find(item => item.id === 'address')
      expect(addressItem?.label).toBe('http://localhost:3000')
    })

    it('should include separator items', async () => {
      vi.mocked(serverPort.getStatus).mockResolvedValue(
        ResultUtil.ok(ServerStatus.STOPPED)
      )

      const menu = await presenter.buildMenu()

      const separators = menu.filter(item => item.type === 'separator')
      expect(separators.length).toBeGreaterThan(0)
    })
  })

  describe('cleanup', () => {
    it('should remove status listener on destroy', () => {
      presenter.destroy()

      expect(serverPort.removeStatusListener).toHaveBeenCalled()
    })

    it('should destroy tray on cleanup', () => {
      presenter.destroy()

      expect(mockTray.destroy).toHaveBeenCalled()
    })

    it('should close logs window if open', () => {
      // Create a mock logs window
      presenter['logsWindow'] = {
        close: vi.fn(),
        destroy: vi.fn()
      } as any

      presenter.destroy()

      expect(presenter['logsWindow']?.close).toHaveBeenCalled()
    })
  })
})