/**
 * 工具集合导出
 */

// PromptX 核心工具
export { discoverTool } from './welcome.js';
export { actionTool } from './action.js';
export { projectTool } from './project.js';
// export { learnTool } from './learn.js';  // 暂时禁用 learn 工具
export { recallTool } from './recall.js';
export { rememberTool } from './remember.js';
export { toolxTool } from './toolx.js';
export { mcpTool } from './mcp.js';

import { discoverTool } from './welcome.js';
import { actionTool } from './action.js';
import { projectTool } from './project.js';
// import { learnTool } from './learn.js';  // 暂时禁用 learn 工具
import { recallTool } from './recall.js';
import { rememberTool } from './remember.js';
import { toolxTool } from './toolx.js';
import { mcpTool } from './mcp.js';

/**
 * 所有可用工具列表
 */
export const allTools = [
  // PromptX 核心工具
  discoverTool,
  actionTool,
  projectTool,
  // learnTool,  // 暂时禁用 learn 工具
  recallTool,
  rememberTool,
  toolxTool,
  mcpTool
];