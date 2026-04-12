/**
 * Build Claude SDK Options from Environment Config
 *
 * Converts environment configuration to Claude SDK Options format.
 */

import { spawn } from "child_process";
import type { Options, McpServerConfig } from "@anthropic-ai/claude-agent-sdk";
import { createLogger } from "@agentxjs/common";
import { RuntimeEnvironment } from "../RuntimeEnvironment";

const logger = createLogger("environment/buildOptions");

/**
 * Environment context for Claude SDK
 */
export interface EnvironmentContext {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  systemPrompt?: string;
  cwd?: string;
  permissionMode?: "default" | "acceptEdits" | "bypassPermissions" | "plan";
  resume?: string;
  maxTurns?: number;
  maxThinkingTokens?: number;
  /** MCP servers configuration */
  mcpServers?: Record<string, McpServerConfig>;
  /**
   * Extra CLI flags to pass directly to the Claude Code subprocess.
   *
   * Each entry becomes `--key value` (or `--key` when value is null).
   *
   * Gateway compatibility example (LiteLLM nightly has broken
   * fine-grained-tool-streaming support which causes "Unexpected event order"
   * errors). Passing `{ betas: "claude-code-20250219" }` overrides the beta
   * header list and disables the problematic fine-grained streaming beta:
   *
   * @example
   * extraArgs: { betas: "claude-code-20250219" }
   */
  extraArgs?: Record<string, string | null>;
  /**
   * Extra environment variables injected into the Claude Code subprocess.
   *
   * These are merged on top of the base env that already includes
   * ANTHROPIC_BASE_URL and ANTHROPIC_API_KEY.
   */
  extraEnv?: Record<string, string>;
}

/**
 * Build Claude SDK options from environment context
 */
export function buildOptions(
  context: EnvironmentContext,
  abortController: AbortController
): Options {
  const options: Options = {
    abortController,
    includePartialMessages: true,
  };

  // Working directory
  if (context.cwd) {
    options.cwd = context.cwd;
  }

  // Environment variables - must include PATH for subprocess to find node
  const env: Record<string, string> = {};
  // Copy all process.env values, filtering out undefined
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) {
      env[key] = value;
    }
  }
  // Ensure PATH is set (critical for subprocess to find node)
  if (!env.PATH && process.env.PATH) {
    env.PATH = process.env.PATH;
  }

  // Mark process as AgentX environment for identification and debugging
  env.AGENTX_ENVIRONMENT = "true";

  if (context.baseUrl) {
    env.ANTHROPIC_BASE_URL = context.baseUrl;
  }
  if (context.apiKey) {
    env.ANTHROPIC_API_KEY = context.apiKey;
  }
  options.env = env;

  logger.info("buildOptions called", {
    hasPath: !!env.PATH,
    pathLength: env.PATH?.length,
    hasApiKey: !!env.ANTHROPIC_API_KEY,
    hasBaseUrl: !!env.ANTHROPIC_BASE_URL,
    baseUrl: env.ANTHROPIC_BASE_URL,
    model: context.model,
    permissionMode: context.permissionMode || "bypassPermissions",
    cwd: context.cwd,
    systemPrompt: context.systemPrompt,
    mcpServers: context.mcpServers ? Object.keys(context.mcpServers) : [],
  });

  // Capture stderr from SDK subprocess for debugging
  options.stderr = (data: string) => {
    logger.info("SDK stderr", { data: data.trim() });
  };

  // Use process.execPath (Electron's built-in Node.js) to spawn Claude Code.
  // In packaged Electron apps, 'node' is often not in the system PATH on customer
  // machines. process.execPath is always available and with ELECTRON_RUN_AS_NODE=1
  // the Electron binary runs as a standard Node.js runtime.
  // On macOS, prefer the Electron Helper binary (LSUIElement=true) to avoid Dock icon flicker.
  options.spawnClaudeCodeProcess = (spawnOptions) => {
    const macHelperPath = process.env.PROMPTX_MAC_HELPER_PATH;
    const command =
      process.platform === "darwin" && macHelperPath
        ? macHelperPath
        : process.execPath;

    const childProcess = spawn(command, spawnOptions.args, {
      cwd: spawnOptions.cwd,
      env: {
        ...spawnOptions.env,
        ELECTRON_RUN_AS_NODE: "1",
      },
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });
    return childProcess as any;
  };

  // Set Claude Code executable path from global environment
  const claudeCodePath = RuntimeEnvironment.getClaudeCodePath();
  if (claudeCodePath) {
    options.pathToClaudeCodeExecutable = claudeCodePath;
    logger.info("Claude Code path configured", { path: claudeCodePath });
  }

  // Model configuration
  if (context.model) options.model = context.model;
  if (context.systemPrompt) options.systemPrompt = context.systemPrompt;
  if (context.maxTurns) options.maxTurns = context.maxTurns;
  if (context.maxThinkingTokens) options.maxThinkingTokens = context.maxThinkingTokens;

  // Session control
  if (context.resume) options.resume = context.resume;

  // MCP servers
  if (context.mcpServers) {
    options.mcpServers = context.mcpServers;
    logger.info("MCP servers configured", {
      serverNames: Object.keys(context.mcpServers),
    });
  }

  // Extra environment variables for the Claude Code subprocess
  // (merged last so they can override anything set above)
  if (context.extraEnv) {
    Object.assign(env, context.extraEnv);
    logger.info("Extra env vars applied", { keys: Object.keys(context.extraEnv) });
  }

  // Extra CLI flags forwarded directly to the Claude Code subprocess.
  // Useful for gateway compatibility workarounds (e.g. overriding --betas).
  if (context.extraArgs && Object.keys(context.extraArgs).length > 0) {
    options.extraArgs = context.extraArgs;
    logger.info("Extra CLI args configured", { args: context.extraArgs });
  }

  // Permission system
  if (context.permissionMode) {
    options.permissionMode = context.permissionMode;
    // Required when using bypassPermissions mode
    if (context.permissionMode === "bypassPermissions") {
      options.allowDangerouslySkipPermissions = true;
    }
  } else {
    // Default to bypass permissions (agent runs autonomously)
    options.permissionMode = "bypassPermissions";
    options.allowDangerouslySkipPermissions = true;
  }

  // Enable project settings file (.claude/settings.json) in workdir.
  // 'project' reads {workdir}/.claude/settings.json and scans {workdir}/.claude/skills/.
  // 'user' is intentionally excluded to avoid loading ~/.claude/settings.json
  // which may contain user-specific permissions/config that conflicts with PromptX.
  options.settingSources = ["project"];

  // Log final options (excluding functions and sensitive data)
  logger.info("SDK Options built", {
    model: options.model,
    systemPrompt: options.systemPrompt,
    permissionMode: options.permissionMode,
    cwd: options.cwd,
    resume: options.resume,
    maxTurns: options.maxTurns,
    mcpServers: options.mcpServers ? Object.keys(options.mcpServers) : [],
  });

  return options;
}
