# PromptX MCP Integration

MCP (Model Context Protocol) client integration for PromptX, enabling connection to external MCP servers and exposing their capabilities (tools, resources, prompts) through the PromptX ecosystem.

## Architecture

```
API Layer
  ├── MCPCommandHandler      # Main command interface
  └── MCPDiscoveryIntegration # Discover system integration

Core Layer
  ├── MCPServerManager        # Server lifecycle management
  ├── MCPToolProxy            # Capability proxy
  └── MCPConfigManager        # Configuration management

Types Layer
  ├── MCPServerConfig         # Server configuration
  ├── MCPConnectionState      # Connection state
  └── MCPCapabilityDescriptor # Capability descriptors
```

## Usage

### Initialize MCP System

```javascript
const { MCPCommandHandler } = require('@promptx/core/mcp')

const handler = new MCPCommandHandler()
await handler.initialize()
```

### Install an MCP Server

```javascript
await handler.handleCommand('install', {
  serverName: 'filesystem',
  config: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '/Users/sean'],
    enabled: true
  }
})
```

### List Servers

```javascript
const result = await handler.handleCommand('list')
console.log(result.servers)
```

### Call a Tool

```javascript
const toolProxy = handler.getToolProxy()

const result = await toolProxy.callTool('filesystem', 'read_file', {
  path: '/path/to/file.txt'
})
```

### Execute by URI

```javascript
const result = await toolProxy.executeByURI(
  'mcp://filesystem/tool/read_file',
  { path: '/path/to/file.txt' }
)
```

## Configuration

Configuration is stored in `~/.promptx/config/mcp-servers.json`:

```json
{
  "filesystem": {
    "name": "filesystem",
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/sean"],
    "env": {},
    "enabled": true,
    "timeout": 30000,
    "metadata": {
      "description": "File system operations",
      "version": "1.0.0"
    }
  }
}
```

## URI Scheme

MCP capabilities use the following URI format:

- Tools: `mcp://server-name/tool/tool-name`
- Resources: `mcp://server-name/resource/resource-uri`
- Prompts: `mcp://server-name/prompt/prompt-name`

## Commands

### install
Install a new MCP server configuration.

### list
List all configured MCP servers with their status.

### enable/disable
Enable or disable a server.

### remove
Remove a server configuration.

### info
Get detailed information about a server.

### start/stop/restart
Control server lifecycle.

### capabilities
Get all capabilities from a server.

## Discovery Integration

The MCP module integrates with PromptX's discover system:

```javascript
const { MCPDiscoveryIntegration } = require('@promptx/core/mcp')

const integration = new MCPDiscoveryIntegration(serverManager)
const markdown = await integration.generateDiscoverMarkdown()
```

## Dependencies

- `@modelcontextprotocol/sdk`: Official MCP TypeScript SDK
- `@promptx/logger`: PromptX logging system
- `fs-extra`: File system operations
- `env-paths`: Cross-platform config paths

## Implementation Status

- ✅ Phase 1: Core Infrastructure
- ✅ Phase 2: Capability Support
- ✅ Phase 3: API Integration
- ⏳ Phase 4: ToolX Protocol Handler
- ⏳ Phase 5: Production Features

## References

- [MCP Specification](https://modelcontextprotocol.io/specification/2025-06-18)
- [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Architecture Design](/Users/sean/Deepractice/workspaces/mcp-module-design.md)
