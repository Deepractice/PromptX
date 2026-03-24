import type { ToolWithHandler } from '~/interfaces/MCPServer.js';
import { MCPOutputAdapter } from '~/utils/MCPOutputAdapter.js';

const outputAdapter = new MCPOutputAdapter();

export function createLearningTool(enableV2: boolean): ToolWithHandler {
  const description = `V2 role cognitive learning cycle - reflect, distill principles, and teach knowledge

## Operations

| Operation | Required Params | Description |
|-----------|----------------|-------------|
| reflect | encounters, experience, id | Create experience from encounters (pass encounters:[] to create directly) |
| realize | experiences, principle, id | Distill principles from experiences |
| master | procedure, id | Create standard procedures from principles |
| forget | nodeId | Remove outdated knowledge |
| synthesize | role, name, source, type | Teach knowledge to another role |
| skill | locator | Load a skill resource |

## Learning Cycle

\`\`\`
reflect (create experience) → realize (distill principle) → master (create procedure) → synthesize (teach to others)
\`\`\`

## Key Rules

- All \`experience\`, \`principle\`, \`procedure\`, and \`source\` MUST use Gherkin Feature format
- \`reflect\`: pass \`encounters: []\` to create experience directly without consuming encounters
- \`realize\`: \`experiences\` must be an array of existing experience IDs
- \`synthesize\`: \`role\` is the **target** role (who receives knowledge), not the current role

## Examples

\`\`\`json
{ "operation": "reflect", "role": "_", "encounters": [], "experience": "Feature: API Design Experience\\n  Scenario: Problem\\n    Then learned to use pagination", "id": "exp-1" }
{ "operation": "realize", "role": "_", "experiences": ["exp-1"], "principle": "Feature: API Principle\\n  Scenario: Always paginate\\n    Then use cursor-based pagination", "id": "p-1" }
{ "operation": "master", "role": "_", "procedure": "Feature: API SOP\\n  Scenario: New endpoint\\n    When creating endpoint\\n    Then add pagination\\n    And add rate limiting", "id": "sop-1" }
{ "operation": "synthesize", "role": "backend-dev", "name": "api-knowledge", "source": "Feature: API Best Practices...", "type": "knowledge" }
{ "operation": "forget", "role": "_", "nodeId": "outdated-id" }
\`\`\`

## Prerequisites

A V2 role must be activated first via the \`action\` tool before using learning operations (except synthesize).`;

  return {
    name: 'learning',
    description,
    inputSchema: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: ['reflect', 'realize', 'master', 'forget', 'synthesize', 'skill'],
          description: 'Learning operation to perform'
        },
        role: {
          type: 'string',
          description: 'Active role ID ("_" for current role), or target role ID for synthesize'
        },
        name: {
          type: 'string',
          description: 'Knowledge name for synthesize operation'
        },
        source: {
          type: 'string',
          description: 'Gherkin source text for synthesize operation'
        },
        type: {
          type: 'string',
          description: 'Synthesize type: "knowledge", "experience", or "voice"'
        },
        id: {
          type: 'string',
          description: 'Custom ID for the created node (reflect/realize/master)'
        },
        encounters: {
          type: 'array',
          items: { type: 'string' },
          description: 'Encounter IDs for reflect. Pass [] to create experience directly'
        },
        experiences: {
          type: 'array',
          items: { type: 'string' },
          description: 'Experience IDs for realize. Must be existing experience IDs'
        },
        experience: {
          type: 'string',
          description: 'Gherkin Feature text for reflect operation'
        },
        principle: {
          type: 'string',
          description: 'Gherkin Feature text for realize operation'
        },
        procedure: {
          type: 'string',
          description: 'Gherkin Feature text for master operation'
        },
        nodeId: {
          type: 'string',
          description: 'Node ID to remove for forget operation'
        },
        locator: {
          type: 'string',
          description: 'Resource locator for skill (e.g., npm:@scope/package)'
        }
      },
      required: ['role', 'operation']
    },
    handler: async (args: Record<string, any>) => {
      const operation = args.operation;
      const core = await import('@promptx/core');
      const coreExports = core.default || core;
      const { RolexActionDispatcher } = (coreExports as any).rolex;
      const dispatcher = new RolexActionDispatcher();

      // 检查角色是否为 V1（不支持 learning 操作）
      // synthesize 的 role 是目标角色，不做检查
      if (args.role && args.role !== '_' && operation !== 'synthesize') {
        try {
          const isV2 = await dispatcher.isV2Role(args.role);
          if (!isV2) {
            return outputAdapter.convertToMCPFormat({
              type: 'error',
              content: `❌ V1 角色 "${args.role}" 不支持 learning 工具

learning 工具仅支持 V2 角色（RoleX）。V1 角色（DPML）请使用 recall/remember 工具管理知识。

**V1 角色知识管理**：
• \`recall\` - 检索角色记忆
• \`remember\` - 保存新知识

**如需使用 learning 工具**，请先创建 V2 角色：
\`\`\`json
{ "operation": "born", "role": "_", "name": "my-role", "source": "Feature: ..." }
\`\`\``
            });
          }
        } catch (e) {
          console.warn('[learning] V2 role check failed, continuing:', e);
        }
      }

      const result = await dispatcher.dispatch(operation, args);
      return outputAdapter.convertToMCPFormat(result);
    }
  };
}

export const learningTool: ToolWithHandler = createLearningTool(true);
