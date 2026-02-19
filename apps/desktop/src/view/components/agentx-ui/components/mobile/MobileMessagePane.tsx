/**
 * MobileMessagePane - Mobile message display area
 *
 * A scrollable container for messages following Claude App's design:
 * - Large whitespace
 * - Hidden scrollbar
 * - Clean empty state
 */

import * as React from "react";
import { MessageSquare } from "lucide-react";
import { cn } from "@/components/agentx-ui/utils/utils";

export interface MobileMessagePaneProps {
  /**
   * Message content (children)
   */
  children?: React.ReactNode;
  /**
   * Empty state configuration
   */
  emptyState?: {
    icon?: React.ReactNode;
    title: string;
    description?: string;
  };
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * MobileMessagePane Component
 *
 * A mobile-optimized message container with auto-scroll and hidden scrollbar.
 */
export const MobileMessagePane: React.ForwardRefExoticComponent<
  MobileMessagePaneProps & React.RefAttributes<HTMLDivElement>
> = React.forwardRef<HTMLDivElement, MobileMessagePaneProps>(
  (
    {
      children,
      emptyState = {
        icon: <MessageSquare className="w-8 h-8 text-muted-foreground/50" />,
        title: "Start a conversation",
        description: "Send a message to begin",
      },
      className,
    },
    ref
  ) => {
    const scrollRef = React.useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when children change
    React.useEffect(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, [children]);

    // Check if empty
    const isEmpty =
      !children ||
      React.Children.count(children) === 0 ||
      (React.isValidElement(children) &&
        children.type === React.Fragment &&
        !children.props.children);

    return (
      <div ref={ref} className={cn("flex flex-col flex-1 min-h-0", className)}>
        <div
          ref={scrollRef}
          className={cn(
            "flex-1 overflow-y-auto",
            "px-4 py-4",
            // Hide scrollbar but keep functionality
            "scrollbar-none",
            "[&::-webkit-scrollbar]:hidden",
            "[-ms-overflow-style:none]",
            "[scrollbar-width:none]"
          )}
        >
          {isEmpty ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-8">
              <div className="mb-4">{emptyState.icon}</div>
              <h2 className="text-lg font-medium text-foreground mb-2">{emptyState.title}</h2>
              {emptyState.description && (
                <p className="text-sm text-muted-foreground">{emptyState.description}</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">{children}</div>
          )}
        </div>
      </div>
    );
  }
);

MobileMessagePane.displayName = "MobileMessagePane";
