import * as React from "react";
import { cn } from "@/components/agentx-ui/utils/utils";
import { Button, buttonVariants } from "@/components/agentx-ui/components/ui";
import type { VariantProps } from "class-variance-authority";

export interface ActionBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Children (ActionBar.Primary, ActionBar.Icon, ActionBar.Group)
   */
  children: React.ReactNode;
}

export interface ActionBarPrimaryProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /**
   * Button content
   */
  children: React.ReactNode;
  /**
   * Show loading state
   */
  loading?: boolean;
}

export interface ActionBarIconProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /**
   * Icon element
   */
  children: React.ReactNode;
  /**
   * Show loading state
   */
  loading?: boolean;
}

export interface ActionBarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Group children
   */
  children: React.ReactNode;
}

/**
 * ActionBar - Compound component for action button layouts
 *
 * A flexible container for action buttons with pre-configured layouts.
 * Supports primary buttons, icon buttons, and grouping.
 *
 * @example
 * ```tsx
 * // Basic action bar
 * <ActionBar>
 *   <ActionBar.Primary onClick={handleNew}>
 *     <Plus className="w-4 h-4 mr-2" />
 *     New Session
 *   </ActionBar.Primary>
 *   <ActionBar.Icon onClick={handleRefresh}>
 *     <RefreshCw className="w-4 h-4" />
 *   </ActionBar.Icon>
 * </ActionBar>
 *
 * // With loading state
 * <ActionBar>
 *   <ActionBar.Primary loading={isCreating}>
 *     New Session
 *   </ActionBar.Primary>
 *   <ActionBar.Icon loading={isRefreshing}>
 *     <RefreshCw />
 *   </ActionBar.Icon>
 * </ActionBar>
 *
 * // Multiple groups
 * <ActionBar>
 *   <ActionBar.Group>
 *     <ActionBar.Primary>New</ActionBar.Primary>
 *     <ActionBar.Icon><RefreshCw /></ActionBar.Icon>
 *   </ActionBar.Group>
 *   <ActionBar.Group>
 *     <ActionBar.Icon><Settings /></ActionBar.Icon>
 *   </ActionBar.Group>
 * </ActionBar>
 * ```
 */
const ActionBarRoot: React.ForwardRefExoticComponent<
  ActionBarProps & React.RefAttributes<HTMLDivElement>
> = React.forwardRef<HTMLDivElement, ActionBarProps>(({ children, className, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("flex gap-2", className)} {...props}>
      {children}
    </div>
  );
});

ActionBarRoot.displayName = "ActionBar";

/**
 * ActionBar.Primary - Primary action button (takes flex-1)
 */
const ActionBarPrimary: React.ForwardRefExoticComponent<
  ActionBarPrimaryProps & React.RefAttributes<HTMLButtonElement>
> = React.forwardRef<HTMLButtonElement, ActionBarPrimaryProps>(
  (
    { children, loading = false, variant = "default", size = "sm", className, disabled, ...props },
    ref
  ) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn("flex-1 h-8 text-xs transition-all duration-200", className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <div className="w-3.5 h-3.5 mr-1.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Loading...
          </>
        ) : (
          children
        )}
      </Button>
    );
  }
);

ActionBarPrimary.displayName = "ActionBar.Primary";

/**
 * ActionBar.Icon - Icon-only action button (square)
 */
const ActionBarIcon: React.ForwardRefExoticComponent<
  ActionBarIconProps & React.RefAttributes<HTMLButtonElement>
> = React.forwardRef<HTMLButtonElement, ActionBarIconProps>(
  (
    { children, loading = false, variant = "outline", size = "sm", className, disabled, ...props },
    ref
  ) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn("h-8 w-8 px-0 transition-colors duration-200 group", className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <div className="w-3.5 h-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          children
        )}
      </Button>
    );
  }
);

ActionBarIcon.displayName = "ActionBar.Icon";

/**
 * ActionBar.Group - Group buttons together
 */
const ActionBarGroup: React.ForwardRefExoticComponent<
  ActionBarGroupProps & React.RefAttributes<HTMLDivElement>
> = React.forwardRef<HTMLDivElement, ActionBarGroupProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("flex gap-2", className)} {...props}>
        {children}
      </div>
    );
  }
);

ActionBarGroup.displayName = "ActionBar.Group";

/**
 * ActionBar compound component type
 */
type ActionBarComponent = React.ForwardRefExoticComponent<
  ActionBarProps & React.RefAttributes<HTMLDivElement>
> & {
  Primary: typeof ActionBarPrimary;
  Icon: typeof ActionBarIcon;
  Group: typeof ActionBarGroup;
};

/**
 * Compound component export
 */
export const ActionBar: ActionBarComponent = Object.assign(ActionBarRoot, {
  Primary: ActionBarPrimary,
  Icon: ActionBarIcon,
  Group: ActionBarGroup,
});
