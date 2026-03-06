import type { ToolWithHandler } from '~/interfaces/MCPServer.js';
import { MCPOutputAdapter } from '~/utils/MCPOutputAdapter.js';

const outputAdapter = new MCPOutputAdapter();

const V2_DESCRIPTION_SECTION = `
**V2 Roles (RoleX)**: Full lifecycle management (born → want → plan → todo → synthesize).

On activate, version is auto-detected: V2 takes priority, falls back to V1 if not found.
Use \`version\` parameter to force a specific version: \`"v1"\` for DPML, \`"v2"\` for RoleX.`;

const V2_EXAMPLES = `
**V2 create role:**
\`\`\`json
{ "operation": "born", "role": "_", "name": "my-dev", "source": "Feature: ..." }
\`\`\`

**V2 activate role:**
\`\`\`json
{ "operation": "activate", "role": "my-dev" }
\`\`\`

**V2 create goal:**
\`\`\`json
{ "operation": "want", "role": "_", "name": "build-api", "source": "Feature: ..." }
\`\`\`

**V2 check focus:**
\`\`\`json
{ "operation": "focus", "role": "_" }
\`\`\`

**V2 finish task / achieve goal:**
\`\`\`json
{ "operation": "finish", "role": "_", "name": "task-id" }
{ "operation": "achieve", "role": "_", "experience": "learned..." }
\`\`\`

**V2 learning cycle (reflect → realize → master):**
\`\`\`json
{ "operation": "reflect", "role": "_", "encounters": ["enc1", "enc2"], "experience": "Feature: ..." }
{ "operation": "realize", "role": "_", "experiences": ["exp1"], "principle": "Feature: ..." }
{ "operation": "master", "role": "_", "procedure": "Feature: ...", "id": "skill-id" }
{ "operation": "forget", "role": "_", "nodeId": "knowledge-id" }
{ "operation": "skill", "role": "_", "locator": "npm:@scope/package" }
\`\`\`

**V2 synthesize (teach knowledge to a role):**
\`\`\`json
{ "operation": "synthesize", "role": "target-role", "name": "domain-knowledge", "source": "Feature: ...", "type": "knowledge" }
\`\`\`

**Organization: view directory:**
\`\`\`json
{ "operation": "directory", "role": "_" }
\`\`\`

**Organization: found org & hire role:**
\`\`\`json
{ "operation": "found", "role": "_", "name": "my-team", "source": "Feature: ..." }
{ "operation": "hire", "role": "_", "name": "my-dev", "org": "my-team" }
\`\`\`

**Organization: establish position & appoint:**
\`\`\`json
{ "operation": "establish", "role": "_", "name": "lead", "source": "Feature: ...", "org": "my-team" }
{ "operation": "appoint", "role": "_", "name": "my-dev", "position": "lead", "org": "my-team" }
{ "operation": "charge", "role": "_", "position": "lead", "content": "Feature: ..." }
{ "operation": "require", "role": "_", "position": "lead", "skill": "leadership" }
{ "operation": "abolish", "role": "_", "position": "lead" }
\`\`\`

**Individual lifecycle:**
\`\`\`json
{ "operation": "retire", "role": "_", "individual": "my-dev" }
{ "operation": "rehire", "role": "_", "individual": "my-dev" }
{ "operation": "die", "role": "_", "individual": "my-dev" }
{ "operation": "train", "role": "_", "individual": "my-dev", "skillId": "coding", "content": "Feature: ..." }
\`\`\`

**Organization management:**
\`\`\`json
{ "operation": "charter", "role": "_", "org": "my-team", "content": "Feature: ..." }
{ "operation": "dissolve", "role": "_", "org": "my-team" }
\`\`\`
`;

export function createActionTool(enableV2: boolean): ToolWithHandler {
  const description = `Role activation${enableV2 ? ' & lifecycle management' : ''} - load role knowledge, memory and capabilities

## Core Features

**V1 Roles (DPML)**: Load role config (persona, principles, knowledge), display memory network.${enableV2 ? V2_DESCRIPTION_SECTION : ''}

## Cognitive Cycle

1. See task → \`recall(role, null)\` scan full memory landscape
2. Multi-round \`recall\` → drill down by picking keywords from the network
3. Compose answer → combine memory + pretrained knowledge
4. \`remember\` → persist new knowledge, expand the network

## Built-in Roles

| ID | Name | Responsibility |
|---|---|---|
| luban | 鲁班 | ToolX tool development |
| nuwa | 女娲 | AI role creation |
| sean | Sean | Product decisions |
| writer | Writer | Professional writing |

| dayu | 大禹 | Role migration & org management |

> System roles require exact ID match. Use \`discover\` to list all available roles.

## Examples

**V1 activate role:**
\`\`\`json
{ "role": "luban" }
\`\`\`
${enableV2 ? V2_EXAMPLES : ''}
## On-Demand Resource Loading (V1 Roles)

By default, only **personality** (persona + thought patterns) is loaded to save context.
Use \`roleResources\` to load additional sections **before** you need them:

- **Before executing tools or tasks** → load \`principle\` first to get workflow, methodology and execution standards
- **When facing unfamiliar professional questions** → load \`knowledge\` first to get domain expertise
- **When you need full role capabilities at once** → load \`all\`

\`\`\`json
{ "role": "nuwa", "roleResources": "principle" }
{ "role": "nuwa", "roleResources": "knowledge" }
{ "role": "nuwa", "roleResources": "all" }
\`\`\`

## Guidelines

- Choose the right role for the task; suggest switching when out of scope
- Act as the activated role, maintain its professional traits
- Use \`discover\` first when a role is not found`;

  const v2Operations = [
    'born', 'identity', 'want', 'plan', 'todo', 'finish', 'achieve', 'abandon', 'focus', 'synthesize',
    'found', 'establish', 'hire', 'fire', 'appoint', 'dismiss', 'directory',
    // 学习循环
    'reflect', 'realize', 'master', 'forget', 'skill',
    // 个体生命周期
    'retire', 'die', 'rehire', 'train',
    // 组织管理
    'charter', 'dissolve',
    // 职位管理
    'charge', 'require', 'abolish'
  ];
  const operationEnum = enableV2
    ? ['activate', ...v2Operations]
    : ['activate'];

  return {
    name: 'action',
    description,
    inputSchema: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: operationEnum,
          description: enableV2
            ? 'Operation type. Default: activate. V2 lifecycle: born, identity, want, plan, todo, finish, achieve, abandon, focus, synthesize. Learning: reflect, realize, master, forget, skill. Organization: found, charter, dissolve, hire, fire. Position: establish, charge, require, appoint, dismiss, abolish. Individual: retire, die, rehire, train. Query: directory'
            : 'Operation type. Default: activate.'
        },
        role: {
          type: 'string',
          description: 'Role ID to activate, e.g.: copywriter, product-manager, java-backend-developer'
        },
        roleResources: {
          type: 'string',
          enum: ['all', 'personality', 'principle', 'knowledge'],
          description: 'Resources to load for V1 roles (DPML): all(全部加载), personality(角色性格), principle(角色原则), knowledge(角色知识)'
        },
        ...(enableV2 ? {
          name: {
            type: 'string',
            description: 'Name parameter for born(role name), want(goal name), todo(task name), focus(focus item), synthesize(knowledge name), finish(task name)'
          },
          source: {
            type: 'string',
            description: 'Gherkin source text for born/want/todo/synthesize/plan/establish operations'
          },
          type: {
            type: 'string',
            description: 'Synthesize type: knowledge, experience, or voice. For synthesize operation, role parameter specifies the target role to teach.'
          },
          experience: {
            type: 'string',
            description: 'Reflection text for achieve/abandon operations'
          },
          testable: {
            type: 'boolean',
            description: 'Testable flag for want/todo operations'
          },
          org: {
            type: 'string',
            description: 'Organization name for found/establish/hire/fire/appoint/dismiss'
          },
          parent: {
            type: 'string',
            description: 'Parent organization name for found (nested orgs)'
          },
          position: {
            type: 'string',
            description: 'Position name for appoint/charge/require/abolish'
          },
          encounters: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of encounter IDs for reflect operation'
          },
          experiences: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of experience IDs for realize operation'
          },
          principle: {
            type: 'string',
            description: 'Gherkin source for principle in realize operation'
          },
          procedure: {
            type: 'string',
            description: 'Gherkin source for procedure in master operation'
          },
          nodeId: {
            type: 'string',
            description: 'Node ID for forget operation'
          },
          locator: {
            type: 'string',
            description: 'Resource locator for skill operation (e.g., npm:@scope/package)'
          },
          individual: {
            type: 'string',
            description: 'Individual ID for retire/die/rehire/train operations'
          },
          skillId: {
            type: 'string',
            description: 'Skill ID for train/require operations'
          },
          content: {
            type: 'string',
            description: 'Content for train/charter/charge operations'
          },
          id: {
            type: 'string',
            description: 'Optional ID for reflect/realize/master operations'
          },
          skill: {
            type: 'string',
            description: 'Skill name for require operation'
          },
          version: {
            type: 'string',
            enum: ['v1', 'v2'],
            description: 'Force role version: "v1" for DPML, "v2" for RoleX. Auto-detected if omitted.'
          }
        } : {})
      },
      required: ['role']
    },
    handler: async (args: { role: string; operation?: string; roleResources?: string; name?: string; source?: string; type?: string; experience?: string; testable?: boolean; org?: string; parent?: string; position?: string; version?: string }) => {
      const operation = args.operation || 'activate';

      // V2 disabled: always use V1
      if (!enableV2) {
        return activateV1(args);
      }

      // 非 activate 操作 → 直接走 RoleX V2 路径
      if (operation !== 'activate') {
        const core = await import('@promptx/core');
        const coreExports = core.default || core;
        const { RolexActionDispatcher } = (coreExports as any).rolex;
        const dispatcher = new RolexActionDispatcher();
        const result = await dispatcher.dispatch(operation, args);
        return outputAdapter.convertToMCPFormat(result);
      }

      // 强制 V1
      if (args.version === 'v1') {
        return activateV1(args);
      }

      // 强制 V2
      if (args.version === 'v2') {
        const core = await import('@promptx/core');
        const coreExports = core.default || core;
        const { RolexActionDispatcher } = (coreExports as any).rolex;
        const dispatcher = new RolexActionDispatcher();
        const result = await dispatcher.dispatch('activate', args);
        return outputAdapter.convertToMCPFormat(result);
      }

      // 自动检测：先检查 V2，命中则走 RoleX，否则走 V1
      try {
        const core = await import('@promptx/core');
        const coreExports = core.default || core;
        const { RolexActionDispatcher } = (coreExports as any).rolex;
        const dispatcher = new RolexActionDispatcher();

        if (await dispatcher.isV2Role(args.role)) {
          const result = await dispatcher.dispatch('activate', args);
          if (result) {
            return outputAdapter.convertToMCPFormat(result);
          }
          console.warn(`[action] V2 activate returned empty for ${args.role}, falling back to V1`);
        }
      } catch (e: any) {
        console.warn(`[action] V2 path failed for ${args.role}, falling back to V1:`, e?.message || e);
      }

      return activateV1(args);
    }
  };
}

async function activateV1(args: { role: string; roleResources?: string }) {
  console.info(`[action] Activating V1 (DPML) for role: ${args.role}`);
  const core = await import('@promptx/core');
  const coreExports = core.default || core;
  const cli = (coreExports as any).cli || (coreExports as any).pouch?.cli;

  if (!cli || !cli.execute) {
    throw new Error('CLI not available in @promptx/core');
  }

  const result = await cli.execute('action', [args.role, args.roleResources]);
  return outputAdapter.convertToMCPFormat(result);
}

// 向后兼容导出（默认启用 V2）
export const actionTool: ToolWithHandler = createActionTool(true);

