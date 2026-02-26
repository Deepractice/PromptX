/**
 * Conversation Components
 *
 * Conversation-first design for chat UI rendering.
 * Conversation = one party's complete utterance in a turn.
 * Block = content unit within a Conversation (TextBlock, ToolBlock, etc.).
 */

// Types - Conversations
export type {
  ConversationData,
  UserConversationData,
  AssistantConversationData,
  ErrorConversationData,
  UserConversationStatus,
  AssistantConversationStatus,
} from "./types";

// Types - Blocks
export type {
  BlockData,
  TextBlockData,
  ToolBlockData,
  ImageBlockData,
  TextBlockStatus,
  ToolBlockStatus,
} from "./types";

// Type Guards
export {
  isUserConversation,
  isAssistantConversation,
  isErrorConversation,
  isTextBlock,
  isToolBlock,
  isImageBlock,
} from "./types";

// Conversation components
export { UserEntry, type UserEntryProps } from "./UserEntry";
export { AssistantEntry, type AssistantEntryProps } from "./AssistantEntry";
export { ErrorEntry, type ErrorEntryProps } from "./ErrorEntry";

// Block components
export { TextBlock, type TextBlockProps } from "./blocks";
export { ToolBlock, type ToolBlockProps } from "./blocks";
