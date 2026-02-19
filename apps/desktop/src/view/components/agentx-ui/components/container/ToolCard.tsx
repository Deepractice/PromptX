/**
 * ToolCard - Collapsible tool call/result card
 *
 * Displays tool execution with status indicators:
 * - Executing: blue with spinner
 * - Success: green with checkmark
 * - Error: red with X
 *
 * Features:
 * - Collapsible content
 * - Status-based styling
 * - Duration display
 * - Input/Output sections
 *
 * @example
 * ```tsx
 * <ToolCard
 *   name="Bash"
 *   status="success"
 *   input={{ command: "ls -la" }}
 *   output="file1.txt\nfile2.txt"
 *   duration={1.23}
 * />
 * ```
 */

import { useState } from "react";
import { ChevronDown, Loader2, CheckCircle2, XCircle, Wrench } from "lucide-react";
import { cn } from "@/components/agentx-ui/utils/utils";

export type ToolStatus = "executing" | "success" | "error";

export interface ToolCardProps {
  /**
   * Tool name
   */
  name: string;
  /**
   * Tool call ID
   */
  id?: string;
  /**
   * Current status
   */
  status: ToolStatus;
  /**
   * Tool input parameters
   */
  input?: Record<string, unknown>;
  /**
   * Tool output (string or object)
   */
  output?: unknown;
  /**
   * Execution duration in seconds
   */
  duration?: number;
  /**
   * Whether output is an error
   */
  isError?: boolean;
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
const statusConfig = {
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
 * ToolCard component
 */
export function ToolCard({
  name,
  id,
  status,
  input,
  output,
  duration,
  isError,
  defaultExpanded = false,
  className,
}: ToolCardProps): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Use error status if isError is true
  const effectiveStatus = isError ? "error" : status;
  const config = statusConfig[effectiveStatus];

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
            <span className="font-medium font-mono text-sm">{name}</span>
          </div>

          {/* Duration */}
          {duration !== undefined && status !== "executing" && (
            <span className="text-xs opacity-60">• {duration.toFixed(2)}s</span>
          )}

          {/* Status Label (only for executing) */}
          {status === "executing" && <span className="text-xs opacity-60">• {config.label}</span>}
        </div>

        {/* Expand/Collapse Icon */}
        <ChevronDown className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-180")} />
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className={cn("border-t px-4 py-3 space-y-3", config.borderColor)}>
          {/* Tool Call ID */}
          {id && (
            <div className="text-xs opacity-60">
              <span className="font-medium">ID:</span> <span className="font-mono">{id}</span>
            </div>
          )}

          {/* Input Section */}
          {input && Object.keys(input).length > 0 && (
            <div>
              <div className="text-xs font-medium opacity-70 mb-1 uppercase tracking-wide">
                Input
              </div>
              <div className="bg-white/50 dark:bg-black/20 rounded border border-current/10 p-2 overflow-x-auto">
                <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                  {JSON.stringify(input, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Output Section */}
          {output !== undefined && status !== "executing" && (
            <div>
              <div className="text-xs font-medium opacity-70 mb-1 uppercase tracking-wide">
                Output
              </div>
              <div className="bg-white/50 dark:bg-black/20 rounded border border-current/10 p-2 overflow-x-auto max-h-48 overflow-y-auto">
                <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                  {formatOutput(output)}
                </pre>
              </div>
            </div>
          )}

          {/* Waiting for result */}
          {status === "executing" && (
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

export default ToolCard;
