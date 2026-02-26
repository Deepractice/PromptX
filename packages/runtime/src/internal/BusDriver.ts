/**
 * BusDriver - Listens to DriveableEvents and forwards to Agent
 *
 * This is the "out" side of agent communication:
 * - Subscribes to SystemBus at construction time
 * - Filters DriveableEvents by agentId (from event context)
 * - Converts DriveableEvent to StreamEvent
 * - Forwards to AgentEngine via callback
 *
 * Flow:
 * ```
 * ClaudeReceptor emits DriveableEvent (with context.agentId)
 *   → SystemBus
 *     → BusDriver filters by agentId
 *       → Converts to StreamEvent
 *         → Calls onStreamEvent callback
 *           → AgentEngine processes
 * ```
 */

import type { StreamEvent } from "@agentxjs/types/agent";
import type { SystemBusConsumer, BusEventHandler } from "@agentxjs/types/runtime/internal";
import type { SystemEvent, DriveableEvent } from "@agentxjs/types/runtime";
import { createLogger } from "@agentxjs/common";

const logger = createLogger("runtime/BusDriver");

/**
 * Callback for stream events
 */
export type StreamEventCallback = (event: StreamEvent) => void;

/**
 * Callback when stream completes (message_stop or interrupted)
 */
export type StreamCompleteCallback = (reason: "message_stop" | "interrupted") => void;

/**
 * BusDriver configuration
 */
export interface BusDriverConfig {
  agentId: string;
  onStreamEvent: StreamEventCallback;
  onStreamComplete?: StreamCompleteCallback;
}

/**
 * BusDriver - Event-driven listener for DriveableEvents
 *
 * Subscribes to SystemBus at construction and filters events
 * by agentId from the event context.
 */
export class BusDriver {
  readonly name = "BusDriver";
  readonly description = "Driver that listens to SystemBus for DriveableEvents";

  private readonly config: BusDriverConfig;
  private readonly unsubscribe: () => void;

  constructor(consumer: SystemBusConsumer, config: BusDriverConfig) {
    this.config = config;

    logger.debug("BusDriver created, subscribing to bus", {
      agentId: config.agentId,
    });

    // Subscribe to all events at construction time
    this.unsubscribe = consumer.onAny(((event: SystemEvent) => {
      this.handleEvent(event);
    }) as BusEventHandler);
  }

  /**
   * Handle incoming event from bus
   */
  private handleEvent(event: SystemEvent): void {
    // Check if this is a DriveableEvent for this agent
    if (!this.isDriveableEventForThisAgent(event)) {
      return;
    }

    const driveableEvent = event as DriveableEvent;
    logger.debug("BusDriver received DriveableEvent", {
      type: driveableEvent.type,
      agentId: this.config.agentId,
      requestId: (driveableEvent as unknown as { requestId?: string }).requestId,
    });

    // Convert to StreamEvent and forward
    const streamEvent = this.toStreamEvent(driveableEvent);
    this.config.onStreamEvent(streamEvent);

    // Notify completion if applicable
    if (driveableEvent.type === "message_stop") {
      this.config.onStreamComplete?.("message_stop");
    } else if (driveableEvent.type === "interrupted") {
      this.config.onStreamComplete?.("interrupted");
    }
  }

  /**
   * Check if event is a DriveableEvent for this agent
   *
   * Must check:
   * 1. source === "environment" (from Claude)
   * 2. context.agentId === this.config.agentId (for this agent)
   */
  private isDriveableEventForThisAgent(event: unknown): event is DriveableEvent {
    const driveableTypes = [
      "message_start",
      "message_delta",
      "message_stop",
      "text_content_block_start",
      "text_delta",
      "text_content_block_stop",
      "tool_use_content_block_start",
      "input_json_delta",
      "tool_use_content_block_stop",
      "tool_call",
      "tool_result",
      "interrupted",
      "error_received",
    ];

    if (
      event === null ||
      typeof event !== "object" ||
      !("type" in event) ||
      typeof (event as { type: unknown }).type !== "string"
    ) {
      return false;
    }

    const e = event as {
      type: string;
      source?: string;
      context?: { agentId?: string };
    };

    // Must be from environment
    if (e.source !== "environment") {
      return false;
    }

    // Must be a driveable event type
    if (!driveableTypes.includes(e.type)) {
      return false;
    }

    // Must be for this agent (check context.agentId)
    if (e.context?.agentId !== this.config.agentId) {
      return false;
    }

    return true;
  }

  /**
   * Convert DriveableEvent to StreamEvent
   */
  private toStreamEvent(event: DriveableEvent): StreamEvent {
    const { type, timestamp, data } = event;

    switch (type) {
      case "message_start": {
        const d = data as { message?: { id: string; model: string } };
        return {
          type: "message_start",
          timestamp,
          data: {
            messageId: d.message?.id ?? "",
            model: d.message?.model ?? "",
          },
        };
      }
      case "message_stop": {
        const d = data as { stopReason?: string };
        return {
          type: "message_stop",
          timestamp,
          data: {
            stopReason: d.stopReason,
          },
        } as StreamEvent;
      }
      case "text_delta": {
        const d = data as { text: string };
        return {
          type: "text_delta",
          timestamp,
          data: { text: d.text },
        };
      }
      case "tool_use_content_block_start": {
        const d = data as {
          id?: string;
          name?: string;
          toolCallId?: string;
          toolName?: string;
        };
        return {
          type: "tool_use_start",
          timestamp,
          data: {
            toolCallId: d.toolCallId ?? d.id ?? "",
            toolName: d.toolName ?? d.name ?? "",
          },
        };
      }
      case "input_json_delta": {
        const d = data as { partialJson: string };
        return {
          type: "input_json_delta",
          timestamp,
          data: { partialJson: d.partialJson },
        };
      }
      case "tool_use_content_block_stop": {
        const d = data as {
          id?: string;
          name?: string;
          toolCallId?: string;
          toolName?: string;
          input?: Record<string, unknown>;
        };
        return {
          type: "tool_use_stop",
          timestamp,
          data: {
            toolCallId: d.toolCallId ?? d.id ?? "",
            toolName: d.toolName ?? d.name ?? "",
            input: d.input ?? {},
          },
        };
      }
      case "tool_result": {
        const d = data as {
          toolUseId?: string;
          toolCallId?: string;
          result: unknown;
          isError?: boolean;
        };
        return {
          type: "tool_result",
          timestamp,
          data: {
            toolCallId: d.toolCallId ?? d.toolUseId ?? "",
            result: d.result,
            isError: d.isError,
          },
        };
      }
      case "interrupted": {
        // interrupted is not part of StreamEvent type, so we convert to message_stop
        // The MealyMachine will handle this and emit conversation_end
        return {
          type: "message_stop",
          timestamp,
          data: { stopReason: "end_turn" }, // Use valid StopReason
        };
      }
      case "error_received": {
        const d = data as { message: string; errorCode?: string };
        return {
          type: "error_received",
          timestamp,
          data: {
            message: d.message,
            errorCode: d.errorCode,
          },
        } as StreamEvent;
      }
      default:
        // For other events, pass through with minimal transformation
        return { type, timestamp, data } as StreamEvent;
    }
  }

  /**
   * Dispose and stop listening
   */
  dispose(): void {
    logger.debug("BusDriver disposing", { agentId: this.config.agentId });
    this.unsubscribe();
  }
}
