/**
 * 工具集合导出
 */

export { echoTool } from './echo.js';
export { calculateTool } from './calculate.js';
export { delayTool } from './delay.js';
export { errorTool } from './error.js';
export { systemTool } from './system.js';

import { echoTool } from './echo.js';
import { calculateTool } from './calculate.js';
import { delayTool } from './delay.js';
import { errorTool } from './error.js';
import { systemTool } from './system.js';

/**
 * 所有可用工具列表
 */
export const allTools = [
  echoTool,
  calculateTool,
  delayTool,
  errorTool,
  systemTool
];