/**
 * FileBlock - Display file attachment in message content
 *
 * Renders file as a card with:
 * - File type icon
 * - Filename
 * - Download button
 */

import * as React from "react";
import { FileText, File, FileImage, Download } from "lucide-react";
import { cn } from "@/components/agentx-ui/utils/utils";

export interface FileBlockProps {
  /**
   * File data (base64)
   */
  data: string;
  /**
   * File MIME type
   */
  mediaType: string;
  /**
   * Filename
   */
  filename?: string;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Get icon component based on media type
 */
function getFileIcon(mediaType: string) {
  if (mediaType === "application/pdf") {
    return FileText;
  }
  if (mediaType.startsWith("image/")) {
    return FileImage;
  }
  return File;
}

/**
 * Get human-readable file type
 */
function getFileTypeLabel(mediaType: string): string {
  const typeMap: Record<string, string> = {
    "application/pdf": "PDF",
    "text/plain": "Text",
    "text/csv": "CSV",
    "application/json": "JSON",
    "application/xml": "XML",
    "application/msword": "Word",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word",
    "application/vnd.ms-excel": "Excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel",
  };

  if (typeMap[mediaType]) {
    return typeMap[mediaType];
  }

  if (mediaType.startsWith("image/")) {
    return mediaType.replace("image/", "").toUpperCase();
  }

  // Extract subtype from MIME type
  const subtype = mediaType.split("/")[1];
  return subtype ? subtype.toUpperCase() : "File";
}

/**
 * FileBlock Component
 */
export const FileBlock: React.FC<FileBlockProps> = ({ data, mediaType, filename, className }) => {
  const Icon = getFileIcon(mediaType);
  const typeLabel = getFileTypeLabel(mediaType);
  const displayName = filename || `file.${mediaType.split("/")[1] || "bin"}`;

  // Build download URL
  const downloadUrl = React.useMemo(() => {
    if (data.startsWith("data:")) {
      return data;
    }
    return `data:${mediaType};base64,${data}`;
  }, [data, mediaType]);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = displayName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-3 px-3 py-2",
        "rounded-lg border border-border bg-muted/30",
        "max-w-xs",
        className
      )}
    >
      {/* File icon */}
      <div className="flex-shrink-0 p-2 rounded-md bg-primary/10">
        <Icon className="w-5 h-5 text-primary" />
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate" title={displayName}>
          {displayName}
        </div>
        <div className="text-xs text-muted-foreground">{typeLabel}</div>
      </div>

      {/* Download button */}
      <button
        onClick={handleDownload}
        className={cn(
          "flex-shrink-0 p-1.5 rounded-md",
          "hover:bg-muted transition-colors",
          "text-muted-foreground hover:text-foreground"
        )}
        title="Download"
      >
        <Download className="w-4 h-4" />
      </button>
    </div>
  );
};
