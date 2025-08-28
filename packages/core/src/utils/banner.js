const chalk = require('chalk')

/**
 * Display PromptX startup banner
 */
function displayBanner() {
  const gradient = [
    chalk.hex('#00D9FF'),  // Bright cyan
    chalk.hex('#00B4D8'),  // Medium cyan
    chalk.hex('#0096C7'),  // Darker cyan
    chalk.hex('#0077B6'),  // Deep blue
    chalk.hex('#03045E'),  // Navy
  ]
  
  const banner = `
${gradient[0]('╔═══════════════════════════════════════════════════════════════════════╗')}
${gradient[0]('║                                                                       ║')}
${gradient[0]('║')}  ${chalk.bold.white('██████╗ ██████╗  ██████╗ ███╗   ███╗██████╗ ████████╗██╗  ██╗')}  ${gradient[0]('║')}
${gradient[0]('║')}  ${chalk.bold.white('██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔══██╗╚══██╔══╝╚██╗██╔╝')}  ${gradient[0]('║')}
${gradient[0]('║')}  ${gradient[1].bold('██████╔╝██████╔╝██║   ██║██╔████╔██║██████╔╝   ██║    ╚███╔╝ ')}  ${gradient[0]('║')}
${gradient[0]('║')}  ${gradient[2].bold('██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔═══╝    ██║    ██╔██╗ ')}  ${gradient[0]('║')}
${gradient[0]('║')}  ${chalk.bold.white('██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║██║        ██║   ██╔╝ ██╗')}  ${gradient[0]('║')}
${gradient[0]('║')}  ${chalk.bold.white('╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═╝        ╚═╝   ╚═╝  ╚═╝')}  ${gradient[0]('║')}
${gradient[0]('║                                                                       ║')}
${gradient[0]('║')}  ${chalk.hex('#FFD60A').bold('      🚀 AI-First Development Framework by deepractice.ai')}       ${gradient[0]('║')}
${gradient[0]('║                                                                       ║')}
${gradient[0]('╠═══════════════════════════════════════════════════════════════════════╣')}
${gradient[0]('║')}  ${chalk.hex('#7AE582')('✨ Making AI Accessible')}                                           ${gradient[0]('║')}
${gradient[0]('║')}  ${chalk.hex('#7AE582')('🎯 Zero-Configuration AI Roles')}                                   ${gradient[0]('║')}
${gradient[0]('║')}  ${chalk.hex('#7AE582')('🧠 Advanced Memory Systems')}                                       ${gradient[0]('║')}
${gradient[0]('║')}  ${chalk.hex('#7AE582')('⚡ MCP Protocol Integration')}                                      ${gradient[0]('║')}
${gradient[0]('║                                                                       ║')}
${gradient[0]('║')}  ${chalk.gray('Version:')} ${chalk.white.bold(require('../../package.json').version.padEnd(20))}  ${chalk.gray('Visit:')} ${chalk.hex('#00D9FF').underline('https://deepractice.ai')}  ${gradient[0]('║')}
${gradient[0]('╚═══════════════════════════════════════════════════════════════════════╝')}
`
  console.error(banner)
}

/**
 * Display compact banner for MCP mode with configuration info
 * @param {Object} config - Configuration object
 * @param {string} config.mode - Server mode (stdio, http, sse)
 * @param {string} config.workingDir - Working directory
 * @param {string} config.host - Server host (for http/sse modes)
 * @param {number} config.port - Server port (for http/sse modes)
 * @param {string} config.mcpId - MCP instance ID
 */
function displayCompactBanner(config = {}) {
  const {
    mode = 'stdio',
    workingDir = process.cwd(),
    host,
    port,
    mcpId = `mcp-${process.pid}`
  } = config

  const gradient = chalk.hex('#00D9FF')
  const highlight = chalk.hex('#FFD60A')
  
  let banner = `
${gradient('═══════════════════════════════════════════════════════════════════════════════')}
  ${chalk.bold.white('PromptX')} ${chalk.gray(`v${require('../../package.json').version}`)} - ${highlight.bold('AI-First Development Framework')}
  ${chalk.gray('by')} ${chalk.hex('#00D9FF').bold('deepractice.ai')} ${chalk.gray('- Making AI Accessible')}
${gradient('═══════════════════════════════════════════════════════════════════════════════')}

  ${chalk.hex('#7AE582')('📍 Instance:')} ${chalk.white(mcpId)}
  ${chalk.hex('#7AE582')('📂 Working Directory:')} ${chalk.white(workingDir)}
  ${chalk.hex('#7AE582')('🔌 Transport Mode:')} ${chalk.white.bold(mode.toUpperCase())}`

  if (mode === 'http' || mode === 'sse') {
    banner += `
  ${chalk.hex('#7AE582')('🌐 Server URL:')} ${chalk.white(`http://${host}:${port}`)}`
  }

  banner += `

${gradient('═══════════════════════════════════════════════════════════════════════════════')}
`
  
  console.error(banner)
}

module.exports = {
  displayBanner,
  displayCompactBanner
}