/**
 * RuntimeSandbox - Sandbox implementation
 *
 * Provides isolated environment for an Agent:
 * - Workdir: Isolated working directory (create, ensure exists)
 * - MCP: Model Context Protocol tools (future)
 */

import type { Sandbox, Workdir } from "@agentxjs/types/runtime/internal";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

/**
 * RuntimeSandbox configuration
 */
export interface RuntimeSandboxConfig {
  agentId: string;
  imageId: string;
  containerId: string;
  basePath: string;
}

/**
 * RuntimeWorkdir - Workdir implementation
 */
class RuntimeWorkdir implements Workdir {
  readonly id: string;
  readonly name: string;
  readonly path: string;

  constructor(agentId: string, path: string) {
    this.id = agentId;
    this.name = `workdir_${agentId}`;
    this.path = path;
  }
}

/**
 * RuntimeSandbox - Full Sandbox implementation
 */
export class RuntimeSandbox implements Sandbox {
  readonly name: string;
  readonly workdir: Workdir;

  private initialized = false;

  constructor(config: RuntimeSandboxConfig) {
    this.name = `sandbox_${config.agentId}`;

    const workdirPath = join(
      config.basePath,
      "containers",
      config.containerId,
      "workdirs",
      config.imageId
    );
    this.workdir = new RuntimeWorkdir(config.agentId, workdirPath);
  }

  /**
   * Initialize sandbox - create directories
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Create workdir
    await mkdir(this.workdir.path, { recursive: true });

    this.initialized = true;
  }

  /**
   * Cleanup sandbox - remove directories (optional)
   */
  async cleanup(): Promise<void> {
    // Note: We don't delete by default (data preservation)
    // Could add a force delete option if needed
  }
}
