/**
 * useIsMobile - Hook to detect mobile viewport
 *
 * Uses matchMedia for efficient viewport detection with automatic updates.
 *
 * @example
 * ```tsx
 * const isMobile = useIsMobile(); // default 768px
 * const isMobile = useIsMobile(640); // custom breakpoint
 * ```
 */

import * as React from "react";

/**
 * Default mobile breakpoint (768px)
 */
export const MOBILE_BREAKPOINT = 768;

/**
 * Hook to detect if viewport is mobile-sized
 *
 * @param breakpoint - Width threshold in pixels (default: 768)
 * @returns true if viewport width is less than breakpoint
 */
export function useIsMobile(breakpoint: number = MOBILE_BREAKPOINT): boolean {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < breakpoint;
  });

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);

    // Set initial value
    setIsMobile(mediaQuery.matches);

    // Listen for changes
    const handleChange = () => {
      setIsMobile(mediaQuery.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [breakpoint]);

  return isMobile;
}
