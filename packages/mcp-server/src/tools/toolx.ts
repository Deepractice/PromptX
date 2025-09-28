import type { ToolWithHandler } from '~/interfaces/MCPServer.js';
import { MCPOutputAdapter } from '~/utils/MCPOutputAdapter.js';
import yaml from 'js-yaml';

const outputAdapter = new MCPOutputAdapter();

export const toolxTool: ToolWithHandler = {
  name: 'toolx',

  description: `ToolX 是 PromptX 的工具运行时，用于加载和执行各种工具。

架构关系：
• 你（Agent/AI）在 Client 中运行（如 VSCode/Cursor）
• Client 通过 MCP 协议连接 MCP Server（PromptX）
• MCP Server 暴露工具，包括 toolx（即 mcp__promptx__toolx）
• toolx 是一个 MCP 工具，用于加载和执行 PromptX 生态的工具（tool://xxx）

⚠️ 重要：第一次使用任何工具必须先 mode: manual 查看手册，了解正确的参数格式。

调用方式：mcp__promptx__toolx，传入 yaml 字符串：

\`\`\`yaml
url: tool://工具名
mode: 模式
parameters:
  参数名: 参数值
  # 多行内容示例（注意竖线后换行，且内容要缩进）：
  content: |
    第一行内容
    第二行内容
    第三行内容
\`\`\`

mode 说明：
• manual - 查看工具手册【第一次必须先执行】
• execute - 执行工具功能（默认）
• configure - 配置环境变量
• rebuild - 重建依赖
• log - 查看日志
• dryrun - 模拟执行`,

  inputSchema: {
    type: 'object',
    properties: {
      yaml: {
        type: 'string',
        description: 'YAML 格式的工具调用配置'
      }
    },
    required: ['yaml']
  },

  handler: async (args: { yaml: string }) => {
    try {
      // YAML → JSON 转换
      const config = yaml.load(args.yaml) as any;

      // 验证必需字段
      if (!config.url) {
        throw new Error('缺少必需字段: url\n示例: url: tool://filesystem');
      }

      // 验证 URL 格式
      if (!config.url.startsWith('tool://')) {
        throw new Error(`url 格式错误: ${config.url}\n必须以 tool:// 开头`);
      }

      // 内部转换为 @tool:// 格式（保持与核心系统兼容）
      config.url = config.url.replace('tool://', '@tool://');

      // 获取核心模块
      const core = await import('@promptx/core');
      const coreExports = core.default || core;
      const cli = (coreExports as any).cli || (coreExports as any).pouch?.cli;

      if (!cli || !cli.execute) {
        throw new Error('CLI not available in @promptx/core');
      }

      // 构建 CLI 参数（保持原有接口）
      const cliArgs = [config.url];
      cliArgs.push(config.mode || 'execute');

      if (config.parameters) {
        cliArgs.push(JSON.stringify(config.parameters));
      }

      if (config.timeout) {
        cliArgs.push('--timeout', config.timeout.toString());
      }

      // 执行
      const result = await cli.execute('toolx', cliArgs);
      return outputAdapter.convertToMCPFormat(result);

    } catch (error: any) {
      // YAML 解析错误
      if (error.name === 'YAMLException') {
        // 检查是否是多行字符串问题
        if (error.message.includes('bad indentation') || error.message.includes('mapping entry')) {
          throw new Error(`YAML 格式错误: ${error.message}\n\n多行内容需要使用 | 符号，例如:\ncontent: |\n  这是第一行\n  这是第二行\n\n注意：竖线后要换行，内容要缩进2个空格`);
        }
        throw new Error(`YAML 格式错误: ${error.message}\n请检查缩进（使用空格）和语法`);
      }

      // 工具不存在
      if (error.message?.includes('Tool not found')) {
        const toolName = args.yaml.match(/url:\s*tool:\/\/(\w+)/)?.[1];
        throw new Error(`工具 '${toolName}' 不存在\n使用 discover 查看可用工具`);
      }

      throw error;
    }
  }
};