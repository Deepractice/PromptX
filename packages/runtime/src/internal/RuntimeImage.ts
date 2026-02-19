/**
 * RuntimeImage - Persistent conversation entity
 *
 * Image is the primary entity that users interact with (displayed as "conversation").
 * Agent is a transient runtime instance created from Image.
 *
 * Lifecycle:
 * - create() → ImageRecord (persistent) + SessionRecord (for messages)
 * - run() → Agent (runtime, in-memory)
 * - stop() / server restart → Agent destroyed, Image remains
 */

import type {
  ImageRecord,
  ImageRepository,
  SessionRepository,
  McpServerConfig,
} from "@agentxjs/types/runtime/internal";
import type { Message } from "@agentxjs/types/agent";
import { createLogger } from "@agentxjs/common";

const logger = createLogger("runtime/RuntimeImage");

/**
 * Context needed by RuntimeImage
 */
export interface RuntimeImageContext {
  imageRepository: ImageRepository;
  sessionRepository: SessionRepository;
}

/**
 * Configuration for creating a new image
 */
export interface ImageCreateConfig {
  containerId: string;
  name?: string;
  description?: string;
  systemPrompt?: string;
  mcpServers?: Record<string, McpServerConfig>;
}

/**
 * RuntimeImage - Manages conversation persistence
 */
export class RuntimeImage {
  private constructor(
    private readonly record: ImageRecord,
    private readonly context: RuntimeImageContext
  ) {}

  // ==================== Getters ====================

  get imageId(): string {
    return this.record.imageId;
  }

  get containerId(): string {
    return this.record.containerId;
  }

  get sessionId(): string {
    return this.record.sessionId;
  }

  get name(): string {
    return this.record.name;
  }

  get description(): string | undefined {
    return this.record.description;
  }

  get systemPrompt(): string | undefined {
    return this.record.systemPrompt;
  }

  get mcpServers(): Record<string, McpServerConfig> | undefined {
    return this.record.mcpServers;
  }

  get createdAt(): number {
    return this.record.createdAt;
  }

  get updatedAt(): number {
    return this.record.updatedAt;
  }

  // ==================== Static Factory Methods ====================

  /**
   * Create a new image (conversation)
   */
  static async create(
    config: ImageCreateConfig,
    context: RuntimeImageContext
  ): Promise<RuntimeImage> {
    const now = Date.now();
    const imageId = RuntimeImage.generateImageId();
    const sessionId = RuntimeImage.generateSessionId();

    // Create image record
    const record: ImageRecord = {
      imageId,
      containerId: config.containerId,
      sessionId,
      name: config.name ?? "New Conversation",
      description: config.description,
      systemPrompt: config.systemPrompt,
      mcpServers: config.mcpServers,
      createdAt: now,
      updatedAt: now,
    };

    // Persist image
    await context.imageRepository.saveImage(record);

    // Create associated session (for message storage)
    await context.sessionRepository.saveSession({
      sessionId,
      imageId,
      containerId: config.containerId,
      createdAt: now,
      updatedAt: now,
    });

    logger.info("Image created", {
      imageId,
      sessionId,
      containerId: config.containerId,
      name: record.name,
    });
    return new RuntimeImage(record, context);
  }

  /**
   * Load an existing image from storage
   */
  static async load(imageId: string, context: RuntimeImageContext): Promise<RuntimeImage | null> {
    const record = await context.imageRepository.findImageById(imageId);
    if (!record) {
      logger.debug("Image not found", { imageId });
      return null;
    }

    logger.debug("Image loaded", { imageId, name: record.name });
    return new RuntimeImage(record, context);
  }

  /**
   * List all images in a container
   */
  static async listByContainer(
    containerId: string,
    context: RuntimeImageContext
  ): Promise<ImageRecord[]> {
    return context.imageRepository.findImagesByContainerId(containerId);
  }

  /**
   * List all images
   */
  static async listAll(context: RuntimeImageContext): Promise<ImageRecord[]> {
    return context.imageRepository.findAllImages();
  }

  // ==================== Instance Methods ====================

  /**
   * Get messages for this conversation
   */
  async getMessages(): Promise<Message[]> {
    return this.context.sessionRepository.getMessages(this.sessionId);
  }

  /**
   * Update image metadata
   */
  async update(updates: { name?: string; description?: string }): Promise<RuntimeImage> {
    const now = Date.now();
    const updatedRecord: ImageRecord = {
      ...this.record,
      name: updates.name ?? this.record.name,
      description: updates.description ?? this.record.description,
      updatedAt: now,
    };

    await this.context.imageRepository.saveImage(updatedRecord);

    logger.info("Image updated", { imageId: this.imageId, updates });
    return new RuntimeImage(updatedRecord, this.context);
  }

  /**
   * Delete this image and its session
   */
  async delete(): Promise<void> {
    // Delete session first (including messages)
    await this.context.sessionRepository.deleteSession(this.sessionId);

    // Delete image
    await this.context.imageRepository.deleteImage(this.imageId);

    logger.info("Image deleted", { imageId: this.imageId, sessionId: this.sessionId });
  }

  /**
   * Get the underlying record
   */
  toRecord(): ImageRecord {
    return { ...this.record };
  }

  // ==================== Private Helpers ====================

  private static generateImageId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `img_${timestamp}_${random}`;
  }

  private static generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `sess_${timestamp}_${random}`;
  }
}
