/**
 * SDKQueryLifecycle - Manages Claude SDK query lifecycle
 *
 * This class encapsulates the low-level SDK interaction:
 * - Query initialization and lazy loading
 * - Background listener for SDK responses
 * - Interrupt and cleanup operations
 *
 * It emits events via callbacks, allowing the parent Effector
 * to handle business logic like timeout management.
 */

import {
  query,
  type SDKUserMessage,
  type Query,
  type SDKMessage,
} from "@anthropic-ai/claude-agent-sdk";
import { Subject } from "rxjs";
import { createLogger } from "@agentxjs/common";
import { buildOptions, type EnvironmentContext } from "./buildOptions";
import { observableToAsyncIterable } from "./observableToAsyncIterable";

const logger = createLogger("environment/SDKQueryLifecycle");

/**
 * Callbacks for SDK events
 */
export interface SDKQueryCallbacks {
  /** Called when a stream_event is received */
  onStreamEvent?: (msg: SDKMessage) => void;
  /** Called when a user message is received (contains tool_result) */
  onUserMessage?: (msg: SDKMessage) => void;
  /** Called when a result is received */
  onResult?: (msg: SDKMessage) => void;
  /** Called when session ID is captured */
  onSessionIdCaptured?: (sessionId: string) => void;
  /** Called when an error occurs */
  onError?: (error: Error) => void;
  /** Called when the listener exits (normally or due to error) */
  onListenerExit?: (reason: "normal" | "abort" | "error") => void;
}

/**
 * Configuration for SDKQueryLifecycle
 */
export interface SDKQueryConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  systemPrompt?: string;
  cwd?: string;
  resumeSessionId?: string;
  mcpServers?: Record<string, import("@agentxjs/types/runtime").McpServerConfig>;
}

/**
 * SDKQueryLifecycle - Manages the lifecycle of a Claude SDK query
 *
 * Responsibilities:
 * - Lazy initialization of SDK query
 * - Background listener for SDK responses
 * - Interrupt and cleanup operations
 * - Resource management (subprocess termination)
 */
export class SDKQueryLifecycle {
  private readonly config: SDKQueryConfig;
  private readonly callbacks: SDKQueryCallbacks;

  private promptSubject = new Subject<SDKUserMessage>();
  private claudeQuery: Query | null = null;
  private isInitialized = false;
  private abortController: AbortController | null = null;
  private capturedSessionId: string | null = null;

  constructor(config: SDKQueryConfig, callbacks: SDKQueryCallbacks = {}) {
    this.config = config;
    this.callbacks = callbacks;
  }

  /**
   * Check if the query is initialized
   */
  get initialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Warmup the SDK query (pre-initialize)
   *
   * Call this early to start the SDK subprocess before the first message.
   * This reduces latency for the first user message.
   *
   * @returns Promise that resolves when SDK is ready
   */
  async warmup(): Promise<void> {
    logger.info("Warming up SDKQueryLifecycle");
    await this.initialize();
    logger.info("SDKQueryLifecycle warmup complete");
  }

  /**
   * Initialize the SDK query (lazy initialization)
   *
   * Creates the query and starts the background listener.
   * Safe to call multiple times - will only initialize once.
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    logger.info("Initializing SDKQueryLifecycle");

    this.abortController = new AbortController();

    const context: EnvironmentContext = {
      apiKey: this.config.apiKey,
      baseUrl: this.config.baseUrl,
      model: this.config.model,
      systemPrompt: this.config.systemPrompt,
      cwd: this.config.cwd,
      resume: this.config.resumeSessionId,
      mcpServers: this.config.mcpServers,
    };

    const sdkOptions = buildOptions(context, this.abortController);
    const promptStream = observableToAsyncIterable<SDKUserMessage>(this.promptSubject);

    this.claudeQuery = query({
      prompt: promptStream,
      options: sdkOptions,
    });

    this.isInitialized = true;

    // Start background listener
    this.startBackgroundListener();

    logger.info("SDKQueryLifecycle initialized");
  }

  /**
   * Send a message to the SDK
   *
   * Must call initialize() first.
   */
  send(message: SDKUserMessage): void {
    if (!this.isInitialized) {
      throw new Error("SDKQueryLifecycle not initialized. Call initialize() first.");
    }
    this.promptSubject.next(message);
  }

  /**
   * Interrupt the current SDK operation
   */
  interrupt(): void {
    if (this.claudeQuery) {
      logger.debug("Interrupting SDK query");
      this.claudeQuery.interrupt().catch((err) => {
        logger.debug("SDK interrupt() error (may be expected)", { error: err });
      });
    }
  }

  /**
   * Reset state and cleanup resources
   *
   * This properly terminates the Claude subprocess by:
   * 1. Completing the prompt stream (signals end of input)
   * 2. Interrupting any ongoing operation
   * 3. Resetting state for potential reuse
   */
  reset(): void {
    logger.debug("Resetting SDKQueryLifecycle");

    // 1. Complete the prompt stream first (signals end of input to subprocess)
    this.promptSubject.complete();

    // 2. Interrupt any ongoing operation
    if (this.claudeQuery) {
      this.claudeQuery.interrupt().catch((err) => {
        logger.debug("SDK interrupt() during reset (may be expected)", { error: err });
      });
    }

    // 3. Reset state for potential reuse
    this.isInitialized = false;
    this.claudeQuery = null;
    this.abortController = null;
    this.promptSubject = new Subject<SDKUserMessage>();
  }

  /**
   * Dispose and cleanup all resources
   *
   * Should be called when the lifecycle is no longer needed.
   */
  dispose(): void {
    logger.debug("Disposing SDKQueryLifecycle");

    // Interrupt first
    if (this.claudeQuery) {
      this.claudeQuery.interrupt().catch((err) => {
        logger.debug("SDK interrupt() during dispose (may be expected)", { error: err });
      });
    }

    // Abort controller
    if (this.abortController) {
      this.abortController.abort();
    }

    // Reset state
    this.reset();

    logger.debug("SDKQueryLifecycle disposed");
  }

  /**
   * Start the background listener for SDK responses
   */
  private startBackgroundListener(): void {
    (async () => {
      try {
        for await (const sdkMsg of this.claudeQuery!) {
          logger.debug("SDK message received", {
            type: sdkMsg.type,
            subtype: (sdkMsg as { subtype?: string }).subtype,
            sessionId: sdkMsg.session_id,
          });

          // Capture session ID (only once, on first occurrence)
          if (
            sdkMsg.session_id &&
            this.callbacks.onSessionIdCaptured &&
            this.capturedSessionId !== sdkMsg.session_id
          ) {
            this.capturedSessionId = sdkMsg.session_id;
            this.callbacks.onSessionIdCaptured(sdkMsg.session_id);
          }

          // Forward stream_event
          if (sdkMsg.type === "stream_event") {
            this.callbacks.onStreamEvent?.(sdkMsg);
          }

          // Forward user message (contains tool_result)
          if (sdkMsg.type === "user") {
            this.callbacks.onUserMessage?.(sdkMsg);
          }

          // Handle result
          if (sdkMsg.type === "result") {
            logger.info("SDK result received", {
              subtype: (sdkMsg as { subtype?: string }).subtype,
              is_error: (sdkMsg as { is_error?: boolean }).is_error,
            });
            this.callbacks.onResult?.(sdkMsg);
          }
        }

        // Normal exit
        this.callbacks.onListenerExit?.("normal");
      } catch (error) {
        if (this.isAbortError(error)) {
          logger.debug("Background listener aborted (expected during interrupt)");
          this.callbacks.onListenerExit?.("abort");
        } else {
          logger.error("Background listener error", { error });
          this.callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
          this.callbacks.onListenerExit?.("error");
        }

        // Always reset state on any error
        this.reset();
      }
    })();
  }

  /**
   * Check if an error is an abort error
   */
  private isAbortError(error: unknown): boolean {
    if (error instanceof Error) {
      if (error.name === "AbortError") return true;
      if (error.message.includes("aborted")) return true;
      if (error.message.includes("abort")) return true;
    }
    return false;
  }
}
