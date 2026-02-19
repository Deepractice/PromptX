/**
 * ToolMessage - Tool call message component
 *
 * Displays tool call with embedded result using ToolCard.
 * Result is directly embedded in props (not via metadata).
 */

import * as React from "react";
import { ToolCard, type ToolStatus } from "@/components/agentx-ui/components/container/ToolCard";
/**
 * @deprecated Use ToolBlock from ~/components/entry instead
 */
interface EmbeddedToolResult {
  output: unknown;
  duration?: number;
}
import { cn } from "@/components/agentx-ui/utils/utils";

export interface ToolMessageProps {
  /**
   * Tool call info
   */
  toolCall: {
    id: string;
    name: string;
    input: unknown;
  };
  /**
   * Tool result (embedded, not separate message)
   */
  toolResult?: EmbeddedToolResult;
  /**
   * Timestamp for calculating duration
   */
  timestamp: number;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * ToolMessage Component
 */
export const ToolMessage: React.FC<ToolMessageProps> = ({ toolCall, toolResult, className }) => {
  // Determine tool status
  let status: ToolStatus = "executing";
  let isError = false;

  if (toolResult) {
    // Check if result indicates error
    const output = toolResult.output as { type?: string } | undefined;
    const outputType = output?.type;
    isError =
      outputType === "error-text" ||
      outputType === "error-json" ||
      outputType === "execution-denied";
    status = isError ? "error" : "success";
  }

  return (
    <div className={cn("py-2 ml-11 max-w-2xl", className)}>
      <ToolCard
        name={toolCall.name}
        id={toolCall.id}
        status={status}
        input={toolCall.input as Record<string, unknown>}
        output={toolResult?.output}
        isError={isError}
        duration={toolResult?.duration}
      />
    </div>
  );
};
