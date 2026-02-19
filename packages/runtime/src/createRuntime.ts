/**
 * createRuntime - Factory for creating Runtime instances
 */

import type { Persistence } from "@agentxjs/types";
import type { Runtime, LLMProvider, ClaudeLLMConfig } from "@agentxjs/types/runtime";
import type { EnvironmentFactory } from "@agentxjs/types/runtime/internal";
import type { AgentDefinition } from "@agentxjs/types/agentx";
import { RuntimeImpl } from "./RuntimeImpl";

/**
 * Runtime configuration
 */
export interface RuntimeConfig {
  /**
   * Persistence layer for data storage
   */
  persistence: Persistence;

  /**
   * LLM provider for AI model access
   */
  llmProvider: LLMProvider<ClaudeLLMConfig>;

  /**
   * Base path for runtime data (containers, workdirs, etc.)
   * @example "/Users/john/.agentx"
   */
  basePath: string;

  /**
   * Optional environment factory for dependency injection (e.g., mock for testing)
   * If not provided, ClaudeEnvironment will be created by default
   */
  environmentFactory?: EnvironmentFactory;

  /**
   * Default agent definition
   * Used as base configuration when creating new images
   */
  defaultAgent?: AgentDefinition;
}

/**
 * Create a Runtime instance
 *
 * @param config - Runtime configuration
 * @returns Runtime instance
 */
export function createRuntime(config: RuntimeConfig): Runtime {
  return new RuntimeImpl(config);
}
