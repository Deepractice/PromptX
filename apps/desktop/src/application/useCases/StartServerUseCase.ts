import { Result, ResultUtil } from '../../shared/Result.js'
import { ServerConfig } from '../../domain/entities/ServerConfig.js'
import { ServerError, ServerErrorCode } from '../../domain/errors/ServerErrors.js'
import type { IServerPort } from '../../domain/ports/IServerPort.js'
import type { IConfigPort, ConfigError } from '../../domain/ports/IConfigPort.js'
import type { INotificationPort } from '../../domain/ports/INotificationPort.js'

export interface UseCaseError {
  code: 'USE_CASE_CONFIG_ERROR' | 'USE_CASE_EXECUTION_ERROR'
  message: string
  cause?: unknown
}

export class StartServerUseCase {
  constructor(
    private readonly serverPort: IServerPort,
    private readonly configPort: IConfigPort,
    private readonly notificationPort: INotificationPort
  ) {}

  async execute(): Promise<Result<void, ServerError | UseCaseError>> {
    // Load configuration
    const configResult = await this.loadOrCreateConfig()
    if (!configResult.ok) {
      return configResult
    }

    const config = configResult.value

    // Start server
    const startResult = await this.serverPort.start(config)
    if (!startResult.ok) {
      await this.handleStartError(startResult.error)
      return startResult
    }

    // Config persistence disabled - using default config only
    // await this.configPort.save(config)

    // Show success notifications
    await this.showSuccessNotifications()

    return ResultUtil.ok(undefined)
  }

  async executeWithCustomConfig(
    config: ServerConfig
  ): Promise<Result<void, ServerError | UseCaseError>> {
    // Start server with custom config
    const startResult = await this.serverPort.start(config)
    if (!startResult.ok) {
      await this.handleStartError(startResult.error)
      return startResult
    }

    // Config persistence disabled - using default config only
    // await this.configPort.save(config)

    // Show success notifications
    await this.showSuccessNotifications()

    return ResultUtil.ok(undefined)
  }

  private async loadOrCreateConfig(): Promise<Result<ServerConfig, UseCaseError>> {
    // Config file persistence is disabled for now
    // Always use default config from code
    // This ensures users always get the latest configuration we ship
    
    // TODO: In the future, we can enable this for user preferences
    // const loadResult = await this.configPort.load()
    // 
    // if (loadResult.ok) {
    //   return ResultUtil.ok(loadResult.value)
    // }
    //
    // // Check if config doesn't exist
    // const exists = await this.configPort.exists()
    // if (!exists) {
    //   // Use default config
    //   return ResultUtil.ok(ServerConfig.default())
    // }
    //
    // // Config exists but failed to load
    // const error: UseCaseError = {
    //   code: 'USE_CASE_CONFIG_ERROR',
    //   message: loadResult.error.message,
    //   cause: loadResult.error
    // }
    //
    // await this.notificationPort.showError(
    //   `Failed to load configuration: ${loadResult.error.message}`,
    //   'Configuration Error'
    // )
    //
    // return ResultUtil.fail(error)
    
    return ResultUtil.ok(ServerConfig.default())
  }

  private async handleStartError(error: ServerError): Promise<void> {
    switch (error.code) {
      case ServerErrorCode.ALREADY_RUNNING:
        await this.notificationPort.showWarning(
          'Server is already running',
          'Server Status'
        )
        break

      case ServerErrorCode.PORT_IN_USE:
        await this.notificationPort.showError(
          error.message,
          'Server Error'
        )
        break

      case ServerErrorCode.INITIALIZATION_FAILED:
        await this.notificationPort.showError(
          error.message,
          'Server Error'
        )
        break

      default:
        await this.notificationPort.showError(
          `Failed to start server: ${error.message}`,
          'Server Error'
        )
    }
  }

  private async showSuccessNotifications(): Promise<void> {
    await this.notificationPort.showSuccess(
      'PromptX server started successfully',
      'Server Running'
    )

    // Get and show server address
    const addressResult = await this.serverPort.getAddress()
    if (addressResult.ok) {
      await this.notificationPort.showInfo(
        `Server available at: ${addressResult.value}`,
        'Server Address'
      )
    }
  }
}