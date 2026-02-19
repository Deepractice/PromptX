/**
 * ToolBlock - Tool execution block component
 *
 * Displays tool call with status, input, and output.
 * Used as a sub-component within AssistantEntry.
 *
 * @example
 * ```tsx
 * <ToolBlockComponent
 *   block={{
 *     id: "msg_123",
 *     toolCallId: "tool_456",
 *     name: "Bash",
 *     input: { command: "ls" },
 *     status: "success",
 *     output: "file1.txt",
 *     duration: 1.23,
 *   }}
 * />
 * ```
 */

import * as React from "react";
import { useState } from "react";
import { ChevronDown, Loader2, CheckCircle2, XCircle, Wrench } from "lucide-react";
import { cn } from "@/components/agentx-ui/utils/utils";
import type { ToolBlockData, ToolBlockStatus } from "../types";

export interface ToolBlockProps {
  /**
   * Tool block data
   */
  block: ToolBlockData;
  /**
   * Default expanded state
   */
  defaultExpanded?: boolean;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Status configuration
 */
const statusConfig: Record<
  ToolBlockStatus,
  {
    icon: React.ReactNode;
    bgColor: string;
    borderColor: string;
    textColor: string;
    iconColor: string;
    label: string;
  }
> = {
  planning: {
    icon: <Loader2 className="w-4 h-4 animate-spin" />,
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-800",
    textColor: "text-amber-700 dark:text-amber-300",
    iconColor: "text-amber-500",
    label: "Planning...",
  },
  executing: {
    icon: <Loader2 className="w-4 h-4 animate-spin" />,
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    textColor: "text-blue-700 dark:text-blue-300",
    iconColor: "text-blue-500",
    label: "Executing...",
  },
  success: {
    icon: <CheckCircle2 className="w-4 h-4" />,
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-200 dark:border-green-800",
    textColor: "text-green-700 dark:text-green-300",
    iconColor: "text-green-500",
    label: "Completed",
  },
  error: {
    icon: <XCircle className="w-4 h-4" />,
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-800",
    textColor: "text-red-700 dark:text-red-300",
    iconColor: "text-red-500",
    label: "Error",
  },
};

/**
 * Format output for display
 */
function formatOutput(output: unknown): string {
  if (typeof output === "string") {
    return output;
  }
  if (output === null || output === undefined) {
    return "";
  }
  return JSON.stringify(output, null, 2);
}

/**
 * ToolBlock component
 */
export function ToolBlock({
  block,
  defaultExpanded = false,
  className,
}: ToolBlockProps): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const config = statusConfig[block.status];

  return (
    <div
      className={cn(
        "w-full border rounded-lg overflow-hidden",
        config.borderColor,
        config.bgColor,
        className
      )}
    >
      {/* Header - Clickable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full px-4 py-3 flex items-center justify-between",
          "hover:bg-black/5 dark:hover:bg-white/5 transition-colors",
          config.textColor
        )}
      >
        <div className="flex items-center gap-3">
          {/* Status Icon */}
          <span className={config.iconColor}>{config.icon}</span>

          {/* Tool Icon + Name */}
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 opacity-60" />
            <span className="font-medium font-mono text-sm">{block.name}</span>
          </div>

          {/* Duration */}
          {block.duration !== undefined && block.status !== "executing" && (
            <span className="text-xs opacity-60">• {block.duration.toFixed(2)}s</span>
          )}

          {/* Status Label (for planning and executing) */}
          {(block.status === "planning" || block.status === "executing") && (
            <span className="text-xs opacity-60">• {config.label}</span>
          )}
        </div>

        {/* Expand/Collapse Icon */}
        <ChevronDown className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-180")} />
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className={cn("border-t px-4 py-3 space-y-3", config.borderColor)}>
          {/* Tool Call ID */}
          <div className="text-xs opacity-60">
            <span className="font-medium">ID:</span>{" "}
            <span className="font-mono">{block.toolCallId}</span>
          </div>

          {/* Input Section */}
          {block.input !== null &&
          block.input !== undefined &&
          typeof block.input === "object" &&
          Object.keys(block.input as Record<string, unknown>).length > 0 ? (
            <div>
              <div className="text-xs font-medium opacity-70 mb-1 uppercase tracking-wide">
                Input
              </div>
              <div className="bg-white/50 dark:bg-black/20 rounded border border-current/10 p-2 overflow-x-auto">
                <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                  {JSON.stringify(block.input, null, 2)}
                </pre>
              </div>
            </div>
          ) : null}

          {/* Output Section */}
          {block.output !== undefined && block.status !== "executing" && (
            <div>
              <div className="text-xs font-medium opacity-70 mb-1 uppercase tracking-wide">
                Output
              </div>
              <div className="bg-white/50 dark:bg-black/20 rounded border border-current/10 p-2 overflow-x-auto max-h-48 overflow-y-auto">
                <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                  {formatOutput(block.output)}
                </pre>
              </div>
            </div>
          )}

          {/* Waiting message */}
          {block.status === "planning" && (
            <div className="flex items-center gap-2 text-xs opacity-60 py-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Generating input...</span>
            </div>
          )}
          {block.status === "executing" && (
            <div className="flex items-center gap-2 text-xs opacity-60 py-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Waiting for result...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ToolBlock;
