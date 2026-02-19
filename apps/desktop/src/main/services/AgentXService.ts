import { createAgentX, type AgentX, type Unsubscribe } from 'agentxjs'
import * as logger from '@promptx/logger'
import * as path from 'node:path'
import * as fs from 'node:fs'
import { app } from 'electron'

export interface AgentXConfig {
  apiKey: string
  baseUrl: string
  model: string
}

const DEFAULT_CONFIG: AgentXConfig = {
  apiKey: '',
  baseUrl: 'https://api.anthropic.com',
  model: 'claude-sonnet-4-20250514',
}

export class AgentXService {
  private agentx: AgentX | null = null
  private port: number = 5200
  private isRunning: boolean = false
  private config: AgentXConfig = { ...DEFAULT_CONFIG }
  private configPath: string
  private agentxDir: string
  private imageCreateUnsubscribe: Unsubscribe | null = null

  constructor() {
    this.configPath = path.join(app.getPath('userData'), 'agentx-config.json')
    this.agentxDir = path.join(app.getPath('userData'), '.agentx')
    this.loadConfig()
  }

  private loadConfig(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf-8')
        const saved = JSON.parse(data)
        this.config = { ...DEFAULT_CONFIG, ...saved }
      }
    } catch (error) {
      logger.error('Failed to load AgentX config:', String(error))
    }
  }

  private saveConfig(): void {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2))
    } catch (error) {
      logger.error('Failed to save AgentX config:', String(error))
    }
  }

  getConfig(): AgentXConfig {
    return { ...this.config }
  }

  async updateConfig(newConfig: Partial<AgentXConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig }
    this.saveConfig()

    // 如果服务正在运行，重启以应用新配置
    if (this.isRunning) {
      await this.stop()
      await this.start()
    }
  }

  async testConnection(config: Partial<AgentXConfig>): Promise<{ success: boolean; error?: string }> {
    const testConfig = { ...this.config, ...config }

    if (!testConfig.apiKey) {
      return { success: false, error: 'API Key is required' }
    }

    try {
      // 使用 fetch 直接测试 Anthropic API
      const response = await fetch(`${testConfig.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': testConfig.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: testConfig.model,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      })

      if (response.ok) {
        return { success: true }
      }

      const errorData = await response.json().catch(() => ({}))
      const errorMessage = (errorData as any)?.error?.message || `HTTP ${response.status}`
      return { success: false, error: errorMessage }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.info('AgentX service is already running')
      return
    }

    if (!this.config.apiKey) {
      logger.warn('AgentX service not started: API Key not configured')
      return
    }

    try {
      logger.info('Starting AgentX service...')

      // Get the path to mcp-office server
      const mcpOfficePath = this.getMcpOfficePath()
      logger.info(`MCP Office path: ${mcpOfficePath}`)

      // Build MCP servers config
      const mcpServers: Record<string, { command: string; args: string[] }> = {}
      if (mcpOfficePath) {
        mcpServers['mcp-office'] = {
          command: 'node',
          args: [mcpOfficePath],
        }
      }

      this.agentx = await createAgentX({
        llm: {
          apiKey: this.config.apiKey,
          baseUrl: this.config.baseUrl,
          model: this.config.model,
        },
        agentxDir: this.agentxDir,
        defaultAgent: {
          name: 'PromptX Agent',
          mcpServers: Object.keys(mcpServers).length > 0 ? mcpServers : undefined,
        },
      })

      // Subscribe to image_create_response to setup .claude settings for new conversations
      this.imageCreateUnsubscribe = this.agentx.onCommand('image_create_response', (event) => {
        if (event.data.record?.imageId) {
          this.setupClaudeSettings(event.data.record.imageId)
        }
      })

      await this.agentx.listen(this.port)
      this.isRunning = true

      logger.info(`AgentX service started on ws://localhost:${this.port}`)
    } catch (error) {
      logger.error('Failed to start AgentX service:', String(error))
      throw error
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning || !this.agentx) {
      logger.info('AgentX service is not running')
      return
    }

    try {
      logger.info('Stopping AgentX service...')

      // Unsubscribe from image_create_response
      if (this.imageCreateUnsubscribe) {
        this.imageCreateUnsubscribe()
        this.imageCreateUnsubscribe = null
      }

      await this.agentx.dispose()
      this.agentx = null
      this.isRunning = false
      logger.info('AgentX service stopped')
    } catch (error) {
      logger.error('Failed to stop AgentX service:', String(error))
      throw error
    }
  }

  /**
   * Setup .claude/settings.local.json in the workdir for a conversation
   */
  private setupClaudeSettings(imageId: string): void {
    try {
      // The workdir path pattern: {agentxDir}/containers/promptx-desktop/workdirs/{imageId}
      const workdirPath = path.join(this.agentxDir, 'containers', 'promptx-desktop', 'workdirs', imageId)
      const claudeDir = path.join(workdirPath, '.claude')
      const settingsPath = path.join(claudeDir, 'settings.local.json')

      // Create .claude directory if it doesn't exist
      if (!fs.existsSync(claudeDir)) {
        fs.mkdirSync(claudeDir, { recursive: true })
      }

      // Write settings.local.json
      const settings = {
        skipWebFetchPreflight: true
      }
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2))

      logger.info(`Created .claude/settings.local.json for image: ${imageId}`)
    } catch (error) {
      logger.error(`Failed to setup .claude settings for image ${imageId}:`, String(error))
    }
  }

  /**
   * Get the path to mcp-office server
   */
  private getMcpOfficePath(): string {
    // In development, use the workspace package
    // In production, it will be bundled with the app
    const devPath = path.join(__dirname, '../../../../packages/mcp-office/dist/index.js')
    const prodPath = path.join(process.resourcesPath || '', 'mcp-office/index.js')

    if (fs.existsSync(devPath)) {
      return devPath
    }
    if (fs.existsSync(prodPath)) {
      return prodPath
    }

    // Fallback: try to find in node_modules
    const nodeModulesPath = path.join(__dirname, '../../../node_modules/@promptx/mcp-office/dist/index.js')
    if (fs.existsSync(nodeModulesPath)) {
      return nodeModulesPath
    }

    // Last resort: use require.resolve
    try {
      return require.resolve('@promptx/mcp-office')
    } catch {
      logger.warn('MCP Office server not found, Office document reading will not be available')
      return ''
    }
  }

  getPort(): number {
    return this.port
  }

  getStatus(): boolean {
    return this.isRunning
  }

  getServerUrl(): string {
    return `ws://localhost:${this.port}`
  }
}

export const agentXService = new AgentXService()
