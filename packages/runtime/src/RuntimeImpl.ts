/**
 * RuntimeImpl - Event-driven Runtime implementation
 *
 * All operations are delegated to SystemBus. CommandHandler listens
 * for command events and executes the actual operations.
 *
 * Architecture:
 * ```
 * RuntimeImpl (implements Runtime extends SystemBus)
 *     │
 *     ├── emit/on/onCommand/emitCommand/request  ← public API
 *     │
 *     ├── bus: SystemBusImpl  ← actual event handling
 *     │
 *     └── commandHandler: CommandHandler  ← listens for commands, executes operations
 * ```
 */

import type { Persistence } from "@agentxjs/types";
import type { Runtime, ClaudeLLMConfig, LLMProvider } from "@agentxjs/types/runtime";
import type { Agent } from "@agentxjs/types/runtime";
import type { UserContentPart } from "@agentxjs/types/agent";
import type {
  BusEventHandler,
  SubscribeOptions,
  Unsubscribe,
  McpServerConfig,
  EnvironmentFactory,
} from "@agentxjs/types/runtime/internal";
import type {
  SystemEvent,
  CommandEventMap,
  CommandRequestType,
  ResponseEventFor,
  RequestDataFor,
} from "@agentxjs/types/event";
import type { AgentDefinition } from "@agentxjs/types/agentx";
import type { RuntimeConfig } from "./createRuntime";
import type { RuntimeImageContext, RuntimeContainerContext } from "./internal";
import type { ImageListItemResult } from "./internal/CommandHandler";
import {
  SystemBusImpl,
  RuntimeImage,
  RuntimeContainer,
  CommandHandler,
  type RuntimeOperations,
} from "./internal";
import { createLogger } from "@agentxjs/common";

const logger = createLogger("runtime/RuntimeImpl");

/**
 * RuntimeImpl - Implementation of Runtime interface
 *
 * Delegates all SystemBus methods to internal bus instance.
 */
export class RuntimeImpl implements Runtime {
  private readonly persistence: Persistence;
  private readonly llmProvider: LLMProvider<ClaudeLLMConfig>;
  private readonly bus: SystemBusImpl;
  private readonly llmConfig: ClaudeLLMConfig;
  private readonly basePath: string;
  private readonly commandHandler: CommandHandler;
  private readonly defaultAgent?: AgentDefinition;
  private readonly environmentFactory?: EnvironmentFactory;

  /** Container registry: containerId -> RuntimeContainer */
  private readonly containerRegistry = new Map<string, RuntimeContainer>();

  constructor(config: RuntimeConfig) {
    logger.info("RuntimeImpl constructor start");
    this.persistence = config.persistence;
    this.llmProvider = config.llmProvider;
    this.basePath = config.basePath;
    this.defaultAgent = config.defaultAgent;
    this.environmentFactory = config.environmentFactory;

    // Create SystemBus
    logger.info("Creating SystemBus");
    this.bus = new SystemBusImpl();

    // Get LLM config (each Agent will create its own Environment)
    this.llmConfig = this.llmProvider.provide();
    logger.info("LLM config loaded", {
      hasApiKey: !!this.llmConfig.apiKey,
      model: this.llmConfig.model,
    });

    // Create CommandHandler to handle command events
    logger.info("Creating CommandHandler");
    this.commandHandler = new CommandHandler(this.bus, this.createRuntimeOperations());

    logger.info("RuntimeImpl constructor done");
  }

  // ==================== SystemBus delegation ====================

  emit(event: SystemEvent): void {
    this.bus.emit(event);
  }

  emitBatch(events: SystemEvent[]): void {
    this.bus.emitBatch(events);
  }

  on<T extends string>(
    typeOrTypes: T | string[],
    handler: BusEventHandler<SystemEvent & { type: T }>,
    options?: SubscribeOptions<SystemEvent & { type: T }>
  ): Unsubscribe {
    return this.bus.on(typeOrTypes, handler, options);
  }

  onAny(handler: BusEventHandler, options?: SubscribeOptions): Unsubscribe {
    return this.bus.onAny(handler, options);
  }

  once<T extends string>(
    type: T,
    handler: BusEventHandler<SystemEvent & { type: T }>
  ): Unsubscribe {
    return this.bus.once(type, handler);
  }

  onCommand<T extends keyof CommandEventMap>(
    type: T,
    handler: (event: CommandEventMap[T]) => void
  ): Unsubscribe {
    return this.bus.onCommand(type, handler);
  }

  emitCommand<T extends keyof CommandEventMap>(type: T, data: CommandEventMap[T]["data"]): void {
    this.bus.emitCommand(type, data);
  }

  request<T extends CommandRequestType>(
    type: T,
    data: RequestDataFor<T>,
    timeout?: number
  ): Promise<ResponseEventFor<T>> {
    return this.bus.request(type, data, timeout);
  }

  asConsumer() {
    return this.bus.asConsumer();
  }

  asProducer() {
    return this.bus.asProducer();
  }

  destroy(): void {
    this.bus.destroy();
  }

  // ==================== Runtime Operations (for CommandHandler) ====================

  private createRuntimeOperations(): RuntimeOperations {
    return {
      // Container operations
      createContainer: async (containerId: string) => {
        const container = await this.getOrCreateContainer(containerId);
        return { containerId: container.containerId };
      },
      getContainer: (containerId: string) => {
        const container = this.containerRegistry.get(containerId);
        return container ? { containerId: container.containerId } : undefined;
      },
      listContainers: () => {
        return Array.from(this.containerRegistry.values()).map((c) => ({
          containerId: c.containerId,
        }));
      },

      // Agent operations (by agentId)
      getAgent: (agentId: string) => {
        const agent = this.findAgent(agentId);
        if (!agent) return undefined;
        // Find imageId for this agent
        const imageId = this.findImageIdForAgent(agentId);
        return { agentId: agent.agentId, containerId: agent.containerId, imageId: imageId ?? "" };
      },
      listAgents: (containerId: string) => {
        const container = this.containerRegistry.get(containerId);
        if (!container) return [];
        return container.listAgents().map((a) => {
          const imageId = this.findImageIdForAgent(a.agentId);
          return { agentId: a.agentId, containerId: a.containerId, imageId: imageId ?? "" };
        });
      },
      destroyAgent: async (agentId: string) => {
        for (const container of this.containerRegistry.values()) {
          if (container.getAgent(agentId)) {
            return container.destroyAgent(agentId);
          }
        }
        return false;
      },
      destroyAllAgents: async (containerId: string) => {
        const container = this.containerRegistry.get(containerId);
        await container?.destroyAllAgents();
      },

      // Agent operations (by imageId - with auto-activation)
      receiveMessage: async (
        imageId: string | undefined,
        agentId: string | undefined,
        content: string | UserContentPart[],
        requestId: string
      ) => {
        // If imageId provided, auto-activate the image
        if (imageId) {
          logger.debug("Receiving message by imageId", {
            imageId,
            contentLength: content.length,
            requestId,
          });
          const record = await this.persistence.images.findImageById(imageId);
          if (!record) throw new Error(`Image not found: ${imageId}`);

          const container = await this.getOrCreateContainer(record.containerId);
          const { agent, reused } = await container.runImage(record);
          logger.info("Message routed to agent", {
            imageId,
            agentId: agent.agentId,
            reused,
            requestId,
          });
          // Pass requestId for event correlation
          await agent.receive(content, requestId);
          return { agentId: agent.agentId, imageId };
        }

        // Fallback to agentId (legacy)
        if (agentId) {
          logger.debug("Receiving message by agentId (legacy)", {
            agentId,
            contentLength: content.length,
            requestId,
          });
          const agent = this.findAgent(agentId);
          if (!agent) throw new Error(`Agent not found: ${agentId}`);
          // Pass requestId for event correlation
          await agent.receive(content, requestId);
          const foundImageId = this.findImageIdForAgent(agentId);
          return { agentId, imageId: foundImageId };
        }

        throw new Error("Either imageId or agentId must be provided");
      },
      interruptAgent: (
        imageId: string | undefined,
        agentId: string | undefined,
        requestId?: string
      ) => {
        // If imageId provided, find agent for that image
        if (imageId) {
          const foundAgentId = this.findAgentIdForImage(imageId);
          if (!foundAgentId) {
            logger.debug("Image is offline, nothing to interrupt", { imageId });
            return { imageId, agentId: undefined };
          }
          const agent = this.findAgent(foundAgentId);
          if (agent) {
            logger.info("Interrupting agent by imageId", {
              imageId,
              agentId: foundAgentId,
              requestId,
            });
            // Pass requestId for event correlation
            agent.interrupt(requestId);
          }
          return { imageId, agentId: foundAgentId };
        }

        // Fallback to agentId (legacy)
        if (agentId) {
          const agent = this.findAgent(agentId);
          if (!agent) throw new Error(`Agent not found: ${agentId}`);
          logger.info("Interrupting agent by agentId (legacy)", { agentId, requestId });
          // Pass requestId for event correlation
          agent.interrupt(requestId);
          const foundImageId = this.findImageIdForAgent(agentId);
          return { agentId, imageId: foundImageId };
        }

        throw new Error("Either imageId or agentId must be provided");
      },

      // Image operations (new model)
      createImage: async (
        containerId: string,
        config: {
          name?: string;
          description?: string;
          systemPrompt?: string;
          mcpServers?: Record<string, McpServerConfig>;
        }
      ) => {
        logger.debug("Creating image", { containerId, name: config.name });
        // Ensure container exists
        await this.getOrCreateContainer(containerId);

        // Merge defaultAgent with incoming config (incoming takes precedence)
        const mergedConfig = {
          containerId,
          name: config.name ?? this.defaultAgent?.name,
          description: config.description ?? this.defaultAgent?.description,
          systemPrompt: config.systemPrompt ?? this.defaultAgent?.systemPrompt,
          mcpServers: config.mcpServers ?? this.defaultAgent?.mcpServers,
        };

        logger.debug("Merged config for image creation", {
          containerId,
          name: mergedConfig.name,
          hasSystemPrompt: !!mergedConfig.systemPrompt,
          mcpServers: mergedConfig.mcpServers ? Object.keys(mergedConfig.mcpServers) : [],
        });

        // Create image
        const image = await RuntimeImage.create(mergedConfig, this.createImageContext());

        logger.info("Image created via RuntimeOps", { imageId: image.imageId, containerId });
        return this.toImageListItemResult(image.toRecord(), false);
      },
      runImage: async (imageId: string) => {
        logger.debug("Running image", { imageId });
        const record = await this.persistence.images.findImageById(imageId);
        if (!record) throw new Error(`Image not found: ${imageId}`);

        const container = await this.getOrCreateContainer(record.containerId);
        const { agent, reused } = await container.runImage(record);
        logger.info("Image running", { imageId, agentId: agent.agentId, reused });
        return { imageId, agentId: agent.agentId, reused };
      },
      stopImage: async (imageId: string) => {
        logger.debug("Stopping image", { imageId });
        const record = await this.persistence.images.findImageById(imageId);
        if (!record) throw new Error(`Image not found: ${imageId}`);

        const container = this.containerRegistry.get(record.containerId);
        if (container) {
          await container.stopImage(imageId);
          logger.info("Image stopped via RuntimeOps", { imageId });
        }
      },
      updateImage: async (imageId: string, updates: { name?: string; description?: string }) => {
        const image = await RuntimeImage.load(imageId, this.createImageContext());
        if (!image) throw new Error(`Image not found: ${imageId}`);

        const updatedImage = await image.update(updates);
        const online = this.isImageOnline(imageId);
        return this.toImageListItemResult(updatedImage.toRecord(), online);
      },
      listImages: async (containerId?: string) => {
        const records = containerId
          ? await RuntimeImage.listByContainer(containerId, this.createImageContext())
          : await RuntimeImage.listAll(this.createImageContext());

        return records.map((r) => {
          const online = this.isImageOnline(r.imageId);
          return this.toImageListItemResult(r, online);
        });
      },
      getImage: async (imageId: string) => {
        const record = await this.persistence.images.findImageById(imageId);
        if (!record) return null;

        const online = this.isImageOnline(imageId);
        return this.toImageListItemResult(record, online);
      },
      deleteImage: async (imageId: string) => {
        logger.debug("Deleting image", { imageId });
        // Stop agent if running
        const agentId = this.findAgentIdForImage(imageId);
        if (agentId) {
          logger.debug("Stopping running agent before delete", { imageId, agentId });
          for (const container of this.containerRegistry.values()) {
            if (container.getAgent(agentId)) {
              await container.destroyAgent(agentId);
              break;
            }
          }
        }

        // Delete image (and session)
        const image = await RuntimeImage.load(imageId, this.createImageContext());
        if (image) {
          await image.delete();
          logger.info("Image deleted via RuntimeOps", { imageId });
        }
      },
      getImageMessages: async (imageId: string) => {
        logger.debug("Getting messages for image", { imageId });
        const image = await RuntimeImage.load(imageId, this.createImageContext());
        if (!image) {
          throw new Error(`Image not found: ${imageId}`);
        }

        const messages = await image.getMessages();
        logger.debug("Got messages from storage", { imageId, count: messages.length });
        // Return complete Message objects (not transformed)
        // UI layer expects full Message structure with subtype
        return messages;
      },
    };
  }

  // ==================== Internal Helpers ====================

  private async getOrCreateContainer(containerId: string): Promise<RuntimeContainer> {
    // Check if already in memory
    const existing = this.containerRegistry.get(containerId);
    if (existing) return existing;

    // Try to load from persistence
    const loaded = await RuntimeContainer.load(containerId, this.createContainerContext());
    if (loaded) {
      this.containerRegistry.set(containerId, loaded);
      return loaded;
    }

    // Create new container
    const container = await RuntimeContainer.create(containerId, this.createContainerContext());
    this.containerRegistry.set(containerId, container);
    return container;
  }

  private findAgent(agentId: string): Agent | undefined {
    for (const container of this.containerRegistry.values()) {
      const agent = container.getAgent(agentId);
      if (agent) return agent;
    }
    return undefined;
  }

  /**
   * Find imageId for a given agentId (reverse lookup)
   */
  private findImageIdForAgent(agentId: string): string | undefined {
    for (const container of this.containerRegistry.values()) {
      const imageId = container.getImageIdForAgent(agentId);
      if (imageId) return imageId;
    }
    return undefined;
  }

  /**
   * Find agentId for a given imageId
   */
  private findAgentIdForImage(imageId: string): string | undefined {
    for (const container of this.containerRegistry.values()) {
      const agentId = container.getAgentIdForImage(imageId);
      if (agentId) return agentId;
    }
    return undefined;
  }

  /**
   * Check if an image has a running agent
   */
  private isImageOnline(imageId: string): boolean {
    for (const container of this.containerRegistry.values()) {
      if (container.isImageOnline(imageId)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Convert ImageRecord to ImageListItemResult
   */
  private toImageListItemResult(
    record: import("@agentxjs/types").ImageRecord,
    online: boolean
  ): ImageListItemResult {
    const agentId = online ? this.findAgentIdForImage(record.imageId) : undefined;
    return {
      imageId: record.imageId,
      containerId: record.containerId,
      sessionId: record.sessionId,
      name: record.name,
      description: record.description,
      systemPrompt: record.systemPrompt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      online,
      agentId,
    };
  }

  private createContainerContext(): RuntimeContainerContext {
    return {
      persistence: this.persistence,
      bus: this.bus,
      llmConfig: this.llmConfig,
      basePath: this.basePath,
      environmentFactory: this.environmentFactory,
      onDisposed: (containerId) => {
        this.containerRegistry.delete(containerId);
      },
    };
  }

  private createImageContext(): RuntimeImageContext {
    return {
      imageRepository: this.persistence.images,
      sessionRepository: this.persistence.sessions,
    };
  }

  // ==================== Lifecycle ====================

  async dispose(): Promise<void> {
    logger.info("Disposing RuntimeImpl");

    // Dispose CommandHandler
    this.commandHandler.dispose();

    // Dispose all containers (which destroys all agents and their environments)
    for (const container of this.containerRegistry.values()) {
      await container.dispose();
    }

    // Destroy bus
    this.bus.destroy();

    // Clear all state
    this.containerRegistry.clear();

    logger.info("RuntimeImpl disposed");
  }
}
