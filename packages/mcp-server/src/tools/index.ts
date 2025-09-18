/**
 * 工具集合导出
 */

// PromptX 核心工具
export { discoverTool } from './welcome.js';
export { actionTool } from './action.js';
export { initTool } from './init.js';
// export { learnTool } from './learn.js';  // 暂时禁用 learn 工具
export { recallTool } from './recall.js';
export { rememberTool } from './remember.js';
export { toolxTool } from './toolx.js';

import { discoverTool } from './welcome.js';
import { actionTool } from './action.js';
import { initTool } from './init.js';
// import { learnTool } from './learn.js';  // 暂时禁用 learn 工具
import { recallTool } from './recall.js';
import { rememberTool } from './remember.js';
import { toolxTool } from './toolx.js';

/**
 * 所有可用工具列表
 */
export const allTools = [
  // PromptX 核心工具
  discoverTool,
  actionTool,
  initTool,
  // learnTool,  // 暂时禁用 learn 工具
  recallTool,
  rememberTool,
  toolxTool
];