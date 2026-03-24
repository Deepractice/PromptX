import type { ToolWithHandler } from '~/interfaces/MCPServer.js';
import { MCPOutputAdapter } from '~/utils/MCPOutputAdapter.js';

const outputAdapter = new MCPOutputAdapter();

export function createActionTool(enableV2: boolean): ToolWithHandler {
  const description = `Role activation & creation - load role knowledge, memory and capabilities

## Core Features

**V1 Roles (DPML)**: Load role config (persona, principles, knowledge), display memory network.${enableV2 ? `
**V2 Roles (RoleX)**: Create and activate V2 roles with full lifecycle support.

On activate, version is auto-detected: V2 takes priority, falls back to V1 if not found.
Use \`version\` parameter to force a specific version: \`"v1"\` for DPML, \`"v2"\` for RoleX.` : ''}

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

**Activate a role (V1 or V2 auto-detect):**
\`\`\`json
{ "role": "luban" }
\`\`\`
${enableV2 ? `
**Create a V2 role:**
\`\`\`json
{ "operation": "born", "role": "_", "name": "my-dev", "source": "Feature: Developer\\n  As a developer..." }
\`\`\`

**Get role identity:**
\`\`\`json
{ "operation": "identity", "role": "my-dev" }
\`\`\`

**Force V1 activation:**
\`\`\`json
{ "role": "nuwa", "version": "v1" }
\`\`\`
` : ''}
## On-Demand Resource Loading (V1 Roles)

By default, only **personality** (persona + thought patterns) is loaded to save context.
Use \`roleResources\` to load additional sections **before** you need them:

- **Before executing tools or tasks** → load \`principle\` first
- **When facing unfamiliar professional questions** → load \`knowledge\` first
- **When you need full role capabilities at once** → load \`all\`

\`\`\`json
{ "role": "nuwa", "roleResources": "principle" }
{ "role": "nuwa", "roleResources": "knowledge" }
{ "role": "nuwa", "roleResources": "all" }
\`\`\`
${enableV2 ? `
## Related Tools

After activating a V2 role, use these tools for further operations:
- **lifecycle**: Goal & task management (want → plan → todo → finish → achieve)
- **learning**: Cognitive cycle (reflect → realize → master → synthesize)
- **organization**: Org, position & personnel management
` : ''}
## Guidelines

- Choose the right role for the task; suggest switching when out of scope
- Act as the activated role, maintain its professional traits
- Use \`discover\` first when a role is not found`;

  const operationEnum = enableV2
    ? ['activate', 'born', 'identity']
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
            ? 'Operation: activate (default), born (create V2 role), identity (view role info)'
            : 'Operation type. Default: activate.'
        },
        role: {
          type: 'string',
          description: 'Role ID to activate, e.g.: copywriter, product-manager, java-backend-developer'
        },
        roleResources: {
          type: 'string',
          enum: ['all', 'personality', 'principle', 'knowledge'],
          description: 'Resources to load for V1 roles: all, personality, principle, knowledge'
        },
        ...(enableV2 ? {
          name: {
            type: 'string',
            description: 'Role name for born operation'
          },
          source: {
            type: 'string',
            description: 'Gherkin source text for born operation'
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
    handler: async (args: { role: string; operation?: string; roleResources?: string; name?: string; source?: string; version?: string }) => {
      const operation = args.operation || 'activate';

      // V2 disabled: always use V1
      if (!enableV2) {
        return activateV1(args);
      }

      // born / identity → 直接走 RoleX V2 路径
      if (operation === 'born' || operation === 'identity') {
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
