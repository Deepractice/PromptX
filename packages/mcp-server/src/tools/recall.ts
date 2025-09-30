import type { ToolWithHandler } from '~/interfaces/MCPServer.js';
import { MCPOutputAdapter } from '~/utils/MCPOutputAdapter.js';

const outputAdapter = new MCPOutputAdapter();

export const recallTool: ToolWithHandler = {
  name: 'recall',
  description: `【认知习惯】基于记忆网络的语义场激活

【规范名称】promptx_recall
【调用说明】在提示词中使用 promptx_recall，实际调用时自动映射到 mcp__[server]__recall

⚡ 触发时机（形成条件反射）：
看到用户问题 → 联想相关关键词 → recall激活记忆

🧠 核心机制：

从关键词开始，在记忆网络中激活扩散，找到相关记忆。

**query参数（激活起点）**：
- 单个关键词："PromptX" → 从该节点开始扩散
- 多个关键词："PromptX 测试 修复" → 创建虚拟mind节点，多中心激活
- 不传query → DMN模式，自动选择5个枢纽节点（连接度最高）

**mode参数（激活模式）**：
- balanced（默认）：阈值0.1，平衡精确和联想
- focused：阈值0.2，精确查找，常用记忆优先
- creative：阈值0.05，广泛联想，远距离连接

**返回结果**：
- 激活的记忆网络图（节点+连接）
- 相关的记忆内容（engrams）

⚠️ **重要约束**：
只有网络中实际存在的节点才能被激活。如果关键词不在网络中，系统会自动tokenize并尝试找最接近的节点，找不到则返回空。

💡 **提示**：
- 优先使用action返回的网络图中的节点，成功率更高
- 对话中recall过的节点也都可以直接使用
- 如果不确定网络中有什么，可以先用DMN模式（不传query）查看全貌

记住：记忆网络是认知地图，从节点开始探索！`,
  inputSchema: {
    type: 'object',
    properties: {
      role: {
        type: 'string',
        description: '要检索记忆的角色ID，如：java-developer, product-manager, copywriter'
      },
      query: {
        oneOf: [
          { type: 'string' },
          { type: 'null' }
        ],
        description: '检索关键词：单词或空格分隔的多词(string)、或null(DMN模式,自动选择枢纽节点)。多词示例："PromptX 测试 修复"。必须使用记忆网络图中实际存在的词。'
      },
      mode: {
        type: 'string',
        enum: ['creative', 'balanced', 'focused'],
        description: '认知激活模式：creative(创造性探索，广泛联想)、balanced(平衡模式，默认)、focused(聚焦检索，精确查找)'
      }
    },
    required: ['role']
  },
  handler: async (args: { role: string; query?: string | null; mode?: string }) => {
    const core = await import('@promptx/core');
    const coreExports = core.default || core;
    const cli = (coreExports as any).cli || (coreExports as any).pouch?.cli;

    if (!cli || !cli.execute) {
      throw new Error('CLI not available in @promptx/core');
    }

    // 构建 CLI 参数，支持 string | string[] | null
    const cliArgs: any[] = [{
      role: args.role,
      query: args.query ?? null,  // undefined转为null
      mode: args.mode
    }];

    const result = await cli.execute('recall', cliArgs);
    return outputAdapter.convertToMCPFormat(result);
  }
};