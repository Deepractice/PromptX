/**
 * RuntimeSession - Session implementation
 *
 * Collects messages from Agent and persists to storage.
 */

import type {
  Session,
  SystemBusProducer,
  SessionRepository,
  SessionRecord,
} from "@agentxjs/types/runtime/internal";
import type { Message } from "@agentxjs/types/agent";

/**
 * RuntimeSession configuration
 */
export interface RuntimeSessionConfig {
  sessionId: string;
  imageId: string;
  containerId: string;
  repository: SessionRepository;
  /** Producer for emitting session lifecycle events */
  producer: SystemBusProducer;
}

/**
 * RuntimeSession - Collects and stores messages
 */
export class RuntimeSession implements Session {
  readonly sessionId: string;
  readonly imageId: string;
  readonly containerId: string;
  readonly createdAt: number;

  private readonly repository: SessionRepository;
  private readonly producer: SystemBusProducer;

  constructor(config: RuntimeSessionConfig) {
    this.sessionId = config.sessionId;
    this.imageId = config.imageId;
    this.containerId = config.containerId;
    this.createdAt = Date.now();
    this.repository = config.repository;
    this.producer = config.producer;
  }

  /**
   * Initialize session in storage
   */
  async initialize(): Promise<void> {
    const record: SessionRecord = {
      sessionId: this.sessionId,
      imageId: this.imageId,
      containerId: this.containerId,
      createdAt: this.createdAt,
      updatedAt: this.createdAt,
    };
    await this.repository.saveSession(record);

    // Emit session_created event
    this.producer.emit({
      type: "session_created",
      timestamp: this.createdAt,
      source: "session",
      category: "lifecycle",
      intent: "notification",
      data: {
        sessionId: this.sessionId,
        imageId: this.imageId,
        containerId: this.containerId,
        createdAt: this.createdAt,
      },
      context: {
        containerId: this.containerId,
        sessionId: this.sessionId,
      },
    });
  }

  async addMessage(message: Message): Promise<void> {
    await this.repository.addMessage(this.sessionId, message);

    // Emit message_persisted event
    this.producer.emit({
      type: "message_persisted",
      timestamp: Date.now(),
      source: "session",
      category: "persist",
      intent: "result",
      data: {
        sessionId: this.sessionId,
        messageId: message.id,
        savedAt: Date.now(),
      },
      context: {
        containerId: this.containerId,
        sessionId: this.sessionId,
      },
    });
  }

  async getMessages(): Promise<Message[]> {
    return this.repository.getMessages(this.sessionId);
  }

  async clear(): Promise<void> {
    await this.repository.clearMessages(this.sessionId);
  }
}
