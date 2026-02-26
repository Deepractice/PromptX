import * as React from "react";
import { cn } from "@/components/agentx-ui/utils/utils";

export interface ListItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /**
   * Whether the item is selected
   */
  selected?: boolean;
  /**
   * Whether the item is active (within last 10 minutes, etc.)
   */
  active?: boolean;
  /**
   * Whether to show active indicator dot
   */
  showActiveIndicator?: boolean;
  /**
   * Left side content (icon, avatar, logo, etc.)
   */
  leading?: React.ReactNode;
  /**
   * Main title content
   */
  title: React.ReactNode;
  /**
   * Subtitle content (timestamp, description, etc.)
   */
  subtitle?: React.ReactNode;
  /**
   * Trailing content (badge, actions, etc.)
   */
  trailing?: React.ReactNode;
  /**
   * Action buttons (show on hover for desktop)
   */
  actions?: React.ReactNode;
  /**
   * Layout variant
   */
  variant?: "default" | "compact";
  /**
   * Whether in mobile mode
   */
  isMobile?: boolean;
  /**
   * Click handler
   */
  onClick?: () => void;
}

/**
 * ListItem - Generic list item component with flexible slots
 *
 * A highly flexible list item component for building various list UIs.
 * Supports leading icons, titles, subtitles, trailing content, and hover actions.
 * Can be used for sessions, messages, users, files, etc.
 *
 * @example
 * ```tsx
 * // Session item
 * <ListItem
 *   leading={<AgentLogo />}
 *   title="Project Planning Session"
 *   subtitle={
 *     <div className="flex items-center gap-1">
 *       <Clock className="w-3 h-3" />
 *       <TimeAgo date={session.lastActivity} />
 *     </div>
 *   }
 *   trailing={<Badge>5</Badge>}
 *   actions={
 *     <button><Trash2 className="w-3 h-3" /></button>
 *   }
 *   selected={isSelected}
 *   onClick={handleSelect}
 * />
 *
 * // User item
 * <ListItem
 *   leading={<Avatar src={user.avatar} />}
 *   title={user.name}
 *   subtitle={user.email}
 *   trailing={<Badge variant="success">Online</Badge>}
 * />
 *
 * // File item
 * <ListItem
 *   leading={<File className="w-5 h-5" />}
 *   title="document.pdf"
 *   subtitle="2.4 MB"
 *   actions={
 *     <>
 *       <button><Download /></button>
 *       <button><Trash2 /></button>
 *     </>
 *   }
 * />
 *
 * // With active indicator
 * <ListItem
 *   active
 *   showActiveIndicator
 *   leading={<MessageSquare />}
 *   title="Live Session"
 *   subtitle="Active now"
 * />
 * ```
 */
export const ListItem: React.ForwardRefExoticComponent<
  ListItemProps & React.RefAttributes<HTMLDivElement>
> = React.forwardRef<HTMLDivElement, ListItemProps>(
  (
    {
      selected = false,
      active = false,
      showActiveIndicator = false,
      leading,
      title,
      subtitle,
      trailing,
      actions,
      variant = "default",
      isMobile = false,
      onClick,
      className,
      ...props
    },
    ref
  ) => {
    const isCompact = variant === "compact";
    const isClickable = !!onClick;

    return (
      <div ref={ref} className={cn("group relative", className)} {...props}>
        {/* Active indicator dot */}
        {showActiveIndicator && active && (
          <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
        )}

        {/* Mobile layout */}
        {isMobile && (
          <div
            className={cn(
              "p-3 mx-3 my-1 rounded-lg bg-card border border-border/50 active:scale-[0.98] transition-all duration-150",
              selected && "bg-primary/5 border-primary/20",
              active && !selected && "border-green-500/30 bg-green-50/5 dark:bg-green-900/5",
              isClickable && "cursor-pointer"
            )}
            onClick={onClick}
          >
            <div className="flex items-center gap-2">
              {/* Leading */}
              {leading && <div className="flex-shrink-0">{leading}</div>}

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div
                  className={cn(
                    "font-medium truncate text-foreground",
                    isCompact ? "text-xs" : "text-xs"
                  )}
                >
                  {title}
                </div>
                {subtitle && <div className="flex items-center gap-1 mt-0.5">{subtitle}</div>}
              </div>

              {/* Trailing */}
              {trailing && <div className="flex-shrink-0">{trailing}</div>}

              {/* Actions (always visible on mobile) */}
              {actions && <div className="flex items-center gap-1 ml-1">{actions}</div>}
            </div>
          </div>
        )}

        {/* Desktop layout */}
        {!isMobile && (
          <>
            <div
              className={cn(
                "w-full p-2 rounded-md transition-colors duration-200",
                isClickable && "cursor-pointer hover:bg-accent/50",
                selected && "bg-blue-50 dark:bg-blue-900/30",
                !isClickable && !selected && "pointer-events-none"
              )}
              onClick={onClick}
            >
              <div className="flex items-start gap-2 min-w-0 w-full">
                {/* Leading */}
                {leading && <div className="flex-shrink-0 mt-0.5">{leading}</div>}

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div
                    className={cn(
                      "font-medium truncate text-foreground",
                      isCompact ? "text-xs" : "text-xs"
                    )}
                  >
                    {title}
                  </div>
                  {subtitle && <div className="flex items-center gap-1 mt-0.5">{subtitle}</div>}
                </div>

                {/* Trailing */}
                {trailing && <div className="flex-shrink-0 ml-auto">{trailing}</div>}
              </div>
            </div>

            {/* Desktop hover actions */}
            {actions && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                {actions}
              </div>
            )}
          </>
        )}
      </div>
    );
  }
);

ListItem.displayName = "ListItem";
