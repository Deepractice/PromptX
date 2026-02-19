/**
 * Chat - Chat interface component
 *
 * Business component that combines MessagePane + InputPane with useAgent hook.
 * Displays conversations and handles sending/receiving.
 *
 * Uses Conversation-first, Block-based design:
 * - conversations: all conversation entries (user, assistant, error)
 * - streamingText: current streaming text for active TextBlock
 * - currentTextBlockId: id of the TextBlock receiving streaming text
 *
 * @example
 * ```tsx
 * <Chat
 *   agentx={agentx}
 *   imageId={currentImageId}
 * />
 * ```
 */

import * as React from "react";
import type { AgentX } from "agentxjs";
import { Save, Smile, FolderOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MessagePane, InputPane, type ToolBarItem } from "@/components/agentx-ui/components/pane";
import { UserEntry, AssistantEntry, ErrorEntry } from "@/components/agentx-ui/components/entry";
import { useAgent, type ConversationData } from "@/components/agentx-ui/hooks";
import { cn } from "@/components/agentx-ui/utils";
import { ChatHeader } from "./ChatHeader";

export interface ChatProps {
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
   * Callback when save button is clicked
   */
  onSave?: () => void;
  /**
   * Show save button in toolbar
   * @default false
   */
  showSaveButton?: boolean;
  /**
   * Input placeholder text
   */
  placeholder?: string;
  /**
   * Height ratio for input pane (0-1)
   * @default 0.25
   */
  inputHeightRatio?: number;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Render a single conversation based on its type
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
 * Chat component
 */
export function Chat({
  agentx,
  imageId,
  agentName,
  onSave,
  showSaveButton = false,
  placeholder,
  inputHeightRatio = 0.25,
  className,
}: ChatProps): React.ReactElement | null {
  const { t } = useTranslation();

  // Use Conversation-first, Block-based state
  const { conversations, streamingText, currentTextBlockId, status, send, interrupt } = useAgent(
    agentx,
    imageId ?? null
  );

  // Use translated placeholder if not provided
  const inputPlaceholder = placeholder ?? t("agentxUI.chat.placeholder");

  // Determine loading state
  const isLoading =
    status === "thinking" ||
    status === "responding" ||
    status === "planning_tool" ||
    status === "awaiting_tool_result";

  // ESC key to interrupt
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isLoading) {
        e.preventDefault();
        interrupt();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isLoading, interrupt]);

  // Full-area drag & drop state
  const [isDragging, setIsDragging] = React.useState(false);
  const [droppedFiles, setDroppedFiles] = React.useState<File[] | undefined>(undefined);
  const dragCounterRef = React.useRef(0);

  // Handle drag events for full-area drop zone
  const handleDragEnter = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer?.types.includes("Files")) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      setDroppedFiles(Array.from(files));
    }
  }, []);

  // Clear dropped files after they've been processed by InputPane
  const handleDroppedFilesProcessed = React.useCallback(() => {
    setDroppedFiles(undefined);
  }, []);

  // Toolbar items
  const toolbarItems: ToolBarItem[] = React.useMemo(
    () => [
      { id: "emoji", icon: <Smile className="w-4 h-4" />, label: t("agentxUI.chat.toolbar.emoji") },
      { id: "folder", icon: <FolderOpen className="w-4 h-4" />, label: t("agentxUI.chat.toolbar.file") },
    ],
    [t]
  );

  const toolbarRightItems: ToolBarItem[] = React.useMemo(() => {
    if (!showSaveButton || !onSave) return [];
    return [{ id: "save", icon: <Save className="w-4 h-4" />, label: t("agentxUI.chat.toolbar.save") }];
  }, [showSaveButton, onSave, t]);

  const handleToolbarClick = React.useCallback(
    (id: string) => {
      if (id === "save" && onSave) {
        onSave();
      }
    },
    [onSave]
  );

  // Calculate heights
  const inputHeight = `${Math.round(inputHeightRatio * 100)}%`;
  const messageHeight = `${Math.round((1 - inputHeightRatio) * 100)}%`;

  // Show empty state if no conversation selected
  if (!imageId) {
    return (
      <div className={cn("flex flex-col h-full bg-background", className)}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium mb-2">No conversation selected</p>
            <p className="text-sm">Select a conversation or start a new one</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("flex flex-col h-full bg-background relative", className)}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Header */}
      <ChatHeader agentName={agentName} status={status} messageCount={conversations.length} />

      {/* Message area */}
      <div style={{ height: messageHeight }} className="min-h-0">
        <MessagePane>
          {conversations.map((conv) =>
            renderConversation(conv, streamingText, currentTextBlockId, interrupt)
          )}
        </MessagePane>
      </div>

      {/* Input area */}
      <div style={{ height: inputHeight }} className="min-h-0">
        <InputPane
          onSend={(content) => {
            // Pass content directly - useAgent now supports multimodal
            send(content);
          }}
          onStop={interrupt}
          isLoading={isLoading}
          placeholder={inputPlaceholder}
          toolbarItems={toolbarItems}
          toolbarRightItems={toolbarRightItems}
          onToolbarItemClick={handleToolbarClick}
          droppedFiles={droppedFiles}
          onDroppedFilesProcessed={handleDroppedFilesProcessed}
        />
      </div>

      {/* Full-area drop overlay - dark mask style */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 pointer-events-none">
          <div className="w-20 h-20 mb-4 rounded-2xl bg-primary flex items-center justify-center">
            <svg
              className="w-10 h-10 text-primary-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <p className="text-white text-lg">Drop to send</p>
        </div>
      )}
    </div>
  );
}
