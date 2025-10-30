/**
 * MCP Core Module
 * Core components for MCP integration
 */

const MCPConfigManager = require('./MCPConfigManager')
const MCPServerManager = require('./MCPServerManager')
const MCPToolProxy = require('./MCPToolProxy')

module.exports = {
  MCPConfigManager,
  MCPServerManager,
  MCPToolProxy
}
