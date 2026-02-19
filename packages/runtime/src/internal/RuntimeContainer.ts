/**
 * RuntimeContainer - Container implementation with agent management
 *
 * Container is an object with behavior. It manages agents internally.
 * In the new Image-First model:
 * - Image is the persistent entity (conversation)
 * - Agent is a transient runtime instance of an Image
 * - Container tracks imageId → agentId mapping
 */

import type { Container, Agent, ClaudeLLMConfig } from "@agentxjs/types/runtime";
import type { Persistence, ContainerRecord, ImageRecord } from "@agentxjs/types";
import type { SystemBus, EnvironmentFactory } from "@agentxjs/types/runtime/internal";
import { RuntimeAgent } from "./RuntimeAgent";
import { RuntimeSession } from "./RuntimeSession";
import { RuntimeSandbox } from "./RuntimeSandbox";
import { createLogger } from "@agentxjs/common";

const logger = createLogger("runtime/RuntimeContainer");

/**
 * Context needed by RuntimeContainer to operate
 */
export interface RuntimeContainerContext {
  persistence: Persistence;
  bus: SystemBus;
  /** LLM configuration for creating agent environments */
  llmConfig: ClaudeLLMConfig;
  basePath: string;
  /** Optional environment factory for dependency injection (e.g., mock for testing) */
  environmentFactory?: EnvironmentFactory;
  /** Callback when container is disposed */
  onDisposed?: (containerId: string) => void;
}

/**
 * RuntimeContainer - Full Container implementation
 */
export class RuntimeContainer implements Container {
  readonly containerId: string;
  readonly createdAt: number;

  /** Map of agentId → RuntimeAgent */
  private readonly agents = new Map<string, RuntimeAgent>();
  /** Map of imageId → agentId (for quick lookup) */
  private readonly imageToAgent = new Map<string, string>();
  private readonly context: RuntimeContainerContext;

  private constructor(containerId: string, createdAt: number, context: RuntimeContainerContext) {
    this.containerId = containerId;
    this.createdAt = createdAt;
    this.context = context;
  }

  /**
   * Create a new container and persist it
   */
  static async create(
    containerId: string,
    context: RuntimeContainerContext
  ): Promise<RuntimeContainer> {
    const now = Date.now();

    // Persist container record
    const record: ContainerRecord = {
      containerId,
      createdAt: now,
      updatedAt: now,
    };
    await context.persistence.containers.saveContainer(record);

    const container = new RuntimeContainer(containerId, now, context);

    // Emit container_created event
    context.bus.emit({
      type: "container_created",
      timestamp: now,
      source: "container",
      category: "lifecycle",
      intent: "notification",
      data: {
        containerId,
        createdAt: now,
      },
      context: {
        containerId,
      },
    });

    logger.info("Container created", { containerId });
    return container;
  }

  /**
   * Load an existing container from persistence
   */
  static async load(
    containerId: string,
    context: RuntimeContainerContext
  ): Promise<RuntimeContainer | null> {
    const record = await context.persistence.containers.findContainerById(containerId);
    if (!record) return null;

    logger.info("Container loaded", { containerId });
    return new RuntimeContainer(containerId, record.createdAt, context);
  }

  // ==================== Image → Agent Lifecycle ====================

  /**
   * Run an image - create or reuse an Agent for the given Image
   * @returns { agent, reused } - the agent and whether it was reused
   */
  async runImage(image: ImageRecord): Promise<{ agent: Agent; reused: boolean }> {
    // Check if agent already exists for this image
    const existingAgentId = this.imageToAgent.get(image.imageId);
    if (existingAgentId) {
      const existingAgent = this.agents.get(existingAgentId);
      if (existingAgent) {
        logger.info("Reusing existing agent for image", {
          containerId: this.containerId,
          imageId: image.imageId,
          agentId: existingAgentId,
        });
        return { agent: existingAgent, reused: true };
      }
      // Agent was destroyed but mapping still exists, clean up
      this.imageToAgent.delete(image.imageId);
    }

    // Create new agent for this image
    const agentId = this.generateAgentId();

    // Create and initialize Sandbox
    const sandbox = new RuntimeSandbox({
      agentId,
      imageId: image.imageId,
      containerId: this.containerId,
      basePath: this.context.basePath,
    });
    await sandbox.initialize();

    // Create Session wrapper (uses existing sessionId from Image)
    const session = new RuntimeSession({
      sessionId: image.sessionId,
      imageId: image.imageId,
      containerId: this.containerId,
      repository: this.context.persistence.sessions,
      producer: this.context.bus.asProducer(),
    });
    // Note: Don't call initialize() - session already exists in storage

    // Create RuntimeAgent with its own Environment
    // RuntimeAgent reads name, systemPrompt, mcpServers from ImageRecord (single source of truth)
    const agent = new RuntimeAgent({
      agentId,
      imageId: image.imageId,
      containerId: this.containerId,
      config: {}, // Runtime-only config (ImageRecord is the source of truth)
      bus: this.context.bus,
      sandbox,
      session,
      llmConfig: this.context.llmConfig,
      image, // Pass full image record for metadata access
      imageRepository: this.context.persistence.images,
      environmentFactory: this.context.environmentFactory,
    });

    // Register agent and mapping
    this.agents.set(agentId, agent);
    this.imageToAgent.set(image.imageId, agentId);

    // Emit agent_registered event
    this.context.bus.emit({
      type: "agent_registered",
      timestamp: Date.now(),
      source: "container",
      category: "lifecycle",
      intent: "notification",
      data: {
        containerId: this.containerId,
        agentId,
        definitionName: image.name,
        registeredAt: Date.now(),
      },
      context: {
        containerId: this.containerId,
        agentId,
      },
    });

    logger.info("Agent created for image", {
      containerId: this.containerId,
      imageId: image.imageId,
      agentId,
    });
    return { agent, reused: false };
  }

  /**
   * Stop an image - destroy the Agent but keep the Image
   */
  async stopImage(imageId: string): Promise<boolean> {
    const agentId = this.imageToAgent.get(imageId);
    if (!agentId) {
      logger.debug("Image not running, nothing to stop", {
        imageId,
        containerId: this.containerId,
      });
      return false;
    }

    logger.info("Stopping image", { imageId, agentId, containerId: this.containerId });
    const success = await this.destroyAgent(agentId);
    if (success) {
      this.imageToAgent.delete(imageId);
      logger.info("Image stopped", { imageId, agentId, containerId: this.containerId });
    }
    return success;
  }

  /**
   * Get agent ID for an image (if running)
   */
  getAgentIdForImage(imageId: string): string | undefined {
    return this.imageToAgent.get(imageId);
  }

  /**
   * Check if an image has a running agent
   */
  isImageOnline(imageId: string): boolean {
    const agentId = this.imageToAgent.get(imageId);
    return agentId !== undefined && this.agents.has(agentId);
  }

  /**
   * Get imageId for an agent (reverse lookup)
   */
  getImageIdForAgent(agentId: string): string | undefined {
    for (const [imageId, mappedAgentId] of this.imageToAgent.entries()) {
      if (mappedAgentId === agentId) {
        return imageId;
      }
    }
    return undefined;
  }

  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  listAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  get agentCount(): number {
    return this.agents.size;
  }

  async destroyAgent(agentId: string): Promise<boolean> {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    // Call agent's destroy
    await agent.destroy();

    // Remove from registry
    this.agents.delete(agentId);

    // Emit agent_unregistered event
    this.context.bus.emit({
      type: "agent_unregistered",
      timestamp: Date.now(),
      source: "container",
      category: "lifecycle",
      intent: "notification",
      data: {
        containerId: this.containerId,
        agentId,
      },
      context: {
        containerId: this.containerId,
        agentId,
      },
    });

    logger.info("Agent destroyed", { containerId: this.containerId, agentId });
    return true;
  }

  async destroyAllAgents(): Promise<void> {
    const agentIds = Array.from(this.agents.keys());
    for (const agentId of agentIds) {
      await this.destroyAgent(agentId);
    }
  }

  // ==================== Container Lifecycle ====================

  async dispose(): Promise<void> {
    const agentCount = this.agents.size;

    // Destroy all agents
    await this.destroyAllAgents();

    // Emit container_destroyed event
    this.context.bus.emit({
      type: "container_destroyed",
      timestamp: Date.now(),
      source: "container",
      category: "lifecycle",
      intent: "notification",
      data: {
        containerId: this.containerId,
        agentCount,
      },
      context: {
        containerId: this.containerId,
      },
    });

    // Notify runtime that this container is disposed
    this.context.onDisposed?.(this.containerId);

    logger.info("Container disposed", { containerId: this.containerId, agentCount });
    // Note: Container record stays in persistence (dispose != delete)
  }

  // ==================== Private Helpers ====================

  private generateAgentId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `agent_${timestamp}_${random}`;
  }
}
