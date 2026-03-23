import * as React from "react";
import { useState, useCallback, useRef } from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  FileCode,
  FileImage,
  File,
  Trash2,
  Loader2,
} from "lucide-react";
import { cn } from "@/components/agentx-ui/utils";
import type { DirEntryItem } from "./explorerTypes";

export interface WsFileDragPayload {
  path: string;
  name: string;
  isImage: boolean;
}

const IMAGE_EXTS = new Set([
  "jpg", "jpeg", "png", "gif", "bmp", "webp", "ico", "svg",
]);

const DRAG_THRESHOLD = 5;

interface FileTreeNodeProps {
  entry: DirEntryItem;
  depth: number;
  isExpanded: boolean;
  isSelected: boolean;
  children?: DirEntryItem[];
  childrenLoading: boolean;
  onToggle: (path: string) => void;
  onSelect: (path: string) => void;
  onLoadChildren: (path: string) => void;
  onDelete?: (path: string) => void;
  expandedPaths: Record<string, boolean>;
  dirCache: Record<string, DirEntryItem[]>;
}

const FILE_ICON_MAP: Record<string, React.ReactNode> = {
  ts: <FileCode className="w-4 h-4 text-blue-500" />,
  tsx: <FileCode className="w-4 h-4 text-blue-500" />,
  js: <FileCode className="w-4 h-4 text-yellow-500" />,
  jsx: <FileCode className="w-4 h-4 text-yellow-500" />,
  py: <FileCode className="w-4 h-4 text-green-500" />,
  rs: <FileCode className="w-4 h-4 text-orange-500" />,
  json: <FileCode className="w-4 h-4 text-amber-500" />,
  md: <FileText className="w-4 h-4 text-gray-500" />,
  txt: <FileText className="w-4 h-4 text-gray-500" />,
  png: <FileImage className="w-4 h-4 text-purple-500" />,
  jpg: <FileImage className="w-4 h-4 text-purple-500" />,
  jpeg: <FileImage className="w-4 h-4 text-purple-500" />,
  svg: <FileImage className="w-4 h-4 text-purple-500" />,
  css: <FileCode className="w-4 h-4 text-pink-500" />,
  scss: <FileCode className="w-4 h-4 text-pink-500" />,
  html: <FileCode className="w-4 h-4 text-orange-500" />,
  vue: <FileCode className="w-4 h-4 text-emerald-500" />,
};

function getFileIcon(name: string): React.ReactNode {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  return FILE_ICON_MAP[ext] || <File className="w-4 h-4 text-muted-foreground" />;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const FileTreeNode = React.memo(function FileTreeNode({
  entry,
  depth,
  isExpanded,
  isSelected,
  childrenLoading,
  onToggle,
  onSelect,
  onLoadChildren,
  onDelete,
  expandedPaths,
  dirCache,
}: FileTreeNodeProps) {
  const [hovering, setHovering] = useState(false);
  const dragStateRef = useRef<{
    startX: number;
    startY: number;
    active: boolean;
    payload: WsFileDragPayload;
  } | null>(null);

  const handleClick = useCallback(() => {
    if (dragStateRef.current?.active) return;
    if (entry.is_dir) {
      onToggle(entry.path);
      if (!isExpanded && !dirCache[entry.path]) {
        onLoadChildren(entry.path);
      }
    } else {
      onSelect(entry.path);
    }
  }, [entry.path, entry.is_dir, isExpanded, dirCache, onToggle, onSelect, onLoadChildren]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (entry.is_dir || e.button !== 0) return;

    const ext = entry.name.split(".").pop()?.toLowerCase() || "";
    const isImage = IMAGE_EXTS.has(ext);
    dragStateRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      active: false,
      payload: { path: entry.path, name: entry.name, isImage },
    };

    const onMove = (ev: MouseEvent) => {
      const state = dragStateRef.current;
      if (!state) return;
      const dx = ev.clientX - state.startX;
      const dy = ev.clientY - state.startY;
      if (!state.active && Math.sqrt(dx * dx + dy * dy) >= DRAG_THRESHOLD) {
        state.active = true;
        document.dispatchEvent(new CustomEvent("ws-file-drag-start", { detail: state.payload }));
      }
      if (state.active) {
        document.dispatchEvent(new CustomEvent("ws-file-drag-move", { detail: { x: ev.clientX, y: ev.clientY } }));
      }
    };

    const onUp = (ev: MouseEvent) => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      const state = dragStateRef.current;
      if (state?.active) {
        document.dispatchEvent(new CustomEvent("ws-file-drag-drop", {
          detail: { ...state.payload, x: ev.clientX, y: ev.clientY },
        }));
      }
      dragStateRef.current = null;
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [entry.path, entry.name, entry.is_dir]);

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete?.(entry.path);
    },
    [entry.path, onDelete]
  );

  const children = dirCache[entry.path] || [];

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-1 px-2 py-1 cursor-pointer rounded-md text-sm transition-colors group select-none",
          isSelected
            ? "bg-primary/10 text-primary"
            : "text-foreground hover:bg-muted/60"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {entry.is_dir ? (
          <>
            <span className="shrink-0 w-4 h-4 flex items-center justify-center text-muted-foreground">
              {childrenLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </span>
            <span className="shrink-0">
              {isExpanded ? (
                <FolderOpen className="w-4 h-4 text-amber-500" />
              ) : (
                <Folder className="w-4 h-4 text-amber-500" />
              )}
            </span>
          </>
        ) : (
          <>
            <span className="shrink-0 w-4 h-4" />
            <span className="shrink-0">{getFileIcon(entry.name)}</span>
          </>
        )}
        <span className="truncate flex-1 ml-1">{entry.name}</span>
        {!entry.is_dir && entry.size > 0 && (
          <span className="text-[10px] text-muted-foreground shrink-0 mr-1">
            {formatSize(entry.size)}
          </span>
        )}
        {hovering && onDelete && (
          <button
            onClick={handleDelete}
            className="shrink-0 p-0.5 rounded hover:bg-destructive/10 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
            title="删除"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>

      {entry.is_dir && isExpanded && (
        <div>
          {children.map((child) => (
            <FileTreeNode
              key={child.path}
              entry={child}
              depth={depth + 1}
              isExpanded={!!expandedPaths[child.path]}
              isSelected={false}
              childrenLoading={false}
              onToggle={onToggle}
              onSelect={onSelect}
              onLoadChildren={onLoadChildren}
              onDelete={onDelete}
              expandedPaths={expandedPaths}
              dirCache={dirCache}
            />
          ))}
          {children.length === 0 && !childrenLoading && (
            <div
              className="text-xs text-muted-foreground py-1 italic"
              style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
            >
              空目录
            </div>
          )}
        </div>
      )}
    </>
  );
});

interface FileTreeProps {
  entries: DirEntryItem[];
  expandedPaths: Record<string, boolean>;
  selectedPath: string | null;
  dirCache: Record<string, DirEntryItem[]>;
  loadingPaths: Set<string>;
  onToggle: (path: string) => void;
  onSelect: (path: string) => void;
  onLoadChildren: (path: string) => void;
  onDelete?: (path: string) => void;
  rootDepth?: number;
}

export function FileTree({
  entries,
  expandedPaths,
  selectedPath,
  dirCache,
  loadingPaths,
  onToggle,
  onSelect,
  onLoadChildren,
  onDelete,
  rootDepth = 0,
}: FileTreeProps) {
  return (
    <div className="py-1">
      {entries.map((entry) => (
        <FileTreeNode
          key={entry.path}
          entry={entry}
          depth={rootDepth}
          isExpanded={!!expandedPaths[entry.path]}
          isSelected={selectedPath === entry.path}
          childrenLoading={loadingPaths.has(entry.path)}
          onToggle={onToggle}
          onSelect={onSelect}
          onLoadChildren={onLoadChildren}
          onDelete={onDelete}
          expandedPaths={expandedPaths}
          dirCache={dirCache}
        />
      ))}
    </div>
  );
}
