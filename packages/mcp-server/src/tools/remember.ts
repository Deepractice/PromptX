import type { ToolWithHandler } from '~/interfaces/MCPServer.js';
import { MCPOutputAdapter } from '~/utils/MCPOutputAdapter.js';

const outputAdapter = new MCPOutputAdapter();

export const rememberTool: ToolWithHandler = {
  name: 'remember',
  description: `Save knowledge to a role's memory network

## When to Use

- After answering a question — save key insights
- After multi-round recall — summarize findings
- Learned something new — persist it
- Solved a problem — record the solution
- Recall returned empty — fill the gap

> Every remember is an investment for future recall. No remember = start from zero next time.

## Engram Types

| Type | Use For | Example |
|---|---|---|
| ATOMIC | Facts, entities, concrete info | "Redis default port is 6379" |
| LINK | Relationships, connections | "Database uses connection pool for management" |
| PATTERN | Processes, methodologies | "Login → select item → checkout" |

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
    const cli = (coreExports as any).cli || (coreExports as any).pouch?.cli;
    
    if (!cli || !cli.execute) {
      throw new Error('CLI not available in @promptx/core');
    }
    
    const result = await cli.execute('remember', [args]);
    return outputAdapter.convertToMCPFormat(result);
  }
};