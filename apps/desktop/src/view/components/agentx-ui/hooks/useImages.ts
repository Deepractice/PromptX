/**
 * useImages - React hook for Image (conversation) management
 *
 * In the Image-First model:
 * - Image is the persistent entity (conversation)
 * - Agent is a transient runtime instance
 * - Images can be online (🟢 has running Agent) or offline (⚫)
 *
 * @example
 * ```tsx
 * import { useImages } from "@agentxjs/ui";
 *
 * function ConversationList({ agentx }) {
 *   const {
 *     images,
 *     isLoading,
 *     refresh,
 *     createImage,
 *     runImage,
 *     stopImage,
 *     deleteImage,
 *   } = useImages(agentx);
 *
 *   return (
 *     <div>
 *       {images.map(img => (
 *         <ConversationItem
 *           key={img.imageId}
 *           image={img}
 *           online={img.online}
 *           onRun={() => runImage(img.imageId)}
 *           onStop={() => stopImage(img.imageId)}
 *           onDelete={() => deleteImage(img.imageId)}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useEffect, useCallback } from "react";
import type { AgentX, ImageListItem } from "agentxjs";
import { isErrorResponse } from "@agentxjs/types/agentx";
import { createLogger } from "@agentxjs/common";

const logger = createLogger("ui/useImages");

/**
 * Return type of useImages hook
 */
export interface UseImagesResult {
  /**
   * All images (conversations) with online status
   */
  images: ImageListItem[];

  /**
   * Loading state
   */
  isLoading: boolean;

  /**
   * Error state
   */
  error: Error | null;

  /**
   * Refresh images from server
   */
  refresh: () => Promise<void>;

  /**
   * Create a new image (conversation)
   * @returns The new image record
   */
  createImage: (config?: {
    name?: string;
    description?: string;
    systemPrompt?: string;
  }) => Promise<ImageListItem>;

  /**
   * Run an image - create or reuse an Agent
   * @returns The agent ID and whether it was reused
   */
  runImage: (imageId: string) => Promise<{ agentId: string; reused: boolean }>;

  /**
   * Stop an image - destroy the Agent but keep the Image
   */
  stopImage: (imageId: string) => Promise<void>;

  /**
   * Update image metadata
   */
  updateImage: (
    imageId: string,
    updates: { name?: string; description?: string }
  ) => Promise<ImageListItem>;

  /**
   * Delete an image
   */
  deleteImage: (imageId: string) => Promise<void>;
}

/**
 * Options for useImages hook
 */
export interface UseImagesOptions {
  /**
   * Container ID to filter images (optional)
   */
  containerId?: string;

  /**
   * Auto-load images on mount
   * @default true
   */
  autoLoad?: boolean;

  /**
   * Callback when an image is run
   */
  onRun?: (imageId: string, agentId: string, reused: boolean) => void;

  /**
   * Callback when images list changes
   */
  onImagesChange?: (images: ImageListItem[]) => void;
}

/**
 * React hook for Image management
 *
 * @param agentx - AgentX instance
 * @param options - Optional configuration
 * @returns Image state and operations
 */
export function useImages(agentx: AgentX | null, options: UseImagesOptions = {}): UseImagesResult {
  const { containerId, autoLoad = true, onRun, onImagesChange } = options;

  // State
  const [images, setImages] = useState<ImageListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Load images from server
  const loadImages = useCallback(async () => {
    if (!agentx) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await agentx.request("image_list_request", { containerId });
      if (isErrorResponse(response.data)) {
        throw new Error(response.data.error!);
      }
      const records = response.data.records ?? [];
      setImages(records);
      onImagesChange?.(records);
      logger.debug("Loaded images", { count: records.length, containerId });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      logger.error("Failed to load images", { error });
    } finally {
      setIsLoading(false);
    }
  }, [agentx, containerId, onImagesChange]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad && agentx) {
      loadImages();
    }
  }, [autoLoad, agentx, loadImages]);

  // Create a new image
  const createImage = useCallback(
    async (
      config: { name?: string; description?: string; systemPrompt?: string } = {}
    ): Promise<ImageListItem> => {
      if (!agentx) {
        throw new Error("AgentX not available");
      }

      setIsLoading(true);
      setError(null);

      try {
        // Use default container if not specified
        const targetContainerId = containerId ?? "default";
        const response = await agentx.request("image_create_request", {
          containerId: targetContainerId,
          config,
        });
        if (response.data.error) {
          throw new Error(response.data.error);
        }

        const record = response.data.record as ImageListItem;
        if (!record) {
          throw new Error("No image record returned");
        }

        // Add to list (record already has online: false from server)
        setImages((prev) => [record, ...prev]);
        onImagesChange?.([record, ...images]);
        logger.info("Created image", { imageId: record.imageId, name: record.name });

        return record;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        logger.error("Failed to create image", { error });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [agentx, containerId, images, onImagesChange]
  );

  // Run an image
  const runImage = useCallback(
    async (imageId: string): Promise<{ agentId: string; reused: boolean }> => {
      if (!agentx) {
        throw new Error("AgentX not available");
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await agentx.request("image_run_request", { imageId });
        if (response.data.error) {
          throw new Error(response.data.error);
        }

        const { agentId, reused } = response.data;
        if (!agentId) {
          throw new Error("Invalid run response");
        }

        // Update image in list to show online
        setImages((prev) =>
          prev.map((img) => (img.imageId === imageId ? { ...img, online: true, agentId } : img))
        );

        logger.info("Image running", { imageId, agentId, reused });
        onRun?.(imageId, agentId, reused);

        return { agentId, reused };
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        logger.error("Failed to run image", { imageId, error });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [agentx, onRun]
  );

  // Stop an image
  const stopImage = useCallback(
    async (imageId: string): Promise<void> => {
      if (!agentx) {
        throw new Error("AgentX not available");
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await agentx.request("image_stop_request", { imageId });
        if (response.data.error) {
          throw new Error(response.data.error);
        }

        // Update image in list to show offline
        setImages((prev) =>
          prev.map((img) =>
            img.imageId === imageId ? { ...img, online: false, agentId: undefined } : img
          )
        );

        logger.info("Image stopped", { imageId });
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        logger.error("Failed to stop image", { imageId, error });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [agentx]
  );

  // Update image metadata
  const updateImage = useCallback(
    async (
      imageId: string,
      updates: { name?: string; description?: string }
    ): Promise<ImageListItem> => {
      if (!agentx) {
        throw new Error("AgentX not available");
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await agentx.request("image_update_request", { imageId, updates });
        if (response.data.error) {
          throw new Error(response.data.error);
        }

        const record = response.data.record as ImageListItem;
        if (!record) {
          throw new Error("No image record returned");
        }

        // Update in list
        setImages((prev) => prev.map((img) => (img.imageId === imageId ? record : img)));

        logger.info("Image updated", { imageId, updates });
        return record;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        logger.error("Failed to update image", { imageId, error });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [agentx]
  );

  // Delete an image
  const deleteImage = useCallback(
    async (imageId: string): Promise<void> => {
      if (!agentx) {
        throw new Error("AgentX not available");
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await agentx.request("image_delete_request", { imageId });
        if (response.data.error) {
          throw new Error(response.data.error);
        }

        const newImages = images.filter((img) => img.imageId !== imageId);
        setImages(newImages);
        onImagesChange?.(newImages);
        logger.info("Deleted image", { imageId });
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        logger.error("Failed to delete image", { imageId, error });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [agentx, images, onImagesChange]
  );

  return {
    images,
    isLoading,
    error,
    refresh: loadImages,
    createImage,
    runImage,
    stopImage,
    updateImage,
    deleteImage,
  };
}
