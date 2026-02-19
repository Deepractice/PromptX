/**
 * AgentList - Conversation list component
 *
 * Business component that combines ListPane with useImages hook.
 * Displays conversations (Images) with online/offline status.
 *
 * In the Image-First model:
 * - Image is the persistent conversation entity
 * - Agent is a transient runtime instance
 * - Online (🟢) = Agent is running for this Image
 * - Offline (⚫) = Image exists but no Agent running
 *
 * @example
 * ```tsx
 * <AgentList
 *   agentx={agentx}
 *   selectedId={currentImageId}
 *   onSelect={(imageId, agentId) => {
 *     setCurrentImageId(imageId);
 *   }}
 *   onNew={(imageId) => setCurrentImageId(imageId)}
 * />
 * ```
 */

import * as React from "react";
import type { AgentX } from "agentxjs";
import { MessageSquare, Bot } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ListPane, type ListPaneItem } from "@/components/agentx-ui/components/pane";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
} from "@/components/agentx-ui/components/ui";
import { useImages } from "@/components/agentx-ui/hooks";
import { cn } from "@/components/agentx-ui/utils";

export interface AgentListProps {
  /**
   * AgentX instance
   */
  agentx: AgentX | null;
  /**
   * Container ID for creating new images
   * @default "default"
   */
  containerId?: string;
  /**
   * Currently selected image ID
   */
  selectedId?: string | null;
  /**
   * Callback when a conversation is selected
   * @param imageId - The selected image ID
   * @param agentId - The agent ID (if online)
   */
  onSelect?: (imageId: string, agentId: string | null) => void;
  /**
   * Callback when a new conversation is created
   * @param imageId - The new image ID
   */
  onNew?: (imageId: string) => void;
  /**
   * Title displayed in header
   * @default "Conversations"
   */
  title?: string;
  /**
   * Enable search functionality
   * @default true
   */
  searchable?: boolean;
  /**
   * Show collapse button in header
   * @default false
   */
  showCollapseButton?: boolean;
  /**
   * Callback when collapse button is clicked
   */
  onCollapse?: () => void;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * AgentList component
 */
export function AgentList({
  agentx,
  containerId = "default",
  selectedId,
  onSelect,
  onNew,
  title,
  searchable = true,
  showCollapseButton = false,
  onCollapse,
  className,
}: AgentListProps): React.ReactElement {
  const { t } = useTranslation();
  const { images, isLoading, createImage, runImage, deleteImage, updateImage, refresh } = useImages(
    agentx,
    {
      containerId,
    }
  );

  // Use translated title if not provided
  const displayTitle = title ?? t("agentxUI.conversations.title");

  // Rename dialog state
  const [renameDialogOpen, setRenameDialogOpen] = React.useState(false);
  const [editingImageId, setEditingImageId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState("");
  const [isRenaming, setIsRenaming] = React.useState(false);

  // Map images to ListPaneItem[]
  const items: ListPaneItem[] = React.useMemo(() => {
    return images.map((img) => ({
      id: img.imageId,
      title: img.name || t("agentxUI.conversations.untitled"),
      leading: <Bot className="w-4 h-4 text-muted-foreground" />,
      trailing: (
        <span
          className={cn("w-2 h-2 rounded-full", img.online ? "bg-green-500" : "bg-gray-400")}
          title={img.online ? t("agentxUI.conversations.status.online") : t("agentxUI.conversations.status.offline")}
        />
      ),
      timestamp: img.updatedAt || img.createdAt,
    }));
  }, [images, t]);

  // Handle selecting an image
  const handleSelect = React.useCallback(
    async (imageId: string) => {
      if (!agentx) return;
      try {
        // Find the image
        const image = images.find((img) => img.imageId === imageId);
        if (!image) return;

        // If offline, run the image first
        if (!image.online) {
          const { agentId } = await runImage(imageId);
          onSelect?.(imageId, agentId);
        } else {
          // Already online, just select
          onSelect?.(imageId, image.agentId ?? null);
        }
      } catch (error) {
        console.error("Failed to select conversation:", error);
      }
    },
    [agentx, images, runImage, onSelect]
  );

  // Handle creating a new conversation
  const handleNew = React.useCallback(async () => {
    console.log("[AgentList] handleNew called, agentx:", !!agentx);
    if (!agentx) {
      console.warn("[AgentList] agentx is null, cannot create new conversation");
      return;
    }
    try {
      console.log("[AgentList] Creating new image with containerId:", containerId);
      // Create a new image
      const image = await createImage({ name: t("agentxUI.conversations.new") });
      console.log("[AgentList] New image created:", image.imageId);

      // Refresh list
      await refresh();
      onNew?.(image.imageId);
    } catch (error) {
      console.error("Failed to create new conversation:", error);
    }
  }, [agentx, containerId, createImage, refresh, onNew]);

  // Handle deleting an image
  const handleDelete = React.useCallback(
    async (imageId: string) => {
      try {
        await deleteImage(imageId);
      } catch (error) {
        console.error("Failed to delete conversation:", error);
      }
    },
    [deleteImage]
  );

  // Handle edit button click - open rename dialog
  const handleEdit = React.useCallback((imageId: string, currentTitle: string) => {
    setEditingImageId(imageId);
    setEditingName(currentTitle);
    setRenameDialogOpen(true);
  }, []);

  // Handle rename confirmation
  const handleRename = React.useCallback(async () => {
    if (!editingImageId || !editingName.trim()) return;

    setIsRenaming(true);
    try {
      await updateImage(editingImageId, { name: editingName.trim() });
      setRenameDialogOpen(false);
      setEditingImageId(null);
      setEditingName("");
    } catch (error) {
      console.error("Failed to rename conversation:", error);
    } finally {
      setIsRenaming(false);
    }
  }, [editingImageId, editingName, updateImage]);

  // Handle dialog close
  const handleDialogClose = React.useCallback((open: boolean) => {
    if (!open) {
      setRenameDialogOpen(false);
      setEditingImageId(null);
      setEditingName("");
    }
  }, []);

  // Handle Enter key in input
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !isRenaming) {
        handleRename();
      }
    },
    [handleRename, isRenaming]
  );

  return (
    <>
      <ListPane
        title={displayTitle}
        items={items}
        selectedId={selectedId}
        isLoading={isLoading}
        searchable={searchable}
        searchPlaceholder={t("agentxUI.conversations.search")}
        showNewButton
        newButtonLabel={t("agentxUI.conversations.new")}
        showCollapseButton={showCollapseButton}
        onCollapse={onCollapse}
        emptyState={{
          icon: <MessageSquare className="w-6 h-6" />,
          title: t("agentxUI.conversations.empty.title"),
          description: t("agentxUI.conversations.empty.description"),
          actionLabel: t("agentxUI.conversations.empty.action"),
        }}
        onSelect={handleSelect}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onNew={handleNew}
        className={className}
      />

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("agentxUI.conversations.actions.rename")}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("agentxUI.conversations.rename.placeholder")}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleDialogClose(false)}
              disabled={isRenaming}
            >
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={isRenaming || !editingName.trim()}>
              {isRenaming ? t("agentxUI.conversations.rename.saving") : t("agentxUI.conversations.rename.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
