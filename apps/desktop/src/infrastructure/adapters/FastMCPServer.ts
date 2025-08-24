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
    logger.debug(`FastMCPServer initialized with config:`, config)
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
        
        try {
          // Call the original tool handler or use default implementation
          let result
          if (toolDef.handler && typeof toolDef.handler === 'function') {
            result = await toolDef.handler(args)
          } else {
            // Default implementation for PromptX tools without handlers
            result = await this.executePromptXTool(toolDef.name, args)
          }
          
          // Convert result to FastMCP format
          if (typeof result === 'string') {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: result
                }
              ]
            }
          } else if (result && typeof result === 'object') {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: JSON.stringify(result, null, 2)
                }
              ]
            }
          } else {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: String(result)
                }
              ]
            }
          }
        } catch (error) {
          logger.error(`Error executing tool ${toolDef.name}:`, error)
          throw error
        }
      }
    })
  }

  private async executePromptXTool(toolName: string, args: any): Promise<any> {
    try {
      logger.info(`Executing PromptX tool: ${toolName} with args:`, args)
      
      // Remove promptx_ prefix if present
      const commandName = toolName.replace(/^promptx_/, '')
      
      // Convert args to CLI format
      const cliArgs = this.convertToCliArgs(toolName, args)
      
      // Execute via PromptX CLI
      const result = await cli.execute(commandName, cliArgs)
      
      logger.debug(`Tool ${toolName} executed successfully`)
      return result
    } catch (error) {
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
        return [args.role, JSON.stringify(args.engrams)]
      
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
}