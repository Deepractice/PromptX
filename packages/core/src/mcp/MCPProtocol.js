/**
 * MCP 协议输出工具
 * 专门处理 MCP 协议消息的 stdout 输出
 * 
 * 设计原则：
 * - 协议消息必须输出到 stdout，不能有任何污染
 * - 所有其他日志使用标准 logger（输出到 stderr）
 * - 保持简单，只处理协议特殊需求
 */

class MCPProtocol {
  /**
   * 输出 MCP 协议消息到 stdout
   * 仅用于 JSON-RPC 协议通信
   * @param {Object|string} message - 协议消息
   */
  static send(message) {
    if (typeof message === 'object') {
      process.stdout.write(JSON.stringify(message) + '\n')
    } else {
      process.stdout.write(message + '\n')
    }
  }
}

module.exports = MCPProtocol