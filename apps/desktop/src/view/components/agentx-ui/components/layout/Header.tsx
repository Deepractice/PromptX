import * as React from "react";
import { cn } from "@/components/agentx-ui/utils/utils";

export interface HeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Left section content (e.g., logo, title)
   */
  left?: React.ReactNode;
  /**
   * Center section content (e.g., search bar, tabs)
   */
  center?: React.ReactNode;
  /**
   * Right section content (e.g., user menu, notifications)
   */
  right?: React.ReactNode;
  /**
   * Header height in pixels
   * @default 56
   */
  height?: number;
}

/**
 * Header - Application-level top header bar
 *
 * A fixed-height header that spans the entire width of the application.
 * Use this for global navigation, branding, search, and user controls.
 *
 * @example
 * ```tsx
 * <Header
 *   left={<Logo />}
 *   center={<SearchBar />}
 *   right={<UserMenu />}
 * />
 * ```
 */
export const Header: React.ForwardRefExoticComponent<
  HeaderProps & React.RefAttributes<HTMLDivElement>
> = React.forwardRef<HTMLDivElement, HeaderProps>(
  ({ left, center, right, height = 56, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "w-full flex items-center",
          "bg-background border-b border-border",
          "px-4",
          className
        )}
        style={{
          height: `${height}px`,
          minHeight: `${height}px`,
        }}
        {...props}
      >
        {/* Left Section */}
        {left && <div className="flex items-center gap-3 flex-shrink-0">{left}</div>}

        {/* Center Section */}
        {center && <div className="flex-1 flex items-center justify-center px-4">{center}</div>}

        {/* Right Section */}
        {right && <div className="flex items-center gap-3 flex-shrink-0">{right}</div>}

        {/* Fallback: render children if no sections specified */}
        {!left && !center && !right && children}
      </div>
    );
  }
);

Header.displayName = "Header";
