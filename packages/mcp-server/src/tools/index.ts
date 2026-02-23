/**
 * 工具集合导出
 */

// PromptX 核心工具
export { discoverTool, createDiscoverTool } from './welcome.js';
export { actionTool, createActionTool } from './action.js';
export { projectTool } from './project.js';
// export { learnTool } from './learn.js';  // 暂时禁用 learn 工具
export { recallTool } from './recall.js';
export { rememberTool } from './remember.js';
export { toolxTool } from './toolx.js';

import { createDiscoverTool } from './welcome.js';
import { createActionTool } from './action.js';
import { projectTool } from './project.js';
// import { learnTool } from './learn.js';  // 暂时禁用 learn 工具
import { recallTool } from './recall.js';
import { rememberTool } from './remember.js';
import { toolxTool } from './toolx.js';
import type { ToolWithHandler } from '~/interfaces/MCPServer.js';

/**
 * 根据 enableV2 标志创建工具列表（工具描述和行为随之变化）
 */
export function createAllTools(enableV2: boolean): ToolWithHandler[] {
  return [
    createDiscoverTool(enableV2),
    createActionTool(enableV2),
    projectTool,
    // learnTool,  // 暂时禁用 learn 工具
    recallTool,
    rememberTool,
    toolxTool
  ];
}

/**
 * 所有可用工具列表（向后兼容，默认启用 V2）
 */
export const allTools = createAllTools(true);
