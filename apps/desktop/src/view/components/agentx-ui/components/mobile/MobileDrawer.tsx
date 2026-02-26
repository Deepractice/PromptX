/**
 * MobileDrawer - Mobile drawer component using vaul
 *
 * A slide-out drawer for mobile navigation, following Claude App's minimalist design.
 * Supports swipe gestures and provides smooth animations.
 *
 * Note: Uses a local portal container to ensure correct z-index stacking
 * regardless of host application's DOM structure.
 */

import * as React from "react";
import { Drawer } from "vaul";
import { cn } from "@/components/agentx-ui/utils/utils";

export interface MobileDrawerProps {
  /**
   * Whether the drawer is open
   */
  open: boolean;
  /**
   * Callback when drawer open state changes
   */
  onOpenChange: (open: boolean) => void;
  /**
   * Drawer content
   */
  children: React.ReactNode;
  /**
   * Additional class name for drawer content
   */
  className?: string;
  /**
   * Container element for the portal. If not provided, uses internal container.
   */
  container?: HTMLElement | null;
}

/**
 * MobileDrawer Component
 *
 * A left-side drawer for mobile navigation using vaul library.
 * Provides gesture support and smooth animations.
 *
 * Uses a local portal container to avoid z-index conflicts with host applications.
 */
export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  open,
  onOpenChange,
  children,
  className,
  container,
}) => {
  const [portalContainer, setPortalContainer] = React.useState<HTMLElement | null>(null);

  return (
    <>
      {/* Local portal container - ensures drawer renders within component hierarchy */}
      <div
        ref={setPortalContainer}
        className="mobile-drawer-portal"
        style={{ position: "fixed", inset: 0, zIndex: 9999, pointerEvents: open ? "auto" : "none" }}
      />
      <Drawer.Root open={open} onOpenChange={onOpenChange} direction="left" handleOnly={false}>
        <Drawer.Portal container={container ?? portalContainer}>
          <Drawer.Overlay className="fixed inset-0 bg-black/40" />
          <Drawer.Content
            className={cn(
              "fixed left-0 top-0 bottom-0",
              "w-[280px] bg-background",
              "flex flex-col",
              "outline-none",
              className
            )}
            style={{ backgroundColor: "hsl(var(--background))" }}
          >
            {children}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
};

MobileDrawer.displayName = "MobileDrawer";
