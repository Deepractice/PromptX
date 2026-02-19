/**
 * MobileHeader - Mobile header component
 *
 * A minimalist header following Claude App's design:
 * - Hamburger menu on left
 * - Title in center
 * - Optional action on right
 */

import * as React from "react";
import { Menu, Plus } from "lucide-react";
import { cn } from "@/components/agentx-ui/utils/utils";

export interface MobileHeaderProps {
  /**
   * Header title
   */
  title?: string;
  /**
   * Callback when menu button is clicked
   */
  onMenuClick?: () => void;
  /**
   * Callback when action button is clicked
   */
  onActionClick?: () => void;
  /**
   * Custom action icon
   */
  actionIcon?: React.ReactNode;
  /**
   * Whether to show action button
   */
  showAction?: boolean;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * MobileHeader Component
 *
 * A simple, minimalist header with hamburger menu and optional action.
 */
export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  onMenuClick,
  onActionClick,
  actionIcon,
  showAction = true,
  className,
}) => {
  return (
    <header
      className={cn(
        "flex items-center justify-between",
        "h-14 px-4",
        "bg-background border-b border-border",
        "shrink-0",
        className
      )}
    >
      {/* Left: Menu button */}
      <button
        type="button"
        onClick={onMenuClick}
        className={cn(
          "w-10 h-10 flex items-center justify-center",
          "rounded-full",
          "text-foreground",
          "hover:bg-muted active:bg-muted/80",
          "transition-colors"
        )}
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Center: Title */}
      {title && (
        <h1 className="text-base font-medium text-foreground truncate max-w-[50%]">{title}</h1>
      )}

      {/* Right: Action button */}
      {showAction ? (
        <button
          type="button"
          onClick={onActionClick}
          className={cn(
            "w-10 h-10 flex items-center justify-center",
            "rounded-full",
            "text-foreground",
            "hover:bg-muted active:bg-muted/80",
            "transition-colors"
          )}
          aria-label="New conversation"
        >
          {actionIcon || <Plus className="w-5 h-5" />}
        </button>
      ) : (
        <div className="w-10 h-10" /> // Spacer for alignment
      )}
    </header>
  );
};

MobileHeader.displayName = "MobileHeader";
