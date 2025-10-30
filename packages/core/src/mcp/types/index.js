/**
 * MCP Types Module
 * Type definitions for MCP integration
 */

const MCPServerConfig = require('./MCPServerConfig')
const MCPConnectionState = require('./MCPConnectionState')
const {
  CapabilityDescriptor,
  ToolDescriptor,
  ResourceDescriptor,
  PromptDescriptor,
  MCPCapabilities
} = require('./MCPCapabilityDescriptor')

module.exports = {
  MCPServerConfig,
  MCPConnectionState,
  CapabilityDescriptor,
  ToolDescriptor,
  ResourceDescriptor,
  PromptDescriptor,
  MCPCapabilities
}
