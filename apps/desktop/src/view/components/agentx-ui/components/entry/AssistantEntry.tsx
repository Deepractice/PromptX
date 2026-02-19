/**
 * AssistantEntry - AI assistant response entry
 *
 * Displays assistant's response with blocks (TextBlock, ToolBlock, etc.)
 * rendered in order. Supports streaming and status indicators.
 *
 * @example
 * ```tsx
 * // Completed entry with text and tool blocks
 * <AssistantEntry
 *   entry={{
 *     type: "assistant",
 *     id: "conv_123",
 *     messageIds: ["msg_1"],
 *     timestamp: Date.now(),
 *     status: "completed",
 *     blocks: [
 *       { type: "text", id: "t1", content: "Let me check...", status: "completed" },
 *       { type: "tool", id: "t2", toolCallId: "tc1", name: "Bash", ... },
 *       { type: "text", id: "t3", content: "Done!", status: "completed" },
 *     ],
 *   }}
 * />
 *
 * // Streaming entry
 * <AssistantEntry
 *   entry={{
 *     type: "assistant",
 *     id: "conv_123",
 *     messageIds: [],
 *     timestamp: Date.now(),
 *     status: "streaming",
 *     blocks: [
 *       { type: "text", id: "text_123", content: "", status: "streaming" },
 *     ],
 *   }}
 *   streamingText="I'm thinking about..."
 *   currentTextBlockId="text_123"
 * />
 * ```
 */

import * as React from "react";
import { useTranslation } from "react-i18next";
import { MessageAvatar } from "@/components/agentx-ui/components/message/MessageAvatar";
import { TextBlock } from "./blocks/TextBlock";
import { ToolBlock } from "./blocks/ToolBlock";
import { AssistantToolbar } from "./AssistantToolbar";
import { cn } from "@/components/agentx-ui/utils/utils";
import type { AssistantConversationData, BlockData } from "./types";

export interface AssistantEntryProps {
  /**
   * Assistant conversation data
   */
  entry: AssistantConversationData;
  /**
   * Streaming text (for streaming TextBlock)
   */
  streamingText?: string;
  /**
   * Current streaming text block id
   */
  currentTextBlockId?: string | null;
  /**
   * Callback when stop is triggered
   */
  onStop?: () => void;
  /**
   * Callback when copy button is clicked
   */
  onCopy?: () => void;
  /**
   * Callback when regenerate button is clicked
   */
  onRegenerate?: () => void;
  /**
   * Callback when like button is clicked
   */
  onLike?: () => void;
  /**
   * Callback when dislike button is clicked
   */
  onDislike?: () => void;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Render a single block
 */
function renderBlock(
  block: BlockData,
  streamingText: string | undefined,
  currentTextBlockId: string | null | undefined
): React.ReactNode {
  switch (block.type) {
    case "text":
      return (
        <TextBlock
          key={block.id}
          block={block}
          streamingText={block.id === currentTextBlockId ? streamingText : undefined}
          className="w-full"
        />
      );

    case "tool":
      return <ToolBlock key={block.id} block={block} />;

    case "image":
      // Future: ImageBlock component
      return null;

    default:
      return null;
  }
}

/**
 * AssistantEntry Component
 */
export const AssistantEntry: React.FC<AssistantEntryProps> = ({
  entry,
  streamingText = "",
  currentTextBlockId,
  onStop,
  onCopy,
  onRegenerate,
  onLike,
  onDislike,
  className,
}) => {
  const { t } = useTranslation();
  const [dots, setDots] = React.useState("");

  // Animated dots for queued/processing/thinking states
  React.useEffect(() => {
    if (entry.status === "queued" || entry.status === "processing" || entry.status === "thinking") {
      const interval = setInterval(() => {
        setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [entry.status]);

  const hasBlocks = entry.blocks.length > 0;

  // Render status indicator for queued/processing/thinking
  const renderStatusIndicator = () => {
    switch (entry.status) {
      case "queued":
        return (
          <div className="rounded-lg px-4 py-2 bg-muted inline-block">
            <span className="text-sm text-muted-foreground">{t("agentxUI.chat.status.queued")}{dots}</span>
          </div>
        );

      case "processing":
        return (
          <div className="rounded-lg px-4 py-2 bg-muted inline-block">
            <span className="text-sm text-muted-foreground">{t("agentxUI.chat.status.processing")}{dots}</span>
          </div>
        );

      case "thinking":
        return (
          <div className="rounded-lg px-4 py-2 bg-muted inline-block">
            <span className="text-sm text-muted-foreground">{t("agentxUI.chat.status.thinking")}{dots}</span>
          </div>
        );

      default:
        return null;
    }
  };

  // Determine if we should show status indicator
  const showStatusIndicator =
    (entry.status === "queued" || entry.status === "processing" || entry.status === "thinking") &&
    !hasBlocks;

  // Show toolbar if any callback is provided
  const showToolbar = onStop || onCopy || onRegenerate || onLike || onDislike;

  return (
    <div className={cn("flex gap-3 py-2", className)}>
      <MessageAvatar role="assistant" />
      <div className="flex-1 min-w-0 space-y-2 max-w-3xl">
        {/* Status indicator (when no blocks yet) */}
        {showStatusIndicator && renderStatusIndicator()}

        {/* Render blocks in order */}
        {entry.blocks.map((block) => renderBlock(block, streamingText, currentTextBlockId))}

        {/* Toolbar */}
        {showToolbar && (
          <AssistantToolbar
            status={entry.status}
            onStop={onStop}
            onCopy={onCopy}
            onRegenerate={onRegenerate}
            onLike={onLike}
            onDislike={onDislike}
          />
        )}
      </div>
    </div>
  );
};

export default AssistantEntry;
