/**
 * TextBlock - Text content block component
 *
 * Displays text content with markdown support.
 * Shows streaming cursor when status is "streaming".
 *
 * @example
 * ```tsx
 * <TextBlock
 *   block={{
 *     type: "text",
 *     id: "text_123",
 *     content: "Hello, world!",
 *     timestamp: Date.now(),
 *     status: "completed",
 *   }}
 * />
 *
 * // Streaming with external text
 * <TextBlock
 *   block={{
 *     type: "text",
 *     id: "text_123",
 *     content: "",
 *     timestamp: Date.now(),
 *     status: "streaming",
 *   }}
 *   streamingText="I'm typing..."
 * />
 * ```
 */

import { MessageContent } from "@/components/agentx-ui/components/message/MessageContent";
import { cn } from "@/components/agentx-ui/utils/utils";
import type { TextBlockData } from "../types";

export interface TextBlockProps {
  /**
   * Text block data
   */
  block: TextBlockData;
  /**
   * Streaming text (for streaming status)
   * When provided and block.status is "streaming", shows this instead of block.content
   */
  streamingText?: string;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * TextBlock component
 */
export function TextBlock({
  block,
  streamingText,
  className,
}: TextBlockProps): React.ReactElement | null {
  // Use streamingText if provided and block is streaming, otherwise use block.content
  const displayContent =
    block.status === "streaming" && streamingText !== undefined ? streamingText : block.content;

  // Don't render if no content
  if (!displayContent && block.status === "completed") {
    return null;
  }

  return (
    <div className={cn("rounded-lg px-4 py-2 bg-muted inline-block max-w-full", className)}>
      <div className="text-sm">
        {displayContent ? (
          <>
            <MessageContent content={displayContent} />
            {block.status === "streaming" && (
              <span className="inline-block w-2 h-4 bg-foreground/50 animate-pulse ml-0.5 align-middle" />
            )}
          </>
        ) : (
          // Empty streaming block - just show cursor
          block.status === "streaming" && (
            <span className="inline-block w-2 h-4 bg-foreground/50 animate-pulse align-middle" />
          )
        )}
      </div>
    </div>
  );
}

export default TextBlock;
