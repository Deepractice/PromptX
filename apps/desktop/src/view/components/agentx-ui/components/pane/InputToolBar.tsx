/**
 * InputToolBar - Toolbar buttons for input area
 *
 * A pure UI component for displaying toolbar buttons above or below
 * an input area. Supports icon buttons, toggles, and dropdowns.
 *
 * @example
 * ```tsx
 * <InputToolBar
 *   items={[
 *     { id: 'attach', icon: <Paperclip />, label: 'Attach file' },
 *     { id: 'emoji', icon: <Smile />, label: 'Add emoji' },
 *   ]}
 *   onItemClick={(id) => handleAction(id)}
 * />
 * ```
 */

import * as React from "react";
import { cn } from "@/components/agentx-ui/utils/utils";

/**
 * Toolbar item data
 */
export interface ToolBarItem {
  /**
   * Unique identifier
   */
  id: string;
  /**
   * Icon element
   */
  icon: React.ReactNode;
  /**
   * Tooltip label
   */
  label: string;
  /**
   * Whether the item is currently active/toggled
   */
  active?: boolean;
  /**
   * Whether the item is disabled
   */
  disabled?: boolean;
  /**
   * Visual variant
   */
  variant?: "default" | "primary" | "danger";
}

export interface InputToolBarProps {
  /**
   * Toolbar items to display
   */
  items: ToolBarItem[];
  /**
   * Items to display on the right side
   */
  rightItems?: ToolBarItem[];
  /**
   * Callback when an item is clicked
   */
  onItemClick?: (id: string) => void;
  /**
   * Size of the toolbar buttons
   * @default 'sm'
   */
  size?: "xs" | "sm" | "md";
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Single toolbar button
 */
const ToolBarButton = ({
  item,
  size,
  onClick,
}: {
  item: ToolBarItem;
  size: "xs" | "sm" | "md";
  onClick?: () => void;
}) => {
  const sizeClasses = {
    xs: "w-6 h-6",
    sm: "w-7 h-7",
    md: "w-8 h-8",
  };

  const iconSizeClasses = {
    xs: "[&>svg]:w-3 [&>svg]:h-3",
    sm: "[&>svg]:w-3.5 [&>svg]:h-3.5",
    md: "[&>svg]:w-4 [&>svg]:h-4",
  };

  const variantClasses = {
    default: cn(
      "text-muted-foreground hover:text-foreground hover:bg-accent",
      item.active && "text-foreground bg-accent"
    ),
    primary: cn(
      "text-primary hover:text-primary hover:bg-primary/10",
      item.active && "bg-primary/10"
    ),
    danger: cn(
      "text-destructive hover:text-destructive hover:bg-destructive/10",
      item.active && "bg-destructive/10"
    ),
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={item.disabled}
      title={item.label}
      className={cn(
        "rounded flex items-center justify-center transition-colors",
        sizeClasses[size],
        iconSizeClasses[size],
        variantClasses[item.variant || "default"],
        item.disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {item.icon}
    </button>
  );
};

/**
 * InputToolBar component
 */
export const InputToolBar: React.ForwardRefExoticComponent<
  InputToolBarProps & React.RefAttributes<HTMLDivElement>
> = React.forwardRef<HTMLDivElement, InputToolBarProps>(
  ({ items, rightItems, onItemClick, size = "sm", className }, ref) => {
    return (
      <div ref={ref} className={cn("flex items-center justify-between px-2 py-1", className)}>
        {/* Left items */}
        <div className="flex items-center gap-0.5">
          {items.map((item) => (
            <ToolBarButton
              key={item.id}
              item={item}
              size={size}
              onClick={() => onItemClick?.(item.id)}
            />
          ))}
        </div>

        {/* Right items */}
        {rightItems && rightItems.length > 0 && (
          <div className="flex items-center gap-0.5">
            {rightItems.map((item) => (
              <ToolBarButton
                key={item.id}
                item={item}
                size={size}
                onClick={() => onItemClick?.(item.id)}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
);

InputToolBar.displayName = "InputToolBar";
