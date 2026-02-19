/**
 * AgentInteractor - Handles user interactions (input)
 *
 * Responsibilities:
 * 1. Receive user messages
 * 2. Build UserMessage objects
 * 3. Persist to Session
 * 4. Emit to Bus (trigger ClaudeEffector)
 * 5. Handle interrupt operations
 *
 * This class is the "in" side of the agent communication.
 * BusDriver handles the "out" side (DriveableEvent → StreamEvent).
 */

import type { SystemBusProducer, Session } from "@agentxjs/types/runtime/internal";
import type { UserMessage, UserContentPart } from "@agentxjs/types/agent";
import type { EventContext } from "@agentxjs/types/runtime";
import { createLogger } from "@agentxjs/common";

const logger = createLogger("runtime/AgentInteractor");

/**
 * Context for AgentInteractor
 */
export interface AgentInteractorContext {
  agentId: string;
  imageId: string;
  containerId: string;
  sessionId: string;
}

/**
 * AgentInteractor - Processes user input and emits events
 */
export class AgentInteractor {
  private readonly producer: SystemBusProducer;
  private readonly session: Session;
  private readonly context: AgentInteractorContext;

  constructor(producer: SystemBusProducer, session: Session, context: AgentInteractorContext) {
    this.producer = producer;
    this.session = session;
    this.context = context;
    logger.debug("AgentInteractor created", { agentId: context.agentId });
  }

  /**
   * Receive user message
   *
   * @param content - Message content (string or ContentPart array for multimodal)
   * @param requestId - Request ID for correlation
   */
  async receive(content: string | UserContentPart[], requestId: string): Promise<UserMessage> {
    const contentPreview =
      typeof content === "string" ? content.substring(0, 50) : `[${content.length} parts]`;

    logger.debug("AgentInteractor.receive", {
      requestId,
      agentId: this.context.agentId,
      contentPreview,
    });

    // 1. Build UserMessage
    const userMessage: UserMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      role: "user",
      subtype: "user",
      content,
      timestamp: Date.now(),
    };

    // 2. Persist to Session
    await this.session.addMessage(userMessage);
    logger.debug("UserMessage persisted", {
      messageId: userMessage.id,
      requestId,
    });

    // 3. Build event context
    const eventContext: EventContext = {
      agentId: this.context.agentId,
      imageId: this.context.imageId,
      containerId: this.context.containerId,
      sessionId: this.context.sessionId,
    };

    // 4. Emit internal event to Bus (triggers ClaudeEffector)
    // This event is internal-only (intent: "request") - not enqueued
    this.producer.emit({
      type: "user_message",
      timestamp: Date.now(),
      data: userMessage,
      source: "agent",
      category: "message",
      intent: "request",
      requestId,
      context: eventContext,
    } as never);

    logger.info("user_message event emitted to bus", {
      messageId: userMessage.id,
      requestId,
      agentId: this.context.agentId,
      eventType: "user_message",
    });

    return userMessage;
  }

  /**
   * Interrupt current operation
   *
   * @param requestId - Optional request ID for correlation
   */
  interrupt(requestId?: string): void {
    logger.debug("AgentInteractor.interrupt", {
      requestId,
      agentId: this.context.agentId,
    });

    const eventContext: EventContext = {
      agentId: this.context.agentId,
      imageId: this.context.imageId,
      containerId: this.context.containerId,
      sessionId: this.context.sessionId,
    };

    this.producer.emit({
      type: "interrupt",
      timestamp: Date.now(),
      data: { agentId: this.context.agentId },
      source: "agent",
      category: "action",
      intent: "request",
      requestId,
      context: eventContext,
    } as never);
  }
}
