/**
 * MCP Capability Descriptors
 * Describes tools, resources, and prompts exposed by MCP servers
 */

/**
 * Base capability descriptor
 */
class CapabilityDescriptor {
  constructor(serverName, name, description) {
    this.serverName = serverName
    this.name = name
    this.description = description
  }

  /**
   * Get URI for this capability
   */
  getURI() {
    throw new Error('getURI must be implemented by subclass')
  }
}

/**
 * Tool descriptor
 */
class ToolDescriptor extends CapabilityDescriptor {
  constructor(serverName, tool) {
    super(serverName, tool.name, tool.description)
    this.inputSchema = tool.inputSchema
  }

  getURI() {
    return `mcp://${this.serverName}/tool/${this.name}`
  }

  toJSON() {
    return {
      serverName: this.serverName,
      name: this.name,
      description: this.description,
      inputSchema: this.inputSchema,
      uri: this.getURI()
    }
  }
}

/**
 * Resource descriptor
 */
class ResourceDescriptor extends CapabilityDescriptor {
  constructor(serverName, resource) {
    super(serverName, resource.name, resource.description)
    this.uri = resource.uri
    this.mimeType = resource.mimeType
  }

  getURI() {
    return `mcp://${this.serverName}/resource/${encodeURIComponent(this.uri)}`
  }

  toJSON() {
    return {
      serverName: this.serverName,
      uri: this.uri,
      name: this.name,
      description: this.description,
      mimeType: this.mimeType,
      promptxURI: this.getURI()
    }
  }
}

/**
 * Prompt descriptor
 */
class PromptDescriptor extends CapabilityDescriptor {
  constructor(serverName, prompt) {
    super(serverName, prompt.name, prompt.description)
    this.arguments = prompt.arguments || []
  }

  getURI() {
    return `mcp://${this.serverName}/prompt/${this.name}`
  }

  toJSON() {
    return {
      serverName: this.serverName,
      name: this.name,
      description: this.description,
      arguments: this.arguments,
      uri: this.getURI()
    }
  }
}

/**
 * Container for all capabilities from a server
 */
class MCPCapabilities {
  constructor() {
    this.tools = []
    this.resources = []
    this.prompts = []
  }

  /**
   * Create from raw MCP server responses
   */
  static from(serverName, rawCapabilities) {
    const capabilities = new MCPCapabilities()

    if (rawCapabilities.tools) {
      capabilities.tools = rawCapabilities.tools.map(
        tool => new ToolDescriptor(serverName, tool)
      )
    }

    if (rawCapabilities.resources) {
      capabilities.resources = rawCapabilities.resources.map(
        resource => new ResourceDescriptor(serverName, resource)
      )
    }

    if (rawCapabilities.prompts) {
      capabilities.prompts = rawCapabilities.prompts.map(
        prompt => new PromptDescriptor(serverName, prompt)
      )
    }

    return capabilities
  }

  /**
   * Get total count
   */
  getCount() {
    return {
      tools: this.tools.length,
      resources: this.resources.length,
      prompts: this.prompts.length,
      total: this.tools.length + this.resources.length + this.prompts.length
    }
  }

  /**
   * Get summary
   */
  getSummary() {
    return {
      count: this.getCount(),
      tools: this.tools.map(t => t.toJSON()),
      resources: this.resources.map(r => r.toJSON()),
      prompts: this.prompts.map(p => p.toJSON())
    }
  }
}

module.exports = {
  CapabilityDescriptor,
  ToolDescriptor,
  ResourceDescriptor,
  PromptDescriptor,
  MCPCapabilities
}
