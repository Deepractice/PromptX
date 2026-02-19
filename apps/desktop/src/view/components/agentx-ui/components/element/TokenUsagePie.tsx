import * as React from "react";
import { cn } from "@/components/agentx-ui/utils/utils";

export interface TokenUsagePieProps {
  /**
   * Number of tokens used
   */
  used: number;
  /**
   * Total token limit
   */
  total: number;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * TokenUsagePie - Display token usage as a circular progress indicator
 *
 * Single Responsibility: Visualize token usage percentage with color coding
 *
 * Color coding (following design system):
 * - Blue (<50%): Normal usage - computational color
 * - Amber (50-75%): Warning - generative/attention color
 * - Red (>75%): Critical - destructive color
 *
 * Returns null if invalid data
 *
 * @example
 * ```tsx
 * <TokenUsagePie used={5000} total={8000} />
 * <TokenUsagePie used={120000} total={200000} />
 * ```
 */
export function TokenUsagePie({
  used,
  total,
  className,
}: TokenUsagePieProps): React.ReactElement | null {
  if (used == null || total == null || total <= 0) return null;

  const percentage = Math.min(100, (used / total) * 100);
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = (): string => {
    if (percentage < 50) return "#0284c7"; // blue-600 - computational (normal)
    if (percentage < 75) return "#f59e0b"; // amber-500 - generative (warning)
    return "#ef4444"; // red-500 - destructive (critical)
  };

  const getColorName = (): string => {
    if (percentage < 50) return "text-blue-600";
    if (percentage < 75) return "text-amber-500";
    return "text-destructive";
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400",
        className
      )}
    >
      {/* Circular progress */}
      <svg width="24" height="24" viewBox="0 0 24 24" className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="12"
          cy="12"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-slate-300 dark:text-slate-600"
        />
        {/* Progress circle */}
        <circle
          cx="12"
          cy="12"
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth="2"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>

      {/* Percentage text */}
      <span
        title={`${used.toLocaleString()} / ${total.toLocaleString()} tokens`}
        className={cn("font-medium transition-colors", getColorName())}
      >
        {percentage.toFixed(1)}%
      </span>
    </div>
  );
}
