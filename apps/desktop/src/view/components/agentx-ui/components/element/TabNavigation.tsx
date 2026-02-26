import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/components/agentx-ui/utils/utils";

const tabNavigationVariants = cva("inline-flex items-center justify-center rounded-lg p-1", {
  variants: {
    variant: {
      pills: "bg-muted",
      underline: "border-b border-border bg-transparent p-0",
    },
  },
  defaultVariants: {
    variant: "pills",
  },
});

const tabButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        pills: "",
        underline: "rounded-none border-b-2 border-transparent",
      },
      active: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      // Pills variant styles
      {
        variant: "pills",
        active: true,
        className: "bg-background text-foreground shadow-sm",
      },
      {
        variant: "pills",
        active: false,
        className: "text-muted-foreground hover:text-foreground hover:bg-background/50",
      },
      // Underline variant styles
      {
        variant: "underline",
        active: true,
        className: "border-primary text-foreground",
      },
      {
        variant: "underline",
        active: false,
        className: "text-muted-foreground hover:text-foreground hover:border-border",
      },
    ],
    defaultVariants: {
      variant: "pills",
      active: false,
    },
  }
);

export interface Tab {
  /**
   * Unique identifier for the tab
   */
  id: string;
  /**
   * Tab label text
   */
  label: string;
  /**
   * Optional icon element
   */
  icon?: React.ReactNode;
  /**
   * Whether the tab is disabled
   */
  disabled?: boolean;
}

export interface TabNavigationProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, "onChange">,
    VariantProps<typeof tabNavigationVariants> {
  /**
   * Array of tab items
   */
  tabs: Tab[];
  /**
   * Currently active tab ID
   */
  activeTab: string;
  /**
   * Callback when tab is changed
   */
  onTabChange: (tabId: string) => void;
  /**
   * Whether to show icons only on mobile
   * @default false
   */
  iconOnlyMobile?: boolean;
}

/**
 * TabNavigation - Flexible tab navigation component
 *
 * A versatile tab navigation that supports both pills and underline styles.
 * Can display tabs with icons, labels, or both. Automatically handles active
 * states and keyboard navigation.
 *
 * @example
 * ```tsx
 * // Pills variant (default)
 * <TabNavigation
 *   tabs={[
 *     { id: 'chat', label: 'Chat', icon: <MessageSquare /> },
 *     { id: 'shell', label: 'Shell', icon: <Terminal /> },
 *     { id: 'files', label: 'Files', icon: <Folder /> },
 *   ]}
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 * />
 *
 * // Underline variant
 * <TabNavigation
 *   variant="underline"
 *   tabs={tabs}
 *   activeTab={current}
 *   onTabChange={setCurrent}
 * />
 *
 * // Icon only on mobile
 * <TabNavigation
 *   tabs={tabs}
 *   activeTab={active}
 *   onTabChange={onChange}
 *   iconOnlyMobile
 * />
 *
 * // With disabled tabs
 * <TabNavigation
 *   tabs={[
 *     { id: 'tab1', label: 'Enabled' },
 *     { id: 'tab2', label: 'Disabled', disabled: true },
 *   ]}
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 * />
 * ```
 */
export const TabNavigation: React.ForwardRefExoticComponent<
  TabNavigationProps & React.RefAttributes<HTMLDivElement>
> = React.forwardRef<HTMLDivElement, TabNavigationProps>(
  (
    {
      tabs,
      activeTab,
      onTabChange,
      variant = "pills",
      iconOnlyMobile = false,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        role="tablist"
        className={cn(tabNavigationVariants({ variant }), className)}
        {...props}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              disabled={tab.disabled}
              onClick={() => !tab.disabled && onTabChange(tab.id)}
              className={cn(tabButtonVariants({ variant, active: isActive }))}
            >
              {tab.icon && (
                <span className="flex items-center justify-center w-4 h-4">{tab.icon}</span>
              )}
              {tab.label && (
                <span className={cn(tab.icon && "ml-1.5", iconOnlyMobile && "hidden sm:inline")}>
                  {tab.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }
);

TabNavigation.displayName = "TabNavigation";
