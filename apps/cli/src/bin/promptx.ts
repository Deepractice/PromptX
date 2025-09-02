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
import { MCPServerManager } from '@promptx/mcp-server'
import logger from '@promptx/logger'

// Get package.json
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'))

// Import from @promptx/core ESM
import core from '@promptx/core'
const { utils, pouch } = core
const { ServerEnvironment, ProjectManager } = utils
const { cli } = pouch
const { getGlobalServerEnvironment } = ServerEnvironment
const { getGlobalProjectManager } = ProjectManager
const serverEnv = getGlobalServerEnvironment()
if (!serverEnv.isInitialized()) {
  // CLI模式使用特殊的transport标识
  serverEnv.initialize({ transport: 'cli' })
  logger.debug('CLI模式：ServerEnvironment已初始化')
}

// CLI模式自动恢复最近的项目配置
async function restoreProjectForCLI() {
  try {
    const projectManager = getGlobalProjectManager()
    const cwd = process.cwd()
    
    // 尝试获取当前目录的项目实例
    const instances = await projectManager.getProjectInstances(cwd)
    if (instances.length > 0) {
      // 找到最近的CLI模式实例，如果没有就用第一个
      const cliInstance = instances.find(i => i.transport === 'cli') || instances[0]
      
      // 恢复项目状态
      ProjectManager.setCurrentProject(
        cliInstance.projectPath,
        cliInstance.mcpId,
        cliInstance.ideType,
        cliInstance.transport
      )
      logger.debug(`CLI模式：已恢复项目配置 - ${cliInstance.projectPath}`)
    }
  } catch (error) {
    // 静默处理错误，不影响CLI使用
    logger.debug(`CLI模式：无法恢复项目配置 - ${error.message}`)
  }
}

// 创建主程序
const program = new Command()

// 需要在命令执行前完成项目恢复
async function ensureProjectRestored() {
  try {
    // 使用正确的静态方法检查
    if (!ProjectManager.isInitialized || !ProjectManager.isInitialized()) {
      await restoreProjectForCLI()
    }
  } catch (error) {
    // 如果检查失败，也尝试恢复
    await restoreProjectForCLI()
  }
}

// 设置程序信息
program
  .name('promptx')
  .description(packageJson.description)
  .version(packageJson.version, '-v, --version', 'display version number')

// 五大核心锦囊命令
program
  .command('init [workspacePath]')
  .description('init锦囊 - 初始化工作环境，传达系统基本诺记')
  .action(async (workspacePath, options) => {
    // 如果提供了workspacePath，将其作为workingDirectory参数传递
    const args = workspacePath ? { workingDirectory: workspacePath } : {}
    await cli.execute('init', [args])
  })

program
  .command('welcome')
  .description('welcome锦囊 - 发现并展示所有可用的AI角色和领域专家')
  .action(async (options) => {
    await cli.execute('welcome', [])
  })

program
  .command('action <role>')
  .description('action锦囊 - 激活特定AI角色，获取专业提示词')
  .action(async (role, options) => {
    await ensureProjectRestored()
    await cli.execute('action', [role])
  })

program
  .command('learn [resourceUrl]')
  .description('learn锦囊 - 学习指定协议的资源内容(thought://、execution://等)')
  .action(async (resourceUrl, options) => {
    await cli.execute('learn', resourceUrl ? [resourceUrl] : [])
  })

program
  .command('recall [query]')
  .description('recall锦囊 - AI主动从记忆中检索相关的专业知识')
  .action(async (query, options) => {
    await cli.execute('recall', query ? [query] : [])
  })

program
  .command('remember [content...]')
  .description('remember锦囊 - AI主动内化知识和经验到记忆体系')
  .action(async (content, options) => {
    const args = content || []
    await cli.execute('remember', args)
  })


// ToolX命令
program
  .command('toolx <arguments>')
  .description('toolx锦囊 - 执行PromptX工具体系(ToolX)中的JavaScript功能')
  .action(async (argumentsJson, options) => {
    try {
      let args = {};
      
      // 支持两种调用方式：
      // 1. 从MCP传来的对象（通过cli.execute调用）
      // 2. 从CLI传来的JSON字符串（直接命令行调用）
      if (typeof argumentsJson === 'object') {
        args = argumentsJson;
      } else if (typeof argumentsJson === 'string') {
        try {
          args = JSON.parse(argumentsJson);
        } catch (error) {
          console.error('参数解析错误，请提供有效的JSON格式');
          console.error('格式示例: \'{"tool_resource": "@tool://calculator", "parameters": {"operation": "add", "a": 25, "b": 37}}\'');
          process.exit(1);
        }
      }
      
      // 验证必需参数
      if (!args.tool_resource || !args.parameters) {
        console.error('缺少必需参数');
        console.error('必需参数: tool_resource (工具资源引用), parameters (工具参数)');
        console.error('格式示例: \'{"tool_resource": "@tool://calculator", "parameters": {"operation": "add", "a": 25, "b": 37}}\'');
        process.exit(1);
      }
      
      await cli.execute('toolx', args);
    } catch (error) {
      console.error(`ToolX命令执行失败: ${error.message}`);
      process.exit(1);
    }
  })

// MCP Server命令
program
  .command('mcp-server')
  .description('启动MCP Server，支持Claude Desktop等AI应用接入')
  .option('-t, --transport <type>', '传输类型 (stdio|http)', 'stdio')
  .option('-p, --port <number>', 'HTTP端口号 (仅http传输)', '5203')
  .option('--host <address>', '绑定地址 (仅http传输)', 'localhost')
  .option('--cors', '启用CORS (仅http传输)', false)
  .option('--debug', '启用调试模式', false)
  .action(async (options) => {
    try {
      logger.info(chalk.cyan(`🚀 Starting MCP Server via PromptX CLI...`))
      
      // Use MCPServerManager for unified server management
      await MCPServerManager.launch({
        transport: options.transport as 'stdio' | 'http',
        port: parseInt(options.port),
        host: options.host,
        cors: options.cors,
        debug: options.debug
      })
    } catch (error) {
      // Output to stderr to avoid polluting MCP stdout communication
      logger.error(`MCP Server startup failed: ${(error as Error).message}`)
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

${chalk.cyan('PromptX 锦囊框架 - AI use CLI get prompt for AI')}

${chalk.cyan('六大核心命令:')}
  ${chalk.cyan('init')}   → 初始化环境，传达系统协议
  ${chalk.yellow('welcome')}  → 发现可用角色和领域专家  
  ${chalk.red('action')} → 激活特定角色，获取专业能力
  ${chalk.blue('learn')}  → 深入学习领域知识体系
  ${chalk.green('recall')} → AI主动检索应用记忆
  ${chalk.magenta('remember')} → AI主动内化知识增强记忆
  ${chalk.cyan('toolx')} → 执行PromptX工具体系(ToolX)，AI智能行动
  ${chalk.blue('mcp-server')} → 启动MCP Server，连接AI应用

${chalk.cyan('示例:')}
  ${chalk.gray('# 1. 初始化锦囊系统')}
  promptx init

  ${chalk.gray('# 2. 发现可用角色')}
  promptx welcome

  ${chalk.gray('# 3. 激活专业角色')}
  promptx action copywriter
  promptx action scrum-master

  ${chalk.gray('# 4. 学习领域知识')}
  promptx learn scrum
  promptx learn copywriter

  ${chalk.gray('# 5. 检索相关经验')}
  promptx recall agile
  promptx recall
  
  ${chalk.gray('# 6. AI内化专业知识')}
  promptx remember "每日站会控制在15分钟内"
  promptx remember "测试→预发布→生产"

  ${chalk.gray('# 7. 执行JavaScript工具')}
  promptx toolx '{"tool_resource": "@tool://calculator", "parameters": {"operation": "add", "a": 2, "b": 3}}'
  promptx toolx '{"tool_resource": "@tool://send-email", "parameters": {"to": "test@example.com", "subject": "Hello", "content": "Test"}}'

  ${chalk.gray('# 8. 启动MCP服务')}
  promptx mcp-server                    # stdio传输(默认)
  promptx mcp-server -t http -p 3000    # HTTP传输(Streamable HTTP)

${chalk.cyan('PATEOAS状态机:')}
  每个锦囊输出都包含 PATEOAS 导航，引导 AI 发现下一步操作
  即使 AI 忘记上文，仍可通过锦囊独立执行

${chalk.cyan('核心理念:')}
  • 锦囊自包含：每个命令包含完整执行信息
  • 串联无依赖：AI忘记上文也能继续执行
  • 分阶段专注：每个锦囊专注单一任务
  • Prompt驱动：输出引导AI发现下一步

${chalk.cyan('MCP集成:')}
  • AI应用连接：通过MCP协议连接Claude Desktop等AI应用
  • 标准化接口：遵循Model Context Protocol标准
  • 无环境依赖：解决CLI环境配置问题

${chalk.cyan('更多信息:')}
  GitHub: ${chalk.underline('https://github.com/Deepractice/PromptX')}
  组织:   ${chalk.underline('https://github.com/Deepractice')}
`)

// 处理未知命令
program.on('command:*', () => {
  logger.error(`错误: 未知命令 '${program.args.join(' ')}'`)
  logger.info('')
  program.help()
})

// 如果没有参数，显示banner和帮助
if (process.argv.length === 2) {
  displayBanner()
  program.help()
}

// 解析命令行参数
program.parse(process.argv)
