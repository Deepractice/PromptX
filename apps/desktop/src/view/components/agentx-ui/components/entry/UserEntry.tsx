/**
 * UserEntry - User message entry
 *
 * Displays user's message with right-aligned layout and status indicator.
 *
 * @example
 * ```tsx
 * <UserEntryComponent
 *   entry={{
 *     type: "user",
 *     id: "msg_123",
 *     content: "Hello, can you help me?",
 *     timestamp: Date.now(),
 *     status: "success",
 *   }}
 * />
 * ```
 */

import * as React from "react";
import { Loader2, Check, AlertCircle, PauseCircle } from "lucide-react";
import { MessageAvatar } from "@/components/agentx-ui/components/message/MessageAvatar";
import { MessageContent } from "@/components/agentx-ui/components/message/MessageContent";
import { cn } from "@/components/agentx-ui/utils/utils";
import type { UserConversationData, UserConversationStatus } from "./types";

export interface UserEntryProps {
  /**
   * User conversation data
   */
  entry: UserConversationData;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Status icon component
 */
const StatusIcon: React.FC<{ status: UserConversationStatus }> = ({ status }) => {
  const iconClassName = "w-4 h-4 flex-shrink-0";

  switch (status) {
    case "pending":
      return <Loader2 className={cn(iconClassName, "animate-spin text-muted-foreground")} />;
    case "success":
      return <Check className={cn(iconClassName, "text-green-500")} />;
    case "error":
      return <AlertCircle className={cn(iconClassName, "text-red-500")} />;
    case "interrupted":
      return <PauseCircle className={cn(iconClassName, "text-gray-500")} />;
    default:
      return null;
  }
};

/**
 * Filter out <file path="...">...</file> tags from text
 */
function filterFilePathTags(text: string): string {
  return text.replace(/<file\s+path="[^"]*">[^<]*<\/file>\s*/g, '').trim();
}

/**
 * Extract file info from <file path="...">filename</file> tags
 */
function extractFileInfoFromText(text: string): { path: string; filename: string }[] {
  const regex = /<file\s+path="([^"]*)">\s*([^<]*)\s*<\/file>/g;
  const files: { path: string; filename: string }[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    files.push({ path: match[1], filename: match[2].trim() });
  }
  return files;
}

/**
 * UserEntry Component
 */
export const UserEntry: React.FC<UserEntryProps> = ({ entry, className }) => {
  // Process content for display
  const { textContent, images, files } = React.useMemo(() => {
    if (typeof entry.content === 'string') {
      // Extract file info from text tags
      const extractedFiles = extractFileInfoFromText(entry.content);
      return {
        textContent: filterFilePathTags(entry.content),
        images: [] as { data: string; mediaType: string; name?: string }[],
        files: extractedFiles,
      };
    }

    // For multimodal content
    const texts: string[] = [];
    const imgs: { data: string; mediaType: string; name?: string }[] = [];
    const fls: { path: string; filename: string }[] = [];

    for (const part of entry.content) {
      if (part.type === 'text') {
        // Extract file info from text tags
        const extractedFiles = extractFileInfoFromText(part.text);
        fls.push(...extractedFiles);
        const filtered = filterFilePathTags(part.text);
        if (filtered) texts.push(filtered);
      } else if (part.type === 'image') {
        imgs.push({
          data: (part as any).data,
          mediaType: (part as any).mediaType,
          name: (part as any).name,
        });
      }
      // Note: 'file' type parts are no longer sent, files are embedded as text tags
    }

    return { textContent: texts.join('\n'), images: imgs, files: fls };
  }, [entry.content]);

  return (
    <div className={cn("flex gap-3 py-2 flex-row-reverse", className)}>
      <MessageAvatar role="user" />
      <div className="flex flex-col items-end gap-2 max-w-[80%]">
        {/* File attachments - simple card showing filename */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-end">
            {files.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/50"
                title={file.path}
              >
                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm truncate max-w-32">{file.filename}</span>
              </div>
            ))}
          </div>
        )}
        {/* Image attachments */}
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-end">
            {images.map((img, idx) => (
              <img
                key={idx}
                src={`data:${img.mediaType};base64,${img.data}`}
                alt={img.name || 'image'}
                className="max-w-48 max-h-48 rounded-lg border border-border"
              />
            ))}
          </div>
        )}
        {/* Text content */}
        {textContent && (
          <div className="flex items-start gap-2">
            <div className="rounded-lg px-4 py-2 bg-primary text-primary-foreground">
              <MessageContent content={textContent} className="text-sm" />
            </div>
            <div className="flex items-center h-8">
              <StatusIcon status={entry.status} />
            </div>
          </div>
        )}
        {/* Show status icon even if no text */}
        {!textContent && (
          <div className="flex items-center h-8">
            <StatusIcon status={entry.status} />
          </div>
        )}
      </div>
    </div>
  );
};

export default UserEntry;
