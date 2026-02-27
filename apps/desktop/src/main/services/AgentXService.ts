import { createAgentX, type AgentX, type Unsubscribe } from 'agentxjs'
import * as logger from '@promptx/logger'
import * as path from 'node:path'
import * as fs from 'node:fs'
import { app } from 'electron'

export interface MCPServerConfig {
  name: string
  // stdio 类型
  command?: string
  args?: string[]
  env?: Record<string, string>
  // http/sse 类型
  type?: "http" | "sse"
  url?: string
  // 通用
  enabled: boolean
  builtin?: boolean  // 内置服务器标记，不可删除
  description?: string  // 服务器描述
  [key: string]: unknown  // 支持其他自定义字段
}

export interface AgentXProfile {
  id: string
  name: string
  apiKey: string
  baseUrl: string
  model: string
}

export interface AgentXConfig {
  apiKey: string
  baseUrl: string
  model: string
  mcpServers?: MCPServerConfig[]
  enabledSkills?: string[]  // 启用的 skills 列表
  profiles?: AgentXProfile[]
  activeProfileId?: string
}

const DEFAULT_CONFIG: AgentXConfig = {
  apiKey: '',
  baseUrl: 'https://api.anthropic.com',
  model: 'claude-sonnet-4-20250514',
  mcpServers: [],
}

export class AgentXService {
  private agentx: AgentX | null = null
  private port: number = 5200
  private isRunning: boolean = false
  private config: AgentXConfig = { ...DEFAULT_CONFIG }
  private configPath: string
  private agentxDir: string
  private imageCreateUnsubscribe: Unsubscribe | null = null
  private externalAccess: boolean = false

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

        // Migrate: if no profiles but has apiKey, create a default profile
        if (!this.config.profiles?.length && this.config.apiKey) {
          const defaultProfile: AgentXProfile = {
            id: crypto.randomUUID(),
            name: 'Default',
            apiKey: this.config.apiKey,
            baseUrl: this.config.baseUrl,
            model: this.config.model,
          }
          this.config.profiles = [defaultProfile]
          this.config.activeProfileId = defaultProfile.id
          this.saveConfig()
        }
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

    // Sync active profile's fields to top-level apiKey/baseUrl/model
    if (this.config.profiles?.length && this.config.activeProfileId) {
      const active = this.config.profiles.find(p => p.id === this.config.activeProfileId)
      if (active) {
        this.config.apiKey = active.apiKey
        this.config.baseUrl = active.baseUrl
        this.config.model = active.model
      }
    }

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
      const mcpServers: Record<string, any> = {}

      // Add built-in PromptX MCP server
      const promptxUrl = this.getPromptXMcpUrl()
      mcpServers['promptx'] = {
        type: 'http',
        url: promptxUrl,
      }
      logger.info(`PromptX MCP URL: ${promptxUrl}`)

      // Add built-in mcp-office server
      // Use Electron's built-in Node.js (ELECTRON_RUN_AS_NODE=1) so it works
      // even if the user doesn't have Node.js installed on their system.
      if (mcpOfficePath) {
        mcpServers['mcp-office'] = {
          command: process.execPath,
          args: [mcpOfficePath],
          env: {
            ...process.env,
            ELECTRON_RUN_AS_NODE: '1',
          },
        }
      }

      // Add user-configured MCP servers
      if (this.config.mcpServers) {
        for (const server of this.config.mcpServers) {
          if (server.enabled && server.name) {
            const { name, enabled, builtin, description, ...config } = server
            // 支持 stdio (command) 或 http/sse (type + url)
            if (config.command || config.url) {
              mcpServers[server.name] = config
            }
          }
        }
      }

      this.agentx = await createAgentX({
        llm: {
          apiKey: this.config.apiKey,
          baseUrl: this.config.baseUrl,
          model: this.config.model,
        },
        agentxDir: this.agentxDir,
        environment: {
          claudeCodePath: this.getClaudeAgentSdkCliPath(),
        },
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

      await this.agentx.listen(this.port, this.externalAccess ? '0.0.0.0' : '127.0.0.1')
      this.isRunning = true

      logger.info(`AgentX service started on ws://${this.externalAccess ? '0.0.0.0' : 'localhost'}:${this.port}`)
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
   * Setup .claude/settings.json in the workdir for a conversation
   */
  private setupClaudeSettings(imageId: string): void {
    try {
      // The workdir path pattern: {agentxDir}/containers/promptx-desktop/workdirs/{imageId}
      const workdirPath = path.join(this.agentxDir, 'containers', 'promptx-desktop', 'workdirs', imageId)
      const claudeDir = path.join(workdirPath, '.claude')
      const settingsPath = path.join(claudeDir, 'settings.json')

      // Create .claude directory if it doesn't exist
      if (!fs.existsSync(claudeDir)) {
        fs.mkdirSync(claudeDir, { recursive: true })
      }

      // Write settings.json
      const settings = {
        skipWebFetchPreflight: true
      }
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2))

      // Link ~/.claude/skills/ into workdir via junction (Windows) or symlink (Unix)
      // This avoids file duplication while making skills available without loading
      // the full user settings (which may contain conflicting permissions/config).
      this.linkSkillsToWorkdir(claudeDir)

      logger.info(`Created .claude/settings.json for image: ${imageId}`)
    } catch (error) {
      logger.error(`Failed to setup .claude settings for image ${imageId}:`, String(error))
    }
  }

  /**
   * Create a junction/symlink from workdir's .claude/skills/ → {userData}/skills/
   * so Claude Code can discover skills without loading the full user settings file.
   * Windows: junction (no admin required); Unix/macOS: symlink
   */
  private linkSkillsToWorkdir(claudeDir: string): void {
    try {
      const skillsSourceDir = this.getSkillsDir()
      const localSkillsLink = path.join(claudeDir, 'skills')

      // Ensure the skills source dir exists
      if (!fs.existsSync(skillsSourceDir)) {
        fs.mkdirSync(skillsSourceDir, { recursive: true })
      }

      // Remove existing link/dir if present (lstatSync detects broken symlinks too)
      try {
        const stat = fs.lstatSync(localSkillsLink)
        if (stat.isSymbolicLink() || stat.isDirectory()) {
          fs.rmSync(localSkillsLink, { recursive: true, force: true })
        }
      } catch {
        // Path doesn't exist, nothing to remove
      }

      // Windows: junction (no admin required); Unix/macOS: regular symlink
      if (process.platform === 'win32') {
        fs.symlinkSync(skillsSourceDir, localSkillsLink, 'junction')
      } else {
        fs.symlinkSync(skillsSourceDir, localSkillsLink)
      }
      logger.info(`Linked skills into workdir: ${localSkillsLink} → ${skillsSourceDir}`)
    } catch (error) {
      logger.warn(`Failed to link skills into workdir: ${String(error)}`)
    }
  }

  /**
   * Get the path to @anthropic-ai/claude-agent-sdk cli.js
   * In packaged app, it lives in app.asar.unpacked (not inside app.asar)
   */
  private getClaudeAgentSdkCliPath(): string | undefined {
    // Packaged: app.asar.unpacked takes priority
    const unpackedPath = path.join(
      process.resourcesPath || '',
      'app.asar.unpacked',
      'node_modules',
      '@anthropic-ai',
      'claude-agent-sdk',
      'cli.js'
    )
    if (fs.existsSync(unpackedPath)) {
      logger.info(`Claude Agent SDK cli.js found at: ${unpackedPath}`)
      return unpackedPath
    }
    // Development: resolve from node_modules
    try {
      const resolved = require.resolve('@anthropic-ai/claude-agent-sdk/cli.js')
      logger.info(`Claude Agent SDK cli.js resolved: ${resolved}`)
      return resolved
    } catch {
      logger.warn('Claude Agent SDK cli.js not found, using SDK default')
      return undefined
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

  async setExternalAccess(enabled: boolean): Promise<void> {
    this.externalAccess = enabled
    if (this.isRunning) {
      await this.stop()
      await this.start()
    }
  }

  getExternalAccess(): boolean {
    return this.externalAccess
  }

  getStatus(): boolean {
    return this.isRunning
  }

  getServerUrl(): string {
    return `ws://localhost:${this.port}`
  }

  /**
   * 获取所有 MCP 服务器配置（包括内置的）
   */
  getMcpServers(): MCPServerConfig[] {
    const servers: MCPServerConfig[] = []

    // 添加内置的 PromptX MCP 服务器（从系统配置获取地址）
    const promptxUrl = this.getPromptXMcpUrl()
    servers.push({
      name: 'promptx',
      type: 'http',
      url: promptxUrl,
      enabled: true,
      builtin: true,
      description: 'PromptX MCP Server (Roles, Tools, Memory)',
    })

    // 添加内置的 mcp-office 服务器
    const mcpOfficePath = this.getMcpOfficePath()
    if (mcpOfficePath) {
      servers.push({
        name: 'mcp-office',
        command: 'node',
        args: [mcpOfficePath],
        enabled: true,
        builtin: true,
        description: 'Office document reader (Word, Excel, PDF)',
      })
    }

    // 添加用户配置的服务器
    if (this.config.mcpServers) {
      servers.push(...this.config.mcpServers)
    }

    return servers
  }

  /**
   * 获取 PromptX MCP 服务器 URL（从系统配置读取）
   */
  private getPromptXMcpUrl(): string {
    try {
      const configPath = path.join(app.getPath('userData'), 'config.json')
      if (fs.existsSync(configPath)) {
        const data = fs.readFileSync(configPath, 'utf-8')
        const config = JSON.parse(data)
        const host = config.host || '127.0.0.1'
        const port = config.port || 5203
        return `http://${host}:${port}/mcp`
      }
    } catch (error) {
      logger.error('Failed to read PromptX server config:', String(error))
    }
    // 默认地址
    return 'http://127.0.0.1:5203/mcp'
  }

  /**
   * 获取 skills 目录路径
   */
  getSkillsDir(): string {
    return path.join(app.getPath('userData'), 'skills')
  }

  /**
   * 从 SKILL.md 中提取描述信息（取第一行非空非标题行，或第一个标题）
   */
  private extractDescriptionFromSkillMd(content: string): string {
    const lines = content.split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      // 如果是标题行，去掉 # 前缀作为描述
      if (trimmed.startsWith('#')) {
        return trimmed.replace(/^#+\s*/, '')
      }
      return trimmed
    }
    return ''
  }

  /**
   * 获取所有可用的 Skills（从 skills 目录获取）
   * 支持 skill.json 和 SKILL.md 两种格式
   */
  async getAvailableSkills(): Promise<{ name: string; description: string; version?: string }[]> {
    try {
      const skillsDir = this.getSkillsDir()
      if (!fs.existsSync(skillsDir)) {
        return []
      }

      const skills: { name: string; description: string; version?: string }[] = []
      const entries = fs.readdirSync(skillsDir, { withFileTypes: true })

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const skillJsonPath = path.join(skillsDir, entry.name, 'skill.json')
          const skillMdPath = path.join(skillsDir, entry.name, 'SKILL.md')

          if (fs.existsSync(skillJsonPath)) {
            try {
              const data = JSON.parse(fs.readFileSync(skillJsonPath, 'utf-8'))
              skills.push({
                name: entry.name,
                description: data.description || '',
                version: data.version || '1.0.0',
              })
            } catch {
              // 忽略解析失败的 skill
            }
          } else if (fs.existsSync(skillMdPath)) {
            try {
              const content = fs.readFileSync(skillMdPath, 'utf-8')
              skills.push({
                name: entry.name,
                description: this.extractDescriptionFromSkillMd(content),
              })
            } catch {
              // 忽略读取失败的 skill
            }
          }
        }
      }

      return skills
    } catch (error) {
      logger.error('Failed to get available skills:', String(error))
      return []
    }
  }

  /**
   * 获取已启用的 Skills 列表
   */
  getEnabledSkills(): string[] {
    return this.config.enabledSkills || []
  }

  /**
   * 更新启用的 Skills 列表
   */
  async updateEnabledSkills(skills: string[]): Promise<void> {
    await this.updateConfig({ enabledSkills: skills })
  }

  /**
   * 导入 Skill（从 zip 压缩包）
   * zip 内应包含一个文件夹，文件夹内有 SKILL.md 文件
   */
  async importSkill(zipPath: string): Promise<{ success: boolean; skillName?: string; error?: string }> {
    const AdmZip = require('adm-zip')
    const os = require('os')

    try {
      if (!fs.existsSync(zipPath)) {
        return { success: false, error: 'File not found' }
      }

      // 创建临时目录
      const tempDir = path.join(os.tmpdir(), `promptx-skill-import-${Date.now()}`)
      fs.mkdirSync(tempDir, { recursive: true })

      try {
        // 解压
        const zip = new AdmZip(zipPath)
        zip.extractAllTo(tempDir, true)

        // 查找包含 SKILL.md 的目录
        let skillDir: string | null = null
        let skillName: string | null = null

        const entries = fs.readdirSync(tempDir)

        // 情况1: 根目录直接有 SKILL.md
        if (entries.includes('SKILL.md')) {
          skillDir = tempDir
          // 用 zip 文件名作为 skill 名称
          skillName = path.basename(zipPath, '.zip')
        } else {
          // 情况2: 一级子目录中有 SKILL.md
          for (const entry of entries) {
            const subDir = path.join(tempDir, entry)
            if (fs.statSync(subDir).isDirectory()) {
              const subEntries = fs.readdirSync(subDir)
              if (subEntries.includes('SKILL.md')) {
                skillDir = subDir
                skillName = entry
                break
              }
            }
          }
        }

        if (!skillDir || !skillName) {
          return { success: false, error: 'Invalid skill structure: SKILL.md not found' }
        }

        // 确保 skills 目录存在
        const skillsDir = this.getSkillsDir()
        fs.mkdirSync(skillsDir, { recursive: true })

        // 目标目录
        const targetDir = path.join(skillsDir, skillName)

        // 如果已存在则覆盖
        if (fs.existsSync(targetDir)) {
          fs.rmSync(targetDir, { recursive: true, force: true })
        }

        // 复制文件
        this.copyDirSync(skillDir, targetDir)

        return { success: true, skillName }
      } finally {
        // 清理临时目录
        try {
          fs.rmSync(tempDir, { recursive: true, force: true })
        } catch {
          // ignore cleanup errors
        }
      }
    } catch (error) {
      logger.error('Failed to import skill:', String(error))
      return { success: false, error: String(error) }
    }
  }

  /**
   * 递归复制目录
   */
  private copyDirSync(src: string, dest: string): void {
    fs.mkdirSync(dest, { recursive: true })
    const entries = fs.readdirSync(src, { withFileTypes: true })
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name)
      const destPath = path.join(dest, entry.name)
      if (entry.isDirectory()) {
        this.copyDirSync(srcPath, destPath)
      } else {
        fs.copyFileSync(srcPath, destPath)
      }
    }
  }

  /**
   * 删除 Skill
   */
  async deleteSkill(skillName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const skillDir = path.join(this.getSkillsDir(), skillName)
      if (!fs.existsSync(skillDir)) {
        return { success: false, error: 'Skill not found' }
      }

      fs.rmSync(skillDir, { recursive: true, force: true })

      // 从已启用列表中移除
      const enabled = this.getEnabledSkills()
      if (enabled.includes(skillName)) {
        await this.updateEnabledSkills(enabled.filter(s => s !== skillName))
      }

      return { success: true }
    } catch (error) {
      logger.error('Failed to delete skill:', String(error))
      return { success: false, error: String(error) }
    }
  }

  /**
   * 更新用户配置的 MCP 服务器（不包括内置的）
   */
  async updateMcpServers(servers: MCPServerConfig[]): Promise<void> {
    // 过滤掉内置服务器，只保存用户配置的
    const userServers = servers.filter(s => !s.builtin)
    await this.updateConfig({ mcpServers: userServers })
  }
}

export const agentXService = new AgentXService()
