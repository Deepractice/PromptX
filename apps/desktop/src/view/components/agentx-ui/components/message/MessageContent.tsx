/**
 * MessageContent - Render message content with Markdown and multimodal support
 *
 * Pure UI component that handles:
 * - String content (renders as Markdown)
 * - ContentPart array (renders text, images, files)
 * - Other content (renders as JSON)
 */

import * as React from "react";
import type { ContentPart } from "agentxjs";
import { MarkdownText } from "@/components/agentx-ui/components/typography/MarkdownText";
import { ImageBlock } from "./ImageBlock";
import { FileBlock } from "./FileBlock";

export interface MessageContentProps {
  /**
   * Content to render
   * Can be string, ContentPart array, or any other structure
   */
  content: string | ContentPart[] | unknown;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Type guards for ContentPart types
 */
interface TextPartLike {
  type: "text";
  text: string;
}

interface ImagePartLike {
  type: "image";
  data: string;
  mediaType: string;
  name?: string;
}

interface FilePartLike {
  type: "file";
  data: string;
  mediaType: string;
  filename?: string;
}

function isTextPart(part: unknown): part is TextPartLike {
  return (
    typeof part === "object" &&
    part !== null &&
    "type" in part &&
    (part as { type: unknown }).type === "text" &&
    "text" in part &&
    typeof (part as { text: unknown }).text === "string"
  );
}

function isImagePart(part: unknown): part is ImagePartLike {
  return (
    typeof part === "object" &&
    part !== null &&
    "type" in part &&
    (part as { type: unknown }).type === "image" &&
    "data" in part &&
    "mediaType" in part
  );
}

function isFilePart(part: unknown): part is FilePartLike {
  return (
    typeof part === "object" &&
    part !== null &&
    "type" in part &&
    (part as { type: unknown }).type === "file" &&
    "data" in part &&
    "mediaType" in part
  );
}

/**
 * Check if content is a ContentPart array
 */
function isContentPartArray(content: unknown): content is ContentPart[] {
  if (!Array.isArray(content)) return false;
  if (content.length === 0) return false;

  // Check if at least one item looks like a ContentPart
  return content.some(
    (part) =>
      typeof part === "object" &&
      part !== null &&
      "type" in part &&
      typeof (part as { type: unknown }).type === "string"
  );
}

/**
 * Check if content only contains text parts
 */
function isTextOnly(parts: ContentPart[]): boolean {
  return parts.every((part) => isTextPart(part));
}

/**
 * Render a single ContentPart
 */
const ContentPartRenderer: React.FC<{ part: ContentPart; index: number }> = ({ part, index }) => {
  if (isTextPart(part)) {
    return <MarkdownText key={index}>{part.text}</MarkdownText>;
  }

  if (isImagePart(part)) {
    return (
      <ImageBlock
        key={index}
        src={part.data}
        mediaType={part.mediaType}
        alt={part.name}
        className="my-2"
      />
    );
  }

  if (isFilePart(part)) {
    return (
      <FileBlock
        key={index}
        data={part.data}
        mediaType={part.mediaType}
        filename={part.filename}
        className="my-2"
      />
    );
  }

  // Unknown part type - skip
  return null;
};

/**
 * MessageContent Component
 */
export const MessageContent: React.FC<MessageContentProps> = ({ content, className }) => {
  // Handle string content
  if (typeof content === "string") {
    return (
      <div className={className}>
        <MarkdownText>{content}</MarkdownText>
      </div>
    );
  }

  // Handle ContentPart[] array
  if (isContentPartArray(content)) {
    // Optimization: if only text parts, join and render as single Markdown
    if (isTextOnly(content)) {
      const text = content
        .filter(isTextPart)
        .map((p) => p.text)
        .join("\n");
      return (
        <div className={className}>
          <MarkdownText>{text}</MarkdownText>
        </div>
      );
    }

    // Mixed content - render each part
    return (
      <div className={className}>
        {content.map((part, index) => (
          <ContentPartRenderer key={index} part={part} index={index} />
        ))}
      </div>
    );
  }

  // For other non-string content, render as JSON
  return (
    <div className={className}>
      <pre className="text-xs bg-muted/50 p-2 rounded overflow-x-auto">
        {JSON.stringify(content, null, 2)}
      </pre>
    </div>
  );
};
