import { Result } from '~/shared/Result'
import { ServerConfig } from '~/main/domain/entities/ServerConfig'
import { ServerError } from '~/main/domain/errors/ServerErrors'
import { ServerStatus } from '~/main/domain/valueObjects/ServerStatus'

export interface ServerMetrics {
  uptime: number
  requestCount: number
  activeConnections: number
  memoryUsage: NodeJS.MemoryUsage
}

export interface IServerPort {
  start(config: ServerConfig): Promise<Result<void, ServerError>>
  stop(): Promise<Result<void, ServerError>>
  restart(config: ServerConfig): Promise<Result<void, ServerError>>
  getStatus(): Promise<Result<ServerStatus, ServerError>>
  getAddress(): Promise<Result<string, ServerError>>
  getMetrics(): Promise<Result<ServerMetrics, ServerError>>
  updateConfig(config: Partial<ServerConfig>): Promise<Result<void, ServerError>>
  onStatusChange(callback: (status: ServerStatus) => void): void
  removeStatusListener(callback: (status: ServerStatus) => void): void
}