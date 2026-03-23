import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
export function ok(data: unknown): CallToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify({ success: true, data }, null, 2) }],
  };
}

export function err(message: string): CallToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify({ success: false, error: message }, null, 2) }],
    isError: true,
  };
}
