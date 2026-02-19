import * as React from "react";
import { cn } from "@/components/agentx-ui/utils/utils";

export interface StatusBarItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Optional icon
   */
  icon?: React.ReactNode;
  /**
   * Item content
   */
  children: React.ReactNode;
  /**
   * Whether the item is clickable
   */
  clickable?: boolean;
}

/**
 * StatusBarItem - Individual item in the status bar
 */
export const StatusBarItem: React.ForwardRefExoticComponent<
  StatusBarItemProps & React.RefAttributes<HTMLDivElement>
> = React.forwardRef<HTMLDivElement, StatusBarItemProps>(
  ({ icon, children, clickable = false, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-1.5 px-2 py-0.5 text-xs",
          clickable && "hover:bg-accent cursor-pointer rounded",
          className
        )}
        {...props}
      >
        {icon && <span className="flex items-center">{icon}</span>}
        <span>{children}</span>
      </div>
    );
  }
);

StatusBarItem.displayName = "StatusBarItem";

export interface StatusBarSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Alignment of items in this section
   * @default 'left'
   */
  align?: "left" | "center" | "right";
  /**
   * Section content
   */
  children: React.ReactNode;
}

/**
 * StatusBarSection - Group of items in the status bar
 */
export const StatusBarSection: React.ForwardRefExoticComponent<
  StatusBarSectionProps & React.RefAttributes<HTMLDivElement>
> = React.forwardRef<HTMLDivElement, StatusBarSectionProps>(
  ({ align = "left", children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-1",
          align === "left" && "justify-start",
          align === "center" && "justify-center flex-1",
          align === "right" && "justify-end",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

StatusBarSection.displayName = "StatusBarSection";

export interface StatusBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Status bar height in pixels
   * @default 24
   */
  height?: number;
  /**
   * Status bar content
   */
  children: React.ReactNode;
}

/**
 * StatusBar - VSCode-style bottom status bar
 *
 * A fixed-height status bar that displays global application state.
 * Use StatusBarSection to organize items with different alignments.
 *
 * @example
 * ```tsx
 * <StatusBar>
 *   <StatusBarSection align="left">
 *     <StatusBarItem icon={<GitBranch />}>main</StatusBarItem>
 *     <StatusBarItem icon={<AlertCircle />}>0 errors</StatusBarItem>
 *   </StatusBarSection>
 *   <StatusBarSection align="right">
 *     <StatusBarItem>Line 42, Col 8</StatusBarItem>
 *     <StatusBarItem>UTF-8</StatusBarItem>
 *   </StatusBarSection>
 * </StatusBar>
 * ```
 */
export const StatusBar: React.ForwardRefExoticComponent<
  StatusBarProps & React.RefAttributes<HTMLDivElement>
> = React.forwardRef<HTMLDivElement, StatusBarProps>(
  ({ height = 24, children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "w-full flex items-center",
          "bg-primary text-primary-foreground",
          "px-2",
          className
        )}
        style={{
          height: `${height}px`,
          minHeight: `${height}px`,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

StatusBar.displayName = "StatusBar";
