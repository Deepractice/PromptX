/**
 * ResponsiveStudio - Automatically switches between desktop and mobile layouts
 *
 * Uses container width (not viewport) to determine which layout to render:
 * - Desktop (>= breakpoint): Studio with sidebar
 * - Mobile (< breakpoint): MobileStudio with drawer
 *
 * @example
 * ```tsx
 * import { ResponsiveStudio, useAgentX } from "@agentxjs/ui";
 *
 * function App() {
 *   const agentx = useAgentX("ws://localhost:5200");
 *   return <ResponsiveStudio agentx={agentx} />;
 * }
 * ```
 */

import * as React from "react";
import type { AgentX } from "agentxjs";
import { Studio } from "./Studio";
import { MobileStudio } from "./MobileStudio";
import { MOBILE_BREAKPOINT } from "@/components/agentx-ui/hooks/useIsMobile";

export interface ResponsiveStudioProps {
  /**
   * AgentX instance
   */
  agentx: AgentX | null;
  /**
   * Container ID for user isolation
   * @default "default"
   */
  containerId?: string;
  /**
   * Breakpoint for mobile/desktop switch (based on container width)
   * @default 768
   */
  breakpoint?: number;
  /**
   * Desktop: Width of the sidebar
   * @default "15vw"
   */
  sidebarWidth?: number | string;
  /**
   * Desktop: Enable search in AgentList
   * @default true
   */
  searchable?: boolean;
  /**
   * Desktop: Input height ratio
   * @default 0.25
   */
  inputHeightRatio?: number;
  /**
   * Mobile: Input placeholder
   */
  placeholder?: string;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * ResponsiveStudio Component
 *
 * Automatically renders Studio or MobileStudio based on container width.
 * Uses ResizeObserver to detect the component's own width, not viewport width.
 */
export function ResponsiveStudio({
  agentx,
  containerId = "default",
  breakpoint = MOBILE_BREAKPOINT,
  sidebarWidth = "15vw",
  searchable = true,
  inputHeightRatio = 0.25,
  placeholder,
  className,
}: ResponsiveStudioProps): React.ReactElement {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Use window.ResizeObserver to avoid ESLint no-undef error
    const Observer = window.ResizeObserver;
    if (!Observer) {
      // Fallback for older browsers
      setIsMobile(container.offsetWidth < breakpoint);
      return;
    }

    const resizeObserver = new Observer((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        setIsMobile(width < breakpoint);
      }
    });

    resizeObserver.observe(container);

    // Initial check
    setIsMobile(container.offsetWidth < breakpoint);

    return () => {
      resizeObserver.disconnect();
    };
  }, [breakpoint]);

  return (
    <div ref={containerRef} className="h-full w-full">
      {isMobile ? (
        <MobileStudio
          agentx={agentx}
          containerId={containerId}
          searchable={searchable}
          placeholder={placeholder}
          className={className}
        />
      ) : (
        <Studio
          agentx={agentx}
          containerId={containerId}
          sidebarWidth={sidebarWidth}
          searchable={searchable}
          inputHeightRatio={inputHeightRatio}
          className={className}
        />
      )}
    </div>
  );
}
