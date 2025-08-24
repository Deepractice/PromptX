import { describe, it, expect, beforeEach, vi } from 'vitest'
import { StopServerUseCase } from '../../../src/application/useCases/StopServerUseCase.js'
import { ServerError, ServerErrorCode } from '../../../src/domain/errors/ServerErrors.js'
import { ResultUtil } from '../../../src/shared/Result.js'
import type { IServerPort } from '../../../src/domain/ports/IServerPort.js'
import type { INotificationPort } from '../../../src/domain/ports/INotificationPort.js'

describe('StopServerUseCase', () => {
  let useCase: StopServerUseCase
  let serverPort: IServerPort
  let notificationPort: INotificationPort

  beforeEach(() => {
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

    notificationPort = {
      show: vi.fn(),
      showInfo: vi.fn(),
      showSuccess: vi.fn(),
      showWarning: vi.fn(),
      showError: vi.fn()
    }

    useCase = new StopServerUseCase(serverPort, notificationPort)
  })

  describe('execute', () => {
    it('should stop server successfully', async () => {
      vi.mocked(serverPort.stop).mockResolvedValue(ResultUtil.ok(undefined))

      const result = await useCase.execute()

      expect(result.ok).toBe(true)
      expect(serverPort.stop).toHaveBeenCalled()
      expect(notificationPort.showSuccess).toHaveBeenCalledWith(
        'PromptX server stopped successfully',
        'Server Stopped'
      )
    })

    it('should handle server not running', async () => {
      vi.mocked(serverPort.stop).mockResolvedValue(
        ResultUtil.fail(ServerError.notRunning())
      )

      const result = await useCase.execute()

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe(ServerErrorCode.NOT_RUNNING)
      }
      expect(notificationPort.showWarning).toHaveBeenCalledWith(
        'Server is not running',
        'Server Status'
      )
    })

    it('should handle shutdown failure', async () => {
      vi.mocked(serverPort.stop).mockResolvedValue(
        ResultUtil.fail(ServerError.shutdownFailed('Timeout'))
      )

      const result = await useCase.execute()

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe(ServerErrorCode.SHUTDOWN_FAILED)
      }
      expect(notificationPort.showError).toHaveBeenCalledWith(
        'Failed to shutdown server: Timeout',
        'Server Error'
      )
    })

    it('should handle graceful shutdown option', async () => {
      vi.mocked(serverPort.stop).mockResolvedValue(ResultUtil.ok(undefined))

      const result = await useCase.execute({ graceful: true })

      expect(result.ok).toBe(true)
      expect(notificationPort.showInfo).toHaveBeenCalledWith(
        'Gracefully shutting down server...',
        'Server Shutdown'
      )
      expect(notificationPort.showSuccess).toHaveBeenCalledWith(
        'PromptX server stopped successfully',
        'Server Stopped'
      )
    })

    it('should handle force shutdown option', async () => {
      vi.mocked(serverPort.stop).mockResolvedValue(ResultUtil.ok(undefined))

      const result = await useCase.execute({ force: true })

      expect(result.ok).toBe(true)
      expect(notificationPort.showWarning).toHaveBeenCalledWith(
        'Force stopping server...',
        'Server Shutdown'
      )
    })
  })
})