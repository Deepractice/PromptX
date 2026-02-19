import * as React from "react";
import { cn } from "@/components/agentx-ui/utils/utils";

export interface DiffViewerProps {
  /**
   * Diff content in unified diff format
   */
  diff: string;
  /**
   * Optional file name (currently unused, for future enhancement)
   */
  fileName?: string;
  /**
   * Enable mobile-friendly text wrapping
   */
  isMobile?: boolean;
  /**
   * Force text wrapping
   */
  wrapText?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * DiffViewer - Display code diff with syntax highlighting
 *
 * Single Responsibility: Render diff content with color-coded additions/deletions
 *
 * Color coding:
 * - Green: Additions (+)
 * - Red: Deletions (-)
 * - Blue: Headers (@@)
 * - Gray: Context lines
 *
 * @example
 * ```tsx
 * <DiffViewer
 *   diff="+  console.log('added');\n-  console.log('removed');"
 * />
 * ```
 */
export function DiffViewer({
  diff,
  fileName: _fileName,
  isMobile,
  wrapText,
  className,
}: DiffViewerProps): React.ReactElement {
  if (!diff) {
    return (
      <div className="p-4 text-center text-slate-500 dark:text-slate-400 text-sm">
        No diff available
      </div>
    );
  }

  const renderDiffLine = (line: string, index: number) => {
    const isAddition = line.startsWith("+") && !line.startsWith("+++");
    const isDeletion = line.startsWith("-") && !line.startsWith("---");
    const isHeader = line.startsWith("@@");

    return (
      <div
        key={index}
        className={cn(
          "font-mono text-xs p-2",
          isMobile && wrapText ? "whitespace-pre-wrap break-all" : "whitespace-pre overflow-x-auto",
          isAddition && "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300",
          isDeletion && "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300",
          isHeader && "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300",
          !isAddition && !isDeletion && !isHeader && "text-slate-600 dark:text-slate-400"
        )}
      >
        {line}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "diff-viewer border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden",
        className
      )}
    >
      {diff.split("\n").map((line, index) => renderDiffLine(line, index))}
    </div>
  );
}
