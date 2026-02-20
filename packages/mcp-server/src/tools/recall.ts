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