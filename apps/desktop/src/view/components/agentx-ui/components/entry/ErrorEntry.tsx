/**
 * ErrorEntry - Error message entry
 *
 * Displays error message with red styling.
 *
 * @example
 * ```tsx
 * <ErrorEntryComponent
 *   entry={{
 *     type: "error",
 *     id: "err_123",
 *     content: "Failed to connect to server",
 *     timestamp: Date.now(),
 *     errorCode: "CONNECTION_ERROR",
 *   }}
 * />
 * ```
 */

import * as React from "react";
import { MessageAvatar } from "@/components/agentx-ui/components/message/MessageAvatar";
import { cn } from "@/components/agentx-ui/utils/utils";
import type { ErrorConversationData } from "./types";

export interface ErrorEntryProps {
  /**
   * Error conversation data
   */
  entry: ErrorConversationData;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * ErrorEntry Component
 */
export const ErrorEntry: React.FC<ErrorEntryProps> = ({ entry, className }) => {
  return (
    <div className={cn("flex gap-3 py-2", className)}>
      <MessageAvatar role="error" />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-destructive mb-1">
          Error{entry.errorCode ? ` (${entry.errorCode})` : ""}
        </div>
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-2 text-sm text-destructive">
          {entry.content}
        </div>
      </div>
    </div>
  );
};

export default ErrorEntry;
