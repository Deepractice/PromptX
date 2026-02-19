/**
 * Conversation Types
 *
 * Conversation-first design for chat UI rendering.
 * Conversation = one party's complete utterance in a turn.
 * Block = content unit within a Conversation (TextBlock, ToolBlock, ImageBlock, etc.).
 *
 * Data flow:
 * Message (backend) → Conversation (UI layer) → Block (sub-components)
 *
 * Terminology:
 * - Turn = UserConversation + AssistantConversation
 * - AssistantConversation may contain multiple backend messages (due to tool calls)
 * - Blocks are rendered in order: text, tool, text, tool, ...
 */

// ============================================================================
// Block Types (内容单元)
// ============================================================================

/**
 * Block base interface
 */
interface BlockBase {
  /** Block id */
  id: string;
  /** Timestamp when block was created */
  timestamp: number;
}

/**
 * Text block status
 */
export type TextBlockStatus = "streaming" | "completed";

/**
 * Text block data - text content in AssistantConversation
 */
export interface TextBlockData extends BlockBase {
  type: "text";
  /** Text content */
  content: string;
  /** Block status */
  status: TextBlockStatus;
}

/**
 * Tool block status
 * - planning: AI is generating tool input (tool_use_start received, waiting for complete input)
 * - executing: Tool input complete, tool is executing
 * - success: Tool execution completed successfully
 * - error: Tool execution failed
 */
export type ToolBlockStatus = "planning" | "executing" | "success" | "error";

/**
 * Tool block data - tool call in AssistantConversation
 */
export interface ToolBlockData extends BlockBase {
  type: "tool";
  /** Tool call id (for matching result) */
  toolCallId: string;
  /** Tool name */
  name: string;
  /** Tool input parameters */
  input: unknown;
  /** Execution status */
  status: ToolBlockStatus;
  /** Tool output (when completed) */
  output?: unknown;
  /** Start time in milliseconds (for duration calculation) */
  startTime?: number;
  /** Execution duration in seconds */
  duration?: number;
}

/**
 * Image block data - image content (future)
 */
export interface ImageBlockData extends BlockBase {
  type: "image";
  /** Image URL */
  url: string;
  /** Alt text */
  alt?: string;
}

/**
 * Union type for all block types
 */
export type BlockData = TextBlockData | ToolBlockData | ImageBlockData;

// ============================================================================
// Type Guards for Blocks
// ============================================================================

export function isTextBlock(block: BlockData): block is TextBlockData {
  return block.type === "text";
}

export function isToolBlock(block: BlockData): block is ToolBlockData {
  return block.type === "tool";
}

export function isImageBlock(block: BlockData): block is ImageBlockData {
  return block.type === "image";
}

// ============================================================================
// Conversation Types (主组件)
// ============================================================================

/**
 * User conversation status
 */
export type UserConversationStatus = "pending" | "success" | "error" | "interrupted";

/**
 * User conversation data - user's message
 */
export interface UserConversationData {
  type: "user";
  /** Conversation id */
  id: string;
  /** Message content (string for text-only, array for multimodal) */
  content: string | import("agentxjs").UserContentPart[];
  /** Timestamp */
  timestamp: number;
  /** Send status */
  status: UserConversationStatus;
  /** Error code (if status is error) */
  errorCode?: string;
}

/**
 * Assistant conversation status (5-state lifecycle)
 * - queued: user sent message, waiting for backend to receive
 * - processing: backend received, preparing to process (conversation_start)
 * - thinking: AI is thinking (conversation_thinking)
 * - streaming: AI is outputting text (conversation_responding / text_delta)
 * - completed: AI finished responding (conversation_end)
 */
export type AssistantConversationStatus =
  | "queued"
  | "processing"
  | "thinking"
  | "streaming"
  | "completed";

/**
 * Assistant conversation data - AI's response with blocks
 * One AssistantConversation may contain multiple backend messages (due to tool call loops)
 * All content is stored in blocks array (TextBlock, ToolBlock, etc.)
 */
export interface AssistantConversationData {
  type: "assistant";
  /** Conversation id - frontend instance ID, never changes once created */
  id: string;
  /** Backend message ids - accumulated from multiple message_start events */
  messageIds: string[];
  /** Timestamp */
  timestamp: number;
  /** Response status */
  status: AssistantConversationStatus;
  /** Content blocks - text, tools, images, etc. rendered in order */
  blocks: BlockData[];
}

/**
 * Error conversation data - error message
 */
export interface ErrorConversationData {
  type: "error";
  /** Conversation id */
  id: string;
  /** Error message content */
  content: string;
  /** Timestamp */
  timestamp: number;
  /** Error code */
  errorCode?: string;
}

/**
 * Union type for all conversations
 */
export type ConversationData =
  | UserConversationData
  | AssistantConversationData
  | ErrorConversationData;

// ============================================================================
// Type Guards for Conversations
// ============================================================================

export function isUserConversation(
  conversation: ConversationData
): conversation is UserConversationData {
  return conversation.type === "user";
}

export function isAssistantConversation(
  conversation: ConversationData
): conversation is AssistantConversationData {
  return conversation.type === "assistant";
}

export function isErrorConversation(
  conversation: ConversationData
): conversation is ErrorConversationData {
  return conversation.type === "error";
}
