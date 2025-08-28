// MCP 模块导出
module.exports = {
  MCPProtocol: require('./MCPProtocol'),
  MCPOutputAdapter: require('./MCPOutputAdapter'),
  ...require('./definitions'),
  ...require('./server')
};