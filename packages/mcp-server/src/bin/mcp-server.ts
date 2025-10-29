#!/usr/bin/env node

// 早期错误捕获 - 在任何模块加载之前
process.on('uncaughtException', (err: Error) => {
  console.error('Fatal error during startup:', err.message)
  if (err.stack) {
    console.error('Stack trace:', err.stack)
  }
  process.exit(1)
})

// 配置保存成功消息修复
// logger.info(`Config saved to: ${chalk.gray('~/.promptx/server-config.json')}`

import { Command } from 'commander'
import chalk from 'chalk'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import logger from '@promptx/logger'
import { ServerConfigManager } from '@promptx/config'
import { PromptXMCPServer } from '../servers/PromptXMCPServer.js'

// Get package.json
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
// 修复路径：编译后在dist目录，所以只需要../package.json
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'))

// 创建主程序
const program = new Command()

// 设置程序信息
program
  .name('@promptx/mcp-server')
  .description('PromptX MCP Server - Connect AI applications to PromptX')
  .version(packageJson.version, '-v, --version', 'display version number')

  // 初始化配置管理器
// 初始化配置管理器并计算默认值
const configManager = new ServerConfigManager()
const defaultTransport = configManager.getTransport()
const defaultPort = configManager.getPort().toString()
const defaultHost = configManager.getHost()
const defaultCors = configManager.getCorsEnabled()
const defaultDebug = configManager.getDebug()

// 默认命令 - 直接启动 MCP Server
program
  .option('-t, --transport <type>', 'Transport type (stdio|http)', defaultTransport)
  .option('-p, --port <number>', 'HTTP port number (http transport only)', defaultPort)
  .option('--host <address>', 'Host address (http transport only)', defaultHost)
  .option('--cors', 'Enable CORS (http transport only)', defaultCors)
  .option('--debug', 'Enable debug mode', defaultDebug)
  .option('--save-config', 'Save current options to config file', false)
  .action(async (options) => {
    try {
      logger.info(chalk.cyan(`PromptX MCP Server v${packageJson.version}`))
      
        // 解析配置值
      const transport = options.transport as 'stdio' | 'http';
      const port = parseInt(options.port);
      const host = options.host;
      const corsEnabled = options.cors;
      const debug = options.debug;
       // 如果指定了 --save-config，保存当前配置
      if (options.saveConfig) {
        try {
          configManager.updateConfig({
            transport,
            port,
            host,
            corsEnabled,
            debug
          })
          logger.info(chalk.green('✅ Configuration saved successfully'))
          logger.info(`Config saved to: ${chalk.gray(configManager.getConfig())}`)
        } catch (configError) {
          logger.warn(`Failed to save config: ${(configError as Error).message}`)
        }
      }
      // 使用 PromptXMCPServer 统一启动
      await PromptXMCPServer.launch({
        transport,
        version: packageJson.version,
        port,
        host,
        corsEnabled,
        debug
      })
      
    } catch (error) {
      logger.error(`MCP Server startup failed: ${(error as Error).message}`)
      if (options.debug && (error as Error).stack) {
        logger.error((error as Error).stack)
      }
      process.exit(1)
    }
  })

// 配置管理命令
program
  .command('config')
  .description('Manage server configuration')
  .option('--show', 'Show current configuration', false)
  .option('--reset', 'Reset configuration to defaults', false)
  .option('--set-port <number>', 'Set default port number')
  .option('--set-host <address>', 'Set default host address')
  .option('--set-transport <type>', 'Set default transport type (stdio|http)')
  .option('--set-cors <boolean>', 'Set default CORS setting (true|false)')
  .option('--set-debug <boolean>', 'Set default debug setting (true|false)')
  .action(async (options) => {
    try {
      const configManager = new ServerConfigManager()
      
      if (options.show) {
        const config = configManager.getConfig()
        logger.info(chalk.cyan('Current Configuration:'))
        logger.info(`  Port: ${chalk.yellow(config.port)}`)
        logger.info(`  Host: ${chalk.yellow(config.host)}`)
        logger.info(`  Transport: ${chalk.yellow(config.transport)}`)
        logger.info(`  CORS Enabled: ${chalk.yellow(config.corsEnabled)}`)
        logger.info(`  Debug Mode: ${chalk.yellow(config.debug)}`)
        return
      }
      
      if (options.reset) {
        configManager.resetToDefaults()
        logger.info(chalk.green('✅ Configuration reset to defaults'))
        return
      }
      
      // 处理设置选项
      const updates: any = {}
      
      if (options.setPort) {
        const port = parseInt(options.setPort)
        if (!ServerConfigManager.isValidPort(port)) {
          throw new Error(`Invalid port number: ${options.setPort}`)
        }
        updates.port = port
      }
      
      if (options.setHost) {
        if (!ServerConfigManager.isValidHost(options.setHost)) {
          throw new Error(`Invalid host address: ${options.setHost}`)
        }
        updates.host = options.setHost
      }
      
      if (options.setTransport) {
        if (options.setTransport !== 'stdio' && options.setTransport !== 'http') {
          throw new Error(`Invalid transport type: ${options.setTransport}`)
        }
        updates.transport = options.setTransport
      }
      
      if (options.setCors) {
        const corsValue = options.setCors.toLowerCase()
        if (corsValue !== 'true' && corsValue !== 'false') {
          throw new Error(`Invalid CORS value: ${options.setCors}. Use 'true' or 'false'`)
        }
        updates.corsEnabled = corsValue === 'true'
      }
      
      if (options.setDebug) {
        const debugValue = options.setDebug.toLowerCase()
        if (debugValue !== 'true' && debugValue !== 'false') {
          throw new Error(`Invalid debug value: ${options.setDebug}. Use 'true' or 'false'`)
        }
        updates.debug = debugValue === 'true'
      }
      
      if (Object.keys(updates).length > 0) {
        configManager.updateConfig(updates)
        logger.info(chalk.green('✅ Configuration updated successfully'))
        
        // 显示更新后的配置
        const config = configManager.getConfig()
        logger.info(chalk.cyan('Updated Configuration:'))
        Object.keys(updates).forEach(key => {
          logger.info(`  ${key}: ${chalk.yellow((config as any)[key])}`)
        })
      } else {
        logger.info(chalk.yellow('No configuration changes specified. Use --help for available options.'))
      }
      
    } catch (error) {
      logger.error(`Configuration error: ${(error as Error).message}`)
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

  ${chalk.gray('# Save current options as defaults')}
  npx @promptx/mcp-server --transport http --port 8080 --save-config

${chalk.cyan('Configuration Management:')}
  ${chalk.gray('# Show current configuration')}
  npx @promptx/mcp-server config --show

  ${chalk.gray('# Set default port')}
  npx @promptx/mcp-server config --set-port 8080

  ${chalk.gray('# Set default host and transport')}
  npx @promptx/mcp-server config --set-host 0.0.0.0 --set-transport http

  ${chalk.gray('# Reset to defaults')}
  npx @promptx/mcp-server config --reset

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