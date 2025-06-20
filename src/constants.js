/**
 * PromptX 系统常量配置
 * 统一管理命令格式、路径等配置信息
 */

// 根据环境变量决定命令前缀
function getCommandPrefix() {
  const env = process.env.PROMPTX_ENV
  
  if (env === 'development') {
    return 'pnpm start'
  } else {
    return 'npx dpml-prompt@snapshot'
  }
}

const COMMAND_PREFIX = getCommandPrefix()

// 静态命令常量
const COMMANDS = {
  INIT: `${COMMAND_PREFIX} init`,
  WELCOME: `${COMMAND_PREFIX} welcome`,
  ACTION: `${COMMAND_PREFIX} action`,
  LEARN: `${COMMAND_PREFIX} learn`,
  RECALL: `${COMMAND_PREFIX} recall`,
  REMEMBER: `${COMMAND_PREFIX} remember`,
  HELP: `${COMMAND_PREFIX} help`
}

// 带参数的命令构建函数
const buildCommand = {
  action: (roleId) => `${COMMAND_PREFIX} action ${roleId}`,
  learn: (resource) => `${COMMAND_PREFIX} learn ${resource}`,
  recall: (query = '') => `${COMMAND_PREFIX} recall${query ? ' ' + query : ''}`,
  remember: (content = '<content>') => `${COMMAND_PREFIX} remember${content !== '<content>' ? ' "' + content + '"' : ' <content>'}`
}

// 为了向后兼容，保留函数式API
function getCommands() {
  return COMMANDS
}

function getBuildCommand() {
  return buildCommand
}

function detectCommandPrefix() {
  return COMMAND_PREFIX
}



// 系统路径配置（静态）
const PATHS = {
  POUCH_DIR: '.promptx',
  MEMORY_DIR: '.promptx/memory',
  STATE_FILE: '.promptx/pouch.json',
  MEMORY_FILE: '.promptx/memory/declarative.md'
}

// 版本信息
const VERSION = '0.0.1'

// 系统状态
const STATES = {
  INITIALIZED: 'initialized',
  ROLE_DISCOVERY: 'role_discovery',
  ACTION_PLAN_GENERATED: 'action_plan_generated',
  LEARNED_ROLE: 'learned_role',
  MEMORY_SAVED: 'memory_saved',
  RECALL_WAITING: 'recall-waiting'
}

// 导出
module.exports = {
  // 固定命令前缀
  COMMAND_PREFIX,
  
  // 命令常量
  COMMANDS,
  buildCommand,
  
  // 向后兼容的函数式API
  getCommands,
  getBuildCommand,
  detectCommandPrefix,
  
  // 其他静态常量
  PATHS,
  VERSION,
  STATES
}
