/**
 * AssistantMessage - Assistant message component with 4-state lifecycle
 *
 * States:
 * - queued: Waiting to start processing
 * - thinking: AI is thinking (extended thinking block)
 * - responding: AI is streaming response
 * - completed: Message is complete
 */

import * as React from "react";
import { MessageAvatar } from "./MessageAvatar";
import { MessageContent } from "./MessageContent";
import { cn } from "@/components/agentx-ui/utils/utils";

export type AssistantMessageStatus = "queued" | "thinking" | "responding" | "completed";

export interface AssistantMessageProps {
  /**
   * Message status (lifecycle state)
   */
  status: AssistantMessageStatus;
  /**
   * Message content (for completed status)
   */
  content?: string;
  /**
   * Streaming text (for responding status)
   */
  streaming?: string;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * AssistantMessage Component
 *
 * Single component handling all 4 lifecycle states
 */
export const AssistantMessage: React.FC<AssistantMessageProps> = ({
  status,
  content = "",
  streaming = "",
  className,
}) => {
  const [dots, setDots] = React.useState("");

  // Animated dots for queued/thinking states
  React.useEffect(() => {
    if (status === "queued" || status === "thinking") {
      const interval = setInterval(() => {
        setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [status]);

  const renderContent = () => {
    switch (status) {
      case "queued":
        return <span className="text-muted-foreground">Queued{dots}</span>;

      case "thinking":
        return <span className="text-muted-foreground">Thinking{dots}</span>;

      case "responding":
        return (
          <>
            <MessageContent content={streaming} />
            <span className="inline-block w-2 h-4 bg-foreground/50 animate-pulse ml-0.5 align-middle" />
          </>
        );

      case "completed":
        return <MessageContent content={content} />;

      default:
        return null;
    }
  };

  return (
    <div className={cn("flex gap-3 py-2", className)}>
      <MessageAvatar role="assistant" />
      <div className="rounded-lg px-4 py-2 bg-muted">
        <div className="text-sm">{renderContent()}</div>
      </div>
    </div>
  );
};
