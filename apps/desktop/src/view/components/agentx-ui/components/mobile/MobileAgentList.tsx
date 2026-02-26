/**
 * MobileAgentList - Mobile agent/conversation list
 *
 * A mobile-optimized list following Claude App's design:
 * - Clean list items with good touch targets
 * - Swipe to delete (optional)
 * - Search at top
 * - New conversation button
 */

import * as React from "react";
import type { AgentX } from "agentxjs";
import { MessageSquare, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useImages } from "@/components/agentx-ui/hooks";
import { cn } from "@/components/agentx-ui/utils/utils";

/**
 * Format timestamp to relative time string
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

export interface MobileAgentListProps {
  /**
   * AgentX instance
   */
  agentx: AgentX | null;
  /**
   * Container ID
   */
  containerId?: string;
  /**
   * Selected image ID
   */
  selectedId?: string | null;
  /**
   * Callback when selecting a conversation
   */
  onSelect?: (imageId: string, agentId: string | null) => void;
  /**
   * Callback when creating new conversation
   */
  onNew?: (imageId: string) => void;
  /**
   * Callback when drawer should close
   */
  onClose?: () => void;
  /**
   * Show search
   */
  searchable?: boolean;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * MobileAgentList Component
 *
 * A mobile-optimized conversation list for the drawer.
 */
export const MobileAgentList: React.FC<MobileAgentListProps> = ({
  agentx,
  containerId = "default",
  selectedId,
  onSelect,
  onNew,
  onClose,
  searchable = true,
  className,
}) => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const { images, isLoading, createImage, runImage, deleteImage, updateImage, refresh } = useImages(
    agentx,
    {
      containerId,
    }
  );

  // Filter images by search
  const filteredImages = React.useMemo(() => {
    if (!searchQuery.trim()) return images;
    const query = searchQuery.toLowerCase();
    return images.filter(
      (img) => img.name?.toLowerCase().includes(query) || img.imageId.toLowerCase().includes(query)
    );
  }, [images, searchQuery]);

  // Handle select
  const handleSelect = async (imageId: string) => {
    if (!agentx) return;
    try {
      const image = images.find((img) => img.imageId === imageId);
      if (!image) return;

      if (!image.online) {
        const { agentId } = await runImage(imageId);
        onSelect?.(imageId, agentId);
      } else {
        onSelect?.(imageId, image.agentId ?? null);
      }
      onClose?.();
    } catch (error) {
      console.error("Failed to select conversation:", error);
    }
  };

  // Handle new
  const handleNew = async () => {
    if (!agentx) return;
    try {
      const image = await createImage({ name: "New Conversation" });
      await refresh();
      onNew?.(image.imageId);
      onClose?.();
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  // Handle delete
  const handleDelete = async (e: React.MouseEvent, imageId: string) => {
    e.stopPropagation();
    try {
      await deleteImage(imageId);
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  // Handle edit - start inline editing
  const handleEdit = (e: React.MouseEvent, imageId: string, currentName: string) => {
    e.stopPropagation();
    setEditingId(imageId);
    setEditingName(currentName);
    // Focus input after render
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // Handle save - save inline edit
  const handleSave = async (imageId: string) => {
    if (!editingName.trim()) {
      setEditingId(null);
      return;
    }
    try {
      await updateImage(imageId, { name: editingName.trim() });
    } catch (error) {
      console.error("Failed to rename conversation:", error);
    }
    setEditingId(null);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-border shrink-0">
        <h2 className="text-lg font-semibold text-foreground">Conversations</h2>
        <button
          type="button"
          onClick={onClose}
          className={cn(
            "w-9 h-9 flex items-center justify-center",
            "rounded-full",
            "text-muted-foreground",
            "hover:bg-muted active:bg-muted/80"
          )}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Search */}
      {searchable && (
        <div className="px-4 py-3 border-b border-border shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className={cn(
                "w-full h-10 pl-10 pr-4",
                "bg-muted/50 rounded-lg",
                "text-sm text-foreground",
                "placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary/20"
              )}
            />
          </div>
        </div>
      )}

      {/* New conversation button */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <button
          type="button"
          onClick={handleNew}
          className={cn(
            "w-full h-12 flex items-center justify-center gap-2",
            "bg-primary text-primary-foreground",
            "rounded-lg",
            "font-medium text-sm",
            "active:scale-[0.98] transition-transform"
          )}
        >
          <Plus className="w-5 h-5" />
          New conversation
        </button>
      </div>

      {/* List */}
      <div
        className={cn("flex-1 overflow-y-auto", "scrollbar-none", "[&::-webkit-scrollbar]:hidden")}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center px-4">
            <MessageSquare className="w-8 h-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "No results found" : "No conversations yet"}
            </p>
          </div>
        ) : (
          <div className="py-2">
            {filteredImages.map((image) => {
              const isEditing = editingId === image.imageId;

              return (
                <div
                  key={image.imageId}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3",
                    "hover:bg-muted/50 active:bg-muted",
                    "transition-colors",
                    selectedId === image.imageId && "bg-muted"
                  )}
                  onClick={() => !isEditing && handleSelect(image.imageId)}
                >
                  {/* Status indicator */}
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      image.online ? "bg-green-500" : "bg-gray-400"
                    )}
                  />

                  {/* Content */}
                  {isEditing ? (
                    // Inline edit mode
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        ref={inputRef}
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSave(image.imageId);
                          } else if (e.key === "Escape") {
                            handleCancelEdit();
                          }
                        }}
                        onBlur={() => handleSave(image.imageId)}
                        className={cn(
                          "flex-1 h-8 px-2",
                          "bg-background border border-input rounded-md",
                          "text-sm text-foreground",
                          "focus:outline-none focus:ring-2 focus:ring-primary/20"
                        )}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  ) : (
                    // Normal display mode
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {image.name || "Untitled"}
                        </p>
                        {image.updatedAt && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatRelativeTime(image.updatedAt)}
                          </p>
                        )}
                      </div>
                      {/* Action buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Edit button */}
                        <button
                          type="button"
                          onClick={(e) => handleEdit(e, image.imageId, image.name || "Untitled")}
                          className={cn(
                            "w-8 h-8 flex items-center justify-center",
                            "rounded-full",
                            "text-muted-foreground",
                            "hover:bg-primary/10 hover:text-primary",
                            "active:bg-primary/20",
                            "transition-colors"
                          )}
                          aria-label="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, image.imageId)}
                          className={cn(
                            "w-8 h-8 flex items-center justify-center",
                            "rounded-full",
                            "text-muted-foreground",
                            "hover:bg-destructive/10 hover:text-destructive",
                            "active:bg-destructive/20",
                            "transition-colors"
                          )}
                          aria-label="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

MobileAgentList.displayName = "MobileAgentList";
