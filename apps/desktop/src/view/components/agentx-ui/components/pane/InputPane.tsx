/**
 * InputPane - Full-height input area with attachment support (WeChat style)
 *
 * A pure UI component where the entire pane is an input area:
 * - Toolbar at the top
 * - Attachment preview area (when attachments exist)
 * - Full-height textarea filling the space
 * - Send button at bottom right corner
 *
 * Supports:
 * - Text input
 * - Image/file attachments via toolbar buttons
 * - Drag & drop files
 * - Paste images (Ctrl+V)
 *
 * @example
 * ```tsx
 * <InputPane
 *   onSend={(content) => handleSend(content)}
 *   placeholder="Type a message..."
 *   toolbarItems={[
 *     { id: 'emoji', icon: <Smile />, label: 'Emoji' },
 *     { id: 'image', icon: <Image />, label: 'Add image' },
 *     { id: 'attach', icon: <Paperclip />, label: 'Attach file' },
 *   ]}
 * />
 * ```
 */

import * as React from "react";
import { Send, Square, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { UserContentPart, ImagePart } from "agentxjs";
import { cn } from "@/components/agentx-ui/utils/utils";
import { InputToolBar, type ToolBarItem } from "./InputToolBar";
import { EmojiPicker, type Emoji } from "../element/EmojiPicker";
import { ImageAttachment } from "../element/ImageAttachment";

/**
 * Internal attachment representation
 */
interface Attachment {
  id: string;
  file: File;
  type: "image" | "file";
  preview?: string;
  error?: string;
  /** Full file path (available in Electron environment) */
  filePath?: string;
}

export interface InputPaneProps {
  /**
   * Callback when user sends a message
   * Returns string for text-only, or ContentPart[] for multimodal
   */
  onSend?: (content: string | UserContentPart[]) => void;
  /**
   * Callback when stop button is clicked (during loading)
   */
  onStop?: () => void;
  /**
   * Whether the input is disabled
   */
  disabled?: boolean;
  /**
   * Whether currently loading/processing
   */
  isLoading?: boolean;
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Toolbar items (left side)
   */
  toolbarItems?: ToolBarItem[];
  /**
   * Toolbar items (right side)
   */
  toolbarRightItems?: ToolBarItem[];
  /**
   * Callback when a toolbar item is clicked
   */
  onToolbarItemClick?: (id: string) => void;
  /**
   * Show toolbar
   * @default true when toolbarItems provided
   */
  showToolbar?: boolean;
  /**
   * Additional class name
   */
  className?: string;
  /**
   * Enable built-in emoji picker for toolbar item with id='emoji'
   * @default true
   */
  enableEmojiPicker?: boolean;
  /**
   * Enable attachment support for toolbar items with id='image', 'attach', 'folder'
   * @default true
   */
  enableAttachments?: boolean;
  /**
   * Maximum number of attachments
   * @default 10
   */
  maxAttachments?: number;
  /**
   * Maximum file size in bytes
   * @default 104857600 (100MB)
   */
  maxFileSize?: number;
  /**
   * Accepted image types
   * @default ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
   */
  acceptedImageTypes?: string[];
  /**
   * Accepted file types (for non-image attachments)
   * @default ['application/pdf']
   */
  acceptedFileTypes?: string[];
  /**
   * Accept all file types without validation
   * @default true
   */
  acceptAllFileTypes?: boolean;
  /**
   * Files dropped from parent component (for full-area drag & drop)
   */
  droppedFiles?: File[];
  /**
   * Callback when dropped files have been processed
   */
  onDroppedFilesProcessed?: () => void;
}

/**
 * Convert File to base64
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix to get raw base64
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * InputPane component - WeChat style full-height input with attachments
 */
export const InputPane: React.ForwardRefExoticComponent<
  InputPaneProps & React.RefAttributes<HTMLDivElement>
> = React.forwardRef<HTMLDivElement, InputPaneProps>(
  (
    {
      onSend,
      onStop,
      disabled = false,
      isLoading = false,
      placeholder,
      toolbarItems,
      toolbarRightItems,
      onToolbarItemClick,
      showToolbar,
      className,
      enableEmojiPicker = true,
      enableAttachments = true,
      maxAttachments = 10,
      maxFileSize = 100 * 1024 * 1024, // 100MB
      acceptedImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"],
      acceptedFileTypes = ["application/pdf"],
      acceptAllFileTypes = true,
      droppedFiles,
      onDroppedFilesProcessed,
    },
    ref
  ) => {
    const { t } = useTranslation();
    const inputPlaceholder = placeholder ?? t("agentxUI.chat.placeholder");
    const [text, setText] = React.useState("");
    const [attachments, setAttachments] = React.useState<Attachment[]>([]);
    const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
    const [isDragging, setIsDragging] = React.useState(false);
    const [fileError, setFileError] = React.useState<string | null>(null);
    const fileErrorTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const showFileError = React.useCallback((msg: string) => {
      setFileError(msg);
      if (fileErrorTimerRef.current) clearTimeout(fileErrorTimerRef.current);
      fileErrorTimerRef.current = setTimeout(() => setFileError(null), 3000);
    }, []);

    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const emojiPickerRef = React.useRef<HTMLDivElement>(null);
    const imageInputRef = React.useRef<HTMLInputElement>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // All accepted types
    const allAcceptedTypes = React.useMemo(
      () => [...acceptedImageTypes, ...acceptedFileTypes],
      [acceptedImageTypes, acceptedFileTypes]
    );

    // Close emoji picker when clicking outside
    React.useEffect(() => {
      if (!showEmojiPicker) return;

      const handleClickOutside = (e: MouseEvent) => {
        if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
          setShowEmojiPicker(false);
        }
      };

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setShowEmojiPicker(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
      };
    }, [showEmojiPicker]);

    /**
     * Add files as attachments
     */
    const addFiles = React.useCallback(
      async (files: Iterable<File>) => {
        const fileArray = Array.from(files);

        for (const file of fileArray) {
          // Check max attachments
          if (attachments.length >= maxAttachments) {
            showFileError(t("agentxUI.chat.errors.maxAttachments", { max: maxAttachments }));
            break;
          }

          // Check file type (skip if acceptAllFileTypes is true)
          if (!acceptAllFileTypes && !allAcceptedTypes.includes(file.type)) {
            showFileError(t("agentxUI.chat.errors.fileTypeNotAccepted", { name: file.name }));
            continue;
          }

          // Check file size
          if (file.size > maxFileSize) {
            showFileError(t("agentxUI.chat.errors.fileTooLarge", { name: file.name, max: `${Math.round(maxFileSize / 1024 / 1024)}MB` }));
            continue;
          }

          const isImage = acceptedImageTypes.includes(file.type);

          // In Electron, File objects from drag & drop have a 'path' property
          const electronFilePath = (file as File & { path?: string }).path;

          const attachment: Attachment = {
            id: generateId(),
            file,
            type: isImage ? "image" : "file",
            filePath: electronFilePath, // Capture file path from Electron
          };

          // Generate preview for images
          if (isImage) {
            const reader = new FileReader();
            reader.onload = () => {
              setAttachments((prev) =>
                prev.map((a) =>
                  a.id === attachment.id ? { ...a, preview: reader.result as string } : a
                )
              );
            };
            reader.readAsDataURL(file);
          }

          setAttachments((prev) => [...prev, attachment]);
        }
      },
      [
        attachments.length,
        maxAttachments,
        maxFileSize,
        allAcceptedTypes,
        acceptedImageTypes,
        acceptAllFileTypes,
        showFileError,
        t,
      ]
    );

    /**
     * Remove attachment
     */
    const removeAttachment = React.useCallback((id: string) => {
      setAttachments((prev) => prev.filter((a) => a.id !== id));
    }, []);

    /**
     * Add files from file paths (Electron dialog)
     */
    const addFilesFromPaths = React.useCallback(
      async (filePaths: string[]) => {
        for (const filePath of filePaths) {
          // Check max attachments
          if (attachments.length >= maxAttachments) {
            showFileError(t("agentxUI.chat.errors.maxAttachments", { max: maxAttachments }));
            break;
          }

          try {
            // Use Electron IPC to read file from main process
            const result = await window.electronAPI.dialog.readFile(filePath);
            if (!result.success || !result.data) {
              console.error(`Failed to read file: ${result.error}`);
              continue;
            }

            // Convert base64 to Blob
            const byteCharacters = atob(result.data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: result.mimeType });

            // Create File object
            const file = new File([blob], result.fileName || 'file', { type: result.mimeType });

            // Check file size
            if (file.size > maxFileSize) {
              showFileError(t("agentxUI.chat.errors.fileTooLarge", { name: result.fileName, max: `${Math.round(maxFileSize / 1024 / 1024)}MB` }));
              continue;
            }

            const isImage = acceptedImageTypes.includes(file.type);
            const attachment: Attachment = {
              id: generateId(),
              file,
              type: isImage ? "image" : "file",
              filePath, // Store the full path
            };

            // Generate preview for images
            if (isImage) {
              const reader = new FileReader();
              reader.onload = () => {
                setAttachments((prev) =>
                  prev.map((a) =>
                    a.id === attachment.id ? { ...a, preview: reader.result as string } : a
                  )
                );
              };
              reader.readAsDataURL(file);
            }

            setAttachments((prev) => [...prev, attachment]);
          } catch (error) {
            console.error(`Failed to load file from path ${filePath}:`, error);
          }
        }
      },
      [attachments.length, maxAttachments, maxFileSize, acceptedImageTypes, showFileError, t]
    );

    /**
     * Handle send
     */
    const handleSend = React.useCallback(async () => {
      const trimmedText = text.trim();
      if ((!trimmedText && attachments.length === 0) || disabled || isLoading) return;

      // Text only - send as string
      if (attachments.length === 0) {
        onSend?.(trimmedText);
        setText("");
        return;
      }

      // With attachments - build ContentPart[]
      const parts: UserContentPart[] = [];

      // Add file path info as text part first (for AI to know the file locations)
      const filePathsInfo = attachments
        .filter(a => a.filePath)
        .map(a => `<file path="${a.filePath}">${a.file.name}</file>`)
        .join('\n');

      // Add text part if present (combine with file paths info)
      const textContent = [filePathsInfo, trimmedText].filter(Boolean).join('\n\n');
      if (textContent) {
        parts.push({ type: "text", text: textContent });
      }

      // Add image attachments only (files are sent as text path info above)
      for (const attachment of attachments) {
        if (attachment.type === "image") {
          try {
            const base64 = await fileToBase64(attachment.file);
            parts.push({
              type: "image",
              data: base64,
              mediaType: attachment.file.type as ImagePart["mediaType"],
              name: attachment.filePath || attachment.file.name,
            });
          } catch (error) {
            console.error(`Failed to read image ${attachment.file.name}:`, error);
          }
        }
        // Non-image files: path info already added as text, AI will use MCP tools to read
      }

      if (parts.length > 0) {
        onSend?.(parts);
        setText("");
        setAttachments([]);
      }
    }, [text, attachments, disabled, isLoading, onSend]);

    /**
     * Handle keyboard
     */
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        handleSend();
      }
    };

    /**
     * Handle paste (for images)
     */
    const handlePaste = React.useCallback(
      (e: React.ClipboardEvent) => {
        if (!enableAttachments) return;

        const items = e.clipboardData?.items;
        if (!items) return;

        const imageFiles: File[] = [];
        for (const item of Array.from(items)) {
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (file) {
              imageFiles.push(file);
            }
          }
        }

        if (imageFiles.length > 0) {
          e.preventDefault();
          addFiles(imageFiles);
        }
      },
      [enableAttachments, addFiles]
    );

    /**
     * Handle drag events
     */
    const handleDragOver = React.useCallback(
      (e: React.DragEvent) => {
        if (!enableAttachments) return;
        e.preventDefault();
        setIsDragging(true);
      },
      [enableAttachments]
    );

    const handleDragLeave = React.useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
    }, []);

    const handleDrop = React.useCallback(
      (e: React.DragEvent) => {
        if (!enableAttachments) return;
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
          addFiles(files);
        }
      },
      [enableAttachments, addFiles]
    );

    // Stable ref for addFiles to avoid useEffect re-running
    const addFilesRef = React.useRef(addFiles);
    addFilesRef.current = addFiles;

    // Process files dropped from parent component (full-area drag & drop)
    React.useEffect(() => {
      if (droppedFiles && droppedFiles.length > 0) {
        addFilesRef.current(droppedFiles);
        onDroppedFilesProcessed?.();
      }
    }, [droppedFiles, onDroppedFilesProcessed]);

    /**
     * Handle emoji select
     */
    const handleEmojiSelect = (emoji: Emoji) => {
      setText((prev) => prev + emoji.native);
      setShowEmojiPicker(false);
      textareaRef.current?.focus();
    };

    /**
     * Handle toolbar item click
     */
    const handleToolbarItemClick = async (id: string) => {
      if (id === "emoji" && enableEmojiPicker) {
        setShowEmojiPicker((prev) => !prev);
      }

      // Handle attachment buttons - use Electron dialog if available
      if (enableAttachments) {
        if (id === "image") {
          // Check if Electron API is available
          if (typeof window !== 'undefined' && window.electronAPI?.dialog?.openFile) {
            const result = await window.electronAPI.dialog.openFile({
              title: 'Select Images',
              filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }],
              properties: ['openFile', 'multiSelections'],
            });
            if (!result.canceled && result.filePaths.length > 0) {
              await addFilesFromPaths(result.filePaths);
            }
          } else {
            imageInputRef.current?.click();
          }
        } else if (id === "attach" || id === "folder") {
          // Check if Electron API is available
          if (typeof window !== 'undefined' && window.electronAPI?.dialog?.openFile) {
            const result = await window.electronAPI.dialog.openFile({
              title: 'Select Files',
              properties: ['openFile', 'multiSelections'],
            });
            if (!result.canceled && result.filePaths.length > 0) {
              await addFilesFromPaths(result.filePaths);
            }
          } else {
            fileInputRef.current?.click();
          }
        }
      }

      onToolbarItemClick?.(id);
    };

    /**
     * Handle file input change
     */
    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        addFiles(files);
      }
      // Reset input so same file can be selected again
      e.target.value = "";
    };

    // Check if toolbar has emoji item
    const hasEmojiItem =
      toolbarItems?.some((item) => item.id === "emoji") ||
      toolbarRightItems?.some((item) => item.id === "emoji");

    const shouldShowToolbar = showToolbar ?? (toolbarItems && toolbarItems.length > 0);

    const canSend = (text.trim().length > 0 || attachments.length > 0) && !disabled && !isLoading;

    return (
      <div
        ref={ref}
        className={cn("flex flex-col h-full border-t border-border bg-muted/30", className)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Hidden file inputs */}
        <input
          ref={imageInputRef}
          type="file"
          accept={acceptedImageTypes.join(",")}
          multiple
          className="hidden"
          onChange={handleFileInputChange}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptAllFileTypes ? "*/*" : allAcceptedTypes.join(",")}
          multiple
          className="hidden"
          onChange={handleFileInputChange}
        />

        {/* Toolbar at top */}
        {shouldShowToolbar && (
          <div className="flex-shrink-0 border-b border-border relative">
            <InputToolBar
              items={toolbarItems || []}
              rightItems={toolbarRightItems}
              onItemClick={handleToolbarItemClick}
            />
            {/* Emoji Picker Popover */}
            {enableEmojiPicker && hasEmojiItem && showEmojiPicker && (
              <div ref={emojiPickerRef} className="absolute left-0 bottom-full z-50 mb-1">
                <div
                  className="bg-popover rounded-lg shadow-lg border border-border"
                  onClick={(e) => e.stopPropagation()}
                >
                  <EmojiPicker onEmojiSelect={handleEmojiSelect} theme="auto" perLine={8} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* File error toast */}
        {fileError && (
          <div className="flex-shrink-0 px-3 py-1.5 bg-destructive/10 border-b border-destructive/20 text-destructive text-xs">
            {fileError}
          </div>
        )}

        {/* Attachment preview area */}
        {attachments.length > 0 && (
          <div className="flex-shrink-0 px-3 py-2 border-b border-border">
            <div className="flex flex-wrap gap-2">
              {attachments.map((attachment) =>
                attachment.type === "image" ? (
                  <ImageAttachment
                    key={attachment.id}
                    file={attachment.file}
                    onRemove={() => removeAttachment(attachment.id)}
                    error={attachment.error}
                  />
                ) : (
                  <div
                    key={attachment.id}
                    className="relative group flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/50"
                  >
                    <span className="text-sm truncate max-w-32">{attachment.file.name}</span>
                    <button
                      onClick={() => removeAttachment(attachment.id)}
                      className="p-0.5 rounded-full bg-destructive text-white hover:bg-destructive/90"
                      title={t("agentxUI.chat.actions.remove")}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Drag overlay - dark mask style */}
        {isDragging && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/60 rounded-lg">
            <div className="w-16 h-16 mb-3 rounded-xl bg-primary flex items-center justify-center">
              <svg
                className="w-8 h-8 text-primary-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <p className="text-white text-base">Drop to send</p>
          </div>
        )}

        {/* Full-height textarea area */}
        <div className="flex-1 relative min-h-0">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={inputPlaceholder}
            disabled={disabled}
            className={cn(
              "w-full h-full resize-none bg-transparent",
              "px-3 py-3 pr-14 text-sm",
              "placeholder:text-muted-foreground",
              "focus:outline-none",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "overflow-y-auto"
            )}
          />

          {/* Send/Stop button at bottom right */}
          <div className="absolute bottom-3 right-3">
            {isLoading && onStop ? (
              <button
                type="button"
                onClick={onStop}
                className={cn(
                  "p-2 rounded-lg transition-all duration-150",
                  "bg-destructive text-destructive-foreground",
                  "hover:bg-destructive/90",
                  "active:scale-95"
                )}
                title={t("agentxUI.chat.actions.stop")}
              >
                <Square className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={!canSend}
                className={cn(
                  "p-2 rounded-lg transition-all duration-150",
                  "bg-primary text-primary-foreground",
                  "hover:bg-primary/90",
                  "active:scale-95",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                title={t("agentxUI.chat.actions.send")}
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
);

InputPane.displayName = "InputPane";
