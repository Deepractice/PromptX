import { Result, ResultUtil } from '../../shared/Result.js'
import { ServerError, ServerErrorCode } from '../../domain/errors/ServerErrors.js'
import type { IServerPort } from '../../domain/ports/IServerPort.js'
import type { INotificationPort } from '../../domain/ports/INotificationPort.js'

export interface StopOptions {
  graceful?: boolean
  force?: boolean
  timeout?: number
}

export class StopServerUseCase {
  constructor(
    private readonly serverPort: IServerPort,
    private readonly notificationPort: INotificationPort
  ) {}

  async execute(options?: StopOptions): Promise<Result<void, ServerError>> {
    // Show stopping notification
    if (options?.force) {
      await this.notificationPort.showWarning(
        'Force stopping server...',
        'Server Shutdown'
      )
    } else if (options?.graceful) {
      await this.notificationPort.showInfo(
        'Gracefully shutting down server...',
        'Server Shutdown'
      )
    }

    // Stop the server
    const stopResult = await this.serverPort.stop()
    
    if (!stopResult.ok) {
      await this.handleStopError(stopResult.error)
      return stopResult
    }

    // Show success notification
    await this.notificationPort.showSuccess(
      'PromptX server stopped successfully',
      'Server Stopped'
    )

    return ResultUtil.ok(undefined)
  }

  private async handleStopError(error: ServerError): Promise<void> {
    switch (error.code) {
      case ServerErrorCode.NOT_RUNNING:
        await this.notificationPort.showWarning(
          'Server is not running',
          'Server Status'
        )
        break

      case ServerErrorCode.SHUTDOWN_FAILED:
        await this.notificationPort.showError(
          error.message,
          'Server Error'
        )
        break

      default:
        await this.notificationPort.showError(
          `Failed to stop server: ${error.message}`,
          'Server Error'
        )
    }
  }
}