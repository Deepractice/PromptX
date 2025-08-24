/**
 * FastMCP Server implementation for Desktop application
 * Direct implementation using FastMCP without relying on @promptx/cli
 */

import { FastMCP } from 'fastmcp'
import { z } from 'zod'
import { logger } from '../../shared/logger.js'

export interface FastMCPServerConfig {
  host: string
  port: number
  debug?: boolean
  stateless?: boolean
}

export class FastMCPServer {
  private server: FastMCP | null = null
  private config: FastMCPServerConfig
  private startTime: Date | null = null
  private requestCount: number = 0
  private isRunningFlag: boolean = false

  constructor(config: FastMCPServerConfig) {
    this.config = config
  }

  async start(): Promise<void> {
    try {
      if (this.isRunningFlag) {
        throw new Error('Server is already running')
      }

      logger.info(`Starting FastMCP Server on ${this.config.host}:${this.config.port}`)

      // Create FastMCP instance
      this.server = new FastMCP({
        name: 'promptx-desktop',
        version: '0.1.0', 
        instructions: 'PromptX Desktop MCP Server - Local AI prompt management',
      })

      // Register some basic tools for testing
      this.registerTestTools()

      // Start the HTTP server
      await this.server.start({
        transportType: 'httpStream',
        httpStream: {
          port: this.config.port,
          endpoint: '/mcp' as `/${string}`,
          stateless: this.config.stateless || false,
          enableJsonResponse: true
        }
      })
      
      this.isRunningFlag = true
      this.startTime = new Date()
      
      logger.success(`FastMCP Server started successfully at http://${this.config.host}:${this.config.port}`)
      logger.info(`MCP endpoint: http://${this.config.host}:${this.config.port}/mcp`)
    } catch (error) {
      logger.error('Failed to start FastMCP Server:', error)
      this.isRunningFlag = false
      throw error
    }
  }

  async stop(): Promise<void> {
    try {
      if (!this.isRunningFlag || !this.server) {
        throw new Error('Server is not running')
      }

      logger.info('Stopping FastMCP Server...')
      
      await this.server.stop()
      
      this.isRunningFlag = false
      this.server = null
      this.startTime = null
      
      logger.success('FastMCP Server stopped successfully')
    } catch (error) {
      logger.error('Failed to stop FastMCP Server:', error)
      throw error
    }
  }

  private registerTestTools(): void {
    if (!this.server) return

    // Register a test echo tool
    this.server.addTool({
      name: 'echo',
      description: 'Echo back the input message',
      parameters: z.object({
        message: z.string().describe('The message to echo')
      }),
      execute: async ({ message }: { message: string }) => {
        this.requestCount++
        return {
          content: [
            {
              type: 'text' as const,
              text: `Echo: ${message}`
            }
          ]
        }
      }
    })

    // Register a server status tool
    this.server.addTool({
      name: 'server_status',
      description: 'Get the current server status',
      parameters: z.object({}),
      execute: async () => {
        this.requestCount++
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                status: 'running',
                uptime: this.getUptime(),
                requestCount: this.requestCount,
                endpoint: `http://${this.config.host}:${this.config.port}/mcp`
              }, null, 2)
            }
          ]
        }
      }
    })

    logger.info('Registered test tools: echo, server_status')
  }

  isRunning(): boolean {
    return this.isRunningFlag
  }

  isStarting(): boolean {
    return false // Simple implementation
  }

  isStopping(): boolean {
    return false // Simple implementation
  }

  getUptime(): number {
    if (!this.startTime) return 0
    return Date.now() - this.startTime.getTime()
  }

  getRequestCount(): number {
    return this.requestCount
  }

  getActiveConnections(): number {
    // FastMCP doesn't expose connection count directly
    return this.isRunningFlag ? 1 : 0
  }

  async updateConfig(config: Partial<FastMCPServerConfig>): Promise<void> {
    // For now, config updates require restart
    Object.assign(this.config, config)
    
    if (this.isRunningFlag) {
      logger.info('Config updated, restart required to apply changes')
    }
  }

  getAddress(): string {
    return `http://${this.config.host}:${this.config.port}`
  }

  getMCPEndpoint(): string {
    return `http://${this.config.host}:${this.config.port}/mcp`
  }
}