/**
 * MCP Tool Definitions Index
 * Exports all PromptX MCP tool definitions
 */

module.exports = {
  promptx_action: require('./promptx_action'),
  promptx_init: require('./promptx_init'),
  promptx_learn: require('./promptx_learn'),
  promptx_recall: require('./promptx_recall'),
  promptx_remember: require('./promptx_remember'),
  // promptx_think: require('./promptx_think'), // Temporarily disabled
  promptx_toolx: require('./promptx_toolx'),
  promptx_welcome: require('./promptx_welcome'),
}

// Also export as an array for easy iteration
module.exports.tools = Object.values(module.exports).filter(item => typeof item === 'object' && item.name)