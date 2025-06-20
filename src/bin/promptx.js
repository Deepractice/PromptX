#!/usr/bin/env node

const { Command } = require('commander')
const chalk = require('chalk')
const packageJson = require('../../package.json')
const logger = require('../lib/utils/logger')

// 导入锦囊框架
const { cli } = require('../lib/core/pouch')
// 导入MCP Server命令
const { MCPServerCommand } = require('../lib/commands/MCPServerCommand')
const { MCPStreamableHttpCommand } = require('../lib/commands/MCPStreamableHttpCommand')

// 创建主程序
const program = new Command()

// 设置程序信息
program
  .name('promptx')
  .description(packageJson.description)
  .version(packageJson.version, '-v, --version', 'display version number')

// 五大核心锦囊命令
program
  .command('init [workspacePath]')
  .description('🏗️ init锦囊 - 初始化工作环境，传达系统基本诺记')
  .action(async (workspacePath, options) => {
    // 如果提供了workspacePath，将其作为workingDirectory参数传递
    const args = workspacePath ? { workingDirectory: workspacePath } : {}
    await cli.execute('init', [args])
  })

program
  .command('welcome')
  .description('👋 welcome锦囊 - 发现并展示所有可用的AI角色和领域专家')
  .action(async (options) => {
    await cli.execute('welcome', [])
  })

program
  .command('action <role>')
  .description('⚡ action锦囊 - 激活特定AI角色，获取专业提示词')
  .action(async (role, options) => {
    await cli.execute('action', [role])
  })

program
  .command('learn [resourceUrl]')
  .description('📚 learn锦囊 - 学习指定协议的资源内容(thought://、execution://等)')
  .action(async (resourceUrl, options) => {
    await cli.execute('learn', resourceUrl ? [resourceUrl] : [])
  })

program
  .command('recall [query]')
  .description('🔍 recall锦囊 - AI主动从记忆中检索相关的专业知识')
  .action(async (query, options) => {
    await cli.execute('recall', query ? [query] : [])
  })

program
  .command('remember [content...]')
  .description('🧠 remember锦囊 - AI主动内化知识和经验到记忆体系')
  .action(async (content, options) => {
    const args = content || []
    await cli.execute('remember', args)
  })

// DACP命令
program
  .command('dacp <service_id> <action> [parameters]')
  .description('🚀 dacp锦囊 - 调用DACP专业服务，让AI角色拥有执行能力')
  .action(async (service_id, action, parameters, options) => {
    try {
      // 解析参数（如果是JSON字符串）
      let parsedParams = {};
      if (parameters) {
        try {
          parsedParams = JSON.parse(parameters);
        } catch (error) {
          console.error('❌ 参数解析错误，请提供有效的JSON格式');
          process.exit(1);
        }
      }
      
      const args = {
        service_id,
        action, 
        parameters: parsedParams
      };
      
      await cli.execute('dacp', args);
    } catch (error) {
      console.error(`❌ DACP命令执行失败: ${error.message}`);
      process.exit(1);
    }
  })

// MCP Server命令
program
  .command('mcp-server')
  .description('🔌 启动MCP Server，支持Claude Desktop等AI应用接入')
  .option('-t, --transport <type>', '传输类型 (stdio|http|sse)', 'stdio')
  .option('-p, --port <number>', 'HTTP端口号 (仅http/sse传输)', '3000')
  .option('--host <address>', '绑定地址 (仅http/sse传输)', 'localhost')
  .option('--cors', '启用CORS (仅http/sse传输)', false)
  .option('--debug', '启用调试模式', false)
  .option('--with-dacp', '同时启动DACP服务', false)
  .action(async (options) => {
    try {
      // 设置调试模式
      if (options.debug) {
        process.env.MCP_DEBUG = 'true';
      }

      // 根据传输类型选择命令
      if (options.transport === 'stdio') {
        const mcpServer = new MCPServerCommand();
        await mcpServer.execute({ withDacp: options.withDacp });
      } else if (options.transport === 'http' || options.transport === 'sse') {
        const mcpHttpServer = new MCPStreamableHttpCommand();
        const serverOptions = {
          transport: options.transport,
          port: parseInt(options.port),
          host: options.host,
          cors: options.cors
        };
        
        logger.info(chalk.green(`🚀 启动 ${options.transport.toUpperCase()} MCP Server 在 ${options.host}:${options.port}...`));
        await mcpHttpServer.execute(serverOptions);
      } else {
        throw new Error(`不支持的传输类型: ${options.transport}。支持的类型: stdio, http, sse`);
      }
    } catch (error) {
      // 输出到stderr，不污染MCP的stdout通信
      logger.error(chalk.red(`❌ MCP Server 启动失败: ${error.message}`));
      process.exit(1);
    }
  })

// 全局错误处理
program.configureHelp({
  helpWidth: 100,
  sortSubcommands: true
})

// 添加示例说明
program.addHelpText('after', `

${chalk.cyan('💡 PromptX 锦囊框架 - AI use CLI get prompt for AI')}

${chalk.cyan('🎒 七大核心命令:')}
  🏗️ ${chalk.cyan('init')}   → 初始化环境，传达系统协议
  👋 ${chalk.yellow('welcome')}  → 发现可用角色和领域专家  
  ⚡ ${chalk.red('action')} → 激活特定角色，获取专业能力
  📚 ${chalk.blue('learn')}  → 深入学习领域知识体系
  🔍 ${chalk.green('recall')} → AI主动检索应用记忆
  🧠 ${chalk.magenta('remember')} → AI主动内化知识增强记忆
  🚀 ${chalk.cyan('dacp')} → 调用DACP专业服务，AI角色执行能力
  🔌 ${chalk.blue('mcp-server')} → 启动MCP Server，连接AI应用

${chalk.cyan('示例:')}
  ${chalk.gray('# 1️⃣ 初始化锦囊系统')}
  promptx init

  ${chalk.gray('# 2️⃣ 发现可用角色')}
  promptx welcome

  ${chalk.gray('# 3️⃣ 激活专业角色')}
  promptx action copywriter
  promptx action scrum-master

  ${chalk.gray('# 4️⃣ 学习领域知识')}
  promptx learn scrum
  promptx learn copywriter

  ${chalk.gray('# 5️⃣ 检索相关经验')}
  promptx recall agile
  promptx recall
  
  ${chalk.gray('# 6️⃣ AI内化专业知识')}
  promptx remember "每日站会控制在15分钟内"
  promptx remember "测试→预发布→生产"

  ${chalk.gray('# 7️⃣ 调用DACP专业服务')}
  promptx dacp dacp-promptx-service calculate '{"user_request": "计算2+3"}'
  promptx dacp dacp-email-service send_email '{"user_request": "发送邮件"}'

  ${chalk.gray('# 8️⃣ 启动MCP服务')}
  promptx mcp-server                    # stdio传输(默认)
  promptx mcp-server -t http -p 3000    # HTTP传输
  promptx mcp-server -t sse -p 3001     # SSE传输

${chalk.cyan('🔄 PATEOAS状态机:')}
  每个锦囊输出都包含 PATEOAS 导航，引导 AI 发现下一步操作
  即使 AI 忘记上文，仍可通过锦囊独立执行

${chalk.cyan('💭 核心理念:')}
  • 锦囊自包含：每个命令包含完整执行信息
  • 串联无依赖：AI忘记上文也能继续执行
  • 分阶段专注：每个锦囊专注单一任务
  • Prompt驱动：输出引导AI发现下一步

${chalk.cyan('🔌 MCP集成:')}
  • AI应用连接：通过MCP协议连接Claude Desktop等AI应用
  • 标准化接口：遵循Model Context Protocol标准
  • 无环境依赖：解决CLI环境配置问题

${chalk.cyan('更多信息:')}
  GitHub: ${chalk.underline('https://github.com/Deepractice/PromptX')}
  组织:   ${chalk.underline('https://github.com/Deepractice')}
`)

// 处理未知命令
program.on('command:*', () => {
  logger.error(chalk.red(`错误: 未知命令 '${program.args.join(' ')}'`))
  logger.info('')
  program.help()
})

// 如果没有参数，显示帮助
if (process.argv.length === 2) {
  program.help()
}

// 解析命令行参数
program.parse(process.argv)
