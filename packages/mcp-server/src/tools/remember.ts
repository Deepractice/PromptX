import type { ToolWithHandler } from '~/interfaces/MCPServer.js';
import { MCPOutputAdapter } from '~/utils/MCPOutputAdapter.js';

const outputAdapter = new MCPOutputAdapter();

export const rememberTool: ToolWithHandler = {
  name: 'remember',
  description: `Save knowledge to a role's memory network

## MANDATORY: Remember Before Conversation Ends

**CRITICAL RULE**: Before a conversation ends, you MUST call remember to save key insights. Every conversation without remember = knowledge lost forever.

**Trigger signals for remember:**
- User says "thanks" / "bye" / conversation naturally wrapping up
- You just solved a problem or answered a complex question
- You learned something new about the user's project/preferences
- Recall returned empty — you MUST fill the gap after answering
- Every 5-7 rounds of deep discussion — save intermediate insights

> Think of remember as "saving your game". No save = start over next time.

## When to Use

- **Conversation ending** (MANDATORY) — save all key insights before goodbye
- After answering a question — save key insights
- After multi-round recall — summarize findings
- Learned something new — persist it
- Solved a problem — record the solution
- Recall returned empty — fill the gap
- User corrected you — save the correction
- Discovered user preferences — save them

## Engram Types

| Type | Use For | Example |
|---|---|---|
| ATOMIC | Facts, entities, concrete info | "Redis default port is 6379" |
| LINK | Relationships, connections | "Database uses connection pool for management" |
| PATTERN | Processes, methodologies | "Login → select item → checkout" |

## What to Save (Checklist)

- Key facts and decisions made during conversation
- User preferences and project context
- Problems solved and solutions found
- Corrections and clarifications
- Patterns and workflows discovered
- Important relationships between concepts

## Occam's Razor Principle

Strip content to minimum essential words. For each word ask: does removing it change the meaning? If not, remove it.

## Examples

\`\`\`json
{
  "role": "luban",
  "engrams": [{
    "content": "Redis default port is 6379",
    "schema": "Redis port 6379",
    "strength": 0.7,
    "type": "ATOMIC"
  }]
}
\`\`\`

\`\`\`json
{
  "role": "luban",
  "engrams": [{
    "content": "Login then select items then pay",
    "schema": "login select-item pay",
    "strength": 0.8,
    "type": "PATTERN"
  }]
}
\`\`\``,
  inputSchema: {
    type: 'object',
    properties: {
      role: {
        type: 'string',
        description: 'Role ID to save memories for, e.g.: java-developer, product-manager'
      },
      engrams: {
        type: 'array',
        description: 'Array of engram objects for batch memory storage. Each contains content, schema, strength, type',
        items: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: 'Raw experience content to save'
            },
            schema: {
              type: 'string',
              description: 'Space-separated keywords extracted from content. Use original words, do not invent new ones.'
            },
            strength: {
              type: 'number',
              description: 'Memory strength (0-1). Higher = more important, affects retrieval priority.',
              minimum: 0,
              maximum: 1,
              default: 0.8
            },
            type: {
              type: 'string',
              description: 'Engram type: ATOMIC (facts, entities), LINK (relationships, connections), PATTERN (processes, methodologies)',
              enum: ['ATOMIC', 'LINK', 'PATTERN']
            }
          },
          required: ['content', 'schema', 'strength', 'type']
        },
        minItems: 1
      }
    },
    required: ['role', 'engrams']
  },
  handler: async (args: { role: string; engrams: string[] }) => {
    const core = await import('@promptx/core');
    const coreExports = core.default || core;

    // 检查是否为 v2 角色
    try {
      const { RolexActionDispatcher } = (coreExports as any).rolex;
      const dispatcher = new RolexActionDispatcher();
      if (await dispatcher.isV2Role(args.role)) {
        return outputAdapter.convertToMCPFormat({
          type: 'error',
          content: `❌ V2 角色 "${args.role}" 不支持 remember 工具

V2 角色（RoleX）使用数据库存储和认知循环系统，请使用 learning 工具：

🧠 **自我沉淀（learning 工具）**：
• reflect - 反思遇到的问题，创建经验
• realize - 总结领悟的原则
• master - 沉淀为标准操作流程（SOP）
• synthesize - 向其他角色传授知识
• forget - 遗忘过时的知识

**示例**（learning 工具）：
\`\`\`json
{
  "operation": "reflect",
  "role": "${args.role}",
  "encounters": [],
  "experience": "Feature: 学到的经验\\n  Scenario: 具体场景\\n    Then 关键发现",
  "id": "exp-1"
}
\`\`\`

当前 remember 工具仅支持 V1 角色（DPML 格式）。`
        });
      }
    } catch (e) {
      // 如果检查失败，继续执行（可能是 v1 角色）
      console.warn('[remember] V2 role check failed, continuing:', e);
    }

    const cli = (coreExports as any).cli || (coreExports as any).pouch?.cli;

    if (!cli || !cli.execute) {
      throw new Error('CLI not available in @promptx/core');
    }

    const result = await cli.execute('remember', [args]);
    return outputAdapter.convertToMCPFormat(result);
  }
};
