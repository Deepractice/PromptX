/**
 * NavBar - Icon navigation bar component
 *
 * A simplified wrapper around ActivityBar for common navigation patterns.
 * Pure UI component with no business logic.
 *
 * @example
 * ```tsx
 * <NavBar
 *   items={[
 *     { id: 'chat', icon: <MessageSquare />, label: 'Chat' },
 *     { id: 'settings', icon: <Settings />, label: 'Settings' },
 *   ]}
 *   activeId="chat"
 *   onSelect={(id) => setActiveId(id)}
 * />
 * ```
 */

import * as React from "react";
import { cn } from "@/components/agentx-ui/utils/utils";
import { ActivityBar, type ActivityBarItem } from "@/components/agentx-ui/components/layout/ActivityBar";

/**
 * Item data for NavBar
 */
export interface NavBarItem {
  /**
   * Unique identifier
   */
  id: string;
  /**
   * Icon element
   */
  icon: React.ReactNode;
  /**
   * Tooltip label
   */
  label: string;
  /**
   * Optional badge (notification count, etc.)
   */
  badge?: string | number;
}

export interface NavBarProps {
  /**
   * Main navigation items (top section)
   */
  items: NavBarItem[];
  /**
   * Bottom navigation items (settings, account, etc.)
   */
  bottomItems?: NavBarItem[];
  /**
   * Currently active item ID
   */
  activeId?: string;
  /**
   * Callback when an item is selected
   */
  onSelect?: (id: string) => void;
  /**
   * Position of the nav bar
   * @default 'left'
   */
  position?: "left" | "right";
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * NavBar component
 */
export const NavBar: React.ForwardRefExoticComponent<
  NavBarProps & React.RefAttributes<HTMLDivElement>
> = React.forwardRef<HTMLDivElement, NavBarProps>(
  ({ items, bottomItems, activeId, onSelect, position = "left", className }, ref) => {
    // Convert NavBarItem to ActivityBarItem (they're compatible)
    const activityItems: ActivityBarItem[] = items;
    const activityBottomItems: ActivityBarItem[] | undefined = bottomItems;

    return (
      <ActivityBar
        ref={ref}
        items={activityItems}
        bottomItems={activityBottomItems}
        activeId={activeId}
        onItemClick={onSelect}
        position={position}
        className={cn(className)}
      />
    );
  }
);

NavBar.displayName = "NavBar";
