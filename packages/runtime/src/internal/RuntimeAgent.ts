/**
 * RuntimeAgent - Full Agent implementation
 *
 * Combines:
 * - Interactor: User input handling (in)
 * - Driver: DriveableEvent listening (out)
 * - Engine: Event processing (MealyMachine)
 * - Presenter: Event output and persistence
 * - Session: Message storage
 *
 * Architecture:
 * ```
 * AgentInteractor (in)              BusDriver (out)
 *   │                                  │
 *   │ emit user_message                │ listen DriveableEvent
 *   ▼                                  ▼
 * SystemBus ─────────────────────────────────────────
 *   │                                  │
 *   ▼                                  │
 * ClaudeEffector                       │
 *   │                                  │
 *   ▼                                  │
 * Claude SDK                           │
 *   │                                  │
 *   ▼                                  │
 * ClaudeReceptor ──────────────────────┘
 *                                      │
 *                                      ▼
 *                               AgentEngine.handleStreamEvent()
 *                                      │
 *                                      ▼
 *                               BusPresenter (persist + emit)
 * ```
 */

import type {
  Agent as RuntimeAgentInterface,
  AgentLifecycle,
  AgentConfig,
  SystemEvent,
  EventCategory,
  ClaudeLLMConfig,
} from "@agentxjs/types/runtime";
import type {
  AgentEngine,
  AgentPresenter,
  AgentOutput,
  Message,
  UserContentPart,
} from "@agentxjs/types/agent";
import type {
  SystemBus,
  SystemBusProducer,
  Sandbox,
  Session,
  ImageRepository,
  ImageRecord,
  EnvironmentFactory,
  Environment,
} from "@agentxjs/types/runtime/internal";
import { createAgent } from "@agentxjs/agent";
import { createLogger, generateRequestId } from "@agentxjs/common";
import { BusDriver } from "./BusDriver";
import { AgentInteractor } from "./AgentInteractor";
import { defaultEnvironmentFactory } from "../environment/DefaultEnvironmentFactory";

const logger = createLogger("runtime/RuntimeAgent");

/**
 * RuntimeAgent configuration
 */
export interface RuntimeAgentConfig {
  agentId: string;
  imageId: string;
  containerId: string;
  config: AgentConfig;
  bus: SystemBus;
  sandbox: Sandbox;
  session: Session;
  /** LLM configuration for this agent's environment */
  llmConfig: ClaudeLLMConfig;
  /** Full image record for metadata access */
  image: ImageRecord;
  /** Image repository for persisting metadata */
  imageRepository: ImageRepository;
  /** Optional environment factory for dependency injection */
  environmentFactory?: EnvironmentFactory;
}

/**
 * BusPresenter - Forwards AgentOutput to SystemBus as proper SystemEvent
 *
 * Responsibilities:
 * 1. Filter out Stream layer events (already sent via DriveableEvent)
 * 2. Convert State/Message/Turn layer events to SystemEvent format
 * 3. Transform Message layer data to proper Message type for persistence
 *
 * Event Flow:
 * - Stream layer: SKIP (DriveableEvent already handles this)
 * - State layer: Convert to SystemEvent, emit
 * - Message layer: Convert data to Message type, emit, persist
 * - Turn layer: Convert to SystemEvent, emit
 *
 * Note: user_message is now persisted by AgentInteractor, not here.
 */
class BusPresenter implements AgentPresenter {
  readonly name = "BusPresenter";
  readonly description = "Forwards AgentOutput to SystemBus and collects messages";

  constructor(
    private readonly producer: SystemBusProducer,
    private readonly session: Session,
    private readonly agentId: string,
    private readonly imageId: string,
    private readonly containerId: string
  ) {}

  present(_agentId: string, output: AgentOutput): void {
    const category = this.getCategoryForOutput(output);

    // Skip user_message - it's now handled by AgentInteractor
    if (output.type === "user_message") {
      return;
    }

    // Convert data format based on category
    let data: unknown = output.data;
    if (category === "message") {
      data = this.convertToMessage(output);
    }

    // Build complete SystemEvent with full context
    // All events from BusPresenter are external (source: "agent") and will be enqueued
    const systemEvent: SystemEvent = {
      type: output.type,
      timestamp: output.timestamp,
      data,
      source: "agent",
      category,
      intent: "notification",
      context: {
        containerId: this.containerId,
        imageId: this.imageId,
        agentId: this.agentId,
        sessionId: this.session.sessionId,
      },
    };

    this.producer.emit(systemEvent);

    // NOTE: Message persistence is now handled by Queue ACK callback
    // in createLocalAgentX.ts, not here. This ensures messages are only
    // persisted after client acknowledges receipt.
  }

  /**
   * Convert AgentOutput to proper Message type for persistence
   *
   * Since messageAssemblerProcessor now emits complete Message objects,
   * we can directly use the data field without transformation.
   */
  private convertToMessage(output: AgentOutput): Message {
    // AgentOutput.data is already a complete Message object
    return output.data as Message;
  }

  /**
   * Determine event category from output type
   */
  private getCategoryForOutput(output: AgentOutput): EventCategory {
    const type = output.type;

    // Stream events - SKIP these
    if (
      type === "message_start" ||
      type === "message_delta" ||
      type === "message_stop" ||
      type === "text_delta" ||
      type === "tool_use_start" ||
      type === "input_json_delta" ||
      type === "tool_use_stop" ||
      type === "tool_result"
    ) {
      return "stream";
    }

    // Message events
    if (
      type === "user_message" ||
      type === "assistant_message" ||
      type === "tool_call_message" ||
      type === "tool_result_message" ||
      type === "error_message"
    ) {
      return "message";
    }

    // Turn events
    if (type === "turn_request" || type === "turn_response") {
      return "turn";
    }

    // State events (default)
    return "state";
  }
}

/**
 * RuntimeAgent - Full Agent with Interactor + Driver + Engine + Session
 */
export class RuntimeAgent implements RuntimeAgentInterface {
  readonly agentId: string;
  readonly imageId: string;
  readonly name: string;
  readonly containerId: string;
  readonly createdAt: number;

  private _lifecycle: AgentLifecycle = "running";
  private readonly interactor: AgentInteractor;
  private readonly driver: BusDriver;
  private readonly engine: AgentEngine;
  private readonly producer: SystemBusProducer;
  private readonly environment: Environment;
  private readonly imageRepository: ImageRepository;
  readonly session: Session;
  readonly config: AgentConfig;

  constructor(config: RuntimeAgentConfig) {
    this.agentId = config.agentId;
    this.imageId = config.imageId;
    // Read name from ImageRecord (single source of truth)
    this.name = config.image.name ?? `agent-${config.agentId}`;
    this.containerId = config.containerId;
    this.createdAt = Date.now();
    this.producer = config.bus.asProducer();
    this.session = config.session;
    this.config = config.config;
    this.imageRepository = config.imageRepository;

    // Create this agent's own Environment (using factory for DI support)
    // Resume using stored sdkSessionId if available
    // Read systemPrompt and mcpServers from ImageRecord (single source of truth)
    const resumeSessionId = config.image.metadata?.claudeSdkSessionId;
    const factory = config.environmentFactory ?? defaultEnvironmentFactory;

    this.environment = factory.create({
      agentId: this.agentId,
      llmConfig: config.llmConfig,
      systemPrompt: config.image.systemPrompt,
      cwd: config.sandbox.workdir.path,
      resumeSessionId,
      mcpServers: config.image.mcpServers,
      onSessionIdCaptured: (sdkSessionId) => {
        // Persist sdkSessionId to image metadata for future resume
        this.saveSessionId(sdkSessionId);
      },
    });

    // Connect environment to bus
    this.environment.receptor.connect(config.bus.asProducer());
    this.environment.effector.connect(config.bus.asConsumer());

    // Warmup environment (fire-and-forget to reduce first message latency)
    if (this.environment.warmup) {
      this.environment.warmup().catch((err) => {
        logger.warn("Environment warmup failed (non-fatal)", { error: err, agentId: this.agentId });
      });
    }

    logger.info("Environment created for agent", {
      agentId: this.agentId,
      environmentName: this.environment.name,
      imageId: this.imageId,
      cwd: config.sandbox.workdir.path,
      resumeSessionId: resumeSessionId ?? "none",
      isResume: !!resumeSessionId,
      imageMetadata: config.image.metadata,
    });

    // Create Presenter (forwards to bus + persists to session)
    const presenter = new BusPresenter(
      this.producer,
      config.session,
      this.agentId,
      this.imageId,
      this.containerId
    );

    // Create Engine (from @agentxjs/agent) - no driver needed for push mode
    // We use a dummy driver since we're using push-based handleStreamEvent
    this.engine = createAgent({
      driver: {
        name: "DummyDriver",
        description: "Placeholder driver for push-based event handling",
        receive: async function* () {
          // Not used - events are pushed via handleStreamEvent
        },
        interrupt: () => {},
      },
      presenter,
    });

    // Create Interactor (handles user input - the "in" side)
    this.interactor = new AgentInteractor(this.producer, config.session, {
      agentId: this.agentId,
      imageId: this.imageId,
      containerId: this.containerId,
      sessionId: config.session.sessionId,
    });

    // Create Driver (listens for DriveableEvents - the "out" side)
    // It pushes events to engine.handleStreamEvent
    this.driver = new BusDriver(config.bus.asConsumer(), {
      agentId: this.agentId,
      onStreamEvent: (event) => {
        logger.debug("BusDriver → Engine.handleStreamEvent", { type: event.type });
        this.engine.handleStreamEvent(event);
      },
      onStreamComplete: (reason) => {
        logger.debug("Stream completed", { reason, agentId: this.agentId });
      },
    });

    logger.debug("RuntimeAgent created", {
      agentId: this.agentId,
      imageId: this.imageId,
    });
  }

  /**
   * Save SDK session ID to image metadata for future resume
   */
  private saveSessionId(sdkSessionId: string): void {
    logger.info("Saving SDK session ID to image metadata", {
      agentId: this.agentId,
      imageId: this.imageId,
      sdkSessionId,
    });
    this.imageRepository
      .updateMetadata(this.imageId, { claudeSdkSessionId: sdkSessionId })
      .catch((err) => {
        logger.error("Failed to save SDK session ID", { error: err, imageId: this.imageId });
      });
  }

  get lifecycle(): AgentLifecycle {
    return this._lifecycle;
  }

  /**
   * Receive a message from user
   *
   * @param content - Message content (string or multimodal content parts)
   * @param requestId - Request ID for correlation
   */
  async receive(content: string | UserContentPart[], requestId?: string): Promise<void> {
    const contentPreview =
      typeof content === "string" ? content.substring(0, 50) : `[${content.length} parts]`;

    logger.debug("RuntimeAgent.receive called", {
      agentId: this.agentId,
      contentPreview,
      requestId,
    });

    if (this._lifecycle !== "running") {
      throw new Error(`Cannot send message to ${this._lifecycle} agent`);
    }

    // Use Interactor to handle user input
    // This will: build UserMessage, persist, emit to bus
    // BusDriver will receive DriveableEvents when Claude responds
    await this.interactor.receive(content, requestId || generateRequestId());

    logger.debug("RuntimeAgent.receive completed", { agentId: this.agentId });
  }

  /**
   * Interrupt current operation
   */
  interrupt(requestId?: string): void {
    logger.debug("RuntimeAgent.interrupt called", { agentId: this.agentId, requestId });

    // Use Interactor to send interrupt
    this.interactor.interrupt(requestId);

    // Emit interrupted event
    this.producer.emit({
      type: "interrupted",
      timestamp: Date.now(),
      source: "agent",
      category: "lifecycle",
      intent: "notification",
      data: {
        agentId: this.agentId,
        containerId: this.containerId,
      },
      context: {
        containerId: this.containerId,
        imageId: this.imageId,
        agentId: this.agentId,
        sessionId: this.session.sessionId,
      },
    });
  }

  async stop(): Promise<void> {
    if (this._lifecycle === "destroyed") {
      throw new Error("Cannot stop destroyed agent");
    }
    this._lifecycle = "stopped";
  }

  async resume(): Promise<void> {
    if (this._lifecycle === "destroyed") {
      throw new Error("Cannot resume destroyed agent");
    }
    this._lifecycle = "running";

    // Emit session_resumed event
    this.producer.emit({
      type: "session_resumed",
      timestamp: Date.now(),
      source: "session",
      category: "lifecycle",
      intent: "notification",
      data: {
        sessionId: this.session.sessionId,
        agentId: this.agentId,
        containerId: this.containerId,
      },
      context: {
        containerId: this.containerId,
        imageId: this.imageId,
        agentId: this.agentId,
        sessionId: this.session.sessionId,
      },
    });
  }

  async destroy(): Promise<void> {
    if (this._lifecycle !== "destroyed") {
      // Dispose driver (stop listening)
      this.driver.dispose();

      // Dispose environment (cleanup SDK resources)
      this.environment.dispose();

      // Destroy engine
      await this.engine.destroy();
      this._lifecycle = "destroyed";

      // Emit session_destroyed event
      this.producer.emit({
        type: "session_destroyed",
        timestamp: Date.now(),
        source: "session",
        category: "lifecycle",
        intent: "notification",
        data: {
          sessionId: this.session.sessionId,
          agentId: this.agentId,
          containerId: this.containerId,
        },
        context: {
          containerId: this.containerId,
          imageId: this.imageId,
          agentId: this.agentId,
          sessionId: this.session.sessionId,
        },
      });
    }
  }
}
