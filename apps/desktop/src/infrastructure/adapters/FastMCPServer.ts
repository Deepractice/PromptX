/**
 * FastMCP Server implementation for Desktop application
 * Direct implementation using FastMCP without relying on @promptx/cli
 */

import { FastMCP } from 'fastmcp'
import { z } from 'zod'
import { logger } from '../../shared/logger.js'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
// Import PromptX CLI for executing tools
const { cli } = require('@promptx/cli/src/lib/core/pouch')
// Import ServerEnvironment for initialization
const { getGlobalServerEnvironment } = require('@promptx/cli/src/lib/utils/ServerEnvironment')
// Import MCPOutputAdapter for output formatting
const { MCPOutputAdapter } = require('@promptx/cli/src/lib/mcp/MCPOutputAdapter')

export interface FastMCPServerConfig {
  host: string
  port: number
  debug?: boolean
  stateless?: boolean
  enableMetrics?: boolean
}

export class FastMCPServer {
  private server: FastMCP | null = null
  private config: FastMCPServerConfig
  private startTime: Date | null = null
  private requestCount: number = 0
  private isRunningFlag: boolean = false
  private sessions: Map<string, any> = new Map()
  private connections: number = 0
  private lastError: Error | null = null
  private outputAdapter: any // MCPOutputAdapter instance
  private metrics = {
    enabled: false,
    requestsTotal: 0,
    responseTimeSum: 0,
    responseTimeCount: 0,
    errors: 0,
    toolExecutions: {} as Record<string, number>
  }

  constructor(config: FastMCPServerConfig) {
    this.config = config
    this.metrics.enabled = config.enableMetrics || false
    this.outputAdapter = new MCPOutputAdapter()
    logger.debug(`FastMCPServer initialized with config:`, config)
  }

  async start(): Promise<void> {
    try {
      if (this.isRunningFlag) {
        throw new Error('Server is already running')
      }

      logger.info(`Starting FastMCP Server on ${this.config.host}:${this.config.port}`)

      // Initialize ServerEnvironment
      const serverEnv = getGlobalServerEnvironment()
      if (!serverEnv.isInitialized()) {
        serverEnv.initialize({ 
          transport: 'http', 
          host: this.config.host, 
          port: this.config.port 
        })
      }

      // Create FastMCP instance
      this.server = new FastMCP({
        name: 'promptx-desktop',
        version: '0.1.0', 
        instructions: 'PromptX Desktop MCP Server - Local AI prompt management',
        logger: this.config.debug ? this.createLogger() : undefined
      })

      // Register PromptX tools
      await this.registerPromptXTools()

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
      logger.info(`Mode: ${this.config.stateless ? 'Stateless' : 'Stateful'}`)
      
      if (this.config.debug) {
        logger.debug('Debug mode enabled')
      }
      
      // Setup signal handlers
      this.setupSignalHandlers()
    } catch (error) {
      logger.error('Failed to start FastMCP Server:', error)
      this.isRunningFlag = false
      this.lastError = error as Error
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

  private async registerPromptXTools(): Promise<void> {
    if (!this.server) return

    try {
      // Load tool definitions from @promptx/cli package
      const promptxLib = require('@promptx/cli/src/lib')
      const toolDefinitions = promptxLib.mcp.definitions.tools
      
      logger.info(`Loading ${toolDefinitions.length} PromptX tools`)

      for (const toolDef of toolDefinitions) {
        try {
          // Register tool with FastMCP
          await this.registerToolToFastMCP(toolDef)
          logger.debug(`Registered tool: ${toolDef.name}`)
        } catch (error) {
          logger.error(`Failed to load tool ${toolDef.name}:`, error)
        }
      }

      logger.success(`Registered ${toolDefinitions.length} PromptX tools`)
    } catch (error) {
      logger.error('Failed to register PromptX tools:', error)
      // Fall back to test tools
      this.registerTestTools()
    }
  }

  private async registerToolToFastMCP(toolDef: any): Promise<void> {
    if (!this.server) return

    // Convert PromptX tool definition to FastMCP format
    const parameters: any = {}
    
    if (toolDef.inputSchema?.properties) {
      for (const [key, value] of Object.entries(toolDef.inputSchema.properties)) {
        const prop = value as any
        let zodType: any
        
        // Map JSON schema types to Zod types
        if (prop.type === 'string') {
          zodType = z.string()
        } else if (prop.type === 'number') {
          zodType = z.number()
        } else if (prop.type === 'boolean') {
          zodType = z.boolean()
        } else if (prop.type === 'object') {
          zodType = z.object({})
        } else if (prop.type === 'array') {
          zodType = z.array(z.any())
        } else {
          zodType = z.any()
        }
        
        // Add description if available
        if (prop.description) {
          zodType = zodType.describe(prop.description)
        }
        
        // Handle optional fields
        if (!toolDef.inputSchema.required?.includes(key)) {
          zodType = zodType.optional()
        }
        
        parameters[key] = zodType
      }
    }

    this.server.addTool({
      name: toolDef.name,
      description: toolDef.description,
      parameters: z.object(parameters),
      execute: async (args: any) => {
        this.requestCount++
        if (this.metrics.enabled) {
          this.metrics.requestsTotal++
        }
        
        try {
          // Call the original tool handler or use default implementation
          let result
          if (toolDef.handler && typeof toolDef.handler === 'function') {
            result = await toolDef.handler(args)
          } else {
            // Default implementation for PromptX tools without handlers
            result = await this.executePromptXTool(toolDef.name, args)
          }
          
          // Format output using MCPOutputAdapter
          return this.outputAdapter.convertToMCPFormat(result)
        } catch (error) {
          logger.error(`Error executing tool ${toolDef.name}:`, error)
          throw error
        }
      }
    })
  }

  private async executePromptXTool(toolName: string, args: any): Promise<any> {
    const startTime = Date.now()
    
    try {
      logger.info(`Executing PromptX tool: ${toolName} with args:`, args)
      
      // Remove promptx_ prefix if present
      const commandName = toolName.replace(/^promptx_/, '')
      
      // Convert args to CLI format
      const cliArgs = this.convertToCliArgs(toolName, args)
      
      // Execute via PromptX CLI
      const result = await cli.execute(commandName, cliArgs)
      
      // Record metrics
      if (this.metrics.enabled) {
        const responseTime = Date.now() - startTime
        this.metrics.responseTimeSum += responseTime
        this.metrics.responseTimeCount++
        
        // Record tool execution count
        if (!this.metrics.toolExecutions[toolName]) {
          this.metrics.toolExecutions[toolName] = 0
        }
        this.metrics.toolExecutions[toolName]++
      }
      
      logger.debug(`Tool ${toolName} executed successfully`)
      
      // Return raw result - will be formatted by MCPOutputAdapter in registerToolToFastMCP
      return result
    } catch (error) {
      // Record error metrics
      if (this.metrics.enabled) {
        this.metrics.errors++
      }
      
      logger.error(`Error executing tool ${toolName}:`, error)
      throw error
    }
  }

  private convertToCliArgs(toolName: string, args: any): any[] {
    // Convert MCP args to CLI args format based on tool
    const commandName = toolName.replace(/^promptx_/, '')
    
    switch (commandName) {
      case 'init':
        if (args && args.workingDirectory) {
          return [{ workingDirectory: args.workingDirectory, ideType: args.ideType }]
        }
        return []
      
      case 'welcome':
        return []
      
      case 'action':
        return args && args.role ? [args.role] : []
      
      case 'learn':
        return args && args.resource ? [args.resource] : []
      
      case 'recall':
        if (!args || !args.role) {
          throw new Error('role parameter is required')
        }
        const recallArgs = [args.role]
        if (args.query && typeof args.query === 'string' && args.query.trim() !== '') {
          recallArgs.push(args.query)
        }
        return recallArgs
      
      case 'remember':
        if (!args || !args.role) {
          throw new Error('role parameter is required')
        }
        if (!args.engrams || !Array.isArray(args.engrams)) {
          throw new Error('engrams parameter is required and must be an array')
        }
        // Keep object format, RememberCommand.parseArgs expects object
        return [args]
      
      case 'toolx':
        if (!args || !args.tool_resource) {
          throw new Error('tool_resource parameter is required')
        }
        const toolxArgs: any[] = []
        toolxArgs.push(args.tool_resource)
        if (args.parameters) {
          toolxArgs.push(JSON.stringify(args.parameters))
        }
        if (args.rebuild !== undefined) {
          toolxArgs.push(args.rebuild)
        }
        if (args.timeout !== undefined) {
          toolxArgs.push(args.timeout)
        }
        return toolxArgs
      
      default:
        // For unknown tools, pass args as-is
        return args ? [args] : []
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

  // Session management methods
  createSession(sessionId: string): any {
    if (this.config.stateless) {
      return null
    }
    
    const session = {
      id: sessionId,
      createdAt: new Date(),
      lastAccess: new Date(),
      data: {}
    }
    
    this.sessions.set(sessionId, session)
    return session
  }

  getSession(sessionId: string): any {
    if (this.config.stateless) {
      return null
    }
    
    const session = this.sessions.get(sessionId)
    if (session) {
      session.lastAccess = new Date()
    }
    return session
  }

  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId)
  }

  // Helper methods
  private createLogger() {
    return {
      log: (message: string, ...args: any[]) => logger.log(message, ...args),
      info: (message: string, ...args: any[]) => logger.info(message, ...args),
      warn: (message: string, ...args: any[]) => logger.warn(message, ...args),
      error: (message: string, ...args: any[]) => logger.error(message, ...args),
      debug: (message: string, ...args: any[]) => logger.debug(message, ...args)
    }
  }

  private setupSignalHandlers(): void {
    const shutdown = async (signal: string) => {
      logger.info(`\n🛑 Received ${signal}, shutting down gracefully...`)
      await this.stop()
      process.exit(0)
    }

    process.once('SIGINT', () => shutdown('SIGINT'))
    process.once('SIGTERM', () => shutdown('SIGTERM'))
  }

  getStatus(): any {
    const uptime = this.startTime 
      ? (Date.now() - this.startTime.getTime()) / 1000 
      : 0

    return {
      running: this.isRunningFlag,
      transport: 'http',
      endpoint: this.getMCPEndpoint(),
      port: this.config.port,
      host: this.config.host,
      connections: this.connections,
      sessions: this.config.stateless ? null : {
        count: this.sessions.size,
        ids: Array.from(this.sessions.keys())
      },
      uptime,
      processedMessages: this.requestCount,
      lastError: this.lastError
    }
  }

  getHealthCheck(): any {
    const uptime = this.startTime 
      ? (Date.now() - this.startTime.getTime()) / 1000 
      : 0

    return {
      status: this.isRunningFlag ? 'healthy' : 'unhealthy',
      uptime,
      memory: process.memoryUsage(),
      tools: this.server ? 'available' : 'unavailable',
      errors: this.metrics.errors
    }
  }

  getMetrics(): any {
    const avgResponseTime = this.metrics.responseTimeCount > 0
      ? this.metrics.responseTimeSum / this.metrics.responseTimeCount
      : 0

    return {
      requestsTotal: this.metrics.requestsTotal,
      requestsPerSecond: 0, // Need to implement calculation logic
      averageResponseTime: avgResponseTime,
      activeConnections: this.connections,
      toolExecutions: this.metrics.toolExecutions
    }
  }
}