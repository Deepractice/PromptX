/**
 * MCP Tool Definitions Index
 * Exports all PromptX MCP tool definitions
 */

export { default as promptx_action } from './promptx_action'
export { default as promptx_init } from './promptx_init'
export { default as promptx_learn } from './promptx_learn'
export { default as promptx_recall } from './promptx_recall'
export { default as promptx_remember } from './promptx_remember'
export { default as promptx_toolx } from './promptx_toolx'
export { default as promptx_welcome } from './promptx_welcome'

// Export all tools as an array
import promptx_action from './promptx_action'
import promptx_init from './promptx_init'
import promptx_learn from './promptx_learn'
import promptx_recall from './promptx_recall'
import promptx_remember from './promptx_remember'
import promptx_toolx from './promptx_toolx'
import promptx_welcome from './promptx_welcome'

export const tools = [
  promptx_action,
  promptx_init,
  promptx_learn,
  promptx_recall,
  promptx_remember,
  promptx_toolx,
  promptx_welcome
].filter(Boolean)