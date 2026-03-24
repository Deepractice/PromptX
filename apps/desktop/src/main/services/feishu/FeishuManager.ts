/**
 * 飞书模块入口
 *
 * 管理飞书 Bot 实例生命周期。
 * 配置持久化在 {dataDir}/feishu-config.json。
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import * as logger from '@promptx/logger'
import { createAgentX, type AgentX } from 'agentxjs'
import { FeishuBot, type FeishuConfig } from './FeishuBot'
import { FeishuBridge } from './FeishuBridge'
import { FeishuSessionManager, type RoleConfig } from './FeishuSessionManager'

export interface FeishuSavedConfig {
  feishu: FeishuConfig
  role: RoleConfig
}

export interface FeishuStatus {
  connected: boolean
  appId?: string
  error?: string
}

export class FeishuManager {
  private configFile: string
  private agentxPort: number
  private bot: FeishuBot | null = null
  private bridge: FeishuBridge | null = null
  private sessionManager: FeishuSessionManager | null = null
  private remoteAgentx: AgentX | null = null
  private _connected = false
  private _error: string | null = null
  private _appId: string | null = null

  constructor(dataDir: string, agentxPort: number = 5200) {
    this.configFile = path.join(dataDir, 'feishu-config.json')
    this.agentxPort = agentxPort
  }

  /**
   * 启动飞书 Bot
   */
  async start(feishuConfig: FeishuConfig, roleConfig: RoleConfig): Promise<void> {
    await this.stop()

    // 连接到本地 AgentX WebSocket 服务
    this.remoteAgentx = await createAgentX({
      serverUrl: `ws://127.0.0.1:${this.agentxPort}`,
    })

    this.bot = new FeishuBot(feishuConfig)
    this.sessionManager = new FeishuSessionManager()
    this.bridge = new FeishuBridge(this.remoteAgentx, this.bot, this.sessionManager, roleConfig)

    await this.bot.start((msg) => this.bridge!.handleFeishuMessage(msg))

    this._connected = true
    this._error = null
    this._appId = feishuConfig.appId

    // 持久化配置
    this.saveConfig(feishuConfig, roleConfig)

    logger.info('[FeishuManager] Started')
  }

  /**
   * 停止飞书 Bot
   */
  async stop(): Promise<void> {
    if (this.bridge) {
      this.bridge.destroy()
      this.bridge = null
    }
    if (this.sessionManager) {
      this.sessionManager.clear()
      this.sessionManager = null
    }
    if (this.bot) {
      await this.bot.stop()
      this.bot = null
    }
    if (this.remoteAgentx) {
      try {
        await (this.remoteAgentx as any).close?.()
      } catch { /* ignore */ }
      this.remoteAgentx = null
    }
    this._connected = false
    this._error = null
    logger.info('[FeishuManager] Stopped')
  }

  /**
   * 停止并删除配置
   */
  async remove(): Promise<void> {
    await this.stop()
    this._appId = null
    try {
      if (fs.existsSync(this.configFile)) {
        fs.unlinkSync(this.configFile)
      }
    } catch (err: any) {
      logger.warn('[FeishuManager] Failed to remove config:', err.message)
    }
  }

  /**
   * 启动时恢复已保存的连接
   */
  async restore(): Promise<void> {
    const saved = this.loadConfig()
    if (!saved?.feishu?.appId) return
    try {
      await this.start(saved.feishu, saved.role)
      logger.info('[FeishuManager] Restored connection')
    } catch (err: any) {
      this._error = err.message
      logger.warn('[FeishuManager] Failed to restore:', err.message)
    }
  }

  getStatus(): FeishuStatus {
    return {
      connected: this._connected,
      appId: this._appId || undefined,
      error: this._error || undefined,
    }
  }

  isConnected(): boolean {
    return this._connected
  }

  // ---------- 配置持久化 ----------

  loadConfig(): FeishuSavedConfig | null {
    try {
      logger.info(`[FeishuManager] loadConfig from: ${this.configFile}`)
      if (fs.existsSync(this.configFile)) {
        const raw = fs.readFileSync(this.configFile, 'utf-8')
        const data = JSON.parse(raw)
        logger.info(`[FeishuManager] loadConfig success, appId=${data?.feishu?.appId || 'N/A'}`)
        return data
      }
      logger.info('[FeishuManager] Config file does not exist')
    } catch (err: any) {
      logger.error('[FeishuManager] Failed to load config:', err.message)
    }
    return null
  }

  saveConfig(feishuConfig: FeishuConfig, roleConfig: RoleConfig): void {
    logger.info(`[FeishuManager] saveConfig to: ${this.configFile}, appId=${feishuConfig?.appId}`)
    const data = { feishu: feishuConfig, role: roleConfig }
    fs.writeFileSync(this.configFile, JSON.stringify(data, null, 2), 'utf-8')
    logger.info(`[FeishuManager] saveConfig success`)
  }
}
