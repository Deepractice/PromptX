import * as React from "react";
import { cn } from "@/components/agentx-ui/utils/utils";

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Initial height in pixels
   * @default 200
   */
  height?: number;
  /**
   * Minimum height in pixels
   * @default 100
   */
  minHeight?: number;
  /**
   * Maximum height in pixels
   * @default 500
   */
  maxHeight?: number;
  /**
   * Panel content
   */
  children: React.ReactNode;
}

/**
 * Panel - Resizable bottom panel container
 *
 * A container for bottom panel content (terminal, output, logs, etc.)
 * with consistent styling. Should be used with Allotment (vertical)
 * for resizing functionality.
 *
 * @example
 * ```tsx
 * <Allotment vertical>
 *   <Allotment.Pane>
 *     <MainContent />
 *   </Allotment.Pane>
 *   <Allotment.Pane minSize={100} maxSize={500} preferredSize={200}>
 *     <Panel>
 *       <Terminal />
 *     </Panel>
 *   </Allotment.Pane>
 * </Allotment>
 * ```
 */
export const Panel: React.ForwardRefExoticComponent<
  PanelProps & React.RefAttributes<HTMLDivElement>
> = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ height = 200, minHeight = 100, maxHeight = 500, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("w-full flex flex-col", "bg-muted/30 border-t border-border", className)}
        style={{
          height: `${height}px`,
          minHeight: `${minHeight}px`,
          maxHeight: `${maxHeight}px`,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Panel.displayName = "Panel";
