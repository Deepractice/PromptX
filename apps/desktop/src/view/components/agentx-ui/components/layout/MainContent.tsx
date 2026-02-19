import * as React from "react";
import { cn } from "@/components/agentx-ui/utils/utils";

export interface MainContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Main content
   */
  children: React.ReactNode;
}

/**
 * MainContent - Main content area container
 *
 * A semantic container for the main content area with consistent styling.
 * This is where your primary content (chat, editor, dashboard) lives.
 *
 * @example
 * ```tsx
 * <MainContent>
 *   <ChatInterface />
 * </MainContent>
 * ```
 */
export const MainContent: React.ForwardRefExoticComponent<
  MainContentProps & React.RefAttributes<HTMLDivElement>
> = React.forwardRef<HTMLDivElement, MainContentProps>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("h-full w-full flex flex-col bg-background", className)}
      {...props}
    >
      {children}
    </div>
  );
});

MainContent.displayName = "MainContent";
