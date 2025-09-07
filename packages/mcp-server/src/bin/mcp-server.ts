#!/usr/bin/env node

// 早期错误捕获 - 在任何模块加载之前
process.on('uncaughtException', (err: Error) => {
  console.error('Fatal error during startup:', err.message)
  if (err.stack) {
    console.error('Stack trace:', err.stack)
  }
  process.exit(1)
})

import { Command } from 'commander'
import chalk from 'chalk'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import logger from '@promptx/logger'
import { StdioMCPServer } from '../servers/StdioMCPServer.js'
import { StreamableHttpMCPServer } from '../servers/StreamableHttpMCPServer.js'
import { allTools } from '../tools/index.js'
import type { MCPServer } from '../interfaces/MCPServer.js'

// Get package.json
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const packageJson = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf-8'))

// 创建主程序
const program = new Command()

// 设置程序信息
program
  .name('@promptx/mcp-server')
  .description('PromptX MCP Server - Connect AI applications to PromptX')
  .version(packageJson.version, '-v, --version', 'display version number')

// 默认命令 - 直接启动 MCP Server
program
  .option('-t, --transport <type>', 'Transport type (stdio|http)', 'stdio')
  .option('-p, --port <number>', 'HTTP port number (http transport only)', '5203')
  .option('--host <address>', 'Host address (http transport only)', 'localhost')
  .option('--cors', 'Enable CORS (http transport only)', false)
  .option('--debug', 'Enable debug mode', false)
  .action(async (options) => {
    try {
      logger.info(chalk.cyan(`PromptX MCP Server v${packageJson.version}`))
      logger.info(`Transport: ${options.transport}`)
      
      let server: MCPServer;
      
      // 创建服务器实例
      if (options.transport === 'stdio') {
        server = new StdioMCPServer({
          name: 'promptx-mcp-server',
          version: packageJson.version
        });
        
        logger.info('Starting STDIO server...')
      } else if (options.transport === 'http') {
        const port = parseInt(options.port);
        server = new StreamableHttpMCPServer({
          name: 'promptx-mcp-server',
          version: packageJson.version,
          port,
          host: options.host,
          corsEnabled: options.cors
        });
        
        logger.info(`Starting HTTP server on ${options.host}:${port}...`)
      } else {
        throw new Error(`Unknown transport type: ${options.transport}`)
      }
      
      // 注册所有工具
      allTools.forEach(tool => {
        server.registerTool(tool)
      })
      logger.info(`Registered ${allTools.length} tools`)
      
      // 启动服务器
      await server.start()
      logger.info(chalk.green('✓ MCP Server started successfully'))
      
      // 处理退出信号
      const shutdown = async (signal: string) => {
        logger.info(`\nReceived ${signal}, shutting down gracefully...`)
        try {
          await server.gracefulShutdown(5000)
          logger.info(chalk.green('✓ Server stopped cleanly'))
          process.exit(0)
        } catch (error) {
          logger.error('Error during shutdown:', error)
          process.exit(1)
        }
      }
      
      process.on('SIGINT', () => shutdown('SIGINT'))
      process.on('SIGTERM', () => shutdown('SIGTERM'))
      
      // HTTP 模式下显示连接信息
      if (options.transport === 'http') {
        logger.info(chalk.cyan('\nHTTP Server Ready:'))
        logger.info(`  URL: http://${options.host}:${options.port}`)
        logger.info(`  CORS: ${options.cors ? 'Enabled' : 'Disabled'}`)
        logger.info(chalk.gray('\n  Endpoints:'))
        logger.info(chalk.gray('  POST /mcp - Send JSON-RPC requests'))
        logger.info(chalk.gray('  GET /mcp - SSE stream (requires session)'))
        logger.info(chalk.gray('  DELETE /mcp - Terminate session'))
        logger.info(chalk.gray('  GET /health - Health check'))
        logger.info(chalk.gray('\n  Use MCP-Session-Id header for session management'))
      }
      
    } catch (error) {
      logger.error(`MCP Server startup failed: ${(error as Error).message}`)
      if (options.debug && (error as Error).stack) {
        logger.error((error as Error).stack)
      }
      process.exit(1)
    }
  })

// 全局错误处理
program.configureHelp({
  helpWidth: 100,
  sortSubcommands: true
})

// 添加示例说明
program.addHelpText('after', `

${chalk.cyan('Examples:')}
  ${chalk.gray('# STDIO mode (default, for AI applications)')}
  npx @promptx/mcp-server

  ${chalk.gray('# HTTP mode (for web applications)')}
  npx @promptx/mcp-server --transport http --port 5203

  ${chalk.gray('# HTTP mode with CORS')}
  npx @promptx/mcp-server --transport http --port 5203 --cors

${chalk.cyan('Claude Desktop Configuration:')}
  {
    "mcpServers": {
      "promptx": {
        "command": "npx",
        "args": ["-y", "@promptx/mcp-server"]
      }
    }
  }

${chalk.cyan('More Information:')}
  GitHub: ${chalk.underline('https://github.com/Deepractice/PromptX')}
`)

// 解析命令行参数
program.parse(process.argv)