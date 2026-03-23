import * as React from "react";
import { useState, useCallback, useMemo, useRef } from "react";
import {
  FolderPlus,
  FolderMinus,
  X,
  RefreshCw,
  FilePlus,
  Eye,
  Folder,
  File,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/components/agentx-ui/utils";
import { FileTree } from "./FileTree";
import type { WorkspaceExplorerPanelProps } from "./explorerTypes";

/**
 * WorkspaceExplorerPanel — 纯 UI 组件
 *
 * 提供：工作区文件夹列表、文件树浏览、文件预览
 * 不包含业务逻辑（Electron IPC 等在 adapter 层处理）
 */
export function WorkspaceExplorerPanel({
  folders,
  expandedPaths,
  selectedPath,
  isLoading,
  dirCache,
  onAddFolder,
  onRemoveFolder,
  onToggleExpanded,
  onSelectPath,
  onLoadDir,
  onReadFile,
  onReadFileBase64,
  onCreateFile,
  onDeleteItem,
}: WorkspaceExplorerPanelProps) {
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewPath, setPreviewPath] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<FileCategory>("text");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [loadingPaths, setLoadingPaths] = useState<Set<string>>(new Set());
  const [showNewFileInput, setShowNewFileInput] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState("");

  const blobUrlRef = useRef<string | null>(null);
  const previewCacheRef = useRef<Map<string, { type: FileCategory; content: string }>>(new Map());

  const revokePreviousBlobUrl = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, []);

  // Cleanup blob URLs on unmount
  React.useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      previewCacheRef.current.clear();
    };
  }, []);

  const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "bmp", "webp", "ico"]);
  const OTHER_BINARY_EXTS = new Set([
    "mp4", "avi", "mov", "mkv", "wmv", "flv", "webm",
    "mp3", "wav", "flac", "aac", "ogg", "wma",
    "zip", "rar", "7z", "tar", "gz", "bz2", "xz",
    "exe", "dll", "so", "dylib", "bin",
    "woff", "woff2", "ttf", "otf", "eot",
    "db", "sqlite", "sqlite3",
    "psd", "ai", "sketch", "fig",
    "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "svg",
  ]);

  type FileCategory = "text" | "image" | "binary";

  const getFileCategory = useCallback((filePath: string): FileCategory => {
    const ext = filePath.split(".").pop()?.toLowerCase() || "";
    if (IMAGE_EXTS.has(ext)) return "image";
    if (OTHER_BINARY_EXTS.has(ext)) return "binary";
    return "text";
  }, []);

  const handleLoadChildren = useCallback(
    async (path: string) => {
      setLoadingPaths((prev) => new Set(prev).add(path));
      try {
        await onLoadDir(path);
      } finally {
        setLoadingPaths((prev) => {
          const next = new Set(prev);
          next.delete(path);
          return next;
        });
      }
    },
    [onLoadDir]
  );

  const handleSelect = useCallback(
    async (path: string) => {
      onSelectPath(path);
      const category = getFileCategory(path);
      setPreviewType(category);
      setPreviewPath(path);
      setPreviewError(null);

      const cached = previewCacheRef.current.get(path);
      if (cached) {
        setPreviewContent(cached.content);
        setPreviewType(cached.type);
        setPreviewLoading(false);
        return;
      }

      revokePreviousBlobUrl();
      setPreviewLoading(true);

      try {
        if (category === "image") {
          const base64 = await onReadFileBase64(path);
          const res = await fetch(`data:application/octet-stream;base64,${base64}`);
          const buffer = await res.arrayBuffer();
          const ext = path.split(".").pop()?.toLowerCase() || "png";
          const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg"
            : ext === "gif" ? "image/gif"
            : ext === "webp" ? "image/webp"
            : ext === "bmp" ? "image/bmp"
            : ext === "ico" ? "image/x-icon"
            : "image/png";
          const blob = new Blob([buffer], { type: mime });
          const url = URL.createObjectURL(blob);
          blobUrlRef.current = url;
          setPreviewContent(url);
        } else if (category === "text") {
          const content = await onReadFile(path);
          setPreviewContent(content);
          previewCacheRef.current.set(path, { type: category, content });
        } else {
          setPreviewContent(null);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setPreviewError(msg);
        setPreviewContent(null);
      } finally {
        setPreviewLoading(false);
      }
    },
    [onSelectPath, onReadFile, onReadFileBase64, getFileCategory, revokePreviousBlobUrl]
  );

  const invalidateCache = useCallback((path: string) => {
    previewCacheRef.current.delete(path);
  }, []);

  const handleDelete = useCallback(
    async (path: string) => {
      try {
        await onDeleteItem(path);
        invalidateCache(path);
        if (previewPath === path) {
          setPreviewContent(null);
          setPreviewPath(null);
        }
        const parentPath = path.replace(/[/\\][^/\\]+$/, "");
        if (parentPath) {
          await onLoadDir(parentPath);
        }
      } catch (e) {
        console.error("[WorkspaceExplorer] Delete failed:", e);
      }
    },
    [onDeleteItem, onLoadDir, previewPath, invalidateCache]
  );

  const handleCreateFile = useCallback(
    async (dirPath: string) => {
      if (!newFileName.trim()) return;
      try {
        await onCreateFile(dirPath, newFileName.trim(), "");
        setShowNewFileInput(null);
        setNewFileName("");
        await onLoadDir(dirPath);
      } catch (e) {
        console.error("[WorkspaceExplorer] Create file failed:", e);
      }
    },
    [newFileName, onCreateFile, onLoadDir]
  );

  const closePreview = useCallback(() => {
    revokePreviousBlobUrl();
    setPreviewContent(null);
    setPreviewPath(null);
    setPreviewError(null);
    onSelectPath(null);
  }, [onSelectPath, revokePreviousBlobUrl]);

  const previewFileName = useMemo(
    () => previewPath?.split(/[/\\]/).pop() || "",
    [previewPath]
  );

  // 空状态
  if (folders.length === 0) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
          <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-cyan-500/20 via-blue-500/15 to-indigo-500/20 flex items-center justify-center mb-6 shadow-xl shadow-cyan-500/5 ring-1 ring-border/50">
            <Folder className="w-10 h-10 text-cyan-500" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-3 tracking-tight">
            添加工作区文件夹
          </h3>
          <p className="text-sm text-muted-foreground mb-8 max-w-[260px] leading-relaxed">
            关联本地文件夹，AI 可以读取内容、生成文件，成为你的智能助手
          </p>
          <button
            onClick={onAddFolder}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <FolderPlus className="w-4 h-4" />
            <span>选择文件夹</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full min-h-0">
      {/* 工具栏 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          工作区 ({folders.length})
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onAddFolder}
            className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="添加文件夹"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 文件树 + 预览 分区 */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* 文件树区域 */}
        <div
          className={cn(
            "overflow-y-auto overflow-x-hidden",
            previewPath !== null ? "max-h-[45%] border-b border-border" : "flex-1"
          )}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            folders.map((folder) => (
              <div key={folder.id} className="border-b border-border/50 last:border-b-0">
                {/* 文件夹标题 */}
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 group">
                  <button
                    onClick={() => {
                      onToggleExpanded(folder.path);
                      if (!expandedPaths[folder.path] && !dirCache[folder.path]) {
                        handleLoadChildren(folder.path);
                      }
                    }}
                    className="flex items-center gap-2 flex-1 min-w-0 text-left"
                  >
                    <span className="shrink-0 text-muted-foreground">
                      {expandedPaths[folder.path] ? (
                        <ChevronDownIcon />
                      ) : (
                        <ChevronRightIcon />
                      )}
                    </span>
                    <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="text-sm font-medium truncate">{folder.name}</span>
                  </button>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setShowNewFileInput(folder.path);
                        setNewFileName("");
                      }}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="新建文件"
                    >
                      <FilePlus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => {
                        if (dirCache[folder.path]) {
                          handleLoadChildren(folder.path);
                        }
                      }}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="刷新"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onRemoveFolder(folder.id)}
                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      title="移除工作区"
                    >
                      <FolderMinus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* 新建文件输入 */}
                {showNewFileInput === folder.path && (
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-muted/20">
                    <input
                      autoFocus
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); handleCreateFile(folder.path); }
                        if (e.key === "Escape") { e.preventDefault(); setShowNewFileInput(null); }
                      }}
                      placeholder="文件名..."
                      className="flex-1 text-xs px-2 py-1 rounded border border-border bg-background outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      onClick={() => handleCreateFile(folder.path)}
                      className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      创建
                    </button>
                    <button
                      onClick={() => setShowNewFileInput(null)}
                      className="text-xs px-2 py-1 rounded text-muted-foreground hover:bg-muted"
                    >
                      取消
                    </button>
                  </div>
                )}

                {/* 文件树 */}
                {expandedPaths[folder.path] && (
                  <FileTree
                    entries={dirCache[folder.path] || []}
                    expandedPaths={expandedPaths}
                    selectedPath={selectedPath}
                    dirCache={dirCache}
                    loadingPaths={loadingPaths}
                    onToggle={onToggleExpanded}
                    onSelect={handleSelect}
                    onLoadChildren={handleLoadChildren}
                    onDelete={handleDelete}
                    rootDepth={1}
                  />
                )}
              </div>
            ))
          )}
        </div>

        {/* 文件预览区域 */}
        {previewPath !== null && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-muted/30 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Eye className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs font-medium truncate">{previewFileName}</span>
              </div>
              <button
                onClick={closePreview}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              {previewLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : previewError ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <AlertTriangle className="w-10 h-10 text-amber-500/60 mb-3" />
                  <p className="text-sm font-medium text-foreground">无法预览</p>
                  <p className="text-xs text-muted-foreground mt-1 px-4">{previewError}</p>
                </div>
              ) : previewType === "image" && previewContent ? (
                <div className="flex items-center justify-center p-4 bg-muted/20">
                  <img
                    src={previewContent}
                    alt={previewFileName}
                    className="max-w-full max-h-[400px] object-contain rounded-lg shadow-sm"
                  />
                </div>
              ) : previewType === "text" && previewContent !== null ? (
                <pre className="text-xs font-mono p-3 whitespace-pre-wrap break-all text-foreground leading-relaxed">
                  {previewContent || "（空文件）"}
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <File className="w-10 h-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">{previewFileName}</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    该文件类型暂不支持预览
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
