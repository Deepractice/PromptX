import type { ToolWithHandler } from '~/interfaces/MCPServer.js';
import { MCPOutputAdapter } from '~/utils/MCPOutputAdapter.js';

const outputAdapter = new MCPOutputAdapter();

export function createLifecycleTool(enableV2: boolean): ToolWithHandler {
  const description = `V2 role goal & task lifecycle management

## Operations

| Operation | Required Params | Description |
|-----------|----------------|-------------|
| want | name, source | Create a goal for the active role |
| plan | source, **id** | Create a plan under the current goal. **id is REQUIRED** or todo will fail |
| todo | name, source | Create a task under the current plan |
| finish | name | Complete a task (creates an encounter node with ID: {name}-finished) |
| achieve | experience | Achieve the current goal with a reflection |
| abandon | experience | Abandon the current goal with a reason |
| focus | name | Switch focus to a specific goal/plan/task |

## Workflow

\`\`\`
want (create goal) → plan (create plan, MUST pass id) → todo (create tasks) → finish (complete tasks) → achieve (complete goal)
\`\`\`

## Examples

\`\`\`json
{ "operation": "want", "role": "_", "name": "build-api", "source": "Feature: Build REST API\\n  As a developer..." }
{ "operation": "plan", "role": "_", "source": "Feature: API Design\\n  Scenario: endpoints...", "id": "api-plan" }
{ "operation": "todo", "role": "_", "name": "implement-auth", "source": "Feature: Auth endpoint..." }
{ "operation": "finish", "role": "_", "name": "implement-auth", "encounter": "Encountered CORS issues..." }
{ "operation": "achieve", "role": "_", "experience": "learned REST best practices..." }
{ "operation": "focus", "role": "_", "name": "api-plan" }
\`\`\`

## Prerequisites

A V2 role must be activated first via the \`action\` tool before using lifecycle operations.`;

  return {
    name: 'lifecycle',
    description,
    inputSchema: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: ['want', 'plan', 'todo', 'finish', 'achieve', 'abandon', 'focus'],
          description: 'Lifecycle operation to perform'
        },
        role: {
          type: 'string',
          description: 'Active role ID, or "_" to use the currently active role'
        },
        name: {
          type: 'string',
          description: 'Name of the goal (want), task (todo/finish), or focus target (focus)'
        },
        source: {
          type: 'string',
          description: 'Gherkin Feature source text for want/plan/todo'
        },
        id: {
          type: 'string',
          description: 'Plan ID. REQUIRED for plan operation to set focused_plan_id'
        },
        testable: {
          type: 'boolean',
          description: 'Whether the goal/task is testable (for want/todo)'
        },
        experience: {
          type: 'string',
          description: 'Reflection text for achieve/abandon operations'
        },
        encounter: {
          type: 'string',
          description: 'Encounter description for finish operation'
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

      // 检查角色是否为 V1（不支持 lifecycle 操作）
      if (args.role && args.role !== '_') {
        try {
          const isV2 = await dispatcher.isV2Role(args.role);
          if (!isV2) {
            return outputAdapter.convertToMCPFormat({
              type: 'error',
              content: `❌ V1 角色 "${args.role}" 不支持 lifecycle 工具

lifecycle 工具仅支持 V2 角色（RoleX）。V1 角色（DPML）不支持目标与任务管理。

**解决方案**：
1. 先使用 action 工具创建一个 V2 角色：
\`\`\`json
{ "operation": "born", "role": "_", "name": "my-role", "source": "Feature: ..." }
\`\`\`
2. 然后激活该 V2 角色后再使用 lifecycle 工具`
            });
          }
        } catch (e) {
          // 检查失败时继续执行，让 dispatcher 自行处理
          console.warn('[lifecycle] V2 role check failed, continuing:', e);
        }
      }

      const result = await dispatcher.dispatch(operation, args);
      return outputAdapter.convertToMCPFormat(result);
    }
  };
}

export const lifecycleTool: ToolWithHandler = createLifecycleTool(true);
