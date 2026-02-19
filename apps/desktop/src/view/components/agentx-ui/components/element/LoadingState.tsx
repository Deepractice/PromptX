import * as React from "react";
import { cn } from "@/components/agentx-ui/utils/utils";

export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Icon or spinner element to display
   */
  icon?: React.ReactNode;
  /**
   * Title text
   */
  title?: string;
  /**
   * Description text
   */
  description?: string;
  /**
   * Vertical spacing size
   */
  spacing?: "sm" | "md" | "lg";
  /**
   * Show default spinner if no icon provided
   */
  showSpinner?: boolean;
}

/**
 * LoadingState - Display loading state with spinner, title, and description
 *
 * A flexible component for showing loading states in lists, tables, pages, etc.
 * Automatically shows a spinner unless a custom icon is provided.
 *
 * @example
 * ```tsx
 * // Basic loading state
 * <LoadingState
 *   title="Loading sessions..."
 *   description="Fetching your Agent sessions"
 * />
 *
 * // Minimal loading state
 * <LoadingState title="Loading..." spacing="sm" />
 *
 * // Custom icon
 * <LoadingState
 *   icon={<RefreshCw className="w-6 h-6 animate-spin" />}
 *   title="Refreshing data..."
 * />
 *
 * // Spinner only (no text)
 * <LoadingState showSpinner />
 * ```
 */
export const LoadingState: React.ForwardRefExoticComponent<
  LoadingStateProps & React.RefAttributes<HTMLDivElement>
> = React.forwardRef<HTMLDivElement, LoadingStateProps>(
  ({ icon, title, description, spacing = "md", showSpinner = true, className, ...props }, ref) => {
    const spacingClasses = {
      sm: "py-8",
      md: "py-12",
      lg: "py-16",
    };

    const iconSpacingClasses = {
      sm: "mb-3",
      md: "mb-4",
      lg: "mb-6",
    };

    const titleSpacingClasses = {
      sm: "mb-1",
      md: "mb-2",
      lg: "mb-3",
    };

    const spinnerSizes = {
      sm: "w-5 h-5",
      md: "w-6 h-6",
      lg: "w-8 h-8",
    };

    const renderIcon = () => {
      if (icon) {
        return icon;
      }
      if (showSpinner) {
        return (
          <div
            className={cn(
              "animate-spin rounded-full border-2 border-muted-foreground border-t-transparent",
              spinnerSizes[spacing]
            )}
          />
        );
      }
      return null;
    };

    const iconElement = renderIcon();

    return (
      <div
        ref={ref}
        className={cn("text-center px-4", spacingClasses[spacing], className)}
        {...props}
      >
        {iconElement && (
          <div
            className={cn(
              "w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto",
              iconSpacingClasses[spacing]
            )}
          >
            {iconElement}
          </div>
        )}
        {title && (
          <h3 className={cn("text-base font-medium text-foreground", titleSpacingClasses[spacing])}>
            {title}
          </h3>
        )}
        {description && (
          <p className="text-sm text-muted-foreground max-w-md mx-auto">{description}</p>
        )}
      </div>
    );
  }
);

LoadingState.displayName = "LoadingState";
