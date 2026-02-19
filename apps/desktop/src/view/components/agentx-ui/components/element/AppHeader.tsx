import * as React from "react";
import { cn } from "@/components/agentx-ui/utils/utils";

export interface AppHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Logo element (icon or image)
   */
  logo?: React.ReactNode;
  /**
   * Application title
   */
  title: string;
  /**
   * Subtitle or description (optional)
   */
  subtitle?: string;
  /**
   * Additional actions on the right side
   */
  actions?: React.ReactNode;
  /**
   * Whether to show border at bottom
   * @default true
   */
  showBorder?: boolean;
  /**
   * Whether in mobile mode (compact layout)
   * @default false
   */
  isMobile?: boolean;
  /**
   * Whether running as PWA (adds safe area padding)
   * @default false
   */
  isPWA?: boolean;
}

/**
 * AppHeader - Application header with logo, title, and actions
 *
 * A flexible header component for application layouts. Supports logos,
 * titles, subtitles, and action buttons. Automatically adapts to mobile
 * and PWA environments.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <AppHeader
 *   logo={<MessageSquare className="w-4 h-4" />}
 *   title="Deepractice Agent"
 * />
 *
 * // With subtitle
 * <AppHeader
 *   logo={<Bot className="w-4 h-4" />}
 *   title="AI Assistant"
 *   subtitle="Powered by Claude"
 * />
 *
 * // With actions
 * <AppHeader
 *   logo={<Logo />}
 *   title="My App"
 *   actions={
 *     <Button variant="ghost" size="sm">
 *       <Settings className="w-4 h-4" />
 *     </Button>
 *   }
 * />
 *
 * // Mobile mode
 * <AppHeader
 *   logo={<MessageSquare />}
 *   title="Agent"
 *   isMobile
 * />
 *
 * // PWA with safe area
 * <AppHeader
 *   logo={<Logo />}
 *   title="App"
 *   isPWA
 *   isMobile
 * />
 * ```
 */
export const AppHeader: React.ForwardRefExoticComponent<
  AppHeaderProps & React.RefAttributes<HTMLDivElement>
> = React.forwardRef<HTMLDivElement, AppHeaderProps>(
  (
    {
      logo,
      title,
      subtitle,
      actions,
      showBorder = true,
      isMobile = false,
      isPWA = false,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "p-4",
          showBorder && "border-b border-border",
          isMobile && "md:hidden p-3",
          !isMobile && "hidden md:block",
          className
        )}
        style={isPWA && isMobile ? { paddingTop: "16px" } : undefined}
        {...props}
      >
        <div className="flex items-center justify-between">
          {/* Logo + Title */}
          <div className="flex items-center gap-3">
            {logo && (
              <div
                className={cn(
                  "bg-primary rounded-lg flex items-center justify-center text-primary-foreground",
                  isMobile ? "w-8 h-8" : "w-8 h-8 shadow-sm"
                )}
              >
                {logo}
              </div>
            )}
            <div>
              <h1
                className={cn(
                  "font-bold text-foreground",
                  isMobile ? "text-lg font-semibold" : "text-lg"
                )}
              >
                {title}
              </h1>
              {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
            </div>
          </div>

          {/* Actions */}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    );
  }
);

AppHeader.displayName = "AppHeader";
