/**
 * MCP Module Entry Point
 * PromptX MCP Client Integration
 */

const { MCPCommandHandler, MCPDiscoveryIntegration } = require('./api')
const { MCPConfigManager, MCPServerManager, MCPToolProxy } = require('./core')
const {
  MCPServerConfig,
  MCPConnectionState,
  ToolDescriptor,
  ResourceDescriptor,
  PromptDescriptor,
  MCPCapabilities
} = require('./types')

module.exports = {
  // API Layer (Primary interface)
  MCPCommandHandler,
  MCPDiscoveryIntegration,

  // Core components
  MCPConfigManager,
  MCPServerManager,
  MCPToolProxy,

  // Types
  MCPServerConfig,
  MCPConnectionState,
  ToolDescriptor,
  ResourceDescriptor,
  PromptDescriptor,
  MCPCapabilities
}
