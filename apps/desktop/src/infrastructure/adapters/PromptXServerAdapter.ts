import { Result, ResultUtil } from '../../shared/Result.js'
import { ServerConfig } from '../../domain/entities/ServerConfig.js'
import { ServerError, ServerErrorCode } from '../../domain/errors/ServerErrors.js'
import { ServerStatus } from '../../domain/valueObjects/ServerStatus.js'
import type { IServerPort, ServerMetrics } from '../../domain/ports/IServerPort.js'
import { logger } from '../../shared/logger.js'
import { FastMCPServer } from './FastMCPServer.js'

export class PromptXServerAdapter implements IServerPort {
  private server: FastMCPServer | null = null
  private statusListeners: Set<(status: ServerStatus) => void> = new Set()
  private currentStatus: ServerStatus = ServerStatus.STOPPED

  async start(config: ServerConfig): Promise<Result<void, ServerError>> {
    try {
      if (this.server?.isRunning()) {
        return ResultUtil.fail(ServerError.alreadyRunning())
      }

      this.updateStatus(ServerStatus.STARTING)

      // Create and start the FastMCP server
      this.server = new FastMCPServer({
        host: config.host,
        port: config.port,
        debug: config.debug || false,
        stateless: config.stateless || false
      })
      
      await this.server.start()
      this.updateStatus(ServerStatus.RUNNING)
      
      logger.info(`Server running at ${this.server.getMCPEndpoint()}`)

      return ResultUtil.ok(undefined)
    } catch (error) {
      this.updateStatus(ServerStatus.ERROR)
      
      if (error instanceof Error) {
        if (error.message.includes('EADDRINUSE')) {
          return ResultUtil.fail(ServerError.portInUse(config.port))
        }
        return ResultUtil.fail(
          ServerError.initializationFailed(error.message, error)
        )
      }
      
      return ResultUtil.fail(
        ServerError.unknown('Failed to start server', error)
      )
    }
  }

  async stop(): Promise<Result<void, ServerError>> {
    try {
      if (!this.server?.isRunning()) {
        return ResultUtil.fail(ServerError.notRunning())
      }

      this.updateStatus(ServerStatus.STOPPING)
      await this.server.stop()
      this.server = null
      this.updateStatus(ServerStatus.STOPPED)

      return ResultUtil.ok(undefined)
    } catch (error) {
      this.updateStatus(ServerStatus.ERROR)
      
      if (error instanceof Error) {
        return ResultUtil.fail(
          ServerError.shutdownFailed(error.message, error)
        )
      }
      
      return ResultUtil.fail(
        ServerError.unknown('Failed to stop server', error)
      )
    }
  }

  async restart(config: ServerConfig): Promise<Result<void, ServerError>> {
    if (this.server?.isRunning()) {
      const stopResult = await this.stop()
      if (!stopResult.ok) {
        return stopResult
      }
    }
    
    return this.start(config)
  }

  async getStatus(): Promise<Result<ServerStatus, ServerError>> {
    if (!this.server) {
      return ResultUtil.ok(ServerStatus.STOPPED)
    }

    if (this.server.isRunning()) {
      return ResultUtil.ok(ServerStatus.RUNNING)
    }
    
    if (this.server.isStarting()) {
      return ResultUtil.ok(ServerStatus.STARTING)
    }
    
    if (this.server.isStopping()) {
      return ResultUtil.ok(ServerStatus.STOPPING)
    }

    return ResultUtil.ok(ServerStatus.ERROR)
  }

  async getAddress(): Promise<Result<string, ServerError>> {
    if (!this.server?.isRunning()) {
      return ResultUtil.fail(ServerError.notRunning())
    }

    const address = this.server.getAddress()
    return ResultUtil.ok(address)
  }

  async getMetrics(): Promise<Result<ServerMetrics, ServerError>> {
    if (!this.server?.isRunning()) {
      return ResultUtil.fail(ServerError.notRunning())
    }

    const metrics: ServerMetrics = {
      uptime: this.server.getUptime(),
      requestCount: this.server.getRequestCount(),
      activeConnections: this.server.getActiveConnections(),
      memoryUsage: process.memoryUsage()
    }

    return ResultUtil.ok(metrics)
  }

  async updateConfig(config: Partial<ServerConfig>): Promise<Result<void, ServerError>> {
    if (!this.server?.isRunning()) {
      return ResultUtil.fail(ServerError.notRunning())
    }

    try {
      await this.server.updateConfig(config)
      return ResultUtil.ok(undefined)
    } catch (error) {
      if (error instanceof Error) {
        return ResultUtil.fail(
          ServerError.configInvalid(error.message)
        )
      }
      return ResultUtil.fail(
        ServerError.unknown('Failed to update config', error)
      )
    }
  }

  onStatusChange(callback: (status: ServerStatus) => void): void {
    this.statusListeners.add(callback)
  }

  removeStatusListener(callback: (status: ServerStatus) => void): void {
    this.statusListeners.delete(callback)
  }

  private updateStatus(status: ServerStatus): void {
    this.currentStatus = status
    this.statusListeners.forEach(listener => {
      try {
        listener(status)
      } catch (error) {
        logger.error('Error in status listener:', error)
      }
    })
  }
}