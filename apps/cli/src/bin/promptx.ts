#!/usr/bin/env node

// Early error capturing - before any module loading
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
  // CLI mode uses special transport identifier
  serverEnv.initialize({ transport: 'cli' })
  logger.debug('CLI mode: ServerEnvironment initialized')
}

// Automatically restore recent project configuration for CLI mode
async function restoreProjectForCLI() {
  try {
    const projectManager = getGlobalProjectManager()
    const cwd = process.cwd()
    
    // Try to get project instances for the current directory
    const instances = await projectManager.getProjectInstances(cwd)
    if (instances.length > 0) {
      // Find the latest CLI mode instance, or use the first one if none found
      const cliInstance = instances.find(i => i.transport === 'cli') || instances[0]
      
      // Restore project state
      ProjectManager.setCurrentProject(
        cliInstance.projectPath,
        cliInstance.mcpId,
        cliInstance.ideType,
        cliInstance.transport
      )
      logger.debug(`CLI mode: Project configuration restored - ${cliInstance.projectPath}`)
    }
  } catch (error) {
    // Handle errors silently, don't affect CLI usage
    logger.debug(`CLI mode: Unable to restore project configuration - ${error.message}`)
  }
}

// Display banner function
function displayBanner() {
  console.log(chalk.cyan(`
 ____                           _    __  __
|  _ \\ _ __ ___  _ __ ___  _ __ | |_ \\ \\/ /
| |_) | '__/ _ \\| '_ \` _ \\| '_ \\| __| \\  / 
|  __/| | | (_) | | | | | | |_) | |_  /  \\ 
|_|   |_|  \\___/|_| |_| |_| .__/ \\__|/_/\\_\\
                          |_|              
`))
  console.log(chalk.yellow('PromptX Pouch Framework - AI use CLI get prompt for AI'))
  console.log('')
}

// Create main program
const program = new Command()

// Need to complete project restoration before command execution
async function ensureProjectRestored() {
  try {
    // Use correct static method check
    if (!ProjectManager.isInitialized || !ProjectManager.isInitialized()) {
      await restoreProjectForCLI()
    }
  } catch (error) {
    // If check fails, also try to restore
    await restoreProjectForCLI()
  }
}

// Set program information
program
  .name('promptx')
  .description(packageJson.description)
  .version(packageJson.version, '-v, --version', 'display version number')

// Five core pouch commands
program
  .command('init [workspacePath]')
  .description('init pouch - initialize work environment, communicate system basic promises')
  .action(async (workspacePath, options) => {
    // If workspacePath is provided, pass it as workingDirectory parameter
    const args = workspacePath ? { workingDirectory: workspacePath } : {}
    await cli.execute('init', [args])
  })

program
  .command('discover')
  .description('discover pouch - discover and display all available AI roles and domain experts')
  .action(async (options) => {
    await cli.execute('discover', [])
  })

program
  .command('action <role>')
  .description('action pouch - activate specific AI role, obtain professional prompts')
  .action(async (role, options) => {
    await ensureProjectRestored()
    await cli.execute('action', [role])
  })

program
  .command('learn [resourceUrl]')
  .description('learn pouch - learn resource content of specified protocols (thought://, execution://, etc.)')
  .action(async (resourceUrl, options) => {
    await cli.execute('learn', resourceUrl ? [resourceUrl] : [])
  })

program
  .command('recall [query]')
  .description('recall pouch - AI actively retrieves relevant professional knowledge from memory')
  .action(async (query, options) => {
    await cli.execute('recall', query ? [query] : [])
  })

program
  .command('remember [content...]')
  .description('remember pouch - AI actively internalizes knowledge and experience into memory system')
  .action(async (content, options) => {
    const args = content || []
    await cli.execute('remember', args)
  })


// ToolX command
program
  .command('toolx <arguments>')
  .description('toolx pouch - execute JavaScript functions in PromptX tool ecosystem (ToolX)')
  .action(async (argumentsJson, options) => {
    try {
      let args = {};
      
      // Support two calling methods:
      // 1. Object from MCP (called via cli.execute)
      // 2. JSON string from CLI (direct command line call)
      if (typeof argumentsJson === 'object') {
        args = argumentsJson;
      } else if (typeof argumentsJson === 'string') {
        try {
          args = JSON.parse(argumentsJson);
        } catch (error) {
          console.error('Parameter parsing error, please provide valid JSON format');
          console.error('Format example: \'{"tool_resource": "@tool://calculator", "parameters": {"operation": "add", "a": 25, "b": 37}}\'');
          process.exit(1);
        }
      }
      
      // Validate required parameters
      if (!args.tool_resource || !args.parameters) {
        console.error('Missing required parameters');
        console.error('Required parameters: tool_resource (tool resource reference), parameters (tool parameters)');
        console.error('Format example: \'{"tool_resource": "@tool://calculator", "parameters": {"operation": "add", "a": 25, "b": 37}}\'');
        process.exit(1);
      }
      
      await cli.execute('toolx', args);
    } catch (error) {
      console.error(`ToolX command execution failed: ${error.message}`);
      process.exit(1);
    }
  })

// MCP Server command
program
  .command('mcp-server')
  .description('Start MCP Server, support AI applications like Claude Desktop to connect')
  .option('-t, --transport <type>', 'Transport type (stdio|http)', 'stdio')
  .option('-p, --port <number>', 'HTTP port number (http transport only)', '5203')
  .option('--host <address>', 'Bind address (http transport only)', '127.0.0.1')
  .option('--cors', 'Enable CORS (http transport only)', false)
  .option('--debug', 'Enable debug mode', false)
  .action(async (options) => {
    try {
      logger.info(chalk.cyan(`Starting MCP Server via PromptX CLI...`))
      
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

// Global error handling
program.configureHelp({
  helpWidth: 100,
  sortSubcommands: true
})

// Add example descriptions
program.addHelpText('after', `

${chalk.cyan('PromptX Pouch Framework - AI use CLI get prompt for AI')}

${chalk.cyan('Six Core Commands:')}
  ${chalk.cyan('init')}   → Initialize environment, communicate system protocols
  ${chalk.yellow('discover')}  → Discover available roles and domain experts  
  ${chalk.red('action')} → Activate specific role, obtain professional capabilities
  ${chalk.blue('learn')}  → Deep learning domain knowledge systems
  ${chalk.green('recall')} → AI actively retrieves applied memory
  ${chalk.magenta('remember')} → AI actively internalizes knowledge to enhance memory
  ${chalk.cyan('toolx')} → Execute PromptX tool ecosystem (ToolX), AI intelligent actions
  ${chalk.blue('mcp-server')} → Start MCP Server, connect AI applications

${chalk.cyan('Examples:')}
  ${chalk.gray('# 1. Initialize pouch system')}
  promptx init

  ${chalk.gray('# 2. Discover available roles')}
  promptx discover

  ${chalk.gray('# 3. Activate professional roles')}
  promptx action copywriter
  promptx action scrum-master

  ${chalk.gray('# 4. Learn domain knowledge')}
  promptx learn scrum
  promptx learn copywriter

  ${chalk.gray('# 5. Retrieve relevant experience')}
  promptx recall agile
  promptx recall
  
  ${chalk.gray('# 6. AI internalizes professional knowledge')}
  promptx remember "Control daily standup within 15 minutes"
  promptx remember "Test → Pre-production → Production"

  ${chalk.gray('# 7. Execute JavaScript tools')}
  promptx toolx '{"tool_resource": "@tool://calculator", "parameters": {"operation": "add", "a": 2, "b": 3}}'
  promptx toolx '{"tool_resource": "@tool://send-email", "parameters": {"to": "test@example.com", "subject": "Hello", "content": "Test"}}'

  ${chalk.gray('# 8. Start MCP service')}
  promptx mcp-server                    # stdio transport (default)
  promptx mcp-server -t http -p 3000    # HTTP transport (Streamable HTTP)

${chalk.cyan('PATEOAS State Machine:')}
  Each pouch output contains PATEOAS navigation, guiding AI to discover next operations
  Even if AI forgets context, can still execute independently through pouches

${chalk.cyan('Core Philosophy:')}
  • Self-contained pouches: Each command contains complete execution information
  • Chain without dependencies: AI can continue execution even forgetting context
  • Phased focus: Each pouch focuses on single task
  • Prompt-driven: Output guides AI to discover next steps

${chalk.cyan('MCP Integration:')}
  • AI application connection: Connect AI applications like Claude Desktop via MCP protocol
  • Standardized interface: Follow Model Context Protocol standard
  • Environment independent: Solve CLI environment configuration issues

${chalk.cyan('More Information:')}
  GitHub: ${chalk.underline('https://github.com/Deepractice/PromptX')}
  Organization: ${chalk.underline('https://github.com/Deepractice')}
`)

// Handle unknown commands
program.on('command:*', () => {
  logger.error(`Error: Unknown command '${program.args.join(' ')}'`)
  logger.info('')
  program.help()
})

// If no arguments, display banner and help
if (process.argv.length === 2) {
  displayBanner()
  program.help()
}

// Parse command line arguments
program.parse(process.argv)
