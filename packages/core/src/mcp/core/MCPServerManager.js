/**
 * MCP Server Manager
 * Manages lifecycle of MCP server connections using official SDK
 */

const { Client } = require('@modelcontextprotocol/sdk/client/index.js')
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js')
const MCPConfigManager = require('./MCPConfigManager')
const { MCPConnectionState, MCPCapabilities } = require('../types')
const logger = require('@promptx/logger')

/**
 * Represents a running MCP server instance
 */
class MCPServerInstance {
  constructor(name, config) {
    this.name = name
    this.config = config
    this.client = null
    this.transport = null
    this.state = new MCPConnectionState()
    this.startTime = null
    this.capabilities = new MCPCapabilities()
  }
}

/**
 * MCP Server Manager
 */
class MCPServerManager {
  constructor(configManager = null) {
    this.configManager = configManager || new MCPConfigManager()
    this.servers = new Map()
    this.initialized = false
  }

  /**
   * Initialize manager and load configurations
   */
  async initialize() {
    if (this.initialized) {
      logger.warn('[MCPServerManager] Already initialized')
      return
    }

    try {
      await this.configManager.load()

      // Start all enabled servers
      const enabledConfigs = this.configManager.getEnabled()
      logger.info(`[MCPServerManager] Found ${enabledConfigs.length} enabled MCP servers`)

      for (const config of enabledConfigs) {
        try {
          await this.startServer(config.name)
        } catch (error) {
          logger.error(`[MCPServerManager] Failed to start server "${config.name}":`, error.message)
        }
      }

      this.initialized = true
      logger.info('[MCPServerManager] Initialization complete')
    } catch (error) {
      logger.error('[MCPServerManager] Initialization failed:', error)
      throw error
    }
  }

  /**
   * Start an MCP server
   */
  async startServer(serverName) {
    try {
      if (this.servers.has(serverName)) {
        logger.warn(`[MCPServerManager] Server "${serverName}" is already running`)
        return
      }

      const config = this.configManager.get(serverName)
      const instance = new MCPServerInstance(serverName, config)

      logger.info(`[MCPServerManager] Starting server "${serverName}"...`)
      instance.state.connecting()

      // Substitute environment variables
      const env = config.substituteEnvVars()

      // Create SDK transport
      const transport = new StdioClientTransport({
        command: config.command,
        args: config.args,
        env: {
          ...process.env,
          ...env
        }
      })

      // Create SDK client
      const client = new Client({
        name: `promptx-${serverName}`,
        version: '1.0.0'
      }, {
        capabilities: {}
      })

      // Connect with timeout
      const timeout = config.timeout || 30000
      await Promise.race([
        client.connect(transport),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout')), timeout)
        )
      ])

      instance.client = client
      instance.transport = transport
      instance.state.connected()
      instance.startTime = new Date()

      // Discover capabilities
      const capabilities = await this.discoverCapabilities(client, serverName)
      instance.capabilities = capabilities

      this.servers.set(serverName, instance)

      const count = capabilities.getCount()
      logger.info(
        `[MCPServerManager] Server "${serverName}" started successfully ` +
        `(${count.tools} tools, ${count.resources} resources, ${count.prompts} prompts)`
      )
    } catch (error) {
      logger.error(`[MCPServerManager] Failed to start server "${serverName}":`, error)

      if (this.servers.has(serverName)) {
        const instance = this.servers.get(serverName)
        instance.state.errored(error)
      }

      throw error
    }
  }

  /**
   * Stop an MCP server
   */
  async stopServer(serverName) {
    try {
      const instance = this.servers.get(serverName)
      if (!instance) {
        logger.warn(`[MCPServerManager] Server "${serverName}" is not running`)
        return
      }

      logger.info(`[MCPServerManager] Stopping server "${serverName}"...`)

      if (instance.client) {
        try {
          await instance.client.close()
        } catch (error) {
          logger.warn(`[MCPServerManager] Error closing client for "${serverName}":`, error.message)
        }
      }

      if (instance.transport) {
        try {
          await instance.transport.close()
        } catch (error) {
          logger.warn(`[MCPServerManager] Error closing transport for "${serverName}":`, error.message)
        }
      }

      instance.state.disconnected()
      this.servers.delete(serverName)

      logger.info(`[MCPServerManager] Server "${serverName}" stopped`)
    } catch (error) {
      logger.error(`[MCPServerManager] Failed to stop server "${serverName}":`, error)
      throw error
    }
  }

  /**
   * Restart an MCP server
   */
  async restartServer(serverName) {
    logger.info(`[MCPServerManager] Restarting server "${serverName}"...`)
    await this.stopServer(serverName)
    await this.startServer(serverName)
  }

  /**
   * Get server instance
   */
  getServer(serverName) {
    const instance = this.servers.get(serverName)
    if (!instance) {
      throw new Error(`MCP server "${serverName}" is not running`)
    }
    return instance
  }

  /**
   * Get SDK client for a server
   */
  getClient(serverName) {
    const instance = this.getServer(serverName)
    if (!instance.state.isConnected()) {
      throw new Error(`MCP server "${serverName}" is not connected (status: ${instance.state.status})`)
    }
    return instance.client
  }

  /**
   * List all servers
   */
  listServers() {
    const list = []

    for (const [name, instance] of this.servers.entries()) {
      list.push({
        name,
        config: {
          command: instance.config.command,
          enabled: instance.config.enabled,
          metadata: instance.config.metadata
        },
        state: instance.state.getSummary(),
        startTime: instance.startTime,
        capabilities: instance.capabilities.getCount()
      })
    }

    return list
  }

  /**
   * Get tools from a server
   */
  async getTools(serverName) {
    const instance = this.getServer(serverName)
    return instance.capabilities.tools
  }

  /**
   * Get resources from a server
   */
  async getResources(serverName) {
    const instance = this.getServer(serverName)
    return instance.capabilities.resources
  }

  /**
   * Get prompts from a server
   */
  async getPrompts(serverName) {
    const instance = this.getServer(serverName)
    return instance.capabilities.prompts
  }

  /**
   * Discover capabilities from MCP server
   */
  async discoverCapabilities(client, serverName) {
    try {
      logger.info(`[MCPServerManager] Discovering capabilities for "${serverName}"...`)

      const [tools, resources, prompts] = await Promise.all([
        client.listTools().catch(err => {
          logger.warn(`[MCPServerManager] Failed to list tools for "${serverName}":`, err.message)
          return { tools: [] }
        }),
        client.listResources().catch(err => {
          logger.warn(`[MCPServerManager] Failed to list resources for "${serverName}":`, err.message)
          return { resources: [] }
        }),
        client.listPrompts().catch(err => {
          logger.warn(`[MCPServerManager] Failed to list prompts for "${serverName}":`, err.message)
          return { prompts: [] }
        })
      ])

      const capabilities = MCPCapabilities.from(serverName, {
        tools: tools.tools || [],
        resources: resources.resources || [],
        prompts: prompts.prompts || []
      })

      return capabilities
    } catch (error) {
      logger.error(`[MCPServerManager] Failed to discover capabilities for "${serverName}":`, error)
      return new MCPCapabilities()
    }
  }

  /**
   * Check if server is running
   */
  isRunning(serverName) {
    return this.servers.has(serverName)
  }

  /**
   * Shutdown all servers
   */
  async shutdown() {
    logger.info('[MCPServerManager] Shutting down all MCP servers...')

    const serverNames = Array.from(this.servers.keys())
    await Promise.all(
      serverNames.map(name => this.stopServer(name).catch(err =>
        logger.error(`[MCPServerManager] Error stopping "${name}":`, err.message)
      ))
    )

    this.initialized = false
    logger.info('[MCPServerManager] Shutdown complete')
  }
}

module.exports = MCPServerManager
