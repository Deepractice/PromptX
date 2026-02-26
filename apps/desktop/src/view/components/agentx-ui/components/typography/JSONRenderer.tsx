import * as React from "react";
import { FileText } from "lucide-react";
import { cn } from "@/components/agentx-ui/utils/utils";

export interface JSONRendererProps {
  /**
   * JSON string to parse and display
   */
  content: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * JSONRenderer - Format and display JSON content
 *
 * Single Responsibility: Parse JSON string and render formatted output
 *
 * Returns null if content is not valid JSON
 *
 * @example
 * ```tsx
 * <JSONRenderer content='{"name": "Agent", "version": "1.0"}' />
 * ```
 */
export function JSONRenderer({ content, className }: JSONRendererProps): React.ReactElement | null {
  try {
    const parsed = JSON.parse(content);
    const formatted = JSON.stringify(parsed, null, 2);

    return (
      <div className={cn("my-2", className)}>
        {/* Header */}
        <div className="flex items-center gap-2 mb-2 text-sm text-slate-600 dark:text-slate-400">
          <FileText className="w-4 h-4" />
          <span className="font-medium">JSON Response</span>
        </div>

        {/* JSON Content */}
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
          <pre className="p-4 overflow-x-auto">
            <code className="text-slate-900 dark:text-slate-100 text-sm font-mono block whitespace-pre">
              {formatted}
            </code>
          </pre>
        </div>
      </div>
    );
  } catch (_e) {
    // Not valid JSON, return null and let parent handle
    return null;
  }
}
