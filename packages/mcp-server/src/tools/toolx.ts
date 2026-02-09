import type { ToolWithHandler } from '~/interfaces/MCPServer.js';
import { MCPOutputAdapter } from '~/utils/MCPOutputAdapter.js';
import yaml from 'js-yaml';

const outputAdapter = new MCPOutputAdapter();

export const toolxTool: ToolWithHandler = {
  name: 'toolx',

  description: `ToolX runtime — load and execute PromptX ecosystem tools

## What It Does

Universal interface for calling PromptX tools (file ops, PDF reading, role creation, etc.).
Input is a YAML document specifying the tool, mode, and parameters.

## Modes

| Mode | Purpose |
|---|---|
| manual | Read tool documentation (**always do this first**) |
| execute | Run the tool with parameters |
| configure | Set environment variables for a tool |
| log | View tool execution logs |
| dryrun | Preview without executing |

## Examples

**Read tool manual (do this first):**
\`\`\`yaml
tool: tool://filesystem
mode: manual
\`\`\`

**Execute with parameters:**
\`\`\`yaml
tool: tool://pdf-reader
mode: execute
parameters:
  path: /path/to/file.pdf
  action: extract
\`\`\`

**Configure tool:**
\`\`\`yaml
tool: tool://my-tool
mode: configure
parameters:
  API_KEY: sk-xxx123
\`\`\`

## Built-in Tools

- **tool://filesystem** — File operations (read/write/list/delete)
- **tool://pdf-reader** — Extract text from PDFs
- **tool://excel-tool** — Read/write Excel files
- **tool://word-tool** — Read/write Word documents
- **tool://role-creator** — Create AI roles (女娲/Nuwa)
- **tool://tool-creator** — Create new tools (鲁班/Luban)

## Rules

- YAML must start with \`tool: tool://name\`
- Always read \`manual\` before first use of any tool
- Do NOT use \`@\` prefix (system handles it internally)
- Use \`discover\` to see all available tools`,

  inputSchema: {
    type: 'object',
    properties: {
      yaml: {
        type: 'string',
        description: 'YAML-formatted tool invocation config'
      }
    },
    required: ['yaml']
  },

  handler: async (args: { yaml: string }) => {
    try {
      // Auto-correct common AI mistakes
      let yamlInput = args.yaml.trim();

      // Case 1: Just a plain URL string like "tool://filesystem" or "@tool://filesystem"
      if (yamlInput.match(/^@?tool:\/\/[\w-]+$/)) {
        const toolName = yamlInput.replace(/^@?tool:\/\//, '');
        yamlInput = `tool: tool://${toolName}\nmode: execute`;
      }

      // Case 2: Handle escaped backslashes and quotes: tool: \"@tool://xxx\"
      // This happens when AI generates YAML in a JSON string
      yamlInput = yamlInput.replace(/\\\\/g, '\\').replace(/\\"/g, '"');

      // Case 3: Remove @ prefix from tool URLs: @tool://xxx -> tool://xxx
      yamlInput = yamlInput.replace(/@tool:\/\//g, 'tool://');

      // Case 4: Remove quotes around tool URLs: tool: "tool://xxx" -> tool: tool://xxx
      yamlInput = yamlInput.replace(/(tool|toolUrl|url):\s*"(tool:\/\/[^"]+)"/g, '$1: $2');

      // YAML → JSON conversion
      const config = yaml.load(yamlInput) as any;

      // Normalize field names (support aliases for AI-friendliness)
      // Priority: tool > toolUrl > url
      const toolIdentifier = config.tool || config.toolUrl || config.url;

      // Priority: mode > operation
      const operationMode = config.mode || config.operation;

      // Validate required fields
      if (!toolIdentifier) {
        throw new Error('Missing required field: tool\nExample: tool: tool://filesystem\nAliases supported: tool / toolUrl / url');
      }

      // Validate URL format
      if (!toolIdentifier.startsWith('tool://')) {
        throw new Error(`Invalid tool format: ${toolIdentifier}\nMust start with tool://`);
      }

      // Convert to internal @tool:// format (compatibility with core system)
      const internalUrl = toolIdentifier.replace('tool://', '@tool://');

      // Get core module
      const core = await import('@promptx/core');
      const coreExports = core.default || core;
      const cli = (coreExports as any).cli || (coreExports as any).pouch?.cli;

      if (!cli || !cli.execute) {
        throw new Error('CLI not available in @promptx/core');
      }

      // Build CLI arguments (maintain original interface)
      const cliArgs = [internalUrl];
      cliArgs.push(operationMode || 'execute');

      if (config.parameters) {
        cliArgs.push(JSON.stringify(config.parameters));
      }

      if (config.timeout) {
        cliArgs.push('--timeout', config.timeout.toString());
      }

      // Execute
      const result = await cli.execute('toolx', cliArgs);
      return outputAdapter.convertToMCPFormat(result);

    } catch (error: any) {
      // YAML parsing errors
      if (error.name === 'YAMLException') {
        // Check for multiline string issues
        if (error.message.includes('bad indentation') || error.message.includes('mapping entry')) {
          throw new Error(`YAML format error: ${error.message}\n\nMultiline content requires | symbol, example:\ncontent: |\n  First line\n  Second line\n\nNote: Newline after |, indent content with 2 spaces`);
        }
        throw new Error(`YAML format error: ${error.message}\nCheck indentation (use spaces) and syntax`);
      }

      // Tool not found
      if (error.message?.includes('Tool not found')) {
        const toolName = args.yaml.match(/(?:tool|toolUrl|url):\s*tool:\/\/(\w+)/)?.[1];
        throw new Error(`Tool '${toolName}' not found\nUse discover to view available tools`);
      }

      throw error;
    }
  }
};