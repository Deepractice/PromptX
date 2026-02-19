/**
 * Message Components
 *
 * Simple, direct message rendering without handler chains.
 * Each component renders a specific message type.
 *
 * ## Components
 *
 * - UserMessage: User messages with status indicator
 * - AssistantMessage: Assistant messages with 4-state lifecycle
 * - ToolMessage: Tool calls with embedded results
 * - ErrorMessage: Error display
 *
 * ## Usage
 *
 * ```tsx
 * import { AssistantMessage, UserMessage, ToolMessage } from "@/components/agentx-ui/components/message";
 *
 * // User message
 * <UserMessage content="Hello" status="success" />
 *
 * // Assistant message with 4-state lifecycle
 * <AssistantMessage status="completed" content="Hi there!" />
 * <AssistantMessage status="responding" streaming="I'm thinking..." />
 *
 * // Tool message with embedded result
 * <ToolMessage
 *   toolCall={{ id: "1", name: "search", input: { query: "test" } }}
 *   toolResult={{ output: "results", duration: 1.2 }}
 *   timestamp={Date.now()}
 * />
 * ```
 */

// Message components
// export { UserMessage, type UserMessageProps } from "./UserMessage";
// export {
//   AssistantMessage,
//   type AssistantMessageProps,
//   type AssistantMessageStatus,
// } from "./AssistantMessage";
// export { ToolMessage, type ToolMessageProps } from "./ToolMessage";
export { ErrorMessage, type ErrorMessageProps } from "./ErrorMessage";

// Utility components
export { MessageAvatar, type MessageAvatarProps } from "./MessageAvatar";
export { MessageContent, type MessageContentProps } from "./MessageContent";

// Content block components
export { ImageBlock, type ImageBlockProps } from "./ImageBlock";
export { FileBlock, type FileBlockProps } from "./FileBlock";
