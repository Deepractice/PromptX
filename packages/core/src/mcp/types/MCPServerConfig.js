/**
 * MCP Server Configuration
 * Configuration for an external MCP server connection
 */

class MCPServerConfig {
  constructor() {
    this.name = ''
    this.command = ''
    this.args = []
    this.env = {}
    this.enabled = true
    this.timeout = 30000
    this.metadata = {
      description: '',
      version: '1.0.0'
    }
  }

  /**
   * Create from plain object
   */
  static from(obj) {
    const config = new MCPServerConfig()
    Object.assign(config, obj)
    return config
  }

  /**
   * Validate configuration
   */
  validate() {
    const errors = []

    if (!this.name || typeof this.name !== 'string') {
      errors.push('name is required and must be a string')
    }

    if (!this.command || typeof this.command !== 'string') {
      errors.push('command is required and must be a string')
    }

    if (!Array.isArray(this.args)) {
      errors.push('args must be an array')
    }

    if (typeof this.env !== 'object' || this.env === null) {
      errors.push('env must be an object')
    }

    if (typeof this.enabled !== 'boolean') {
      errors.push('enabled must be a boolean')
    }

    if (typeof this.timeout !== 'number' || this.timeout <= 0) {
      errors.push('timeout must be a positive number')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Substitute environment variables in config
   */
  substituteEnvVars() {
    const substituted = { ...this.env }

    for (const [key, value] of Object.entries(substituted)) {
      if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
        const varName = value.slice(2, -1)
        const envValue = process.env[varName]

        if (envValue === undefined) {
          throw new Error(`Environment variable ${varName} is not defined`)
        }

        substituted[key] = envValue
      }
    }

    return substituted
  }

  /**
   * Clone configuration
   */
  clone() {
    return MCPServerConfig.from(JSON.parse(JSON.stringify(this)))
  }
}

module.exports = MCPServerConfig
