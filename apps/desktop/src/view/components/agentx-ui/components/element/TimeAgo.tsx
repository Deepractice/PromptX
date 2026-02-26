import * as React from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/components/agentx-ui/utils/utils";

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
 * Format time ago with i18n support
 */
function useFormatTimeAgo(dateString: string | Date, currentTime: Date): string {
  const { t } = useTranslation();

  const date = typeof dateString === "string" ? new Date(dateString) : dateString;

  if (isNaN(date.getTime())) {
    return t("agentxUI.time.unknown");
  }

  const diffInMs = currentTime.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInSeconds < 60) return t("agentxUI.time.justNow");
  if (diffInMinutes === 1) return t("agentxUI.time.minAgo");
  if (diffInMinutes < 60) return t("agentxUI.time.minsAgo", { count: diffInMinutes });
  if (diffInHours === 1) return t("agentxUI.time.hourAgo");
  if (diffInHours < 24) return t("agentxUI.time.hoursAgo", { count: diffInHours });
  if (diffInDays === 1) return t("agentxUI.time.dayAgo");
  if (diffInDays < 7) return t("agentxUI.time.daysAgo", { count: diffInDays });
  return date.toLocaleDateString();
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

    const formattedTime = useFormatTimeAgo(date, currentTime);
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
