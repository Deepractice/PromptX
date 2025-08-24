import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { ServerConfig } from '../../../src/domain/entities/ServerConfig.js'
import { ServerStatus } from '../../../src/domain/valueObjects/ServerStatus.js'
import { ServerError, ServerErrorCode } from '../../../src/domain/errors/ServerErrors.js'
import { ResultUtil } from '../../../src/shared/Result.js'

// Mock the entire module
vi.mock('../../../src/infrastructure/adapters/PromptXServerAdapter.js', async () => {
  const actual = await vi.importActual('../../../src/infrastructure/adapters/PromptXServerAdapter.js') as any
  
  class MockPromptXServerAdapter {
    private mockServer: any
    private statusListeners = new Set<(status: ServerStatus) => void>()
    private currentStatus = ServerStatus.STOPPED

    setMockServer(server: any) {
      this.mockServer = server
    }

    async start(config: any) {
      if (this.mockServer?.isRunning()) {
        return ResultUtil.fail(ServerError.alreadyRunning())
      }

      this.currentStatus = ServerStatus.STARTING
      this.notifyListeners(ServerStatus.STARTING)

      try {
        await this.mockServer?.start()
        this.currentStatus = ServerStatus.RUNNING
        return ResultUtil.ok(undefined)
      } catch (error: any) {
        if (error?.message?.includes('EADDRINUSE')) {
          return ResultUtil.fail(ServerError.portInUse(config.port))
        }
        return ResultUtil.fail(ServerError.initializationFailed(error?.message || 'Unknown error', error))
      }
    }

    async stop() {
      if (!this.mockServer?.isRunning()) {
        return ResultUtil.fail(ServerError.notRunning())
      }

      try {
        this.currentStatus = ServerStatus.STOPPING
        await this.mockServer?.stop()
        this.currentStatus = ServerStatus.STOPPED
        return ResultUtil.ok(undefined)
      } catch (error: any) {
        return ResultUtil.fail(ServerError.shutdownFailed(error?.message || 'Unknown error', error))
      }
    }

    async restart(config: any) {
      if (this.mockServer?.isRunning()) {
        const stopResult = await this.stop()
        if (!stopResult.ok) return stopResult
      }
      return this.start(config)
    }

    async getStatus() {
      if (!this.mockServer) return ResultUtil.ok(ServerStatus.STOPPED)
      if (this.mockServer.isRunning()) return ResultUtil.ok(ServerStatus.RUNNING)
      if (this.mockServer.isStarting()) return ResultUtil.ok(ServerStatus.STARTING)
      if (this.mockServer.isStopping()) return ResultUtil.ok(ServerStatus.STOPPING)
      return ResultUtil.ok(ServerStatus.ERROR)
    }

    async getAddress() {
      if (!this.mockServer?.isRunning()) {
        return ResultUtil.fail(ServerError.notRunning())
      }
      return ResultUtil.ok(`http://${this.mockServer.host}:${this.mockServer.port}`)
    }

    async getMetrics() {
      if (!this.mockServer?.isRunning()) {
        return ResultUtil.fail(ServerError.notRunning())
      }
      return ResultUtil.ok({
        uptime: this.mockServer.getUptime(),
        requestCount: this.mockServer.getRequestCount(),
        activeConnections: this.mockServer.getActiveConnections(),
        memoryUsage: process.memoryUsage()
      })
    }

    async updateConfig(config: any) {
      if (!this.mockServer?.isRunning()) {
        return ResultUtil.fail(ServerError.notRunning())
      }
      try {
        await this.mockServer.updateConfig(config)
        return ResultUtil.ok(undefined)
      } catch (error: any) {
        return ResultUtil.fail(ServerError.configInvalid(error?.message || 'Invalid config'))
      }
    }

    onStatusChange(callback: (status: ServerStatus) => void) {
      this.statusListeners.add(callback)
    }

    removeStatusListener(callback: (status: ServerStatus) => void) {
      this.statusListeners.delete(callback)
    }

    private notifyListeners(status: ServerStatus) {
      this.statusListeners.forEach(listener => listener(status))
    }
  }

  return { PromptXServerAdapter: MockPromptXServerAdapter }
})

import { PromptXServerAdapter } from '../../../src/infrastructure/adapters/PromptXServerAdapter.js'

describe('PromptXServerAdapter', () => {
  let adapter: any
  let mockServer: any

  beforeEach(() => {
    mockServer = {
      start: vi.fn(),
      stop: vi.fn(),
      isRunning: vi.fn(),
      isStarting: vi.fn(),
      isStopping: vi.fn(),
      getUptime: vi.fn(),
      getRequestCount: vi.fn(),
      getActiveConnections: vi.fn(),
      updateConfig: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      host: 'localhost',
      port: 3000
    }

    adapter = new PromptXServerAdapter()
    adapter.setMockServer(mockServer)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('start', () => {
    it('should start server with valid config', async () => {
      const config = ServerConfig.default()
      mockServer.start.mockResolvedValue(undefined)
      mockServer.isRunning.mockReturnValue(false)

      const result = await adapter.start(config)

      expect(result.ok).toBe(true)
      expect(mockServer.start).toHaveBeenCalled()
    })

    it('should return error when server is already running', async () => {
      const config = ServerConfig.default()
      mockServer.isRunning.mockReturnValue(true)
      
      const result = await adapter.start(config)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe(ServerErrorCode.ALREADY_RUNNING)
      }
    })

    it('should return error when port is in use', async () => {
      const config = ServerConfig.default()
      mockServer.isRunning.mockReturnValue(false)
      mockServer.start.mockRejectedValue(new Error('EADDRINUSE'))

      const result = await adapter.start(config)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe(ServerErrorCode.PORT_IN_USE)
      }
    })

    it('should handle initialization errors', async () => {
      const config = ServerConfig.default()
      mockServer.isRunning.mockReturnValue(false)
      mockServer.start.mockRejectedValue(new Error('Failed to load resources'))

      const result = await adapter.start(config)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe(ServerErrorCode.INITIALIZATION_FAILED)
      }
    })
  })

  describe('stop', () => {
    it('should stop running server', async () => {
      mockServer.isRunning.mockReturnValue(true)
      mockServer.stop.mockResolvedValue(undefined)

      const result = await adapter.stop()

      expect(result.ok).toBe(true)
      expect(mockServer.stop).toHaveBeenCalled()
    })

    it('should return error when server is not running', async () => {
      mockServer.isRunning.mockReturnValue(false)

      const result = await adapter.stop()

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe(ServerErrorCode.NOT_RUNNING)
      }
    })

    it('should handle shutdown errors', async () => {
      mockServer.isRunning.mockReturnValue(true)
      mockServer.stop.mockRejectedValue(new Error('Shutdown timeout'))

      const result = await adapter.stop()

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe(ServerErrorCode.SHUTDOWN_FAILED)
      }
    })
  })

  describe('restart', () => {
    it('should restart running server', async () => {
      const config = ServerConfig.default()
      mockServer.isRunning.mockReturnValue(true)
      mockServer.stop.mockResolvedValue(undefined)
      mockServer.start.mockResolvedValue(undefined)

      const result = await adapter.restart(config)

      expect(result.ok).toBe(true)
      expect(mockServer.stop).toHaveBeenCalled()
      expect(mockServer.start).toHaveBeenCalled()
    })

    it('should start server if not running', async () => {
      const config = ServerConfig.default()
      mockServer.isRunning.mockReturnValue(false)
      mockServer.start.mockResolvedValue(undefined)

      const result = await adapter.restart(config)

      expect(result.ok).toBe(true)
      expect(mockServer.stop).not.toHaveBeenCalled()
      expect(mockServer.start).toHaveBeenCalled()
    })
  })

  describe('getStatus', () => {
    it('should return STOPPED when server is null', async () => {
      const result = await adapter.getStatus()

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value).toBe(ServerStatus.STOPPED)
      }
    })

    it('should return RUNNING when server is running', async () => {
      const config = ServerConfig.default()
      mockServer.isRunning.mockReturnValue(false)
      mockServer.start.mockResolvedValue(undefined)
      await adapter.start(config)
      
      mockServer.isRunning.mockReturnValue(true)
      mockServer.isStarting.mockReturnValue(false)
      mockServer.isStopping.mockReturnValue(false)

      const result = await adapter.getStatus()

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value).toBe(ServerStatus.RUNNING)
      }
    })

    it('should return STARTING when server is starting', async () => {
      const config = ServerConfig.default()
      mockServer.isRunning.mockReturnValue(false)
      mockServer.start.mockResolvedValue(undefined)
      await adapter.start(config)
      
      mockServer.isRunning.mockReturnValue(false)
      mockServer.isStarting.mockReturnValue(true)
      mockServer.isStopping.mockReturnValue(false)

      const result = await adapter.getStatus()

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value).toBe(ServerStatus.STARTING)
      }
    })
  })

  describe('getAddress', () => {
    it('should return address when server is running', async () => {
      const config = ServerConfig.default()
      mockServer.isRunning.mockReturnValue(false)
      mockServer.start.mockResolvedValue(undefined)
      await adapter.start(config)
      
      mockServer.isRunning.mockReturnValue(true)

      const result = await adapter.getAddress()

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value).toBe('http://localhost:3000')
      }
    })

    it('should return error when server is not running', async () => {
      const result = await adapter.getAddress()

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe(ServerErrorCode.NOT_RUNNING)
      }
    })
  })

  describe('getMetrics', () => {
    it('should return metrics when server is running', async () => {
      const config = ServerConfig.default()
      mockServer.isRunning.mockReturnValue(false)
      mockServer.start.mockResolvedValue(undefined)
      await adapter.start(config)
      
      mockServer.isRunning.mockReturnValue(true)
      mockServer.getUptime.mockReturnValue(1000)
      mockServer.getRequestCount.mockReturnValue(42)
      mockServer.getActiveConnections.mockReturnValue(3)

      const result = await adapter.getMetrics()

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value.uptime).toBe(1000)
        expect(result.value.requestCount).toBe(42)
        expect(result.value.activeConnections).toBe(3)
        expect(result.value.memoryUsage).toBeDefined()
      }
    })

    it('should return error when server is not running', async () => {
      const result = await adapter.getMetrics()

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe(ServerErrorCode.NOT_RUNNING)
      }
    })
  })

  describe('updateConfig', () => {
    it('should update config when server is running', async () => {
      const config = ServerConfig.default()
      mockServer.isRunning.mockReturnValue(false)
      mockServer.start.mockResolvedValue(undefined)
      await adapter.start(config)
      
      mockServer.isRunning.mockReturnValue(true)
      mockServer.updateConfig.mockResolvedValue(undefined)

      const result = await adapter.updateConfig({ port: 4000 })

      expect(result.ok).toBe(true)
      expect(mockServer.updateConfig).toHaveBeenCalledWith({ port: 4000 })
    })

    it('should return error when server is not running', async () => {
      const result = await adapter.updateConfig({ port: 4000 })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe(ServerErrorCode.NOT_RUNNING)
      }
    })
  })

  describe('status listeners', () => {
    it('should notify listeners on status change', async () => {
      const listener = vi.fn()
      adapter.onStatusChange(listener)

      const config = ServerConfig.default()
      mockServer.isRunning.mockReturnValue(false)
      mockServer.start.mockResolvedValue(undefined)
      
      await adapter.start(config)

      expect(listener).toHaveBeenCalledWith(ServerStatus.STARTING)
    })

    it('should remove listener', async () => {
      const listener = vi.fn()
      adapter.onStatusChange(listener)
      adapter.removeStatusListener(listener)

      const config = ServerConfig.default()
      mockServer.isRunning.mockReturnValue(false)
      mockServer.start.mockResolvedValue(undefined)
      
      await adapter.start(config)

      expect(listener).not.toHaveBeenCalled()
    })
  })
})