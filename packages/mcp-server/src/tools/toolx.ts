import type { ToolWithHandler } from '~/interfaces/MCPServer.js';
import { MCPOutputAdapter } from '~/utils/MCPOutputAdapter.js';

const outputAdapter = new MCPOutputAdapter();

export const toolxTool: ToolWithHandler = {
  name: 'toolx',
  description: `🔧 [ToolX多模式执行器] 执行、配置、查看PromptX工具体系中的JavaScript工具
基于PromptX工具生态系统，提供安全可控的工具执行环境，支持多种操作模式。

⚠️ 重要原则：提高执行成功率的黄金法则
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【第一次使用工具时的标准流程】
1️⃣ 先用 mode: 'manual' 查看手册，了解参数要求
2️⃣ 如有环境变量需求，用 mode: 'configure' 配置
3️⃣ 最后用 mode: 'execute' 执行工具

❌ 错误做法：直接执行未知工具 → 参数错误 → 执行失败
✅ 正确做法：先看手册 → 理解参数 → 正确执行
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 五种执行模式详解:

【1. manual模式】- 查看工具使用手册（首次必用）
目的：了解工具功能、参数格式、使用限制
使用：{tool_resource: '@tool://tool-name', mode: 'manual'}
特点：不需要parameters参数，返回完整使用说明

【2. configure模式】- 配置工具环境变量
目的：设置API密钥、账号密码等敏感信息
查看：{tool_resource: '@tool://tool-name', mode: 'configure'}
设置：{tool_resource: '@tool://tool-name', mode: 'configure', parameters: {KEY: 'value'}}
特点：parameters为空时显示配置状态，有值时设置环境变量

【3. execute模式】- 执行工具业务逻辑（默认）
目的：执行工具的实际功能
使用：{tool_resource: '@tool://tool-name', parameters: {...}}
特点：必须按照manual中的参数格式传递parameters

【4. rebuild模式】- 强制重建沙箱后执行
目的：解决依赖问题、清理缓存
使用：{tool_resource: '@tool://tool-name', mode: 'rebuild', parameters: {...}}
特点：删除旧沙箱，重新安装依赖，然后执行

【5. log模式】- 查询工具执行日志
目的：查看工具执行历史，调试问题，分析错误
查看最近日志：{tool_resource: '@tool://tool-name', mode: 'log', parameters: {action: 'tail', lines: 50}}
搜索日志：{tool_resource: '@tool://tool-name', mode: 'log', parameters: {action: 'search', keyword: 'error'}}
查看错误：{tool_resource: '@tool://tool-name', mode: 'log', parameters: {action: 'errors', limit: 20}}
统计信息：{tool_resource: '@tool://tool-name', mode: 'log', parameters: {action: 'stats'}}
清空日志：{tool_resource: '@tool://tool-name', mode: 'log', parameters: {action: 'clear'}}
特点：无需执行工具即可查看历史日志，支持多种查询方式

📋 典型使用场景:

场景1：使用新工具
- 步骤1：mode: 'manual' → 阅读参数说明
- 步骤2：mode: 'execute' → 按说明执行

场景2：使用需要API的工具
- 步骤1：mode: 'manual' → 了解需要哪些环境变量
- 步骤2：mode: 'configure' → 设置API密钥
- 步骤3：mode: 'execute' → 执行工具

场景3：工具执行报错
- 如果是参数错误 → mode: 'manual' 查看正确格式
- 如果是依赖错误 → mode: 'rebuild' 重建环境
- 如果是环境变量缺失 → mode: 'configure' 配置
- 如果需要调试 → mode: 'log' 查看执行日志

核心能力:
- 动态加载执行JavaScript工具
- 工具级环境变量隔离管理
- 自动npm依赖安装
- 隔离沙箱执行环境
- 完整的手册文档系统

强制要求:
1. 🚫 禁止在未查看manual的情况下盲目执行工具
2. 🚫 禁止猜测参数格式，必须按manual要求传参
3. ✅ 必须先了解工具功能再执行
4. ✅ 必须按照manual中的参数示例构造参数

你应该:
1. 第一次接触工具时，永远先用manual模式
2. 严格按照manual中的参数格式传递参数
3. 遇到错误时，回到manual查看正确用法
4. 需要配置的工具，先configure再execute
5. 依赖问题用rebuild模式解决`,
  inputSchema: {
    type: 'object',
    properties: {
      tool_resource: {
        type: 'string',
        description: '工具资源引用，格式：@tool://tool-name',
        pattern: '^@tool://.+'
      },
      mode: {
        type: 'string',
        enum: ['execute', 'manual', 'configure', 'rebuild', 'log'],
        description: '执行模式：execute(执行工具), manual(查看手册), configure(配置环境变量), rebuild(重建沙箱), log(查询日志)'
      },
      parameters: {
        type: 'object',
        description: '传递给工具的参数对象（根据mode不同含义不同）'
      },
      timeout: {
        type: 'number',
        description: '工具执行超时时间（毫秒），默认30000ms，仅execute和rebuild模式使用',
        default: 30000
      }
    },
    required: ['tool_resource', 'mode']
  },
  handler: async (args: { tool_resource: string; mode: string; parameters?: any; timeout?: number }) => {
    const core = await import('@promptx/core');
    const coreExports = core.default || core;
    const cli = (coreExports as any).cli || (coreExports as any).pouch?.cli;
    
    if (!cli || !cli.execute) {
      throw new Error('CLI not available in @promptx/core');
    }
    
    // 构建CLI参数
    const cliArgs = [args.tool_resource];
    
    // 添加mode
    cliArgs.push(args.mode);
    
    // 添加parameters（如果有）
    if (args.parameters) {
      cliArgs.push(JSON.stringify(args.parameters));
    }
    
    // 添加timeout
    if (args.timeout) {
      cliArgs.push('--timeout', args.timeout.toString());
    }
    
    const result = await cli.execute('toolx', cliArgs);
    return outputAdapter.convertToMCPFormat(result);
  }
};