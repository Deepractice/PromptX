/**
 * MCP Connection State
 * Tracks the state of a connection to an MCP server
 */

class MCPConnectionState {
  constructor() {
    this.status = 'disconnected' // disconnected | connecting | connected | error
    this.connectedAt = null
    this.lastActivity = null
    this.requestCount = 0
    this.error = null
  }

  /**
   * Update to connecting state
   */
  connecting() {
    this.status = 'connecting'
    this.error = null
  }

  /**
   * Update to connected state
   */
  connected() {
    this.status = 'connected'
    this.connectedAt = new Date()
    this.lastActivity = new Date()
    this.error = null
  }

  /**
   * Update to disconnected state
   */
  disconnected() {
    this.status = 'disconnected'
    this.connectedAt = null
    this.lastActivity = null
    this.error = null
  }

  /**
   * Update to error state
   */
  errored(error) {
    this.status = 'error'
    this.error = {
      message: error.message,
      code: error.code,
      timestamp: new Date()
    }
  }

  /**
   * Record activity
   */
  recordActivity() {
    this.lastActivity = new Date()
    this.requestCount++
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.status === 'connected'
  }

  /**
   * Check if healthy
   */
  isHealthy() {
    return this.status === 'connected' && !this.error
  }

  /**
   * Get state summary
   */
  getSummary() {
    return {
      status: this.status,
      connectedAt: this.connectedAt,
      lastActivity: this.lastActivity,
      requestCount: this.requestCount,
      error: this.error
    }
  }
}

module.exports = MCPConnectionState
