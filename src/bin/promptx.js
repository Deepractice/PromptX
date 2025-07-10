#!/usr/bin/env node

const { Command } = require('commander')
const chalk = require('chalk')
const packageJson = require('../../package.json')
const logger = require('../lib/utils/logger')

// 导入锦囊框架
const { cli } = require('../lib/core/pouch')
// 导入MCP Server命令
const { MCPServerStdioCommand } = require('../lib/mcp/MCPServerStdioCommand')
const { MCPServerHttpCommand } = require('../lib/mcp/MCPServerHttpCommand')

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


// Tool命令
program
  .command('tool <arguments>')
  .description('🔧 tool锦囊 - 执行通过@tool协议声明的JavaScript工具')
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
          console.error('❌ 参数解析错误，请提供有效的JSON格式');
          console.error('格式示例: \'{"tool_resource": "@tool://calculator", "parameters": {"operation": "add", "a": 25, "b": 37}}\'');
          process.exit(1);
        }
      }
      
      // 验证必需参数
      if (!args.tool_resource || !args.parameters) {
        console.error('❌ 缺少必需参数');
        console.error('必需参数: tool_resource (工具资源引用), parameters (工具参数)');
        console.error('格式示例: \'{"tool_resource": "@tool://calculator", "parameters": {"operation": "add", "a": 25, "b": 37}}\'');
        process.exit(1);
      }
      
      await cli.execute('tool', args);
    } catch (error) {
      console.error(`❌ Tool命令执行失败: ${error.message}`);
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
  .action(async (options) => {
    try {
      // 设置调试模式
      if (options.debug) {
        process.env.MCP_DEBUG = 'true';
      }

      // 根据传输类型选择命令
      if (options.transport === 'stdio') {
        const mcpServer = new MCPServerStdioCommand();
        await mcpServer.execute();
      } else if (options.transport === 'http' || options.transport === 'sse') {
        const mcpHttpServer = new MCPServerHttpCommand();
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

${chalk.cyan('🎒 六大核心命令:')}
  🏗️ ${chalk.cyan('init')}   → 初始化环境，传达系统协议
  👋 ${chalk.yellow('welcome')}  → 发现可用角色和领域专家  
  ⚡ ${chalk.red('action')} → 激活特定角色，获取专业能力
  📚 ${chalk.blue('learn')}  → 深入学习领域知识体系
  🔍 ${chalk.green('recall')} → AI主动检索应用记忆
  🧠 ${chalk.magenta('remember')} → AI主动内化知识增强记忆
  🔧 ${chalk.cyan('tool')} → 执行JavaScript工具，AI智能行动
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

  ${chalk.gray('# 7️⃣ 执行JavaScript工具')}
  promptx tool '{"tool_resource": "@tool://calculator", "parameters": {"operation": "add", "a": 2, "b": 3}}'
  promptx tool '{"tool_resource": "@tool://send-email", "parameters": {"to": "test@example.com", "subject": "Hello", "content": "Test"}}'

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
