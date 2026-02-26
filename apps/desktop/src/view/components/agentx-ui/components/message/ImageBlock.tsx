/**
 * ImageBlock - Display image in message content
 *
 * Renders image from base64 data or URL with:
 * - Loading state
 * - Error state
 * - Click to enlarge (lightbox)
 */

import * as React from "react";
import { ImageIcon, X, Loader2 } from "lucide-react";
import { cn } from "@/components/agentx-ui/utils/utils";

export interface ImageBlockProps {
  /**
   * Image source (base64 data or URL)
   */
  src: string;
  /**
   * Image alt text
   */
  alt?: string;
  /**
   * Media type (e.g., "image/png")
   */
  mediaType?: string;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * ImageBlock Component
 */
export const ImageBlock: React.FC<ImageBlockProps> = ({
  src,
  alt = "Image",
  mediaType,
  className,
}) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

  // Build image src - handle base64 data
  const imageSrc = React.useMemo(() => {
    // If already a data URL or http URL, use as-is
    if (src.startsWith("data:") || src.startsWith("http")) {
      return src;
    }
    // Otherwise, assume it's raw base64 data
    const type = mediaType || "image/png";
    return `data:${type};base64,${src}`;
  }, [src, mediaType]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleClick = () => {
    if (!hasError) {
      setIsOpen(true);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Close on escape key
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* Thumbnail */}
      <div
        className={cn(
          "relative inline-block rounded-lg overflow-hidden",
          "border border-border bg-muted/30",
          "max-w-xs cursor-pointer",
          "transition-transform hover:scale-[1.02]",
          className
        )}
        onClick={handleClick}
      >
        {/* Loading state */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className="flex items-center justify-center w-32 h-32 bg-muted/50">
            <div className="text-center text-muted-foreground">
              <ImageIcon className="w-8 h-8 mx-auto mb-1" />
              <span className="text-xs">Failed to load</span>
            </div>
          </div>
        )}

        {/* Image */}
        <img
          src={imageSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "max-w-full h-auto max-h-64 object-contain",
            isLoading && "invisible",
            hasError && "hidden"
          )}
        />
      </div>

      {/* Lightbox Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={handleClose}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className={cn(
              "absolute top-4 right-4 p-2 rounded-full",
              "bg-white/10 hover:bg-white/20 text-white",
              "transition-colors"
            )}
          >
            <X className="w-6 h-6" />
          </button>

          {/* Full size image */}
          <img
            src={imageSrc}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
            className="max-w-[90vw] max-h-[90vh] object-contain"
          />
        </div>
      )}
    </>
  );
};
