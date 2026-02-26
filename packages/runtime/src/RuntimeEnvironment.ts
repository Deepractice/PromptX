/**
 * RuntimeEnvironment - Global singleton for runtime configuration
 *
 * Holds global runtime settings that don't need to be passed through layers.
 * This is an internal implementation detail, not exposed to users.
 *
 * Users configure via LocalConfig.environment, which gets set into this singleton.
 */

import type { RuntimeEnvironmentConfig } from "@agentxjs/types/runtime/internal";

export class RuntimeEnvironment {
  private static config: RuntimeEnvironmentConfig = {};

  private constructor() {
    // Prevent instantiation
  }

  /**
   * Set Claude Code executable path
   * Called by createLocalAgentX when environment.claudeCodePath is provided
   */
  static setClaudeCodePath(path: string): void {
    this.config.claudeCodePath = path;
  }

  /**
   * Get Claude Code executable path
   * Called by buildOptions when creating SDK options
   */
  static getClaudeCodePath(): string | undefined {
    return this.config.claudeCodePath;
  }

  /**
   * Reset configuration (for testing)
   */
  static reset(): void {
    this.config = {};
  }
}
