/**
 * MCPServerManager - Unified manager for MCP Server lifecycle
 * Handles both STDIO and HTTP transport modes with graceful shutdown
 */

import { FastMCPStdioServer, FastMCPHttpServer } from './server/index.js'
import logger from '@promptx/logger'
import chalk from 'chalk'

export interface MCPServerOptions {
  transport: 'stdio' | 'http'
  port?: number
  host?: string
  cors?: boolean
  debug?: boolean
  stateless?: boolean
}

export class MCPServerManager {
  private server: FastMCPStdioServer | FastMCPHttpServer | null = null
  private options: MCPServerOptions
  private shutdownHandlers: Array<() => Promise<void>> = []
  private isShuttingDown: boolean = false

  constructor(options: MCPServerOptions) {
    this.options = options
    this.setupSignalHandlers()
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    // Enable debug mode if requested
    if (this.options.debug) {
      process.env.MCP_DEBUG = 'true'
      logger.debug('Debug mode enabled')
    }

    try {
      switch (this.options.transport) {
        case 'stdio':
          await this.startStdioServer()
          break
        case 'http':
          await this.startHttpServer()
          break
        default:
          throw new Error(`Unsupported transport type: ${this.options.transport}`)
      }

      // Keep the process alive
      await this.keepAlive()
    } catch (error) {
      logger.error(`Failed to start MCP Server: ${(error as Error).message}`)
      throw error
    }
  }

  /**
   * Start STDIO transport server
   */
  private async startStdioServer(): Promise<void> {
    logger.info(chalk.gray('Starting STDIO transport mode...'))
    
    this.server = new FastMCPStdioServer({
      debug: this.options.debug
    })
    
    await this.server.start()
    logger.info(chalk.green('STDIO MCP Server started successfully'))
    logger.info(chalk.gray('Ready to receive messages via standard I/O'))
  }

  /**
   * Start HTTP transport server
   */
  private async startHttpServer(): Promise<void> {
    const { 
      port = 5203, 
      host = 'localhost', 
      cors = false, 
      stateless = false 
    } = this.options
    
    logger.info(chalk.cyan(`Starting HTTP transport mode on ${host}:${port}...`))
    
    this.server = new FastMCPHttpServer({
      debug: this.options.debug,
      port,
      host,
      cors,
      stateless
    })
    
    await this.server.start()
    
    // Display server information
    logger.info(chalk.green(`MCP HTTP Server started on http://${host}:${port}/mcp`))
    logger.info('')
    logger.info(chalk.gray(`Mode: ${stateless ? 'Stateless' : 'Stateful (Schema)'}`))
    logger.info(chalk.gray(`Tools: ${this.server.tools?.size || 0} registered`))
    logger.info(chalk.gray(`HTTP MCP Server started on ${host}:${port}`))
    logger.info('')
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    // Prevent multiple shutdown attempts
    if (this.isShuttingDown) {
      return
    }
    this.isShuttingDown = true

    logger.info(chalk.yellow('\n🔄 Initiating graceful shutdown...'))
    
    // Execute all registered shutdown handlers
    for (const handler of this.shutdownHandlers) {
      try {
        await handler()
      } catch (error) {
        logger.error(`Shutdown handler error: ${(error as Error).message}`)
      }
    }

    // Stop the server
    if (this.server && typeof this.server.stop === 'function') {
      try {
        await this.server.stop()
        logger.info(chalk.green('Server stopped gracefully'))
      } catch (error) {
        logger.error(`Failed to stop server: ${(error as Error).message}`)
      }
    }

    logger.info(chalk.green('👋 Goodbye!'))
  }

  /**
   * Setup signal handlers for graceful shutdown
   */
  private setupSignalHandlers(): void {
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGHUP']
    
    signals.forEach(signal => {
      process.on(signal, async () => {
        logger.info(chalk.yellow(`\nReceived ${signal} signal`))
        await this.shutdown()
        process.exit(0)
      })
    })

    // Handle uncaught exceptions
    process.on('uncaughtException', async (error: Error) => {
      logger.error(chalk.red(`Uncaught exception: ${error.message}`))
      if (error.stack) {
        logger.error(error.stack)
      }
      await this.shutdown()
      process.exit(1)
    })

    // Handle unhandled promise rejections
    process.on('unhandledRejection', async (reason: any) => {
      logger.error(chalk.red(`Unhandled rejection: ${reason}`))
      await this.shutdown()
      process.exit(1)
    })

    // Windows-specific handling for Ctrl+C
    if (process.platform === 'win32') {
      // Import readline dynamically for Windows
      import('readline').then(({ default: readline }) => {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        })
        
        rl.on('SIGINT', async () => {
          logger.info(chalk.yellow('\nReceived SIGINT (Ctrl+C)'))
          await this.shutdown()
          process.exit(0)
        })
      }).catch(error => {
        // If readline import fails, just continue without it
        logger.debug(`Could not load readline for Windows: ${error.message}`)
      })
    }
  }

  /**
   * Keep the process alive
   */
  private async keepAlive(): Promise<void> {
    return new Promise((resolve) => {
      // For STDIO mode, keep stdin open
      if (this.options.transport === 'stdio') {
        process.stdin.resume()
        process.stdin.on('end', async () => {
          logger.info('STDIN closed, shutting down...')
          await this.shutdown()
          resolve()
        })
      }
      
      // The promise never resolves normally, keeping the process alive
      // Process will exit through signal handlers
    })
  }

  /**
   * Register a custom shutdown handler
   */
  onShutdown(handler: () => Promise<void>): void {
    this.shutdownHandlers.push(handler)
  }

  /**
   * Get server status
   */
  getStatus(): any {
    if (!this.server) {
      return { running: false, transport: this.options.transport }
    }
    
    // Return server status if available
    if ('status' in this.server && this.server.status) {
      return this.server.status
    }
    
    return { 
      running: true, 
      transport: this.options.transport,
      ...(this.options.transport === 'http' && {
        port: this.options.port,
        host: this.options.host
      })
    }
  }

  /**
   * Static factory method for quick launch
   */
  static async launch(options: MCPServerOptions): Promise<MCPServerManager> {
    const manager = new MCPServerManager(options)
    await manager.start()
    return manager
  }
}

export default MCPServerManager