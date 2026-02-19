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
import { FileBlock } from "@/components/agentx-ui/components/message/FileBlock";
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
 * UserEntry Component
 */
export const UserEntry: React.FC<UserEntryProps> = ({ entry, className }) => {
  // Process content for display
  const { textContent, images, files } = React.useMemo(() => {
    if (typeof entry.content === 'string') {
      return {
        textContent: filterFilePathTags(entry.content),
        images: [] as { data: string; mediaType: string; name?: string }[],
        files: [] as { data: string; mediaType: string; filename?: string }[],
      };
    }

    // For multimodal content
    const texts: string[] = [];
    const imgs: { data: string; mediaType: string; name?: string }[] = [];
    const fls: { data: string; mediaType: string; filename?: string }[] = [];

    for (const part of entry.content) {
      if (part.type === 'text') {
        const filtered = filterFilePathTags(part.text);
        if (filtered) texts.push(filtered);
      } else if (part.type === 'image') {
        imgs.push({
          data: (part as any).data,
          mediaType: (part as any).mediaType,
          name: (part as any).name,
        });
      } else if (part.type === 'file') {
        fls.push({
          data: (part as any).data,
          mediaType: (part as any).mediaType,
          filename: (part as any).filename,
        });
      }
    }

    return { textContent: texts.join('\n'), images: imgs, files: fls };
  }, [entry.content]);

  return (
    <div className={cn("flex gap-3 py-2 flex-row-reverse", className)}>
      <MessageAvatar role="user" />
      <div className="flex flex-col items-end gap-2 max-w-[80%]">
        {/* File attachments - using original card style */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-end">
            {files.map((file, idx) => (
              <FileBlock
                key={idx}
                data={file.data}
                mediaType={file.mediaType}
                filename={file.filename?.split(/[/\\]/).pop()}
              />
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
