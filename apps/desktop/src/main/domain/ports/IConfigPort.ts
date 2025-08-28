import { Result } from '~/shared/Result'
import { ServerConfig, ServerConfigData } from '~/main/domain/entities/ServerConfig'

export interface ConfigError {
  code: 'CONFIG_LOAD_FAILED' | 'CONFIG_SAVE_FAILED' | 'CONFIG_PARSE_ERROR'
  message: string
  cause?: unknown
}

export interface IConfigPort {
  load(): Promise<Result<ServerConfig, ConfigError>>
  save(config: ServerConfig): Promise<Result<void, ConfigError>>
  exists(): Promise<boolean>
  reset(): Promise<Result<void, ConfigError>>
  watch(callback: (config: ServerConfig) => void): void
  unwatch(callback: (config: ServerConfig) => void): void
}