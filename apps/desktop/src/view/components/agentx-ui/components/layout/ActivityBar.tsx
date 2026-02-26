import * as React from "react";
import { cn } from "@/components/agentx-ui/utils/utils";

export interface ActivityBarItem {
  /**
   * Unique identifier
   */
  id: string;
  /**
   * Icon element
   */
  icon: React.ReactNode;
  /**
   * Tooltip text
   */
  label: string;
  /**
   * Badge content (e.g., notification count)
   */
  badge?: string | number;
}

export interface ActivityBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Top activity bar items (main features)
   */
  items: ActivityBarItem[];
  /**
   * Bottom activity bar items (settings, account, etc.)
   */
  bottomItems?: ActivityBarItem[];
  /**
   * Currently active item ID
   */
  activeId?: string;
  /**
   * Callback when item is clicked
   */
  onItemClick?: (id: string) => void;
  /**
   * Position of the activity bar
   * @default 'left'
   */
  position?: "left" | "right";
}

/**
 * ActivityBar - VSCode-style activity bar with icon buttons
 *
 * A vertical bar with icon buttons, typically used for switching between
 * different views/panels. Inspired by VSCode's activity bar.
 *
 * @example
 * ```tsx
 * <ActivityBar
 *   items={[
 *     { id: 'explorer', icon: <FileIcon />, label: 'Explorer' },
 *     { id: 'search', icon: <SearchIcon />, label: 'Search' },
 *     { id: 'git', icon: <GitIcon />, label: 'Git', badge: 3 },
 *   ]}
 *   activeId="explorer"
 *   onItemClick={setActiveView}
 * />
 * ```
 */
export const ActivityBar: React.ForwardRefExoticComponent<
  ActivityBarProps & React.RefAttributes<HTMLDivElement>
> = React.forwardRef<HTMLDivElement, ActivityBarProps>(
  ({ items, bottomItems, activeId, onItemClick, position = "left", className, ...props }, ref) => {
    const renderItem = (item: ActivityBarItem) => {
      const isActive = item.id === activeId;

      return (
        <button
          key={item.id}
          type="button"
          onClick={() => onItemClick?.(item.id)}
          className={cn(
            "relative w-12 h-12 flex items-center justify-center",
            "text-muted-foreground hover:text-foreground",
            "transition-colors duration-200",
            "group",
            isActive && [
              "text-foreground",
              position === "left" ? "border-l-2 border-primary" : "border-r-2 border-primary",
            ]
          )}
          title={item.label}
          aria-label={item.label}
          aria-current={isActive ? "page" : undefined}
        >
          {/* Icon */}
          <div className="w-6 h-6 flex items-center justify-center">{item.icon}</div>

          {/* Badge */}
          {item.badge && (
            <span
              className={cn(
                "absolute top-1 right-1",
                "min-w-[16px] h-4 px-1",
                "flex items-center justify-center",
                "text-[10px] font-semibold",
                "bg-primary text-primary-foreground",
                "rounded-full"
              )}
            >
              {item.badge}
            </span>
          )}

          {/* Hover indicator */}
          <div
            className={cn(
              "absolute inset-0 bg-accent/0 group-hover:bg-accent/50",
              "transition-colors duration-200"
            )}
          />
        </button>
      );
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col bg-muted/30 border-border",
          position === "left" ? "border-r" : "border-l",
          className
        )}
        {...props}
      >
        {/* Top Activity Items */}
        <div className="flex-1 flex flex-col">{items.map(renderItem)}</div>

        {/* Bottom Activity Items */}
        {bottomItems && bottomItems.length > 0 && (
          <div className="flex flex-col border-t border-border">{bottomItems.map(renderItem)}</div>
        )}
      </div>
    );
  }
);

ActivityBar.displayName = "ActivityBar";
