/**
 * MobileChat - Mobile chat interface
 *
 * A mobile-optimized chat component following Claude App's design:
 * - Full-screen layout
 * - Clean header with hamburger menu
 * - Scrollable message area
 * - Bottom input with rounded design
 */

import * as React from "react";
import type { AgentX } from "agentxjs";
import { MobileHeader } from "./MobileHeader";
import { MobileMessagePane } from "./MobileMessagePane";
import { MobileInputPane } from "./MobileInputPane";
import { UserEntry, AssistantEntry, ErrorEntry } from "@/components/agentx-ui/components/entry";
import { useAgent, type ConversationData } from "@/components/agentx-ui/hooks";
import { cn } from "@/components/agentx-ui/utils/utils";

export interface MobileChatProps {
  /**
   * AgentX instance
   */
  agentx: AgentX | null;
  /**
   * Image ID for the conversation
   */
  imageId?: string | null;
  /**
   * Agent name to display in header
   */
  agentName?: string;
  /**
   * Callback when menu button is clicked
   */
  onMenuClick?: () => void;
  /**
   * Callback when new conversation button is clicked
   */
  onNewConversation?: () => void;
  /**
   * Input placeholder text
   */
  placeholder?: string;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Render a single conversation entry
 */
function renderConversation(
  conversation: ConversationData,
  streamingText: string,
  currentTextBlockId: string | null,
  onStop?: () => void
): React.ReactNode {
  switch (conversation.type) {
    case "user":
      return <UserEntry key={conversation.id} entry={conversation} />;

    case "assistant":
      return (
        <AssistantEntry
          key={conversation.id}
          entry={conversation}
          streamingText={streamingText}
          currentTextBlockId={currentTextBlockId}
          onStop={onStop}
        />
      );

    case "error":
      return <ErrorEntry key={conversation.id} entry={conversation} />;

    default:
      return null;
  }
}

/**
 * MobileChat Component
 *
 * A full-screen mobile chat interface.
 */
export const MobileChat: React.FC<MobileChatProps> = ({
  agentx,
  imageId,
  agentName,
  onMenuClick,
  onNewConversation,
  placeholder = "Message...",
  className,
}) => {
  const { conversations, streamingText, currentTextBlockId, status, send, interrupt } = useAgent(
    agentx,
    imageId ?? null
  );

  // Determine loading state
  const isLoading =
    status === "thinking" ||
    status === "responding" ||
    status === "planning_tool" ||
    status === "awaiting_tool_result";

  // Empty state when no conversation selected
  if (!imageId) {
    return (
      <div className={cn("flex flex-col h-full bg-background", "overflow-hidden", className)}>
        <MobileHeader
          onMenuClick={onMenuClick}
          onActionClick={onNewConversation}
          showAction={!!onNewConversation}
        />
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <h2 className="text-xl font-medium text-foreground mb-2">Welcome</h2>
          <p className="text-sm text-muted-foreground">Select a conversation or start a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-background", "overflow-hidden", className)}>
      {/* Header */}
      <MobileHeader
        title={agentName}
        onMenuClick={onMenuClick}
        onActionClick={onNewConversation}
        showAction={!!onNewConversation}
      />

      {/* Messages */}
      <MobileMessagePane>
        {conversations.map((conv) =>
          renderConversation(conv, streamingText, currentTextBlockId, interrupt)
        )}
      </MobileMessagePane>

      {/* Input */}
      <MobileInputPane
        onSend={send}
        onStop={interrupt}
        isLoading={isLoading}
        placeholder={placeholder}
      />
    </div>
  );
};

MobileChat.displayName = "MobileChat";
