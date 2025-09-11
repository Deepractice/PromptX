import * as path from 'node:path'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as logger from '@promptx/logger'
import { UpdateState, UpdateInfo } from './types'

interface PersistedState {
  currentState: UpdateState
  lastCheck: number
  updateInfo?: UpdateInfo
  lastError?: {
    message: string
    timestamp: number
  }
}

export class UpdaterStorage {
  private basePath: string
  private statePath: string
  private cachePath: string

  constructor() {
    this.basePath = path.join(os.homedir(), '.promptx', 'desktop', 'updater')
    this.statePath = path.join(this.basePath, 'state.json')
    this.cachePath = path.join(this.basePath, 'cache')
  }

  async init(): Promise<void> {
    try {
      await fs.mkdir(this.basePath, { recursive: true })
      await fs.mkdir(this.cachePath, { recursive: true })
      logger.info(`UpdaterStorage: Initialized at ${this.basePath}`)
    } catch (error) {
      logger.error('UpdaterStorage: Failed to initialize:', error)
    }
  }

  async saveState(state: PersistedState): Promise<void> {
    try {
      const tempPath = `${this.statePath}.tmp`
      await fs.writeFile(tempPath, JSON.stringify(state, null, 2))
      await fs.rename(tempPath, this.statePath)
      logger.debug('UpdaterStorage: State saved')
    } catch (error) {
      logger.error('UpdaterStorage: Failed to save state:', error)
    }
  }

  async loadState(): Promise<PersistedState | null> {
    try {
      const data = await fs.readFile(this.statePath, 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      if ((error as any).code !== 'ENOENT') {
        logger.error('UpdaterStorage: Failed to load state:', error)
      }
      return null
    }
  }

  getCachePath(): string {
    return this.cachePath
  }

  async clearCache(): Promise<void> {
    try {
      const files = await fs.readdir(this.cachePath)
      await Promise.all(
        files.map(file => fs.unlink(path.join(this.cachePath, file)))
      )
      logger.info('UpdaterStorage: Cache cleared')
    } catch (error) {
      logger.error('UpdaterStorage: Failed to clear cache:', error)
    }
  }

  async getStorageInfo(): Promise<{
    stateExists: boolean
    cacheSize: number
  }> {
    const stateExists = await fs.access(this.statePath).then(() => true).catch(() => false)

    let cacheSize = 0
    try {
      const files = await fs.readdir(this.cachePath)
      const stats = await Promise.all(
        files.map(file => fs.stat(path.join(this.cachePath, file)))
      )
      cacheSize = stats.reduce((sum, stat) => sum + stat.size, 0)
    } catch {
      // ignore
    }

    return { stateExists, cacheSize }
  }
}