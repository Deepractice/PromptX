/**
 * ClaudeReceptor - Perceives Claude SDK responses and emits to SystemBus
 *
 * Converts Claude SDK stream events to DriveableEvents.
 * DriveableEvents are the subset of EnvironmentEvents that can drive Agent.
 *
 * Type Relationship:
 * ```
 * EnvironmentEvent
 * ├── DriveableEvent ← ClaudeReceptor outputs this
 * │   └── message_start, text_delta, message_stop, interrupted...
 * └── ConnectionEvent
 * ```
 */

import type { Receptor, SystemBusProducer } from "@agentxjs/types/runtime/internal";
import type {
  DriveableEvent,
  MessageStartEvent,
  MessageStopEvent,
  TextContentBlockStartEvent,
  TextDeltaEvent,
  TextContentBlockStopEvent,
  ToolUseContentBlockStartEvent,
  InputJsonDeltaEvent,
  ToolUseContentBlockStopEvent,
  ToolResultEvent,
  InterruptedEvent,
  ErrorReceivedEvent,
  EventContext,
} from "@agentxjs/types/runtime";
import type { SDKPartialAssistantMessage } from "@anthropic-ai/claude-agent-sdk";
import { createLogger } from "@agentxjs/common";

/**
 * Context for tracking content block state across events
 */
interface ContentBlockContext {
  currentBlockType: "text" | "tool_use" | null;
  currentBlockIndex: number;
  currentToolId: string | null;
  currentToolName: string | null;
  lastStopReason: string | null;
  lastStopSequence: string | null;
}

/**
 * Metadata passed with each SDK message for event correlation
 */
export interface ReceptorMeta {
  requestId: string;
  context: EventContext;
}

const logger = createLogger("ecosystem/ClaudeReceptor");

/**
 * ClaudeReceptor - Perceives Claude SDK and emits DriveableEvents to SystemBus
 *
 * Uses SystemBusProducer (write-only) because Receptor only emits events.
 */
export class ClaudeReceptor implements Receptor {
  private producer: SystemBusProducer | null = null;
  private currentMeta: ReceptorMeta | null = null;

  /** Context for tracking content block state */
  private blockContext: ContentBlockContext = {
    currentBlockType: null,
    currentBlockIndex: 0,
    currentToolId: null,
    currentToolName: null,
    lastStopReason: null,
    lastStopSequence: null,
  };

  /**
   * Connect to SystemBus producer to emit events
   */
  connect(producer: SystemBusProducer): void {
    this.producer = producer;
    logger.debug("ClaudeReceptor connected to SystemBusProducer");
  }

  /**
   * Feed SDK message to receptor with correlation metadata
   * @param sdkMsg - SDK message from Claude
   * @param meta - Request metadata for event correlation
   */
  feed(sdkMsg: SDKPartialAssistantMessage, meta: ReceptorMeta): void {
    this.currentMeta = meta;
    this.processStreamEvent(sdkMsg);
  }

  /**
   * Emit interrupted event
   */
  emitInterrupted(
    reason: "user_interrupt" | "timeout" | "error" | "system",
    meta?: ReceptorMeta
  ): void {
    const eventMeta = meta || this.currentMeta;
    this.emitToBus({
      type: "interrupted",
      timestamp: Date.now(),
      source: "environment",
      category: "stream",
      intent: "notification",
      requestId: eventMeta?.requestId,
      context: eventMeta?.context,
      data: { reason },
    } as InterruptedEvent);
  }

  /**
   * Emit error_received event
   *
   * Used when an error is received from the environment (e.g., Claude API error).
   * This drives the MealyMachine to produce error_occurred + error_message events.
   */
  emitError(message: string, errorCode?: string, meta?: ReceptorMeta): void {
    const eventMeta = meta || this.currentMeta;
    this.emitToBus({
      type: "error_received",
      timestamp: Date.now(),
      source: "environment",
      category: "stream",
      intent: "notification",
      requestId: eventMeta?.requestId,
      context: eventMeta?.context,
      data: { message, errorCode },
    } as ErrorReceivedEvent);
  }

  /**
   * Feed SDK user message (contains tool_result) to receptor
   * @param sdkMsg - SDK user message from Claude
   * @param meta - Request metadata for event correlation
   */
  feedUserMessage(sdkMsg: { message?: { content?: unknown[] } }, meta: ReceptorMeta): void {
    this.currentMeta = meta;
    const { requestId, context } = meta;

    if (!sdkMsg.message || !Array.isArray(sdkMsg.message.content)) {
      return;
    }

    for (const block of sdkMsg.message.content) {
      if (block && typeof block === "object" && "type" in block && block.type === "tool_result") {
        const toolResultBlock = block as unknown as {
          tool_use_id: string;
          content: unknown;
          is_error?: boolean;
        };

        this.emitToBus({
          type: "tool_result",
          timestamp: Date.now(),
          source: "environment",
          category: "stream",
          intent: "notification",
          requestId,
          context,
          data: {
            toolUseId: toolResultBlock.tool_use_id,
            result: toolResultBlock.content,
            isError: toolResultBlock.is_error || false,
          },
        } as ToolResultEvent);
      }
    }
  }

  /**
   * Process stream_event from SDK and emit corresponding DriveableEvent
   *
   * Uses currentMeta for requestId and context correlation.
   */
  private processStreamEvent(sdkMsg: SDKPartialAssistantMessage): void {
    const event = sdkMsg.event;
    const { requestId, context } = this.currentMeta || {};

    // All DriveableEvents are internal-only (source: "environment")
    // They are consumed by BusDriver and processed through MealyMachine
    // BusPresenter will emit the transformed SystemEvents to clients (source: "agent")

    switch (event.type) {
      case "message_start":
        // Reset context on new message
        this.blockContext = {
          currentBlockType: null,
          currentBlockIndex: 0,
          currentToolId: null,
          currentToolName: null,
          lastStopReason: null,
          lastStopSequence: null,
        };

        this.emitToBus({
          type: "message_start",
          timestamp: Date.now(),
          source: "environment",
          category: "stream",
          intent: "notification",
          requestId,
          context,
          data: {
            message: {
              id: event.message.id,
              model: event.message.model,
            },
          },
        } as MessageStartEvent);
        break;

      case "content_block_start": {
        const contentBlock = event.content_block as { type: string; id?: string; name?: string };
        this.blockContext.currentBlockIndex = event.index;
        logger.debug("content_block_start received", { contentBlock, index: event.index });

        if (contentBlock.type === "text") {
          this.blockContext.currentBlockType = "text";
          this.emitToBus({
            type: "text_content_block_start",
            timestamp: Date.now(),
            source: "environment",
            category: "stream",
            intent: "notification",
            index: event.index,
            requestId,
            context,
            data: {},
          } as TextContentBlockStartEvent);
        } else if (contentBlock.type === "tool_use") {
          this.blockContext.currentBlockType = "tool_use";
          this.blockContext.currentToolId = contentBlock.id || null;
          this.blockContext.currentToolName = contentBlock.name || null;
          this.emitToBus({
            type: "tool_use_content_block_start",
            timestamp: Date.now(),
            source: "environment",
            category: "stream",
            intent: "notification",
            index: event.index,
            requestId,
            context,
            data: {
              id: contentBlock.id || "",
              name: contentBlock.name || "",
            },
          } as ToolUseContentBlockStartEvent);
        }
        break;
      }

      case "content_block_delta": {
        const delta = event.delta as { type: string; text?: string; partial_json?: string };

        if (delta.type === "text_delta") {
          this.emitToBus({
            type: "text_delta",
            timestamp: Date.now(),
            source: "environment",
            category: "stream",
            intent: "notification",
            requestId,
            context,
            data: { text: delta.text || "" },
          } as TextDeltaEvent);
        } else if (delta.type === "input_json_delta") {
          this.emitToBus({
            type: "input_json_delta",
            timestamp: Date.now(),
            source: "environment",
            category: "stream",
            intent: "notification",
            index: this.blockContext.currentBlockIndex,
            requestId,
            context,
            data: { partialJson: delta.partial_json || "" },
          } as InputJsonDeltaEvent);
        }
        break;
      }

      case "content_block_stop":
        if (this.blockContext.currentBlockType === "tool_use" && this.blockContext.currentToolId) {
          this.emitToBus({
            type: "tool_use_content_block_stop",
            timestamp: Date.now(),
            source: "environment",
            category: "stream",
            intent: "notification",
            index: this.blockContext.currentBlockIndex,
            requestId,
            context,
            data: {},
          } as ToolUseContentBlockStopEvent);
        } else {
          this.emitToBus({
            type: "text_content_block_stop",
            timestamp: Date.now(),
            source: "environment",
            category: "stream",
            intent: "notification",
            index: this.blockContext.currentBlockIndex,
            requestId,
            context,
            data: {},
          } as TextContentBlockStopEvent);
        }
        // Reset current block type after stop
        this.blockContext.currentBlockType = null;
        this.blockContext.currentToolId = null;
        this.blockContext.currentToolName = null;
        break;

      case "message_delta": {
        const msgDelta = event.delta as { stop_reason?: string; stop_sequence?: string };
        if (msgDelta.stop_reason) {
          this.blockContext.lastStopReason = msgDelta.stop_reason;
          this.blockContext.lastStopSequence = msgDelta.stop_sequence || null;
        }
        break;
      }

      case "message_stop":
        this.emitToBus({
          type: "message_stop",
          timestamp: Date.now(),
          source: "environment",
          category: "stream",
          intent: "notification",
          requestId,
          context,
          data: {
            stopReason:
              (this.blockContext.lastStopReason as
                | "end_turn"
                | "tool_use"
                | "max_tokens"
                | "stop_sequence") || "end_turn",
            stopSequence: this.blockContext.lastStopSequence || undefined,
          },
        } as MessageStopEvent);
        // Reset after emitting
        this.blockContext.lastStopReason = null;
        this.blockContext.lastStopSequence = null;
        break;
    }
  }

  private emitToBus(event: DriveableEvent): void {
    if (this.producer) {
      this.producer.emit(event);
    }
  }
}
