#!/usr/bin/env node

// 早期错误捕获 - 在任何模块加载之前
process.on('uncaughtException', (err: Error) => {
  console.error('❌ Fatal error during startup:', err.message)
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
import { FastMCPStdioServer, FastMCPHttpServer } from '../index.js'
import logger from '@promptx/logger'

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
      logger.info(chalk.cyan(`🚀 PromptX MCP Server v${packageJson.version}`))
      
      // 设置调试模式
      if (options.debug) {
        process.env.MCP_DEBUG = 'true'
      }

      // Start server based on transport type
      if (options.transport === 'stdio') {
        logger.info(chalk.gray('📡 Starting STDIO transport mode...'))
        const mcpServer = new FastMCPStdioServer({
          debug: options.debug,
          name: 'promptx-mcp-server',
          version: packageJson.version
        })
        await mcpServer.start()
        
        // Keep process running
        await new Promise(() => {}) // Never resolves, keeps process running
      } else if (options.transport === 'http') {
        const port = parseInt(options.port)
        logger.info(`📡 Starting HTTP transport mode on ${options.host}:${port}...`)
        
        const mcpHttpServer = new FastMCPHttpServer({
          debug: options.debug,
          name: 'promptx-mcp-server',
          version: packageJson.version,
          port: port,
          host: options.host,
          cors: options.cors
        })
        
        await mcpHttpServer.start()
        logger.info(chalk.green(`✅ HTTP MCP Server started on ${options.host}:${port}`))
      } else {
        throw new Error(`Unsupported transport type: ${options.transport}. Supported types: stdio, http`)
      }
    } catch (error) {
      logger.error(`❌ MCP Server startup failed: ${(error as Error).message}`)
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

${chalk.cyan('💡 PromptX MCP Server - Bridge AI applications to PromptX')}

${chalk.cyan('🚀 Quick Start:')}
  ${chalk.gray('# STDIO mode (default, suitable for most AI applications)')}
  npx @promptx/mcp-server

  ${chalk.gray('# HTTP mode (suitable for web applications and remote connections)')}
  npx @promptx/mcp-server --transport http --port 5203

${chalk.cyan('📋 AI Application Configuration:')}
  ${chalk.gray('# Claude Desktop configuration example')}
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