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
// finish 操作会创建 encounter 节点，ID 格式为 {task-id}-finished
{ "operation": "finish", "role": "_", "name": "task-id", "encounter": "遇到的问题和经历..." }
{ "operation": "achieve", "role": "_", "experience": "learned..." }
\`\`\`

**V2 complete learning cycle (want → plan → reflect → realize → master → synthesize):**
\`\`\`json
// 完整认知循环流程（基于实际测试验证）：

// 1. 创建目标
{ "operation": "want", "role": "_", "name": "improve-process", "source": "Feature: 改进流程\\n  作为产品经理..." }

// 2. 制定计划（必须传入 id 参数！）
{ "operation": "plan", "role": "_", "source": "Feature: 分析问题\\n  Scenario: 调研...", "id": "analysis-plan" }

// 3. 反思 - 创建经验（可跳过 encounter，直接创建）
{
  "operation": "reflect",
  "role": "_",
  "encounters": [],  // 空数组 = 直接创建 experience，无需预定义 encounter
  "experience": "Feature: 需求变更管理经验\\n  在项目管理中发现...\\n\\n  Scenario: 问题表现\\n    Then 需求反复修改导致延误\\n    And 团队理解不一致产生返工",
  "id": "exp-1"  // 自定义 ID，用于后续引用
}

// 4. 领悟 - 提炼原则（必须基于已存在的 experience）
{
  "operation": "realize",
  "role": "_",
  "experiences": ["exp-1"],  // 必须是已存在的 experience ID 数组（复数！）
  "principle": "Feature: 需求变更管理原则\\n  Scenario: 预防原则\\n    Then 预防胜于控制\\n    And 充分的需求调研",
  "id": "principle-1"
}

// 5. 沉淀 - 创建标准流程
{
  "operation": "master",
  "role": "_",
  "procedure": "Feature: 需求变更管理SOP\\n  Background:\\n    Given 需求变更是常态\\n\\n  Scenario: 变更申请阶段\\n    When 收到变更请求\\n    Then 记录变更内容\\n    And 评估影响范围",
  "id": "sop-1"
}

// 6. 传授 - 向其他角色传授知识
{
  "operation": "synthesize",
  "role": "开发工程师",  // 目标角色（接收知识的角色）
  "name": "需求变更管理",
  "source": "Feature: 需求变更管理 - 开发视角\\n  Scenario: 配合要点\\n    Then 及时反馈技术可行性",
  "type": "knowledge"
}

// 7. 遗忘 - 清理过时知识（可选）
{ "operation": "forget", "role": "_", "nodeId": "outdated-knowledge-id" }
\`\`\`

**V2 learning cycle - 关键要点:**
\`\`\`
✅ Gherkin 格式必填: experience/principle/procedure/source 都必须使用 Gherkin 格式
✅ Feature 开头: 必须以 "Feature: 标题" 开头，包含描述
✅ Scenario 结构: 使用 Scenario/Background 定义场景，内部使用 Then/And/Given/When
✅ 空数组可用: reflect 时 encounters: [] 可直接创建 experience，无需预定义 encounter
✅ ID 数组必填: realize 的 experiences 必须是已存在的 experience ID 数组（复数）
✅ 角色注意: synthesize 的 role 是目标角色（接收知识的角色），不是当前角色

🚨 CRITICAL - plan 操作必须传入 id 参数:
   plan 操作如果不传入 id 参数，focused_plan_id 不会被设置，
   导致后续 todo 操作失败并报错 "No focused plan. Call plan first."

   ❌ 错误: { "operation": "plan", "role": "_", "source": "..." }
   ✅ 正确: { "operation": "plan", "role": "_", "source": "...", "id": "my-plan" }
\`\`\`

**V2 alternative: 基于任务完成的认知循环:**
\`\`\`json
// 如果想基于实际任务经历：
// 1. 完成任务 → 自动创建 encounter (ID: {task-id}-finished)
{ "operation": "finish", "role": "_", "name": "task-1", "encounter": "遇到的问题..." }

// 2. 反思 encounter → 创建 experience
{ "operation": "reflect", "role": "_", "encounters": ["task-1-finished"], "experience": "Feature: ...", "id": "exp-1" }

// 3-6. 后续步骤同上
\`\`\`

**V2 synthesize (teach knowledge to a role):**
\`\`\`json
// synthesize 直接指定目标角色，无需先 activate
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
// ⚠️ 关键：职位名必须是"角色名+岗位"格式，appoint 的 position 必须与 establish 的 name 完全一致
{ "operation": "establish", "role": "_", "name": "技术负责人岗位", "source": "Feature: ...", "org": "my-team" }
{ "operation": "appoint", "role": "_", "name": "my-dev", "position": "技术负责人岗位", "org": "my-team" }
{ "operation": "charge", "role": "_", "position": "技术负责人岗位", "content": "Feature: ..." }
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
            description: 'Synthesize type: knowledge, experience, or voice. For synthesize operation, the role parameter specifies the target role to teach (no need to activate first).'
          },
          experience: {
            type: 'string',
            description: 'Experience text (Gherkin Feature format) for reflect operation, or reflection text for achieve/abandon operations'
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
            description: 'Array of encounter node IDs for reflect operation. Must be existing encounter IDs (usually created by finish operation), or pass empty array [] to create experience directly without consuming encounters.'
          },
          experiences: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of experience node IDs for realize operation. Must be existing experience IDs created by reflect operation. This parameter is REQUIRED for realize.'
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
            description: 'Optional ID for plan/reflect/realize/master operations. IMPORTANT: plan operation REQUIRES id parameter to set focused_plan_id, otherwise todo will fail.'
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

