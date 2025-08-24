export enum ServerErrorCode {
  ALREADY_RUNNING = 'SERVER_ALREADY_RUNNING',
  NOT_RUNNING = 'SERVER_NOT_RUNNING',
  PORT_IN_USE = 'SERVER_PORT_IN_USE',
  INITIALIZATION_FAILED = 'SERVER_INITIALIZATION_FAILED',
  SHUTDOWN_FAILED = 'SERVER_SHUTDOWN_FAILED',
  CONFIG_INVALID = 'SERVER_CONFIG_INVALID',
  RESOURCE_UNAVAILABLE = 'SERVER_RESOURCE_UNAVAILABLE',
  UNKNOWN = 'SERVER_UNKNOWN_ERROR'
}

export class ServerError extends Error {
  constructor(
    public readonly code: ServerErrorCode,
    message: string,
    public readonly cause?: unknown
  ) {
    super(message)
    this.name = 'ServerError'
  }

  static alreadyRunning(): ServerError {
    return new ServerError(
      ServerErrorCode.ALREADY_RUNNING,
      'Server is already running'
    )
  }

  static notRunning(): ServerError {
    return new ServerError(
      ServerErrorCode.NOT_RUNNING,
      'Server is not running'
    )
  }

  static portInUse(port: number): ServerError {
    return new ServerError(
      ServerErrorCode.PORT_IN_USE,
      `Port ${port} is already in use`
    )
  }

  static initializationFailed(reason: string, cause?: unknown): ServerError {
    return new ServerError(
      ServerErrorCode.INITIALIZATION_FAILED,
      `Failed to initialize server: ${reason}`,
      cause
    )
  }

  static shutdownFailed(reason: string, cause?: unknown): ServerError {
    return new ServerError(
      ServerErrorCode.SHUTDOWN_FAILED,
      `Failed to shutdown server: ${reason}`,
      cause
    )
  }

  static configInvalid(reason: string): ServerError {
    return new ServerError(
      ServerErrorCode.CONFIG_INVALID,
      `Invalid server configuration: ${reason}`
    )
  }

  static resourceUnavailable(resource: string): ServerError {
    return new ServerError(
      ServerErrorCode.RESOURCE_UNAVAILABLE,
      `Required resource is unavailable: ${resource}`
    )
  }

  static unknown(message: string, cause?: unknown): ServerError {
    return new ServerError(
      ServerErrorCode.UNKNOWN,
      message,
      cause
    )
  }
}