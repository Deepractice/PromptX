/**
 * MCP 工具定义 - 共享配置
 * 统一管理所有MCP工具的描述和Schema定义，避免重复维护
 */

const fs = require('fs');
const path = require('path');

/**
 * 参数转换函数映射
 * 因为函数不能在JSON中存储，所以在这里单独定义
 */
const CONVERTERS = {
  promptx_init: (args) => {
    if (args && args.workingDirectory) {
      return [{ workingDirectory: args.workingDirectory, ideType: args.ideType }];
    }
    return [];
  },
  
  promptx_welcome: () => [],
  
  promptx_action: (args) => args && args.role ? [args.role] : [],
  
  promptx_learn: (args) => args && args.resource ? [args.resource] : [],
  
  promptx_recall: (args) => {
    if (!args || !args.role) {
      throw new Error('role 参数是必需的');
    }
    const result = [];
    
    // role参数作为第一个位置参数
    result.push(args.role);
    
    // 处理query参数
    if (args && args.query && typeof args.query === 'string' && args.query.trim() !== '') {
      result.push(args.query);
    }
    
    return result;
  },
  
  promptx_remember: (args) => {
    if (!args || !args.role) {
      throw new Error('role 参数是必需的');
    }
    if (!args || !args.engrams || !Array.isArray(args.engrams)) {
      throw new Error('engrams 参数是必需的且必须是数组');
    }
    if (args.engrams.length === 0) {
      throw new Error('engrams 数组不能为空');
    }
    
    const result = [];
    
    // role作为第一个参数
    result.push(args.role);
    
    // 将engrams数组序列化为JSON字符串作为第二个参数
    result.push(JSON.stringify(args.engrams));
    
    return result;
  },
  
  promptx_tool: (args) => {
    if (!args || !args.tool_resource || !args.parameters) {
      throw new Error('tool_resource 和 parameters 参数是必需的');
    }
    const result = [args.tool_resource, args.parameters];
    
    if (args.rebuild) {
      result.push('--rebuild');
    }
    
    if (args.timeout) {
      result.push('--timeout', args.timeout);
    }
    
    return result;
  },
  
  promptx_think: (args) => {
    if (!args || !args.role) {
      throw new Error('role 参数是必需的');
    }
    if (!args || !args.thought || typeof args.thought !== 'object') {
      throw new Error('thought 参数是必需的且必须是对象');
    }
    if (!args.thought.goalEngram) {
      throw new Error('thought 必须包含 goalEngram');
    }
    
    const result = [];
    
    // role作为第一个参数
    result.push(args.role);
    
    // 将thought对象序列化为JSON字符串作为第二个参数
    result.push(JSON.stringify(args.thought));
    
    // templateName作为第三个参数（可选）
    if (args.templateName) {
      result.push(args.templateName);
    }
    
    return result;
  }
};

/**
 * 加载所有工具定义
 */
function loadToolDefinitions() {
  const definitionsDir = path.join(__dirname, 'definitions');
  const definitions = [];
  
  // 读取所有 JS 文件
  // 暂时禁用 promptx_think 工具，避免与 promptx_action 功能重叠造成用户困惑
  // Issue #201: 保留代码，仅禁用注册，便于后续重新启用或重新设计
  const files = fs.readdirSync(definitionsDir)
    .filter(file => file.endsWith('.js'))
    .filter(file => file !== 'promptx_think.js'); // 暂时禁用 think 工具
  
  for (const file of files) {
    const filePath = path.join(definitionsDir, file);
    const definition = require(filePath);
    
    // 添加对应的转换函数
    const toolName = definition.name;
    if (CONVERTERS[toolName]) {
      definition.convertToCliArgs = CONVERTERS[toolName];
    }
    
    definitions.push(definition);
  }
  
  return definitions;
}

/**
 * 工具定义配置
 */
const TOOL_DEFINITIONS = loadToolDefinitions();

/**
 * 获取所有工具定义 - 用于MCP Server
 */
function getToolDefinitions() {
  return TOOL_DEFINITIONS.map(tool => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema
  }));
}

/**
 * 获取指定工具的定义
 */
function getToolDefinition(toolName) {
  return TOOL_DEFINITIONS.find(tool => tool.name === toolName);
}

/**
 * 获取指定工具的参数转换函数
 */
function getToolCliConverter(toolName) {
  const tool = getToolDefinition(toolName);
  return tool ? tool.convertToCliArgs : null;
}

/**
 * 获取所有工具名称
 */
function getToolNames() {
  return TOOL_DEFINITIONS.map(tool => tool.name);
}

module.exports = {
  TOOL_DEFINITIONS,
  getToolDefinitions,
  getToolDefinition,
  getToolCliConverter,
  getToolNames
};