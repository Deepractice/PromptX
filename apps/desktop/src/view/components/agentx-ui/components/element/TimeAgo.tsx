import * as React from "react";
import { cn } from "@/components/agentx-ui/utils/utils";
import { formatTimeAgo } from "@/components/agentx-ui/utils/timeUtils";

export interface TimeAgoProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * Date to display (ISO string or Date object)
   */
  date: string | Date;
  /**
   * Auto-update interval in milliseconds (0 to disable)
   * @default 60000 (1 minute)
   */
  updateInterval?: number;
  /**
   * Show tooltip with full date on hover
   * @default true
   */
  showTooltip?: boolean;
}

/**
 * TimeAgo - Display relative time with auto-update
 *
 * A component that displays relative time ("Just now", "5 mins ago") and
 * automatically updates at a specified interval. Useful for showing timestamps
 * in lists, messages, and activity feeds.
 *
 * @example
 * ```tsx
 * // Basic usage with auto-update every minute
 * <TimeAgo date="2025-01-14T10:30:00Z" />
 *
 * // With custom styling
 * <TimeAgo
 *   date={session.lastActivity}
 *   className="text-xs text-muted-foreground"
 * />
 *
 * // Disable auto-update
 * <TimeAgo date={message.timestamp} updateInterval={0} />
 *
 * // Fast update interval (every 10 seconds)
 * <TimeAgo date={recentEvent} updateInterval={10000} />
 *
 * // No tooltip
 * <TimeAgo date={date} showTooltip={false} />
 * ```
 */
export const TimeAgo: React.ForwardRefExoticComponent<
  TimeAgoProps & React.RefAttributes<HTMLSpanElement>
> = React.forwardRef<HTMLSpanElement, TimeAgoProps>(
  ({ date, updateInterval = 60000, showTooltip = true, className, ...props }, ref) => {
    const [currentTime, setCurrentTime] = React.useState(new Date());

    // Auto-update timer
    React.useEffect(() => {
      if (updateInterval <= 0) return;

      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, updateInterval);

      return () => clearInterval(timer);
    }, [updateInterval]);

    const formattedTime = formatTimeAgo(date, currentTime);
    const fullDate = React.useMemo(() => {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return undefined;
      return dateObj.toLocaleString();
    }, [date]);

    return (
      <span
        ref={ref}
        className={cn("inline-block", className)}
        title={showTooltip ? fullDate : undefined}
        {...props}
      >
        {formattedTime}
      </span>
    );
  }
);

TimeAgo.displayName = "TimeAgo";
