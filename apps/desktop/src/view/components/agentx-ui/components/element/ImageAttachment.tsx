import * as React from "react";
import { X, AlertCircle, Image as ImageIcon } from "lucide-react";
import { cn } from "@/components/agentx-ui/utils/utils";

export interface ImageAttachmentProps {
  /**
   * The image file to display
   */
  file: File;
  /**
   * Callback when remove button is clicked
   */
  onRemove: () => void;
  /**
   * Upload progress (0-100). Shows progress overlay when < 100
   */
  uploadProgress?: number;
  /**
   * Error message. Shows error overlay when provided
   */
  error?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * ImageAttachment - Display image preview with upload progress and remove button
 *
 * Single Responsibility: Display a single image attachment with its upload state
 *
 * Used in input area for previewing images before sending
 *
 * @example
 * ```tsx
 * <ImageAttachment
 *   file={imageFile}
 *   onRemove={() => handleRemove(index)}
 * />
 *
 * <ImageAttachment
 *   file={imageFile}
 *   uploadProgress={75}
 *   onRemove={() => handleRemove(index)}
 * />
 *
 * <ImageAttachment
 *   file={imageFile}
 *   error="Upload failed"
 *   onRemove={() => handleRemove(index)}
 * />
 * ```
 */
export function ImageAttachment({
  file,
  onRemove,
  uploadProgress,
  error,
  className,
}: ImageAttachmentProps): React.ReactElement {
  const [preview, setPreview] = React.useState<string>("");

  React.useEffect(() => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    // Data URLs don't need cleanup (unlike Object URLs)
  }, [file]);

  return (
    <div className={cn("relative group", className)}>
      {/* Image container */}
      <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 transition-colors">
        {preview ? (
          <img src={preview} alt={file.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-slate-400" />
          </div>
        )}

        {/* Upload progress overlay */}
        {uploadProgress !== undefined && uploadProgress < 100 && (
          <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center backdrop-blur-sm">
            <div className="text-center">
              <div className="text-white text-sm font-semibold">{uploadProgress}%</div>
              <div className="w-12 h-1 bg-slate-700 rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 bg-destructive/90 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
        )}
      </div>

      {/* Remove button */}
      <button
        onClick={onRemove}
        className={cn(
          "absolute -top-2 -right-2 w-6 h-6",
          "bg-destructive hover:bg-destructive/90 text-white",
          "rounded-full flex items-center justify-center",
          "shadow-lg transition-all duration-200",
          "opacity-0 group-hover:opacity-100",
          "focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2"
        )}
        title="Remove image"
        type="button"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Error message tooltip */}
      {error && (
        <div className="absolute top-full mt-1 left-0 right-0 text-xs text-destructive text-center px-1 animate-fade-in">
          {error}
        </div>
      )}
    </div>
  );
}
