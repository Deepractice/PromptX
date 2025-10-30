/**
 * MCP Tool Proxy
 * Proxies calls to MCP server capabilities (tools, resources, prompts)
 */

const logger = require('@promptx/logger')

class MCPToolProxy {
  constructor(serverManager) {
    this.serverManager = serverManager
  }

  /**
   * Call a tool on an MCP server
   */
  async callTool(serverName, toolName, args = {}) {
    try {
      logger.info(`[MCPToolProxy] Calling tool "${toolName}" on server "${serverName}"`)

      const client = this.serverManager.getClient(serverName)
      const instance = this.serverManager.getServer(serverName)

      // Record activity
      instance.state.recordActivity()

      // Call tool via SDK client
      const result = await client.callTool({
        name: toolName,
        arguments: args
      })

      logger.info(`[MCPToolProxy] Tool "${toolName}" completed successfully`)

      return {
        success: true,
        result: result.content || result,
        metadata: {
          serverName,
          toolName,
          timestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      logger.error(`[MCPToolProxy] Tool "${toolName}" failed:`, error.message)

      return {
        success: false,
        error: {
          message: error.message,
          code: error.code || 'TOOL_ERROR',
          serverName,
          toolName
        }
      }
    }
  }

  /**
   * List all tools from a server
   */
  async listTools(serverName) {
    try {
      const tools = await this.serverManager.getTools(serverName)
      return {
        success: true,
        tools: tools.map(t => t.toJSON())
      }
    } catch (error) {
      logger.error(`[MCPToolProxy] Failed to list tools from "${serverName}":`, error.message)
      return {
        success: false,
        error: {
          message: error.message,
          serverName
        }
      }
    }
  }

  /**
   * Read a resource from an MCP server
   */
  async readResource(serverName, uri) {
    try {
      logger.info(`[MCPToolProxy] Reading resource "${uri}" from server "${serverName}"`)

      const client = this.serverManager.getClient(serverName)
      const instance = this.serverManager.getServer(serverName)

      // Record activity
      instance.state.recordActivity()

      // Read resource via SDK client
      const result = await client.readResource({ uri })

      logger.info(`[MCPToolProxy] Resource "${uri}" read successfully`)

      return {
        success: true,
        contents: result.contents || [],
        metadata: {
          serverName,
          uri,
          timestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      logger.error(`[MCPToolProxy] Failed to read resource "${uri}":`, error.message)

      return {
        success: false,
        error: {
          message: error.message,
          code: error.code || 'RESOURCE_ERROR',
          serverName,
          uri
        }
      }
    }
  }

  /**
   * List all resources from a server
   */
  async listResources(serverName) {
    try {
      const resources = await this.serverManager.getResources(serverName)
      return {
        success: true,
        resources: resources.map(r => r.toJSON())
      }
    } catch (error) {
      logger.error(`[MCPToolProxy] Failed to list resources from "${serverName}":`, error.message)
      return {
        success: false,
        error: {
          message: error.message,
          serverName
        }
      }
    }
  }

  /**
   * Get a prompt from an MCP server
   */
  async getPrompt(serverName, name, args = {}) {
    try {
      logger.info(`[MCPToolProxy] Getting prompt "${name}" from server "${serverName}"`)

      const client = this.serverManager.getClient(serverName)
      const instance = this.serverManager.getServer(serverName)

      // Record activity
      instance.state.recordActivity()

      // Get prompt via SDK client
      const result = await client.getPrompt({
        name,
        arguments: args
      })

      logger.info(`[MCPToolProxy] Prompt "${name}" retrieved successfully`)

      return {
        success: true,
        description: result.description,
        messages: result.messages || [],
        metadata: {
          serverName,
          name,
          timestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      logger.error(`[MCPToolProxy] Failed to get prompt "${name}":`, error.message)

      return {
        success: false,
        error: {
          message: error.message,
          code: error.code || 'PROMPT_ERROR',
          serverName,
          name
        }
      }
    }
  }

  /**
   * List all prompts from a server
   */
  async listPrompts(serverName) {
    try {
      const prompts = await this.serverManager.getPrompts(serverName)
      return {
        success: true,
        prompts: prompts.map(p => p.toJSON())
      }
    } catch (error) {
      logger.error(`[MCPToolProxy] Failed to list prompts from "${serverName}":`, error.message)
      return {
        success: false,
        error: {
          message: error.message,
          serverName
        }
      }
    }
  }

  /**
   * Get all capabilities from a server
   */
  async getAllCapabilities(serverName) {
    try {
      const instance = this.serverManager.getServer(serverName)
      return {
        success: true,
        capabilities: instance.capabilities.getSummary()
      }
    } catch (error) {
      logger.error(`[MCPToolProxy] Failed to get capabilities from "${serverName}":`, error.message)
      return {
        success: false,
        error: {
          message: error.message,
          serverName
        }
      }
    }
  }

  /**
   * Parse MCP URI and extract components
   * Format: mcp://server-name/type/identifier
   */
  static parseURI(uri) {
    const mcpURIPattern = /^mcp:\/\/([^\/]+)\/(tool|resource|prompt)\/(.+)$/

    const match = uri.match(mcpURIPattern)
    if (!match) {
      throw new Error(`Invalid MCP URI format: ${uri}`)
    }

    return {
      serverName: match[1],
      type: match[2],
      identifier: decodeURIComponent(match[3])
    }
  }

  /**
   * Execute capability by URI
   * Universal method that routes to appropriate handler based on URI
   */
  async executeByURI(uri, params = {}) {
    try {
      const parsed = MCPToolProxy.parseURI(uri)

      switch (parsed.type) {
        case 'tool':
          return await this.callTool(parsed.serverName, parsed.identifier, params)

        case 'resource':
          return await this.readResource(parsed.serverName, parsed.identifier)

        case 'prompt':
          return await this.getPrompt(parsed.serverName, parsed.identifier, params)

        default:
          throw new Error(`Unknown capability type: ${parsed.type}`)
      }
    } catch (error) {
      logger.error(`[MCPToolProxy] Failed to execute URI "${uri}":`, error.message)
      return {
        success: false,
        error: {
          message: error.message,
          uri
        }
      }
    }
  }
}

module.exports = MCPToolProxy
