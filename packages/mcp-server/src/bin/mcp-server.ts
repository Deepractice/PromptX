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
import { PromptXMCPServer } from '../servers/PromptXMCPServer.js'

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
      
      // 使用 PromptXMCPServer 统一启动
      await PromptXMCPServer.launch({
        transport: options.transport as 'stdio' | 'http',
        version: packageJson.version,
        port: parseInt(options.port),
        host: options.host,
        corsEnabled: options.cors,
        debug: options.debug
      })
      
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