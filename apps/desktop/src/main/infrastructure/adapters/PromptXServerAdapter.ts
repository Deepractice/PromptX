import { Result, ResultUtil } from '~/shared/Result'
import { ServerConfig } from '~/main/domain/entities/ServerConfig'
import { ServerError } from '~/main/domain/errors/ServerErrors'
import { ServerStatus } from '~/main/domain/valueObjects/ServerStatus'
import type { IServerPort, ServerMetrics } from '~/main/domain/ports/IServerPort'
import * as logger from '@promptx/logger'
import { ServerConfigManager } from '@promptx/config'

// Dynamic import for ESM module
let PromptXMCPServer: any

export class PromptXServerAdapter implements IServerPort {
  private server: any = null
  private statusListeners: Set<(status: ServerStatus) => void> = new Set()
  private currentStatus: ServerStatus = ServerStatus.STOPPED

  async start(config: ServerConfig): Promise<Result<void, ServerError>> {
    try {
      if (this.server?.getServer && this.server.getServer().isRunning()) {
        return ResultUtil.fail(ServerError.alreadyRunning())
      }

      this.updateStatus(ServerStatus.STARTING)

      // Dynamic import @promptx/mcp-server (ESM module)
      if (!PromptXMCPServer) {
        const mcpServer = await import('@promptx/mcp-server')
        PromptXMCPServer = mcpServer.PromptXMCPServer
      }

      // 使用配置管理器作为回退（当 UI 未提供 host/port/debug）
      const cfg = new ServerConfigManager()
      const host = config.host ?? cfg.getHost()
      const port = config.port ?? cfg.getPort()
      const debug = config.debug ?? cfg.getDebug()
      const corsEnabled = cfg.getCorsEnabled()
  
      // Create and start the PromptX MCP server
      this.server = new PromptXMCPServer({
        transport: 'http',
        host,
        port,
        debug,
        corsEnabled
      })
      
      await this.server.start()
      this.updateStatus(ServerStatus.RUNNING)
      
      const endpoint = `http://${host}:${port}/mcp`
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
      if (!this.server?.getServer || !this.server.getServer().isRunning()) {
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
    if (this.server?.getServer && this.server.getServer().isRunning()) {
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

    // PromptXMCPServer 使用 isRunning() 方法
    if (this.server.getServer && this.server.getServer().isRunning()) {
      return ResultUtil.ok(ServerStatus.RUNNING)
    }
    
    return ResultUtil.ok(ServerStatus.STOPPED)
  }

  async getAddress(): Promise<Result<string, ServerError>> {
    if (!this.server?.getServer || !this.server.getServer().isRunning()) {
      return ResultUtil.fail(ServerError.notRunning())
    }

    // PromptXMCPServer 的配置存储在 options 中
    const host = this.server.options?.host || '127.0.0.1'
    const port = this.server.options?.port || 5203
    const address = `http://${host}:${port}/mcp`
    return ResultUtil.ok(address)
  }

  async getMetrics(): Promise<Result<ServerMetrics, ServerError>> {
    if (!this.server?.getServer || !this.server.getServer().isRunning()) {
      return ResultUtil.fail(ServerError.notRunning())
    }

    // 从底层服务器获取指标
    const serverMetrics = this.server.getServer().getMetrics()
    const metrics: ServerMetrics = {
      uptime: serverMetrics.uptime || 0,
      requestCount: serverMetrics.requestCount || 0,
      activeConnections: serverMetrics.activeConnections || 0,
      memoryUsage: serverMetrics.memoryUsage || process.memoryUsage()
    }

    return ResultUtil.ok(metrics)
  }

  async updateConfig(config: Partial<ServerConfig>): Promise<Result<void, ServerError>> {
    if (!this.server?.getServer || !this.server.getServer().isRunning()) {
      return ResultUtil.fail(ServerError.notRunning())
    }

    // PromptXMCPServer 不支持动态更新配置，需要重启
    // 这里我们只更新内部记录，实际更新需要重启服务器
    try {
      logger.warn('Configuration update requires server restart to take effect')
      // 保存新配置以备重启时使用
      if (config.host !== undefined) this.server.options.host = config.host
      if (config.port !== undefined) this.server.options.port = config.port
      if (config.debug !== undefined) this.server.options.debug = config.debug
      
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
        const err = String(error)
        logger.error('Error in status listener:', err)
      }
    })
  }
}