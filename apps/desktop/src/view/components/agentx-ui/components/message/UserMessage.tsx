/**
 * UserMessage - User message component
 *
 * Displays user message with right-aligned layout and status indicator.
 */

import * as React from "react";
import { Loader2, Check, AlertCircle, PauseCircle } from "lucide-react";
import { MessageAvatar } from "./MessageAvatar";
import { MessageContent } from "./MessageContent";
import { cn } from "@/components/agentx-ui/utils/utils";
import type { UserConversationStatus } from "@/components/agentx-ui/hooks/useAgent";

/**
 * @deprecated Use UserEntry from ~/components/entry instead
 */
type UserMessageStatus = UserConversationStatus;

export interface UserMessageProps {
  /**
   * Message content
   */
  content: string;
  /**
   * Message status
   */
  status: UserMessageStatus;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Status icon component
 */
const StatusIcon: React.FC<{ status: UserMessageStatus }> = ({ status }) => {
  const iconClassName = "w-4 h-4 flex-shrink-0";

  switch (status) {
    case "pending":
      return <Loader2 className={cn(iconClassName, "animate-spin text-muted-foreground")} />;
    case "success":
      return <Check className={cn(iconClassName, "text-green-500")} />;
    case "error":
      return <AlertCircle className={cn(iconClassName, "text-red-500")} />;
    case "interrupted":
      return <PauseCircle className={cn(iconClassName, "text-gray-500")} />;
    default:
      return null;
  }
};

/**
 * UserMessage Component
 */
export const UserMessage: React.FC<UserMessageProps> = ({ content, status, className }) => {
  // Filter out <file path="...">...</file> tags for display (AI still sees them)
  const displayContent = React.useMemo(() => {
    return content
      .replace(/<file\s+path="[^"]*">[^<]*<\/file>\s*/g, '')
      .trim();
  }, [content]);

  return (
    <div className={cn("flex gap-3 py-2 flex-row-reverse", className)}>
      <MessageAvatar role="user" />
      <div className="flex items-start gap-2 max-w-[80%]">
        <div className="rounded-lg px-4 py-2 bg-primary text-primary-foreground">
          <MessageContent content={displayContent} className="text-sm" />
        </div>
        <div className="flex items-center h-8">
          <StatusIcon status={status} />
        </div>
      </div>
    </div>
  );
};
