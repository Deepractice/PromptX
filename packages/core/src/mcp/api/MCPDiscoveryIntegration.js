/**
 * MCP Discovery Integration
 * Integrates MCP servers and capabilities with PromptX discover system
 */

const logger = require('@promptx/logger')

class MCPDiscoveryIntegration {
  constructor(serverManager) {
    this.serverManager = serverManager
  }

  /**
   * Get all MCP resources for discovery
   * Returns formatted data for discover command
   */
  async getDiscoveryResources() {
    try {
      const servers = this.serverManager.listServers()
      const resources = []

      for (const serverInfo of servers) {
        const serverResource = await this.formatServerForDiscovery(serverInfo)
        if (serverResource) {
          resources.push(serverResource)
        }
      }

      return {
        success: true,
        category: 'MCP Servers',
        emoji: '🔧',
        resources,
        summary: {
          total: resources.length,
          active: resources.filter(r => r.status === 'connected').length
        }
      }
    } catch (error) {
      logger.error('[MCPDiscoveryIntegration] Failed to get discovery resources:', error)
      return {
        success: false,
        error: {
          message: error.message
        }
      }
    }
  }

  /**
   * Format a single server for discovery display
   */
  async formatServerForDiscovery(serverInfo) {
    try {
      const instance = this.serverManager.getServer(serverInfo.name)

      const formatted = {
        id: `mcp-server-${serverInfo.name}`,
        type: 'mcp-server',
        name: serverInfo.name,
        description: serverInfo.config.metadata.description || 'MCP Server',
        status: serverInfo.state.status,
        enabled: serverInfo.config.enabled,
        capabilities: {
          tools: this.formatTools(instance.capabilities.tools),
          resources: this.formatResources(instance.capabilities.resources),
          prompts: this.formatPrompts(instance.capabilities.prompts)
        },
        counts: instance.capabilities.getCount(),
        metadata: {
          command: serverInfo.config.command,
          startTime: serverInfo.startTime,
          requestCount: serverInfo.state.requestCount
        }
      }

      return formatted
    } catch (error) {
      logger.warn(`[MCPDiscoveryIntegration] Failed to format server "${serverInfo.name}":`, error.message)
      return null
    }
  }

  /**
   * Format tools for discovery
   */
  formatTools(tools) {
    return tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      uri: tool.getURI(),
      inputSchema: tool.inputSchema
    }))
  }

  /**
   * Format resources for discovery
   */
  formatResources(resources) {
    return resources.map(resource => ({
      name: resource.name,
      description: resource.description,
      uri: resource.uri,
      promptxURI: resource.getURI(),
      mimeType: resource.mimeType
    }))
  }

  /**
   * Format prompts for discovery
   */
  formatPrompts(prompts) {
    return prompts.map(prompt => ({
      name: prompt.name,
      description: prompt.description,
      uri: prompt.getURI(),
      arguments: prompt.arguments
    }))
  }

  /**
   * Generate markdown output for discover
   */
  async generateDiscoverMarkdown() {
    const discovery = await this.getDiscoveryResources()

    if (!discovery.success) {
      return '## MCP Servers\n\nFailed to load MCP servers.\n'
    }

    let markdown = `## ${discovery.emoji} ${discovery.category} (${discovery.summary.active} active)\n\n`

    for (const server of discovery.resources) {
      const statusEmoji = server.status === 'connected' ? '✅' : '❌'
      const enabledText = server.enabled ? 'enabled' : 'disabled'

      markdown += `### ${statusEmoji} ${server.name} (${enabledText})\n\n`

      // Description
      if (server.description) {
        markdown += `${server.description}\n\n`
      }

      // Tools
      if (server.counts.tools > 0) {
        markdown += `**🛠️  Tools (${server.counts.tools})**\n\n`
        for (const tool of server.capabilities.tools) {
          markdown += `- **${tool.name}**: ${tool.description}\n`
          markdown += `  \`${tool.uri}\`\n`
        }
        markdown += '\n'
      }

      // Resources
      if (server.counts.resources > 0) {
        markdown += `**📄 Resources (${server.counts.resources})**\n\n`
        for (const resource of server.capabilities.resources) {
          markdown += `- **${resource.name}**: ${resource.description}\n`
          markdown += `  \`${resource.promptxURI}\`\n`
        }
        markdown += '\n'
      }

      // Prompts
      if (server.counts.prompts > 0) {
        markdown += `**💬 Prompts (${server.counts.prompts})**\n\n`
        for (const prompt of server.capabilities.prompts) {
          markdown += `- **${prompt.name}**: ${prompt.description}\n`
          markdown += `  \`${prompt.uri}\`\n`
        }
        markdown += '\n'
      }

      // Metadata
      markdown += `**ℹ️ Server Info**\n\n`
      markdown += `- Command: \`${server.metadata.command}\`\n`
      markdown += `- Requests: ${server.metadata.requestCount}\n`
      if (server.metadata.startTime) {
        markdown += `- Started: ${new Date(server.metadata.startTime).toLocaleString()}\n`
      }
      markdown += '\n'
    }

    return markdown
  }

  /**
   * Search capabilities across all servers
   */
  async searchCapabilities(query) {
    const servers = this.serverManager.listServers()
    const results = {
      tools: [],
      resources: [],
      prompts: []
    }

    const lowerQuery = query.toLowerCase()

    for (const serverInfo of servers) {
      try {
        const instance = this.serverManager.getServer(serverInfo.name)

        // Search tools
        for (const tool of instance.capabilities.tools) {
          if (
            tool.name.toLowerCase().includes(lowerQuery) ||
            tool.description.toLowerCase().includes(lowerQuery)
          ) {
            results.tools.push({
              serverName: serverInfo.name,
              ...tool.toJSON()
            })
          }
        }

        // Search resources
        for (const resource of instance.capabilities.resources) {
          if (
            resource.name.toLowerCase().includes(lowerQuery) ||
            resource.description.toLowerCase().includes(lowerQuery)
          ) {
            results.resources.push({
              serverName: serverInfo.name,
              ...resource.toJSON()
            })
          }
        }

        // Search prompts
        for (const prompt of instance.capabilities.prompts) {
          if (
            prompt.name.toLowerCase().includes(lowerQuery) ||
            prompt.description.toLowerCase().includes(lowerQuery)
          ) {
            results.prompts.push({
              serverName: serverInfo.name,
              ...prompt.toJSON()
            })
          }
        }
      } catch (error) {
        logger.warn(`[MCPDiscoveryIntegration] Failed to search server "${serverInfo.name}":`, error.message)
      }
    }

    return {
      success: true,
      query,
      results,
      total: results.tools.length + results.resources.length + results.prompts.length
    }
  }
}

module.exports = MCPDiscoveryIntegration
