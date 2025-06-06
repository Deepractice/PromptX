/**
 * PromptX 系统常量配置
 * 统一管理命令格式、路径等配置信息
 */

// 命令前缀配置 - 约定大于配置
const COMMAND_PREFIX = 'npx dpml-prompt-local'

// 常用命令模板
const COMMANDS = {
  INIT: `${COMMAND_PREFIX} init`,
  HELLO: `${COMMAND_PREFIX} hello`,
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
  remember: (content = '<content>') => `${COMMAND_PREFIX} remember${content !== '<content>' ? ' "' + content + '"' : ' <content>'}`,
  register: (roleId) => `${COMMAND_PREFIX} register ${roleId}`,
  hello: () => `${COMMAND_PREFIX} hello`
}

// 系统路径配置
const PATHS = {
  POUCH_DIR: '.promptx',
  MEMORY_DIR: '.promptx/memory',
  STATE_FILE: '.promptx/pouch.json',
  MEMORY_FILE: '.promptx/memory/declarative.md'
}

// 版本信息
const VERSION = '0.0.2-local.1'

// 系统状态
const STATES = {
  INITIALIZED: 'initialized',
  ROLE_DISCOVERY: 'role_discovery',
  ACTION_PLAN_GENERATED: 'action_plan_generated',
  LEARNED_ROLE: 'learned_role',
  MEMORY_SAVED: 'memory_saved',
  RECALL_WAITING: 'recall-waiting'
}

module.exports = {
  COMMAND_PREFIX,
  COMMANDS,
  buildCommand,
  PATHS,
  VERSION,
  STATES
}
