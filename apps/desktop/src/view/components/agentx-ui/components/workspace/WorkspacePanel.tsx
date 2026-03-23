import * as React from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/components/agentx-ui/utils";
import { WorkspacePanelHeader } from "./WorkspacePanelHeader";
import type { WorkspacePanelProps } from "./types";

const DEFAULT_WIDTH = 420;
const MIN_WIDTH = 360;
const MAX_WIDTH = 600;

/**
 * WorkspacePanel — 通用右侧面板外壳
 *
 * 提供：拖拽宽度调整、tab 栏切换、打开/关闭
 * 不包含任何业务逻辑。
 */
export function WorkspacePanel({
  isOpen,
  onClose,
  plugins,
  activeTabId,
  onTabChange,
  defaultWidth = DEFAULT_WIDTH,
  minWidth = MIN_WIDTH,
  maxWidth = MAX_WIDTH,
}: WorkspacePanelProps) {
  const [panelWidth, setPanelWidth] = React.useState(defaultWidth);
  const isDraggingRef = React.useRef(false);
  const startXRef = React.useRef(0);
  const startWidthRef = React.useRef(defaultWidth);

  // 拖拽事件
  const handleDragStart = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = panelWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [panelWidth]);

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const delta = startXRef.current - e.clientX;
      const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidthRef.current + delta));
      setPanelWidth(newWidth);
    };
    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [minWidth, maxWidth]);

  if (!isOpen) return null;

  const visiblePlugins = plugins.filter((p) => p.visible !== false);
  const activePlugin = visiblePlugins.find((p) => p.id === activeTabId);

  return (
    <div
      className="h-full flex flex-col bg-background border-l border-border relative shrink-0"
      style={{ width: panelWidth, minWidth, maxWidth }}
    >
      {/* 左侧拖拽手柄 */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-10 group"
        onMouseDown={handleDragStart}
      >
        <div className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2",
          "w-4 h-8 flex items-center justify-center",
          "opacity-0 group-hover:opacity-100 transition-opacity"
        )}>
          <GripVertical className="w-3 h-3 text-muted-foreground" />
        </div>
      </div>

      {/* Tab 栏 */}
      <WorkspacePanelHeader
        plugins={visiblePlugins}
        activeTabId={activeTabId}
        onTabChange={onTabChange}
        onClose={onClose}
      />

      {/* 面板内容 */}
      <div className="flex-1 flex flex-col min-h-0">
        {activePlugin && (
          <activePlugin.component isActive onClose={onClose} />
        )}
      </div>
    </div>
  );
}
