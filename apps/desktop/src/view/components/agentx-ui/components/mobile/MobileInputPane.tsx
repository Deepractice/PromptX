/**
 * MobileInputPane - Mobile input area
 *
 * A minimalist input area following Claude App's design:
 * - Rounded corners
 * - Clean appearance
 * - Mobile keyboard handling
 */

import * as React from "react";
import { Send, Square } from "lucide-react";
import { cn } from "@/components/agentx-ui/utils/utils";

export interface MobileInputPaneProps {
  /**
   * Callback when user sends a message
   */
  onSend?: (text: string) => void;
  /**
   * Callback when stop button is clicked
   */
  onStop?: () => void;
  /**
   * Whether the input is disabled
   */
  disabled?: boolean;
  /**
   * Whether currently loading
   */
  isLoading?: boolean;
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * MobileInputPane Component
 *
 * A mobile-optimized input area with clean, minimal design.
 */
export const MobileInputPane: React.ForwardRefExoticComponent<
  MobileInputPaneProps & React.RefAttributes<HTMLDivElement>
> = React.forwardRef<HTMLDivElement, MobileInputPaneProps>(
  (
    { onSend, onStop, disabled = false, isLoading = false, placeholder = "Message...", className },
    ref
  ) => {
    const [text, setText] = React.useState("");
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    // Handle mobile keyboard (visual viewport API)
    React.useEffect(() => {
      if (typeof window === "undefined" || !window.visualViewport) return;

      const viewport = window.visualViewport;

      const handleResize = () => {
        // When keyboard opens, scroll input into view
        if (document.activeElement === textareaRef.current) {
          textareaRef.current?.scrollIntoView({ block: "center" });
        }
      };

      viewport.addEventListener("resize", handleResize);
      return () => viewport.removeEventListener("resize", handleResize);
    }, []);

    const handleSend = () => {
      if (!text.trim() || disabled || isLoading) return;
      onSend?.(text.trim());
      setText("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Enter to send, Shift+Enter for new line
      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        handleSend();
      }
    };

    const canSend = text.trim().length > 0 && !disabled && !isLoading;

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-end gap-2",
          "px-4 pt-3",
          // Safe area bottom padding for iOS/Android
          "pb-[calc(env(safe-area-inset-bottom,0px)+12px)]",
          // Floating card effect with top shadow
          "bg-background/95 backdrop-blur-sm",
          "shadow-[0_-4px_12px_rgba(0,0,0,0.08)]",
          "border-t border-border/50",
          "shrink-0",
          className
        )}
      >
        {/* Input container */}
        <div
          className={cn(
            "flex-1 flex items-end",
            "bg-card rounded-2xl",
            "border border-input",
            "shadow-sm",
            "overflow-hidden"
          )}
        >
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
              "flex-1 resize-none bg-transparent",
              "px-4 py-3 text-base",
              "placeholder:text-muted-foreground",
              "focus:outline-none",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "max-h-32 overflow-y-auto",
              // Hide scrollbar
              "scrollbar-none",
              "[&::-webkit-scrollbar]:hidden"
            )}
            style={{
              // Auto-resize height
              height: "auto",
              minHeight: "44px",
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
            }}
          />
        </div>

        {/* Send/Stop button */}
        {isLoading && onStop ? (
          <button
            type="button"
            onClick={onStop}
            className={cn(
              "w-11 h-11 flex items-center justify-center",
              "rounded-full shrink-0",
              "bg-destructive text-destructive-foreground",
              "active:scale-95 transition-transform"
            )}
            aria-label="Stop"
          >
            <Square className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className={cn(
              "w-11 h-11 flex items-center justify-center",
              "rounded-full shrink-0",
              "bg-primary text-primary-foreground",
              "active:scale-95 transition-transform",
              "disabled:opacity-40 disabled:cursor-not-allowed"
            )}
            aria-label="Send"
          >
            <Send className="w-5 h-5" />
          </button>
        )}
      </div>
    );
  }
);

MobileInputPane.displayName = "MobileInputPane";
