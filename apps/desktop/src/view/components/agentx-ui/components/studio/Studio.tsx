/**
 * Studio - Complete chat workspace
 *
 * Top-level component that provides a ready-to-use chat interface.
 * Combines AgentList and Chat with coordinated state management.
 *
 * In the Image-First model:
 * - Image is the persistent conversation entity
 * - Agent is auto-activated on first message
 * - Messages are auto-saved (no manual save needed)
 *
 * Layout (WeChat style):
 * ```
 * ┌──────────────┬─────────────────────────────────────┐
 * │              │                                     │
 * │  AgentList   │              Chat                   │
 * │  (sidebar)   │                                     │
 * │              │  ┌─────────────────────────────────┐│
 * │  [Images]    │  │      MessagePane                ││
 * │  🟢 Online   │  └─────────────────────────────────┘│
 * │  ⚫ Offline  │  ┌─────────────────────────────────┐│
 * │  [+ New]     │  │      InputPane                  ││
 * │              │  └─────────────────────────────────┘│
 * └──────────────┴─────────────────────────────────────┘
 * ```
 *
 * @example
 * ```tsx
 * import { Studio, useAgentX } from "@agentxjs/ui";
 *
 * function App() {
 *   const agentx = useAgentX("ws://localhost:5200");
 *   return <Studio agentx={agentx} />;
 * }
 * ```
 */

import * as React from "react";
import type { AgentX } from "agentxjs";
import { ChevronsRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AgentList } from "@/components/agentx-ui/components/container/AgentList";
import { Chat } from "@/components/agentx-ui/components/container/Chat";
import { ToastContainer, useToast } from "@/components/agentx-ui/components/element/Toast";
import { useImages } from "@/components/agentx-ui/hooks";
import { cn } from "@/components/agentx-ui/utils";

export interface StudioProps {
  /**
   * AgentX instance
   */
  agentx: AgentX | null;
  /**
   * Container ID for user isolation
   * Each user should have their own container to isolate their conversations
   * @default "default"
   */
  containerId?: string;
  /**
   * Width of the sidebar (AgentList)
   * @default "15vw"
   */
  sidebarWidth?: number | string;
  /**
   * Enable sidebar collapse functionality
   * @default true
   */
  collapsible?: boolean;
  /**
   * Enable search in AgentList
   * @default true
   */
  searchable?: boolean;
  /**
   * Show save button in Chat (not needed in Image-First model)
   * @default false
   */
  showSaveButton?: boolean;
  /**
   * Input height ratio for Chat
   * @default 0.25
   */
  inputHeightRatio?: number;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Studio component
 */
export function Studio({
  agentx,
  containerId = "default",
  sidebarWidth = "15vw",
  collapsible = true,
  searchable = true,
  showSaveButton = false, // Default to false in Image-First model
  inputHeightRatio = 0.25,
  className,
}: StudioProps): React.ReactElement {
  const { t } = useTranslation();
  // State - only track imageId now (agentId is managed by useAgent)
  const [currentImageId, setCurrentImageId] = React.useState<string | null>(null);
  const [currentImageName, setCurrentImageName] = React.useState<string | undefined>(undefined);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  // Toast state
  const { toasts, showToast, dismissToast } = useToast();

  // Handle sidebar collapse toggle
  const handleCollapse = React.useCallback(() => {
    setSidebarCollapsed(true);
  }, []);

  const handleExpand = React.useCallback(() => {
    setSidebarCollapsed(false);
  }, []);

  // Images hook - pass containerId for user isolation
  const { images } = useImages(agentx, { containerId, autoLoad: true });

  // Handle selecting a conversation
  const handleSelect = React.useCallback(
    (imageId: string, _agentId: string | null) => {
      setCurrentImageId(imageId);

      // Set name from image
      const image = images.find((img) => img.imageId === imageId);
      setCurrentImageName(image?.name || t("agentxUI.conversations.untitled"));
    },
    [images, t]
  );

  // Handle creating a new conversation
  const handleNew = React.useCallback((imageId: string) => {
    setCurrentImageId(imageId);
    setCurrentImageName(t("agentxUI.conversations.new"));
  }, [t]);

  // Listen to agentx system_error events
  React.useEffect(() => {
    if (!agentx) return;

    // Subscribe to system_error events
    const unsubscribe = agentx.on("system_error", (event) => {
      const errorData = event.data as {
        message: string;
        severity?: "info" | "warn" | "error" | "fatal";
      };
      showToast(errorData.message, errorData.severity || "error");
    });

    return () => {
      unsubscribe();
    };
  }, [agentx, showToast]);

  return (
    <div className={cn("flex h-full bg-background", className)}>
      {/* Sidebar - AgentList or Collapsed Button */}
      {sidebarCollapsed ? (
        /* Collapsed state - show expand button */
        <div
          style={{ width: 40, minWidth: 40 }}
          className="flex-shrink-0 border-r border-border bg-muted/30"
        >
          <button
            className="w-10 h-10 flex items-center justify-center hover:bg-accent transition-colors"
            onClick={handleExpand}
            title={t("agentxUI.sidebar.expand")}
          >
            <ChevronsRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      ) : (
        /* Expanded state - show AgentList */
        <div
          style={{ width: sidebarWidth, maxWidth: 250 }}
          className="flex-shrink-0 border-r border-border transition-all duration-200"
        >
          <AgentList
            agentx={agentx}
            containerId={containerId}
            selectedId={currentImageId}
            onSelect={handleSelect}
            onNew={handleNew}
            searchable={searchable}
            showCollapseButton={collapsible}
            onCollapse={handleCollapse}
          />
        </div>
      )}

      {/* Main area - Chat */}
      <div className="flex-1 min-w-0">
        <Chat
          key={currentImageId || "empty"}
          agentx={agentx}
          imageId={currentImageId}
          agentName={currentImageName}
          showSaveButton={showSaveButton}
          inputHeightRatio={inputHeightRatio}
        />
      </div>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} position="top-right" />
    </div>
  );
}
