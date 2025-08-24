import { describe, it, expect, beforeEach, vi } from 'vitest'
import { StartServerUseCase } from '../../../src/application/useCases/StartServerUseCase.js'
import { ServerConfig } from '../../../src/domain/entities/ServerConfig.js'
import { ServerError, ServerErrorCode } from '../../../src/domain/errors/ServerErrors.js'
import { ServerStatus } from '../../../src/domain/valueObjects/ServerStatus.js'
import { ResultUtil } from '../../../src/shared/Result.js'
import type { IServerPort } from '../../../src/domain/ports/IServerPort.js'
import type { IConfigPort } from '../../../src/domain/ports/IConfigPort.js'
import type { INotificationPort } from '../../../src/domain/ports/INotificationPort.js'

describe('StartServerUseCase', () => {
  let useCase: StartServerUseCase
  let serverPort: IServerPort
  let configPort: IConfigPort
  let notificationPort: INotificationPort

  beforeEach(() => {
    // Create mocks for ports
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

    configPort = {
      load: vi.fn(),
      save: vi.fn(),
      exists: vi.fn(),
      reset: vi.fn(),
      watch: vi.fn(),
      unwatch: vi.fn()
    }

    notificationPort = {
      show: vi.fn(),
      showInfo: vi.fn(),
      showSuccess: vi.fn(),
      showWarning: vi.fn(),
      showError: vi.fn()
    }

    useCase = new StartServerUseCase(serverPort, configPort, notificationPort)
  })

  describe('execute', () => {
    it('should start server successfully with loaded config', async () => {
      const config = ServerConfig.default()
      vi.mocked(configPort.load).mockResolvedValue(ResultUtil.ok(config))
      vi.mocked(serverPort.start).mockResolvedValue(ResultUtil.ok(undefined))
      vi.mocked(serverPort.getAddress).mockResolvedValue(ResultUtil.ok('http://localhost:3000'))

      const result = await useCase.execute()

      expect(result.ok).toBe(true)
      expect(configPort.load).toHaveBeenCalled()
      expect(serverPort.start).toHaveBeenCalledWith(config)
      expect(notificationPort.showSuccess).toHaveBeenCalledWith(
        'PromptX server started successfully',
        'Server Running'
      )
    })

    it('should handle config load failure', async () => {
      const configError = {
        code: 'CONFIG_LOAD_FAILED' as const,
        message: 'Config file corrupted'
      }
      vi.mocked(configPort.load).mockResolvedValue(ResultUtil.fail(configError))
      vi.mocked(configPort.exists).mockResolvedValue(true) // Config exists but corrupted

      const result = await useCase.execute()

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('USE_CASE_CONFIG_ERROR')
        expect(result.error.message).toContain('Config file corrupted')
      }
      expect(serverPort.start).not.toHaveBeenCalled()
      expect(notificationPort.showError).toHaveBeenCalledWith(
        'Failed to load configuration: Config file corrupted',
        'Configuration Error'
      )
    })

    it('should handle server already running', async () => {
      const config = ServerConfig.default()
      vi.mocked(configPort.load).mockResolvedValue(ResultUtil.ok(config))
      vi.mocked(serverPort.start).mockResolvedValue(
        ResultUtil.fail(ServerError.alreadyRunning())
      )

      const result = await useCase.execute()

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe(ServerErrorCode.ALREADY_RUNNING)
      }
      expect(notificationPort.showWarning).toHaveBeenCalledWith(
        'Server is already running',
        'Server Status'
      )
    })

    it('should handle port in use error', async () => {
      const config = ServerConfig.default()
      vi.mocked(configPort.load).mockResolvedValue(ResultUtil.ok(config))
      vi.mocked(serverPort.start).mockResolvedValue(
        ResultUtil.fail(ServerError.portInUse(3000))
      )

      const result = await useCase.execute()

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe(ServerErrorCode.PORT_IN_USE)
      }
      expect(notificationPort.showError).toHaveBeenCalledWith(
        'Port 3000 is already in use',
        'Server Error'
      )
    })

    it('should handle initialization failure', async () => {
      const config = ServerConfig.default()
      vi.mocked(configPort.load).mockResolvedValue(ResultUtil.ok(config))
      vi.mocked(serverPort.start).mockResolvedValue(
        ResultUtil.fail(ServerError.initializationFailed('Missing dependencies'))
      )

      const result = await useCase.execute()

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe(ServerErrorCode.INITIALIZATION_FAILED)
      }
      expect(notificationPort.showError).toHaveBeenCalledWith(
        'Failed to initialize server: Missing dependencies',
        'Server Error'
      )
    })

    it('should use default config when none exists', async () => {
      vi.mocked(configPort.load).mockResolvedValue(
        ResultUtil.fail({ 
          code: 'CONFIG_LOAD_FAILED' as const, 
          message: 'Config not found' 
        })
      )
      vi.mocked(configPort.exists).mockResolvedValue(false)
      vi.mocked(serverPort.start).mockResolvedValue(ResultUtil.ok(undefined))
      vi.mocked(serverPort.getAddress).mockResolvedValue(ResultUtil.ok('http://localhost:3000'))

      const result = await useCase.execute()

      expect(result.ok).toBe(true)
      const startCall = vi.mocked(serverPort.start).mock.calls[0]
      if (startCall) {
        const config = startCall[0] as ServerConfig
        expect(config.port).toBe(3000)
        expect(config.host).toBe('localhost')
      }
    })

    it('should save config after successful start', async () => {
      const config = ServerConfig.default()
      vi.mocked(configPort.load).mockResolvedValue(ResultUtil.ok(config))
      vi.mocked(serverPort.start).mockResolvedValue(ResultUtil.ok(undefined))
      vi.mocked(serverPort.getAddress).mockResolvedValue(ResultUtil.ok('http://localhost:3000'))
      vi.mocked(configPort.save).mockResolvedValue(ResultUtil.ok(undefined))

      const result = await useCase.execute()

      expect(result.ok).toBe(true)
      expect(configPort.save).toHaveBeenCalledWith(config)
    })

    it('should provide server address in success message', async () => {
      const config = ServerConfig.default()
      vi.mocked(configPort.load).mockResolvedValue(ResultUtil.ok(config))
      vi.mocked(serverPort.start).mockResolvedValue(ResultUtil.ok(undefined))
      vi.mocked(serverPort.getAddress).mockResolvedValue(
        ResultUtil.ok('http://localhost:4000')
      )

      await useCase.execute()

      expect(notificationPort.showInfo).toHaveBeenCalledWith(
        'Server available at: http://localhost:4000',
        'Server Address'
      )
    })
  })

  describe('executeWithCustomConfig', () => {
    it('should start server with custom config', async () => {
      const customConfig = ServerConfig.create({
        port: 5000,
        host: '0.0.0.0',
        workspace: '/custom/path'
      })
      
      if (!customConfig.ok) {
        throw new Error('Config creation failed')
      }

      vi.mocked(serverPort.start).mockResolvedValue(ResultUtil.ok(undefined))
      vi.mocked(serverPort.getAddress).mockResolvedValue(ResultUtil.ok('http://0.0.0.0:5000'))

      const result = await useCase.executeWithCustomConfig(customConfig.value)

      expect(result.ok).toBe(true)
      expect(serverPort.start).toHaveBeenCalledWith(customConfig.value)
      expect(configPort.save).toHaveBeenCalledWith(customConfig.value)
    })

    it('should not load config when using custom config', async () => {
      const customConfig = ServerConfig.default()
      vi.mocked(serverPort.start).mockResolvedValue(ResultUtil.ok(undefined))
      vi.mocked(serverPort.getAddress).mockResolvedValue(ResultUtil.ok('http://localhost:3000'))

      await useCase.executeWithCustomConfig(customConfig)

      expect(configPort.load).not.toHaveBeenCalled()
    })
  })
})