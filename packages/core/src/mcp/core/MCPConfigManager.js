/**
 * MCP Configuration Manager
 * Manages MCP server configurations with persistence
 */

const fs = require('fs-extra')
const path = require('path')
const envPaths = require('env-paths')
const { MCPServerConfig } = require('../types')
const logger = require('@promptx/logger')

const PATHS = envPaths('promptx', { suffix: '' })

class MCPConfigManager {
  constructor(configPath = null) {
    this.configPath = configPath || path.join(PATHS.config, 'mcp-servers.json')
    this.configs = new Map()
    this.loaded = false
  }

  /**
   * Load configurations from disk
   */
  async load() {
    try {
      await fs.ensureDir(path.dirname(this.configPath))

      if (await fs.pathExists(this.configPath)) {
        const data = await fs.readJSON(this.configPath)

        for (const [name, configData] of Object.entries(data)) {
          const config = MCPServerConfig.from(configData)
          const validation = config.validate()

          if (!validation.valid) {
            logger.warn(`[MCPConfigManager] Invalid config for "${name}":`, validation.errors)
            continue
          }

          this.configs.set(name, config)
        }

        logger.info(`[MCPConfigManager] Loaded ${this.configs.size} MCP server configs`)
      } else {
        logger.info('[MCPConfigManager] No config file found, starting with empty config')
        await this.save()
      }

      this.loaded = true
    } catch (error) {
      logger.error('[MCPConfigManager] Failed to load config:', error)
      throw error
    }
  }

  /**
   * Save configurations to disk
   */
  async save() {
    try {
      const data = {}

      for (const [name, config] of this.configs.entries()) {
        data[name] = {
          name: config.name,
          command: config.command,
          args: config.args,
          env: config.env,
          enabled: config.enabled,
          timeout: config.timeout,
          metadata: config.metadata
        }
      }

      await fs.ensureDir(path.dirname(this.configPath))
      await fs.writeJSON(this.configPath, data, { spaces: 2 })

      logger.info(`[MCPConfigManager] Saved ${this.configs.size} MCP server configs`)
    } catch (error) {
      logger.error('[MCPConfigManager] Failed to save config:', error)
      throw error
    }
  }

  /**
   * Get a server configuration
   */
  get(serverName) {
    if (!this.loaded) {
      throw new Error('Configuration not loaded. Call load() first.')
    }

    const config = this.configs.get(serverName)
    if (!config) {
      throw new Error(`MCP server "${serverName}" not found`)
    }

    return config
  }

  /**
   * Set a server configuration
   */
  set(serverName, config) {
    if (!(config instanceof MCPServerConfig)) {
      config = MCPServerConfig.from(config)
    }

    const validation = config.validate()
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`)
    }

    this.configs.set(serverName, config)
  }

  /**
   * Delete a server configuration
   */
  delete(serverName) {
    return this.configs.delete(serverName)
  }

  /**
   * List all server configurations
   */
  list() {
    return Array.from(this.configs.values())
  }

  /**
   * Check if server exists
   */
  has(serverName) {
    return this.configs.has(serverName)
  }

  /**
   * Get enabled servers
   */
  getEnabled() {
    return this.list().filter(config => config.enabled)
  }

  /**
   * Validate configuration
   */
  validate(config) {
    if (!(config instanceof MCPServerConfig)) {
      config = MCPServerConfig.from(config)
    }

    return config.validate()
  }

  /**
   * Clear all configurations
   */
  clear() {
    this.configs.clear()
  }

  /**
   * Get config file path
   */
  getConfigPath() {
    return this.configPath
  }

  /**
   * Export configurations as plain object
   */
  export() {
    const data = {}
    for (const [name, config] of this.configs.entries()) {
      data[name] = {
        name: config.name,
        command: config.command,
        args: config.args,
        env: config.env,
        enabled: config.enabled,
        timeout: config.timeout,
        metadata: config.metadata
      }
    }
    return data
  }

  /**
   * Import configurations from plain object
   */
  async import(data) {
    this.clear()

    for (const [name, configData] of Object.entries(data)) {
      try {
        const config = MCPServerConfig.from(configData)
        const validation = config.validate()

        if (!validation.valid) {
          logger.warn(`[MCPConfigManager] Skipping invalid config "${name}":`, validation.errors)
          continue
        }

        this.configs.set(name, config)
      } catch (error) {
        logger.warn(`[MCPConfigManager] Failed to import config "${name}":`, error.message)
      }
    }

    await this.save()
  }
}

module.exports = MCPConfigManager
