import { Result, ResultUtil } from '~/shared/Result'
import { ServerConfig } from '~/main/domain/entities/ServerConfig'
import { ServerError, ServerErrorCode } from '~/main/domain/errors/ServerErrors'
import { ServerStatus } from '~/main/domain/valueObjects/ServerStatus'
import type { IServerPort, ServerMetrics } from '~/main/domain/ports/IServerPort'
import * as logger from '@promptx/logger'

// Dynamic import for ESM module
let FastMCPHttpServer: any

export class PromptXServerAdapter implements IServerPort {
  private server: any = null
  private statusListeners: Set<(status: ServerStatus) => void> = new Set()
  private currentStatus: ServerStatus = ServerStatus.STOPPED

  async start(config: ServerConfig): Promise<Result<void, ServerError>> {
    try {
      if (this.server?.status?.running) {
        return ResultUtil.fail(ServerError.alreadyRunning())
      }

      this.updateStatus(ServerStatus.STARTING)

      // Dynamic import @promptx/mcp-server (ESM module)
      if (!FastMCPHttpServer) {
        const mcpServer = await import('@promptx/mcp-server')
        FastMCPHttpServer = mcpServer.FastMCPHttpServer
      }

      // Create and start the FastMCP server
      this.server = new FastMCPHttpServer({
        host: config.host,
        port: config.port,
        debug: config.debug || false,
        stateless: config.stateless || false
      })
      
      await this.server.start()
      this.updateStatus(ServerStatus.RUNNING)
      
      const endpoint = `http://${config.host}:${config.port}/mcp`
      logger.info(`Server running at ${endpoint}`)

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
      if (!this.server?.status?.running) {
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
    if (this.server?.status?.running) {
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

    // FastMCP使用status.running属性而非isRunning()方法
    if (this.server.status?.running) {
      return ResultUtil.ok(ServerStatus.RUNNING)
    }
    
    return ResultUtil.ok(ServerStatus.STOPPED)
  }

  async getAddress(): Promise<Result<string, ServerError>> {
    if (!this.server?.status?.running) {
      return ResultUtil.fail(ServerError.notRunning())
    }

    const address = `http://${this.server.config.host}:${this.server.config.port}${this.server.config.endpoint}`
    return ResultUtil.ok(address)
  }

  async getMetrics(): Promise<Result<ServerMetrics, ServerError>> {
    if (!this.server?.status?.running) {
      return ResultUtil.fail(ServerError.notRunning())
    }

    const metrics: ServerMetrics = {
      uptime: this.server.status.startTime ? Date.now() - this.server.status.startTime : 0,
      requestCount: this.server.config.metrics?.requestsTotal || 0,
      activeConnections: this.server.status.connections || 0,
      memoryUsage: process.memoryUsage()
    }

    return ResultUtil.ok(metrics)
  }

  async updateConfig(config: Partial<ServerConfig>): Promise<Result<void, ServerError>> {
    if (!this.server?.status?.running) {
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