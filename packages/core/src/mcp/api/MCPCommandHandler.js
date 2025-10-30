/**
 * MCP Command Handler
 * Main API for MCP command operations
 */

const { MCPServerManager, MCPConfigManager, MCPToolProxy } = require('../core')
const { MCPServerConfig } = require('../types')
const logger = require('@promptx/logger')

class MCPCommandHandler {
  constructor() {
    this.configManager = new MCPConfigManager()
    this.serverManager = new MCPServerManager(this.configManager)
    this.toolProxy = new MCPToolProxy(this.serverManager)
    this.initialized = false
  }

  /**
   * Initialize the MCP system
   */
  async initialize() {
    if (this.initialized) {
      return { success: true, message: 'Already initialized' }
    }

    try {
      await this.serverManager.initialize()
      this.initialized = true

      return {
        success: true,
        message: 'MCP system initialized successfully',
        servers: this.serverManager.listServers()
      }
    } catch (error) {
      logger.error('[MCPCommandHandler] Initialization failed:', error)
      return {
        success: false,
        error: {
          message: error.message,
          code: 'INIT_ERROR'
        }
      }
    }
  }

  /**
   * Handle MCP command
   */
  async handleCommand(action, params = {}) {
    try {
      switch (action) {
        case 'install':
          return await this.install(params.serverName, params.config)

        case 'list':
          return await this.list()

        case 'enable':
          return await this.enable(params.serverName)

        case 'disable':
          return await this.disable(params.serverName)

        case 'remove':
          return await this.remove(params.serverName)

        case 'info':
          return await this.info(params.serverName)

        case 'start':
          return await this.start(params.serverName)

        case 'stop':
          return await this.stop(params.serverName)

        case 'restart':
          return await this.restart(params.serverName)

        case 'capabilities':
          return await this.getCapabilities(params.serverName)

        default:
          return {
            success: false,
            error: {
              message: `Unknown action: ${action}`,
              code: 'UNKNOWN_ACTION'
            }
          }
      }
    } catch (error) {
      logger.error(`[MCPCommandHandler] Command "${action}" failed:`, error)
      return {
        success: false,
        error: {
          message: error.message,
          code: error.code || 'COMMAND_ERROR'
        }
      }
    }
  }

  /**
   * Install a new MCP server
   */
  async install(serverName, configData) {
    try {
      if (!serverName) {
        throw new Error('serverName is required')
      }

      if (!configData) {
        throw new Error('config is required')
      }

      // Create config
      const config = MCPServerConfig.from({
        name: serverName,
        ...configData
      })

      // Validate
      const validation = config.validate()
      if (!validation.valid) {
        throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`)
      }

      // Check if already exists
      if (this.configManager.has(serverName)) {
        throw new Error(`Server "${serverName}" already exists`)
      }

      // Add to config
      this.configManager.set(serverName, config)
      await this.configManager.save()

      // Start if enabled
      if (config.enabled) {
        await this.serverManager.startServer(serverName)
      }

      logger.info(`[MCPCommandHandler] Installed server "${serverName}"`)

      return {
        success: true,
        message: `Server "${serverName}" installed successfully`,
        config: config
      }
    } catch (error) {
      logger.error(`[MCPCommandHandler] Failed to install "${serverName}":`, error)
      throw error
    }
  }

  /**
   * List all MCP servers
   */
  async list() {
    try {
      const allConfigs = this.configManager.list()
      const runningServers = this.serverManager.listServers()

      const servers = allConfigs.map(config => {
        const running = runningServers.find(s => s.name === config.name)

        return {
          name: config.name,
          enabled: config.enabled,
          command: config.command,
          metadata: config.metadata,
          status: running ? running.state.status : 'stopped',
          capabilities: running ? running.capabilities : null
        }
      })

      return {
        success: true,
        servers,
        summary: {
          total: servers.length,
          enabled: servers.filter(s => s.enabled).length,
          running: servers.filter(s => s.status === 'connected').length
        }
      }
    } catch (error) {
      logger.error('[MCPCommandHandler] Failed to list servers:', error)
      throw error
    }
  }

  /**
   * Enable a server
   */
  async enable(serverName) {
    try {
      const config = this.configManager.get(serverName)
      config.enabled = true
      await this.configManager.save()

      // Start the server
      if (!this.serverManager.isRunning(serverName)) {
        await this.serverManager.startServer(serverName)
      }

      logger.info(`[MCPCommandHandler] Enabled server "${serverName}"`)

      return {
        success: true,
        message: `Server "${serverName}" enabled and started`
      }
    } catch (error) {
      logger.error(`[MCPCommandHandler] Failed to enable "${serverName}":`, error)
      throw error
    }
  }

  /**
   * Disable a server
   */
  async disable(serverName) {
    try {
      const config = this.configManager.get(serverName)
      config.enabled = false
      await this.configManager.save()

      // Stop the server if running
      if (this.serverManager.isRunning(serverName)) {
        await this.serverManager.stopServer(serverName)
      }

      logger.info(`[MCPCommandHandler] Disabled server "${serverName}"`)

      return {
        success: true,
        message: `Server "${serverName}" disabled and stopped`
      }
    } catch (error) {
      logger.error(`[MCPCommandHandler] Failed to disable "${serverName}":`, error)
      throw error
    }
  }

  /**
   * Remove a server
   */
  async remove(serverName) {
    try {
      // Stop if running
      if (this.serverManager.isRunning(serverName)) {
        await this.serverManager.stopServer(serverName)
      }

      // Remove from config
      this.configManager.delete(serverName)
      await this.configManager.save()

      logger.info(`[MCPCommandHandler] Removed server "${serverName}"`)

      return {
        success: true,
        message: `Server "${serverName}" removed`
      }
    } catch (error) {
      logger.error(`[MCPCommandHandler] Failed to remove "${serverName}":`, error)
      throw error
    }
  }

  /**
   * Get server info
   */
  async info(serverName) {
    try {
      const config = this.configManager.get(serverName)
      const running = this.serverManager.isRunning(serverName)

      let serverInfo = {
        name: config.name,
        command: config.command,
        args: config.args,
        enabled: config.enabled,
        timeout: config.timeout,
        metadata: config.metadata,
        status: running ? 'running' : 'stopped'
      }

      if (running) {
        const instance = this.serverManager.getServer(serverName)
        serverInfo = {
          ...serverInfo,
          state: instance.state.getSummary(),
          startTime: instance.startTime,
          capabilities: instance.capabilities.getSummary()
        }
      }

      return {
        success: true,
        server: serverInfo
      }
    } catch (error) {
      logger.error(`[MCPCommandHandler] Failed to get info for "${serverName}":`, error)
      throw error
    }
  }

  /**
   * Start a server
   */
  async start(serverName) {
    try {
      await this.serverManager.startServer(serverName)

      return {
        success: true,
        message: `Server "${serverName}" started`
      }
    } catch (error) {
      logger.error(`[MCPCommandHandler] Failed to start "${serverName}":`, error)
      throw error
    }
  }

  /**
   * Stop a server
   */
  async stop(serverName) {
    try {
      await this.serverManager.stopServer(serverName)

      return {
        success: true,
        message: `Server "${serverName}" stopped`
      }
    } catch (error) {
      logger.error(`[MCPCommandHandler] Failed to stop "${serverName}":`, error)
      throw error
    }
  }

  /**
   * Restart a server
   */
  async restart(serverName) {
    try {
      await this.serverManager.restartServer(serverName)

      return {
        success: true,
        message: `Server "${serverName}" restarted`
      }
    } catch (error) {
      logger.error(`[MCPCommandHandler] Failed to restart "${serverName}":`, error)
      throw error
    }
  }

  /**
   * Get server capabilities
   */
  async getCapabilities(serverName) {
    try {
      return await this.toolProxy.getAllCapabilities(serverName)
    } catch (error) {
      logger.error(`[MCPCommandHandler] Failed to get capabilities for "${serverName}":`, error)
      throw error
    }
  }

  /**
   * Shutdown MCP system
   */
  async shutdown() {
    try {
      await this.serverManager.shutdown()
      this.initialized = false

      return {
        success: true,
        message: 'MCP system shut down successfully'
      }
    } catch (error) {
      logger.error('[MCPCommandHandler] Shutdown failed:', error)
      return {
        success: false,
        error: {
          message: error.message,
          code: 'SHUTDOWN_ERROR'
        }
      }
    }
  }

  /**
   * Get tool proxy for direct capability access
   */
  getToolProxy() {
    return this.toolProxy
  }
}

module.exports = MCPCommandHandler
