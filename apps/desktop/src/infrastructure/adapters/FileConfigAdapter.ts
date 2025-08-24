import * as fs from 'node:fs/promises'
import * as fsSync from 'node:fs'
import * as path from 'node:path'
import { Result, ResultUtil } from '../../shared/Result.js'
import { ServerConfig, ServerConfigData } from '../../domain/entities/ServerConfig.js'
import type { IConfigPort, ConfigError } from '../../domain/ports/IConfigPort.js'

export class FileConfigAdapter implements IConfigPort {
  private watchers: Set<(config: ServerConfig) => void> = new Set()
  private fileWatcher: any = null

  constructor(private readonly configPath: string) {
    // Ensure config directory exists
    this.ensureConfigDir()
  }

  async load(): Promise<Result<ServerConfig, ConfigError>> {
    try {
      const data = await fs.readFile(this.configPath, 'utf-8')
      const parsed = JSON.parse(data) as ServerConfigData
      
      const configResult = ServerConfig.create(parsed)
      if (!configResult.ok) {
        return ResultUtil.fail({
          code: 'CONFIG_PARSE_ERROR',
          message: 'Invalid configuration format',
          cause: configResult.error
        })
      }

      return ResultUtil.ok(configResult.value)
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return ResultUtil.fail({
          code: 'CONFIG_LOAD_FAILED',
          message: 'Configuration file not found',
          cause: error
        })
      }

      return ResultUtil.fail({
        code: 'CONFIG_LOAD_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
        cause: error
      })
    }
  }

  async save(config: ServerConfig): Promise<Result<void, ConfigError>> {
    try {
      await this.ensureConfigDir()
      
      const data = JSON.stringify(config.toJSON(), null, 2)
      await fs.writeFile(this.configPath, data, 'utf-8')
      
      // Notify watchers
      this.notifyWatchers(config)
      
      return ResultUtil.ok(undefined)
    } catch (error) {
      return ResultUtil.fail({
        code: 'CONFIG_SAVE_FAILED',
        message: error instanceof Error ? error.message : 'Failed to save configuration',
        cause: error
      })
    }
  }

  async exists(): Promise<boolean> {
    try {
      await fs.access(this.configPath)
      return true
    } catch {
      return false
    }
  }

  async reset(): Promise<Result<void, ConfigError>> {
    try {
      const defaultConfig = ServerConfig.default()
      return await this.save(defaultConfig)
    } catch (error) {
      return ResultUtil.fail({
        code: 'CONFIG_SAVE_FAILED',
        message: 'Failed to reset configuration',
        cause: error
      })
    }
  }

  watch(callback: (config: ServerConfig) => void): void {
    this.watchers.add(callback)
    
    // Setup file watcher if not already watching
    if (!this.fileWatcher) {
      this.setupFileWatcher()
    }
  }

  unwatch(callback: (config: ServerConfig) => void): void {
    this.watchers.delete(callback)
    
    // Stop watching if no more watchers
    if (this.watchers.size === 0 && this.fileWatcher) {
      fsSync.unwatchFile(this.configPath)
      this.fileWatcher = null
    }
  }

  private async ensureConfigDir(): Promise<void> {
    const dir = path.dirname(this.configPath)
    try {
      await fs.mkdir(dir, { recursive: true })
    } catch {
      // Directory might already exist
    }
  }

  private setupFileWatcher(): void {
    try {
      // Using fs.watchFile as it's more reliable for single files
      fsSync.watchFile(this.configPath, async () => {
        const configResult = await this.load()
        if (configResult.ok) {
          this.notifyWatchers(configResult.value)
        }
      })
      this.fileWatcher = true
    } catch {
      // File might not exist yet
    }
  }

  private notifyWatchers(config: ServerConfig): void {
    this.watchers.forEach(callback => {
      try {
        callback(config)
      } catch (error) {
        console.error('Error in config watcher:', error)
      }
    })
  }
}