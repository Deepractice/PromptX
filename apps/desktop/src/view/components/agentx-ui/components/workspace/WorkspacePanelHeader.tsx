import { X } from "lucide-react";
import { cn } from "@/components/agentx-ui/utils";
import type { WorkspacePanelPlugin } from "./types";

interface WorkspacePanelHeaderProps {
  plugins: WorkspacePanelPlugin[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  onClose: () => void;
}

export function WorkspacePanelHeader({
  plugins,
  activeTabId,
  onTabChange,
  onClose,
}: WorkspacePanelHeaderProps) {
  return (
    <div className="flex items-center justify-between w-full h-14 px-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0 z-10 select-none">
      <div className="flex items-center gap-1.5 h-full overflow-x-auto no-scrollbar flex-1 min-w-0 pr-2">
        {plugins.map((plugin) => {
          const isActive = plugin.id === activeTabId;
          return (
            <button
              key={plugin.id}
              onClick={() => onTabChange(plugin.id)}
              className={cn(
                "group relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0",
                isActive
                  ? "bg-secondary text-secondary-foreground shadow-sm ring-1 ring-border/50"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              <span className={cn(
                "shrink-0 transition-colors [&>svg]:w-4 [&>svg]:h-4",
                isActive ? "text-primary" : "text-muted-foreground/70 group-hover:text-foreground"
              )}>
                {plugin.icon}
              </span>
              <span className="whitespace-nowrap">{plugin.label}</span>
              {plugin.badge != null && plugin.badge > 0 && (
                <span className={cn(
                  "ml-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ring-1 ring-inset transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground ring-primary"
                    : "bg-muted text-muted-foreground ring-border group-hover:bg-background group-hover:ring-muted-foreground/30"
                )}>
                  {plugin.badge > 99 ? '99+' : plugin.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center pl-2 border-l border-border/50 ml-1 shrink-0">
        <button
          onClick={onClose}
          className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          title="关闭面板"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
