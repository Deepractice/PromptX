/**
 * AssistantToolbar - Toolbar for assistant message actions
 *
 * Displays action buttons below assistant messages:
 * - Copy, regenerate, like, dislike for completed messages
 * - "esc to stop" hint for streaming messages
 *
 * @example
 * ```tsx
 * <AssistantToolbar
 *   status="completed"
 *   onCopy={() => handleCopy()}
 *   onRegenerate={() => handleRegenerate()}
 * />
 * ```
 */

import * as React from "react";
import { useTranslation } from "react-i18next";
import { Copy, RefreshCw, ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/components/agentx-ui/utils/utils";
import type { AssistantConversationStatus } from "./types";

export interface AssistantToolbarProps {
  /**
   * Current status of the conversation
   */
  status: AssistantConversationStatus;
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
   * Callback when stop is triggered (click or ESC)
   */
  onStop?: () => void;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Toolbar button component
 */
const ToolbarButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}> = ({ icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "p-1.5 rounded-md",
      "text-muted-foreground/60 hover:text-muted-foreground",
      "hover:bg-muted/50",
      "transition-colors duration-150"
    )}
    title={label}
  >
    {icon}
  </button>
);

/**
 * AssistantToolbar Component
 */
export const AssistantToolbar: React.FC<AssistantToolbarProps> = ({
  status,
  onCopy,
  onRegenerate,
  onLike,
  onDislike,
  onStop,
  className,
}) => {
  const { t } = useTranslation();
  const isStreaming =
    status === "queued" ||
    status === "processing" ||
    status === "thinking" ||
    status === "streaming";

  const isCompleted = status === "completed";

  return (
    <div
      className={cn(
        "flex items-center gap-1 pt-1",
        // Fade in animation
        "animate-in fade-in duration-200",
        className
      )}
    >
      {/* Streaming: show stop hint */}
      {isStreaming && onStop && (
        <span
          className="text-xs text-muted-foreground/40 cursor-pointer hover:text-muted-foreground/60 transition-colors select-none"
          onClick={onStop}
        >
          {t("agentxUI.chat.actions.escToStop")}
        </span>
      )}

      {/* Completed: show action buttons */}
      {isCompleted && (
        <>
          {onCopy && (
            <ToolbarButton icon={<Copy className="w-3.5 h-3.5" />} label={t("agentxUI.chat.actions.copy")} onClick={onCopy} />
          )}
          {onRegenerate && (
            <ToolbarButton
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              label={t("agentxUI.chat.actions.regenerate")}
              onClick={onRegenerate}
            />
          )}
          <div className="w-px h-4 bg-border mx-1" />
          {onLike && (
            <ToolbarButton
              icon={<ThumbsUp className="w-3.5 h-3.5" />}
              label={t("agentxUI.chat.actions.like")}
              onClick={onLike}
            />
          )}
          {onDislike && (
            <ToolbarButton
              icon={<ThumbsDown className="w-3.5 h-3.5" />}
              label={t("agentxUI.chat.actions.dislike")}
              onClick={onDislike}
            />
          )}
        </>
      )}
    </div>
  );
};

export default AssistantToolbar;
