/**
 * ErrorMessage - Error message component
 *
 * Displays error message with red styling.
 */

import * as React from "react";
import { MessageAvatar } from "./MessageAvatar";
import { cn } from "@/components/agentx-ui/utils/utils";

export interface ErrorMessageProps {
  /**
   * Error content
   */
  content: string;
  /**
   * Error code (optional)
   */
  errorCode?: string;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * ErrorMessage Component
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({ content, errorCode, className }) => {
  return (
    <div className={cn("flex gap-3 py-2", className)}>
      <MessageAvatar role="error" />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-destructive mb-1">
          Error{errorCode ? ` (${errorCode})` : ""}
        </div>
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-2 text-sm text-destructive">
          {content}
        </div>
      </div>
    </div>
  );
};
