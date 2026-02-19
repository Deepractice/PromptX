import * as React from "react";
import { cn } from "@/components/agentx-ui/utils/utils";

export interface AgentLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /**
   * Custom icon source URL. Defaults to "/icons/agent-ai-icon.svg"
   */
  src?: string;
}

/**
 * AgentLogo - Display the Agent AI logo
 *
 * Single Responsibility: Display a logo image with consistent sizing
 *
 * @example
 * ```tsx
 * <AgentLogo />
 * <AgentLogo className="w-8 h-8" />
 * <AgentLogo src="/custom-logo.svg" />
 * ```
 */
const AgentLogo: React.ForwardRefExoticComponent<
  AgentLogoProps & React.RefAttributes<HTMLImageElement>
> = React.forwardRef<HTMLImageElement, AgentLogoProps>(
  ({ className, src = "/icons/agent-ai-icon.svg", alt = "Agent", ...props }, ref) => {
    return <img ref={ref} src={src} alt={alt} className={cn("w-5 h-5", className)} {...props} />;
  }
);

AgentLogo.displayName = "AgentLogo";

export { AgentLogo };
