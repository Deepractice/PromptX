import type { ToolWithHandler } from '~/interfaces/MCPServer.js';
import { MCPOutputAdapter } from '~/utils/MCPOutputAdapter.js';

const outputAdapter = new MCPOutputAdapter();

export const toolxTool: ToolWithHandler = {
  name: 'toolx',
  description: `🔧 [ToolX多模式执行器] 执行、配置、查看PromptX工具体系中的JavaScript工具
基于PromptX工具生态系统，提供安全可控的工具执行环境，支持多种操作模式。

🎯 四种执行模式:
1. execute（默认）- 执行工具的业务逻辑
2. manual - 查看工具的使用手册
3. configure - 配置工具的环境变量
4. rebuild - 强制重建沙箱后执行

📋 使用场景示例:

【执行工具】mode: 'execute' 或省略
- 正常执行工具功能
- 需要传递业务参数
- 示例: {tool_resource: '@tool://text-analyzer', parameters: {text: 'hello'}}

【查看手册】mode: 'manual'
- 查看工具的完整使用说明
- 不需要parameters参数
- 示例: {tool_resource: '@tool://text-analyzer', mode: 'manual'}

【配置环境】mode: 'configure'
- 设置API密钥、账号密码等环境变量
- parameters为空时查看当前配置状态
- 示例: {tool_resource: '@tool://email-manager', mode: 'configure', parameters: {EMAIL: 'user@gmail.com'}}

【重建执行】mode: 'rebuild'
- 遇到依赖问题时强制重建沙箱
- 清理旧环境并重新安装依赖
- 示例: {tool_resource: '@tool://text-analyzer', mode: 'rebuild', parameters: {text: 'hello'}}

核心执行能力:
- 动态加载和执行JavaScript工具模块
- 工具级环境变量隔离管理
- 自动处理工具依赖的npm包安装
- 提供隔离的执行沙箱环境
- 支持查看工具手册文档
- 配置管理敏感信息（API Keys等）

使用建议:
1. 首次使用工具前，先用 mode: 'manual' 查看手册
2. 需要API密钥的工具，先用 mode: 'configure' 配置
3. 遇到依赖错误时，尝试 mode: 'rebuild' 重建环境
4. 日常使用直接调用或用 mode: 'execute'

你应该:
1. 根据用户需求选择合适的mode
2. 配置环境变量时注意保护敏感信息
3. 出现问题时尝试rebuild模式
4. 查看manual了解工具的完整功能`,
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
        enum: ['execute', 'manual', 'configure', 'rebuild'],
        description: '执行模式：execute(执行工具), manual(查看手册), configure(配置环境变量), rebuild(重建沙箱)',
        default: 'execute'
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
    required: ['tool_resource']
  },
  handler: async (args: { tool_resource: string; mode?: string; parameters?: any; timeout?: number }) => {
    const core = await import('@promptx/core');
    const coreExports = core.default || core;
    const cli = (coreExports as any).cli || (coreExports as any).pouch?.cli;
    
    if (!cli || !cli.execute) {
      throw new Error('CLI not available in @promptx/core');
    }
    
    // 构建CLI参数
    const cliArgs = [args.tool_resource];
    
    // 添加mode（如果指定且不是默认的execute）
    if (args.mode && args.mode !== 'execute') {
      cliArgs.push(args.mode);
    }
    
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