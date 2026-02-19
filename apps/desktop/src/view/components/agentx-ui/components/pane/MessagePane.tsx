/**
 * MessagePane - Pure UI scrollable container for messages
 *
 * A pure UI component that provides:
 * - Scrollable container with auto-scroll
 * - Empty state display
 * - Flexible content (accepts any React children)
 *
 * This component knows NOTHING about:
 * - Message types or structure
 * - Business logic
 * - Rendering logic for specific message types
 *
 * It's purely a layout/container component.
 *
 * @example
 * ```tsx
 * <MessagePane>
 *   {messages.map(msg => (
 *     msg.role === 'assistant' ? (
 *       <AssistantMessage
 *         key={msg.id}
 *         message={msg}
 *         status={msg.metadata?.status}
 *         streamingText={streaming}
 *       />
 *     ) : (
 *       <MessageRenderer key={msg.id} message={msg} />
 *     )
 *   ))}
 * </MessagePane>
 * ```
 */

import * as React from "react";
import { MessageSquare } from "lucide-react";
import { EmptyState } from "@/components/agentx-ui/components/element/EmptyState";
import { cn } from "@/components/agentx-ui/utils/utils";

export interface MessagePaneProps {
  /**
   * Content to display (messages, indicators, etc.)
   */
  children?: React.ReactNode;
  /**
   * Empty state configuration
   * Shows when children is empty
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
 * MessagePane Component
 *
 * Pure UI container with auto-scroll functionality.
 */
export const MessagePane: React.ForwardRefExoticComponent<
  MessagePaneProps & React.RefAttributes<HTMLDivElement>
> = React.forwardRef<HTMLDivElement, MessagePaneProps>(
  (
    {
      children,
      emptyState = {
        icon: <MessageSquare className="w-6 h-6" />,
        title: "No messages yet",
        description: "Start the conversation by sending a message",
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
      <div ref={ref} className={cn("flex flex-col h-full bg-background", className)}>
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-2">
          {isEmpty ? (
            <div className="h-full flex items-center justify-center">
              <EmptyState
                icon={emptyState.icon}
                title={emptyState.title}
                description={emptyState.description}
              />
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    );
  }
);

MessagePane.displayName = "MessagePane";
