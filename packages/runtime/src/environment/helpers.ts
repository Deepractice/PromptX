/**
 * Helper functions for Claude Environment
 */

import type {
  UserMessage,
  ContentPart,
  TextPart,
  ImagePart,
  FilePart,
} from "@agentxjs/types/agent";
import type { SDKUserMessage } from "@anthropic-ai/claude-agent-sdk";

/**
 * Claude API content block types
 */
type ClaudeTextBlock = {
  type: "text";
  text: string;
};

type ClaudeImageBlock = {
  type: "image";
  source: {
    type: "base64";
    media_type: string;
    data: string;
  };
};

type ClaudeDocumentBlock = {
  type: "document";
  source: {
    type: "base64";
    media_type: string;
    data: string;
  };
};

type ClaudeContentBlock = ClaudeTextBlock | ClaudeImageBlock | ClaudeDocumentBlock;

/**
 * Type guards for ContentPart discrimination
 */
function isTextPart(part: ContentPart): part is TextPart {
  return part.type === "text";
}

function isImagePart(part: ContentPart): part is ImagePart {
  return part.type === "image";
}

function isFilePart(part: ContentPart): part is FilePart {
  return part.type === "file";
}

/**
 * Build SDK content from UserMessage
 *
 * Converts AgentX ContentPart[] to Claude API format:
 * - Pure text messages return as string (for efficiency)
 * - Mixed content returns as ClaudeContentBlock[]
 */
export function buildSDKContent(message: UserMessage): string | ClaudeContentBlock[] {
  // String content - return as-is
  if (typeof message.content === "string") {
    return message.content;
  }

  // Not an array - return empty string
  if (!Array.isArray(message.content)) {
    return "";
  }

  const parts = message.content as ContentPart[];

  // Check if we have only text parts
  const hasNonTextParts = parts.some((p) => !isTextPart(p));

  if (!hasNonTextParts) {
    // Pure text - return as string for efficiency
    return parts
      .filter(isTextPart)
      .map((p) => p.text)
      .join("\n");
  }

  // Mixed content - return as content blocks
  return parts.map((part): ClaudeContentBlock => {
    if (isTextPart(part)) {
      return {
        type: "text",
        text: part.text,
      };
    }

    if (isImagePart(part)) {
      return {
        type: "image",
        source: {
          type: "base64",
          media_type: part.mediaType,
          data: part.data,
        },
      };
    }

    if (isFilePart(part)) {
      // PDF and other files use "document" type in Claude API
      return {
        type: "document",
        source: {
          type: "base64",
          media_type: part.mediaType,
          data: part.data,
        },
      };
    }

    // Unknown type - return empty text block
    return { type: "text", text: "" };
  });
}

/**
 * Build SDK UserMessage from AgentX UserMessage
 */
export function buildSDKUserMessage(message: UserMessage, sessionId: string): SDKUserMessage {
  return {
    type: "user",
    message: { role: "user", content: buildSDKContent(message) },
    parent_tool_use_id: null,
    session_id: sessionId,
  };
}
