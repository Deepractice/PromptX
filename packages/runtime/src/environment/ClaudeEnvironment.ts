/**
 * ClaudeEnvironment - Claude SDK Environment (Receptor + Effector)
 *
 * Combines:
 * - ClaudeReceptor: Perceives Claude SDK responses → emits to SystemBus
 * - ClaudeEffector: Subscribes to SystemBus → sends to Claude SDK
 *
 * @see packages/types/src/ecosystem/Environment.ts
 */

import type { Environment, Receptor, Effector } from "@agentxjs/types/runtime/internal";
import { ClaudeReceptor } from "./ClaudeReceptor";
import { ClaudeEffector, type ClaudeEffectorConfig } from "./ClaudeEffector";

/**
 * ClaudeEnvironment configuration
 */
export interface ClaudeEnvironmentConfig extends ClaudeEffectorConfig {}

/**
 * ClaudeEnvironment - Claude SDK Environment
 */
export class ClaudeEnvironment implements Environment {
  readonly name = "claude";
  readonly receptor: Receptor;
  readonly effector: Effector;

  private readonly claudeEffector: ClaudeEffector;

  constructor(config: ClaudeEnvironmentConfig) {
    const claudeReceptor = new ClaudeReceptor();
    const claudeEffector = new ClaudeEffector(config, claudeReceptor);

    this.receptor = claudeReceptor;
    this.effector = claudeEffector;
    this.claudeEffector = claudeEffector;
  }

  /**
   * Warmup the environment (pre-initialize SDK)
   *
   * Call this early to reduce latency for the first user message.
   */
  async warmup(): Promise<void> {
    await this.claudeEffector.warmup();
  }

  /**
   * Dispose environment resources
   */
  dispose(): void {
    this.claudeEffector.dispose();
  }
}
