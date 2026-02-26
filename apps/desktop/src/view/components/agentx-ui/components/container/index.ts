/**
 * Container Components - Business Logic Layer
 *
 * Integration layer that combines Pane (UI) with Hooks (logic).
 * These components:
 * - Use AgentX hooks (useImages, useAgent)
 * - Map hook data to pane props
 * - Handle events and callbacks
 * - Manage business state
 *
 * Architecture:
 * ```
 * pane/ (pure UI) + hooks/ (logic) = container/ (business components)
 * ```
 *
 * Components:
 * - AgentList: Conversation list with CRUD operations
 * - Chat: Chat interface with messages and input
 * - WelcomePage: Initial welcome page with presets
 */

// AgentList - Conversation list
export { AgentList } from "./AgentList";
export type { AgentListProps } from "./AgentList";

// Chat - Chat interface
export { Chat } from "./Chat";
export type { ChatProps } from "./Chat";

// ChatHeader - Chat header component
export { ChatHeader } from "./ChatHeader";
export type { ChatHeaderProps } from "./ChatHeader";

// ToolCard - Collapsible tool call/result card
// export { ToolCard } from "./ToolCard";
// export type { ToolCardProps, ToolStatus } from "./ToolCard";

// WelcomePage - Initial welcome page
export { WelcomePage } from "./WelcomePage";
export type { WelcomePageProps, PresetQuestion } from "./WelcomePage";
