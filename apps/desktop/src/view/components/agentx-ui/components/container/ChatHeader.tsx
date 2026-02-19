/**
 * ChatHeader - Header component for Chat interface
 *
 * Displays current agent information, status, and actions.
 *
 * @example
 * ```tsx
 * <ChatHeader
 *   agentName="Assistant"
 *   status="thinking"
 *   messageCount={5}
 * />
 * ```
 */

import * as React from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { AgentState } from "agentxjs";
import { Badge } from "@/components/agentx-ui/components/ui";
import { cn } from "@/components/agentx-ui/utils";

export interface ChatHeaderProps {
  /**
   * Agent name to display
   */
  agentName?: string;
  /**
   * Current agent status
   */
  status?: AgentState;
  /**
   * Number of messages in conversation
   */
  messageCount?: number;
  /**
   * Additional actions on the right side
   */
  actions?: React.ReactNode;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Get status display info
 */
function useStatusInfo(status?: AgentState): {
  text: string;
  variant: "default" | "secondary" | "outline";
} {
  const { t } = useTranslation();

  switch (status) {
    case "thinking":
      return { text: t("agentxUI.chat.status.thinking"), variant: "default" };
    case "responding":
      return { text: t("agentxUI.chat.status.responding"), variant: "default" };
    case "planning_tool":
      return { text: t("agentxUI.chat.status.planning"), variant: "default" };
    case "awaiting_tool_result":
      return { text: t("agentxUI.chat.status.executing"), variant: "default" };
    case "error":
      return { text: t("agentxUI.chat.status.error"), variant: "outline" };
    default:
      return { text: t("agentxUI.chat.status.idle"), variant: "secondary" };
  }
}

/**
 * ChatHeader component
 */
export function ChatHeader({
  agentName,
  status = "idle",
  messageCount = 0,
  actions,
  className,
}: ChatHeaderProps): React.ReactElement {
  const { t } = useTranslation();
  const statusInfo = useStatusInfo(status);
  const isActive = status !== "idle";
  const displayName = agentName ?? t("agentxUI.conversations.untitled");

  return (
    <div className={cn("px-4 py-3 border-b border-border bg-background", className)}>
      <div className="flex items-center justify-between">
        {/* Left: Agent info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Icon */}
          <div className="bg-primary rounded-lg w-8 h-8 flex items-center justify-center text-primary-foreground flex-shrink-0 shadow-sm">
            <MessageSquare className="w-4 h-4" />
          </div>

          {/* Name and status */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-sm text-foreground truncate">{displayName}</h2>
              {isActive && (
                <Loader2 className="w-3 h-3 text-muted-foreground animate-spin flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant={statusInfo.variant} className="text-xs px-1.5 py-0">
                {statusInfo.text}
              </Badge>
              {messageCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {messageCount} {messageCount === 1 ? "message" : "messages"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        {actions && <div className="flex items-center gap-2 ml-4">{actions}</div>}
      </div>
    </div>
  );
}
