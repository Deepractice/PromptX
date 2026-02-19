import * as React from "react";
import { cn } from "@/components/agentx-ui/utils/utils";

export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Position of the sidebar
   * @default 'left'
   */
  position?: "left" | "right";
  /**
   * Sidebar content
   */
  children: React.ReactNode;
}

/**
 * Sidebar - Sidebar container
 *
 * A container for sidebar content with consistent styling.
 * Should be used with Allotment for resizing functionality.
 * Width is controlled by Allotment.Pane, not by this component.
 *
 * @example
 * ```tsx
 * <Allotment>
 *   <Allotment.Pane minSize={200} maxSize={600} preferredSize={256}>
 *     <Sidebar>
 *       <SessionList sessions={sessions} />
 *     </Sidebar>
 *   </Allotment.Pane>
 *   <Allotment.Pane>
 *     <MainContent />
 *   </Allotment.Pane>
 * </Allotment>
 * ```
 */
export const Sidebar: React.ForwardRefExoticComponent<
  SidebarProps & React.RefAttributes<HTMLDivElement>
> = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ position = "left", className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "h-full w-full flex flex-col",
          "bg-muted/30 border-border",
          position === "left" ? "border-r" : "border-l",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Sidebar.displayName = "Sidebar";
