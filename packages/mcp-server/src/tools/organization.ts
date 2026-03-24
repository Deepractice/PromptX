import type { ToolWithHandler } from '~/interfaces/MCPServer.js';
import { MCPOutputAdapter } from '~/utils/MCPOutputAdapter.js';

const outputAdapter = new MCPOutputAdapter();

export function createOrganizationTool(enableV2: boolean): ToolWithHandler {
  const description = `V2 organization, position, and individual management

## Organization Operations

| Operation | Required Params | Description |
|-----------|----------------|-------------|
| found | name, source | Create a new organization |
| charter | org, content | Set organization charter |
| dissolve | org | Dissolve an organization |
| directory | (none) | View organization directory |

## Position Operations

| Operation | Required Params | Description |
|-----------|----------------|-------------|
| establish | name, source, org | Create a position in an organization |
| charge | position, content | Assign responsibilities to a position |
| require | position, skill | Add skill requirement to a position |
| abolish | position | Remove a position |

## Personnel Operations

| Operation | Required Params | Description |
|-----------|----------------|-------------|
| hire | name, org | Hire a role into an organization |
| fire | name, org | Remove a role from an organization |
| appoint | name, position, org | Appoint a role to a position |
| dismiss | name, org | Dismiss a role from a position |
| retire | individual | Retire an individual |
| rehire | individual | Rehire a retired individual |
| die | individual | Permanently remove an individual |
| train | individual, skillId, content | Train an individual with a skill |

## Examples

\`\`\`json
{ "operation": "found", "role": "_", "name": "dev-team", "source": "Feature: Dev Team\\n  Build products..." }
{ "operation": "hire", "role": "_", "name": "my-dev", "org": "dev-team" }
{ "operation": "establish", "role": "_", "name": "tech-lead", "source": "Feature: Tech Lead...", "org": "dev-team" }
{ "operation": "appoint", "role": "_", "name": "my-dev", "position": "tech-lead", "org": "dev-team" }
{ "operation": "directory", "role": "_" }
\`\`\``;

  return {
    name: 'organization',
    description,
    inputSchema: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: [
            'found', 'charter', 'dissolve', 'directory',
            'establish', 'charge', 'require', 'abolish',
            'hire', 'fire', 'appoint', 'dismiss',
            'retire', 'rehire', 'die', 'train'
          ],
          description: 'Organization/position/personnel operation to perform'
        },
        role: {
          type: 'string',
          description: 'Active role ID, or "_" to use the currently active role'
        },
        name: {
          type: 'string',
          description: 'Name of the organization (found), position (establish), or individual (hire/fire/appoint/dismiss)'
        },
        source: {
          type: 'string',
          description: 'Gherkin source text for found/establish operations'
        },
        org: {
          type: 'string',
          description: 'Target organization name'
        },
        parent: {
          type: 'string',
          description: 'Parent organization name for nested orgs (found)'
        },
        position: {
          type: 'string',
          description: 'Position name for appoint/charge/require/abolish'
        },
        individual: {
          type: 'string',
          description: 'Individual ID for retire/die/rehire/train'
        },
        skillId: {
          type: 'string',
          description: 'Skill ID for train operation'
        },
        skill: {
          type: 'string',
          description: 'Skill name for require operation'
        },
        content: {
          type: 'string',
          description: 'Content for charter/charge/train operations'
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

      // organization 操作大部分不需要 _requireActiveRole，
      // 但仍然检查非 "_" 的角色是否为 V1，给出友好提示
      if (args.role && args.role !== '_') {
        try {
          const isV2 = await dispatcher.isV2Role(args.role);
          if (!isV2) {
            return outputAdapter.convertToMCPFormat({
              type: 'error',
              content: `❌ V1 角色 "${args.role}" 不支持 organization 工具

organization 工具仅支持 V2 角色（RoleX）。

**如需使用 organization 工具**，请先创建 V2 角色：
\`\`\`json
{ "operation": "born", "role": "_", "name": "my-role", "source": "Feature: ..." }
\`\`\``
            });
          }
        } catch (e) {
          console.warn('[organization] V2 role check failed, continuing:', e);
        }
      }

      const result = await dispatcher.dispatch(operation, args);
      return outputAdapter.convertToMCPFormat(result);
    }
  };
}

export const organizationTool: ToolWithHandler = createOrganizationTool(true);
