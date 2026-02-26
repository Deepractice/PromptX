/**
 * MessageAvatar - Display avatar for different message roles
 *
 * Pure UI component that renders a circular avatar based on message role.
 */

import * as React from "react";
import type { MessageRole } from "agentxjs";
import { cn } from "@/components/agentx-ui/utils/utils";

export interface MessageAvatarProps {
  /**
   * Message role
   */
  role: MessageRole;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * MessageAvatar Component
 */
export const MessageAvatar: React.FC<MessageAvatarProps> = ({ role, className }) => {
  const avatarClasses = cn(
    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0",
    className
  );

  switch (role) {
    case "user":
      return <div className={cn(avatarClasses, "bg-primary text-primary-foreground")}>U</div>;
    case "assistant":
      return <div className={cn(avatarClasses, "bg-secondary text-secondary-foreground")}>A</div>;
    case "system":
      return <div className={cn(avatarClasses, "bg-muted text-muted-foreground")}>S</div>;
    case "tool":
      return <div className={cn(avatarClasses, "bg-accent text-accent-foreground")}>T</div>;
    case "error":
      return (
        <div className={cn(avatarClasses, "bg-destructive text-destructive-foreground")}>!</div>
      );
    default:
      return null;
  }
};
