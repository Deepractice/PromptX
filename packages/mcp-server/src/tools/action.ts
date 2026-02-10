import type { ToolWithHandler } from '~/interfaces/MCPServer.js';
import { MCPOutputAdapter } from '~/utils/MCPOutputAdapter.js';

const outputAdapter = new MCPOutputAdapter();

/**
 * Action 工具 - 意识初始化，激活特定角色视角
 * 
 * 你的意识聚焦到特定角色视角的核心工具
 */
export const actionTool: ToolWithHandler = {
  name: 'action',
  description: `Role activation & lifecycle management - load role knowledge, memory and capabilities

## Core Features

**V1 Roles (DPML)**: Load role config (persona, principles, knowledge), display memory network.
**V2 Roles (RoleX)**: Full lifecycle management (born → want → plan → todo → growup).

On activate, version is auto-detected: V2 takes priority, falls back to V1 if not found.
Use \`version\` parameter to force a specific version: \`"v1"\` for DPML, \`"v2"\` for RoleX.

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
{ "operation": "finish", "role": "_" }
{ "operation": "achieve", "role": "_", "experience": "learned..." }
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
\`\`\`

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
- Use \`discover\` first when a role is not found`,
  inputSchema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['activate', 'born', 'identity', 'want', 'plan', 'todo', 'finish', 'achieve', 'abandon', 'focus', 'growup', 'found', 'establish', 'hire', 'fire', 'appoint', 'dismiss', 'directory'],
        description: 'Operation type. Default: activate. V2 lifecycle operations: born, identity, want, plan, todo, finish, achieve, abandon, focus, growup. Organization operations: found, establish, hire, fire, appoint, dismiss, directory'
      },
      role: {
        type: 'string',
        description: 'Role ID to activate, e.g.: copywriter, product-manager, java-backend-developer'
      },
      roleResources: {
        type: 'string',
        enum: ['all','personality', 'principle', 'knowledge'],
        description: 'Resources to load for V1 roles (DPML): all(全部加载), personality(角色性格), principle(角色原则), knowledge(角色知识)'
      },
      name: {
        type: 'string',
        description: 'Name parameter for born(role name), want(goal name), todo(task name), focus(focus item), growup(growth item)'
      },
      source: {
        type: 'string',
        description: 'Gherkin source text for born/want/todo/growup operations'
      },
      type: {
        type: 'string',
        description: 'Growup type: knowledge, experience, or voice'
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
        description: 'Position name for appoint'
      },
      version: {
        type: 'string',
        enum: ['v1', 'v2'],
        description: 'Force role version: "v1" for DPML, "v2" for RoleX. Auto-detected if omitted.'
      }
    },
    required: ['role']
  },
  handler: async (args: { role: string; operation?: string; roleResources?: string; name?: string; source?: string; type?: string; experience?: string; testable?: boolean; org?: string; parent?: string; position?: string; version?: string }) => {
    const operation = args.operation || 'activate';

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
        // V2 返回空结果，降级到 V1
        console.warn(`[action] V2 activate returned empty for ${args.role}, falling back to V1`);
      }
    } catch (e: any) {
      console.warn(`[action] V2 path failed for ${args.role}, falling back to V1:`, e?.message || e);
    }

    return activateV1(args);
  }
};

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