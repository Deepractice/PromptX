import type { ToolWithHandler } from '~/interfaces/MCPServer.js';
import { MCPOutputAdapter } from '~/utils/MCPOutputAdapter.js';

const outputAdapter = new MCPOutputAdapter();

export const recallTool: ToolWithHandler = {
  name: 'recall',
  description: `Retrieve memories from a role's semantic network

## MANDATORY: Recall at Conversation Start

**CRITICAL RULE**: When a role is active, you MUST call recall BEFORE answering the user's first message. This is not optional — skipping recall means losing all accumulated knowledge.

\`\`\`
Step 1: recall(role, null)          → DMN scan, see full memory landscape
Step 2: recall(role, "relevant-kw") → drill into topic-specific memories
Step 3: Answer using recalled context
\`\`\`

> Without recall, every conversation starts from zero. With recall, you build on past experience.

## Workflow

1. **DMN scan** — \`recall(role, null)\` → see the full memory landscape (hub nodes)
2. **Drill down** — pick keywords from the network → \`recall(role, "keyword")\` → get details
3. **Repeat** — follow new keywords in each result until you have enough context

> Always start with DMN (null query) to see what exists. Never guess keywords.

## When to Recall

- **Conversation start** (MANDATORY) — always recall before first response
- **New topic introduced** — recall related memories before answering
- **User asks about past context** — recall to find previous discussions
- **Before making decisions** — check if past experience is relevant
- **Mid-conversation** — when you realize a topic connects to past knowledge

## Query Parameter

- \`null\` → **DMN mode** (recommended entry point): activates hub nodes, shows full network
- Single keyword: \`"PromptX"\` → spread from that node
- Multiple keywords: \`"PromptX testing fix"\` → multi-center activation

## Mode Parameter

- \`balanced\` (default): balance precision and association
- \`focused\`: precise lookup, frequent memories first
- \`creative\`: broad association, distant connections

## Examples

**DMN full scan (always do this first):**
\`\`\`json
{ "role": "luban", "query": null }
\`\`\`

**Keyword drill-down:**
\`\`\`json
{ "role": "luban", "query": "PromptX testing", "mode": "focused" }
\`\`\``,
  inputSchema: {
    type: 'object',
    properties: {
      role: {
        type: 'string',
        description: 'Role ID to recall memories from, e.g.: java-developer, product-manager'
      },
      query: {
        oneOf: [
          { type: 'string' },
          { type: 'null' }
        ],
        description: 'Query keywords: string (space-separated) or null (DMN mode — auto-select hub nodes). Keywords must exist in the memory network.'
      },
      mode: {
        type: 'string',
        enum: ['creative', 'balanced', 'focused'],
        description: 'Activation mode: creative (broad association), balanced (default), focused (precise lookup)'
      }
    },
    required: ['role']
  },
  handler: async (args: { role: string; query?: string | null; mode?: string }) => {
    const core = await import('@promptx/core');
    const coreExports = core.default || core;

    // 检查是否为 v2 角色
    try {
      const { RolexActionDispatcher } = (coreExports as any).rolex;
      const dispatcher = new RolexActionDispatcher();
      if (await dispatcher.isV2Role(args.role)) {
        return outputAdapter.convertToMCPFormat({
          type: 'error',
          content: `❌ V2 角色 "${args.role}" 不支持 recall 工具

V2 角色（RoleX）使用数据库存储和认知循环系统，请使用以下工具：

🔍 **查询角色知识**（action 工具）：
• identity - 查看角色完整身份和知识体系

📋 **目标与任务管理**（lifecycle 工具）：
• focus - 查看当前进行中的目标和任务

🧠 **自我沉淀**（learning 工具）：
• reflect - 反思遇到的问题，创建经验
• realize - 总结领悟的原则
• master - 沉淀为标准操作流程（SOP）
• synthesize - 向其他角色传授知识
• forget - 遗忘过时的知识

**示例 - 查看角色知识**（action 工具）：
\`\`\`json
{ "operation": "identity", "role": "${args.role}" }
\`\`\`

**示例 - 查看当前进度**（lifecycle 工具）：
\`\`\`json
{ "operation": "focus", "role": "${args.role}" }
\`\`\`

当前 recall 工具仅支持 V1 角色（DPML 格式）。`
        });
      }
    } catch (e) {
      // 如果检查失败，继续执行（可能是 v1 角色）
      console.warn('[recall] V2 role check failed, continuing:', e);
    }

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
