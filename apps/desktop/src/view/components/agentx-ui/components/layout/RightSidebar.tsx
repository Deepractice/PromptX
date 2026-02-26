import * as React from "react";
import { cn } from "@/components/agentx-ui/utils/utils";

export interface RightSidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Initial width in pixels
   * @default 300
   */
  width?: number;
  /**
   * Minimum width in pixels
   * @default 200
   */
  minWidth?: number;
  /**
   * Maximum width in pixels
   * @default 600
   */
  maxWidth?: number;
  /**
   * Sidebar content
   */
  children: React.ReactNode;
}

/**
 * RightSidebar - Resizable right sidebar container
 *
 * A container for right sidebar content (outline, properties, preview, etc.)
 * with consistent styling. Should be used with Allotment for resizing functionality.
 *
 * @example
 * ```tsx
 * <Allotment>
 *   <Allotment.Pane>
 *     <MainContent />
 *   </Allotment.Pane>
 *   <Allotment.Pane minSize={200} maxSize={600} preferredSize={300}>
 *     <RightSidebar>
 *       <Outline />
 *     </RightSidebar>
 *   </Allotment.Pane>
 * </Allotment>
 * ```
 */
export const RightSidebar: React.ForwardRefExoticComponent<
  RightSidebarProps & React.RefAttributes<HTMLDivElement>
> = React.forwardRef<HTMLDivElement, RightSidebarProps>(
  ({ width = 300, minWidth = 200, maxWidth = 600, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("h-full flex flex-col", "bg-muted/30 border-l border-border", className)}
        style={{
          width: `${width}px`,
          minWidth: `${minWidth}px`,
          maxWidth: `${maxWidth}px`,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

RightSidebar.displayName = "RightSidebar";
