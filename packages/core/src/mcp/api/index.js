/**
 * MCP API Module
 * Public API for MCP integration
 */

const MCPCommandHandler = require('./MCPCommandHandler')
const MCPDiscoveryIntegration = require('./MCPDiscoveryIntegration')

module.exports = {
  MCPCommandHandler,
  MCPDiscoveryIntegration
}
