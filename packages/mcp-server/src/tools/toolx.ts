import type { ToolWithHandler } from '~/interfaces/MCPServer.js';
import { MCPOutputAdapter } from '~/utils/MCPOutputAdapter.js';

const outputAdapter = new MCPOutputAdapter();

export const toolxTool: ToolWithHandler = {
  name: 'toolx',
  description: `🔧 [ToolX运行时] PromptX工具生态的执行环境

⚠️ AI必读：三个致命错误
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ 直接调用toolx → 必须用 mcp__promptx__toolx
❌ execute不传parameters → 必须传对象 {}
❌ parameters传null → 必须是对象，不能null/undefined

✅ 正确调用：
手册：{tool_resource: '@tool://filesystem', mode: 'manual'}
执行：{tool_resource: '@tool://filesystem', mode: 'execute', parameters: {method: 'write_file', path: '...', content: '...'}}

🔴 铁律：第一次用任何工具，必须先manual看手册！
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 理解ToolX：小程序运行时
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• MCP = 操作系统（提供基础能力）
• PromptX = 微信App（应用平台）
• ToolX = 小程序运行时（本工具）
• @tool://xxx = 具体小程序（功能实现）

调用链：AI → mcp__promptx__toolx → @tool://xxx → 执行
作用：统一工具生态，平台无关，行为一致
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 核心场景（记住这4个）:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1️⃣ 新工具：manual → execute
2️⃣ 需API：manual → configure → execute
3️⃣ 报错了：
   参数错 → manual 看格式
   依赖缺 → rebuild 重建
   没配置 → configure 设置
4️⃣ 调试：log 查历史 → 定位问题
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 六种模式精简说明:

【manual】查看手册（首次必用）
{tool_resource: '@tool://name', mode: 'manual'}

【execute】执行功能（默认模式）
{tool_resource: '@tool://name', mode: 'execute', parameters: {...}}
⚠️ parameters必须是对象，不能为null

【configure】配置环境变量
查看：{tool_resource: '@tool://name', mode: 'configure'}
设置：{tool_resource: '@tool://name', mode: 'configure', parameters: {KEY: 'value'}}

【rebuild】重建依赖（解决依赖问题）
{tool_resource: '@tool://name', mode: 'rebuild', parameters: {...}}

【log】查看日志（调试用）
最近：{..., mode: 'log', parameters: {action: 'tail', lines: 50}}
搜索：{..., mode: 'log', parameters: {action: 'search', keyword: 'error'}}
错误：{..., mode: 'log', parameters: {action: 'errors', limit: 20}}

【dryrun】测试运行（不执行真实操作）
{tool_resource: '@tool://name', mode: 'dryrun', parameters: {...}}

核心能力:
• JavaScript工具动态加载执行
• 环境变量隔离管理
• 自动npm依赖安装
• 沙箱执行环境
• 完整手册系统

记住：
1. 本工具在MCP中叫 mcp__promptx__toolx
2. execute模式的parameters不能省略或为null
3. 第一次用工具必须先manual
4. 遇错先分析错误类型，对症下药`,
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
        enum: ['execute', 'manual', 'configure', 'rebuild', 'log', 'dryrun'],
        description: '执行模式：execute(执行工具), manual(查看手册), configure(配置环境变量), rebuild(重建沙箱), log(查询日志), dryrun(干运行测试)'
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