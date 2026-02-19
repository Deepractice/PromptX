import * as React from "react";
import { cn } from "@/components/agentx-ui/utils/utils";

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Main title text
   */
  title: string;
  /**
   * Optional subtitle/description
   */
  subtitle?: string;
  /**
   * Optional leading element (e.g., menu button, back button)
   */
  leading?: React.ReactNode;
  /**
   * Optional trailing element (e.g., actions, tabs)
   */
  trailing?: React.ReactNode;
  /**
   * Whether to show border at bottom
   * @default true
   */
  showBorder?: boolean;
  /**
   * Whether in mobile mode (compact spacing)
   * @default false
   */
  isMobile?: boolean;
}

/**
 * PageHeader - Flexible page header with title and actions
 *
 * A generic header component for page layouts. Supports leading elements
 * (menu buttons, back buttons), title/subtitle, and trailing elements
 * (actions, tabs, buttons). Automatically handles mobile responsive layout.
 *
 * @example
 * ```tsx
 * // Basic header with title
 * <PageHeader title="New Session" />
 *
 * // With subtitle
 * <PageHeader
 *   title="Dashboard"
 *   subtitle="Welcome back!"
 * />
 *
 * // With mobile menu button
 * <PageHeader
 *   title="Settings"
 *   leading={
 *     <Button variant="ghost" size="icon">
 *       <Menu className="w-5 h-5" />
 *     </Button>
 *   }
 *   isMobile
 * />
 *
 * // With tab navigation
 * <PageHeader
 *   title="Project Explorer"
 *   trailing={
 *     <TabNavigation
 *       tabs={tabs}
 *       activeTab={activeTab}
 *       onTabChange={setActiveTab}
 *     />
 *   }
 * />
 *
 * // Complete example with all props
 * <PageHeader
 *   title="Agent Conversation"
 *   subtitle="deepractice-ai/project"
 *   leading={<MenuButton onClick={toggleSidebar} />}
 *   trailing={
 *     <TabNavigation
 *       tabs={[
 *         { id: 'chat', label: 'Chat', icon: <MessageSquare /> },
 *         { id: 'shell', label: 'Shell', icon: <Terminal /> },
 *       ]}
 *       activeTab="chat"
 *       onTabChange={setTab}
 *     />
 *   }
 *   isMobile
 * />
 * ```
 */
export const PageHeader: React.ForwardRefExoticComponent<
  PageHeaderProps & React.RefAttributes<HTMLDivElement>
> = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  (
    {
      title,
      subtitle,
      leading,
      trailing,
      showBorder = true,
      isMobile = false,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex-shrink-0",
          showBorder && "border-b border-border",
          isMobile ? "p-3" : "p-4",
          "bg-card",
          className
        )}
        {...props}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Left Side: Leading + Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {/* Leading Element (e.g., menu button) */}
            {leading && <div className="flex-shrink-0">{leading}</div>}

            {/* Title + Subtitle */}
            <div className="min-w-0 flex-1">
              <h1
                className={cn(
                  "font-semibold text-foreground truncate",
                  isMobile ? "text-base" : "text-base sm:text-lg"
                )}
              >
                {title}
              </h1>
              {subtitle && (
                <p
                  className={cn(
                    "text-xs text-muted-foreground truncate",
                    isMobile ? "mt-0" : "mt-0.5"
                  )}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right Side: Trailing Element (e.g., tabs, actions) */}
          {trailing && <div className="flex-shrink-0 hidden sm:block">{trailing}</div>}
        </div>
      </div>
    );
  }
);

PageHeader.displayName = "PageHeader";
