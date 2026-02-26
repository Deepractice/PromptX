/**
 * useAgent - React hook for Agent event binding
 *
 * Conversation-first, Block-based design:
 * - Produces ConversationData[] for UI rendering
 * - AssistantConversation contains blocks (TextBlock, ToolBlock, etc.)
 * - Blocks are rendered in order
 *
 * @example
 * ```tsx
 * function ChatPage({ agentx, imageId }) {
 *   const {
 *     conversations,
 *     streamingText,
 *     currentTextBlockId,
 *     status,
 *     send,
 *   } = useAgent(agentx, imageId);
 *
 *   return (
 *     <div>
 *       {conversations.map(conv => {
 *         switch (conv.type) {
 *           case 'user':
 *             return <UserEntry key={conv.id} entry={conv} />;
 *           case 'assistant':
 *             return (
 *               <AssistantEntry
 *                 key={conv.id}
 *                 entry={conv}
 *                 streamingText={streamingText}
 *                 currentTextBlockId={currentTextBlockId}
 *               />
 *             );
 *           case 'error':
 *             return <ErrorEntry key={conv.id} entry={conv} />;
 *         }
 *       })}
 *     </div>
 *   );
 * }
 * ```
 */

import { useReducer, useCallback, useRef, useEffect } from "react";
import type { AgentX, Message, UserContentPart } from "agentxjs";
import { isErrorResponse } from "@agentxjs/types/agentx";
import { createLogger } from "@agentxjs/common";
import type { UserConversationData, UseAgentResult, UseAgentOptions, UIError } from "./types";
import { conversationReducer, initialConversationState } from "./conversationReducer";

const logger = createLogger("ui/useAgent");

/**
 * Generate unique ID
 */
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * React hook for binding to Agent events via AgentX
 */
export function useAgent(
  agentx: AgentX | null,
  imageId: string | null,
  options: UseAgentOptions = {}
): UseAgentResult {
  const { onSend, onError, onStatusChange } = options;

  // Single reducer for all conversation state
  const [state, dispatch] = useReducer(conversationReducer, initialConversationState);

  // Track agent ID
  const agentIdRef = useRef<string | null>(null);

  // Derive isLoading from agent status
  const isLoading =
    state.agentStatus === "thinking" ||
    state.agentStatus === "responding" ||
    state.agentStatus === "planning_tool" ||
    state.agentStatus === "awaiting_tool_result";

  // Reset state when imageId changes
  useEffect(() => {
    dispatch({ type: "RESET" });
    agentIdRef.current = null;
  }, [imageId]);

  // Load message history
  useEffect(() => {
    if (!agentx || !imageId) return;

    let mounted = true;

    agentx
      .request("image_messages_request", { imageId })
      .then((response) => {
        if (!mounted) return;
        // Check for error response using unified type guard
        if (isErrorResponse(response.data)) {
          logger.warn("Failed to load messages", { imageId, error: response.data.error });
          return;
        }
        const data = response.data as unknown as { messages: Message[] };
        if (data.messages && data.messages.length > 0) {
          dispatch({ type: "LOAD_HISTORY", messages: data.messages });
          logger.debug("Loaded messages from storage", { imageId, count: data.messages.length });
        }
      })
      .catch((err) => {
        logger.error("Failed to load messages", { imageId, error: err });
      });

    return () => {
      mounted = false;
    };
  }, [agentx, imageId]);

  // Subscribe to agent events
  useEffect(() => {
    if (!agentx || !imageId) return;

    const unsubscribes: Array<() => void> = [];

    // Helper to check if event is for this image
    const isForThisImage = (event: { context?: { imageId?: string } }): boolean => {
      return event.context?.imageId === imageId;
    };

    // Stream events - message_start (add messageId to conversation)
    unsubscribes.push(
      agentx.on("message_start", (event) => {
        if (!isForThisImage(event)) return;
        const data = event.data as { messageId: string };
        dispatch({ type: "ASSISTANT_CONVERSATION_MESSAGE_START", messageId: data.messageId });
      })
    );

    // Stream events - text_delta (create/append to TextBlock)
    unsubscribes.push(
      agentx.on("text_delta", (event) => {
        if (!isForThisImage(event)) return;
        const data = event.data as { text: string };
        dispatch({ type: "TEXT_BLOCK_DELTA", text: data.text });
      })
    );

    // State events - conversation lifecycle
    unsubscribes.push(
      agentx.on("conversation_start", (event) => {
        if (!isForThisImage(event)) return;
        dispatch({ type: "AGENT_STATUS", status: "thinking" });
        dispatch({ type: "ASSISTANT_CONVERSATION_STATUS", status: "processing" });
        onStatusChange?.("thinking");
      })
    );

    unsubscribes.push(
      agentx.on("conversation_thinking", (event) => {
        if (!isForThisImage(event)) return;
        dispatch({ type: "AGENT_STATUS", status: "thinking" });
        dispatch({ type: "ASSISTANT_CONVERSATION_STATUS", status: "thinking" });
        onStatusChange?.("thinking");
      })
    );

    unsubscribes.push(
      agentx.on("conversation_responding", (event) => {
        if (!isForThisImage(event)) return;
        dispatch({ type: "AGENT_STATUS", status: "responding" });
        dispatch({ type: "ASSISTANT_CONVERSATION_STATUS", status: "streaming" });
        onStatusChange?.("responding");
      })
    );

    unsubscribes.push(
      agentx.on("conversation_end", (event) => {
        if (!isForThisImage(event)) return;
        // Finish the conversation - marks text block complete and conversation complete
        dispatch({ type: "ASSISTANT_CONVERSATION_FINISH" });
        dispatch({ type: "AGENT_STATUS", status: "idle" });
        onStatusChange?.("idle");
      })
    );

    unsubscribes.push(
      agentx.on("tool_executing", (event) => {
        if (!isForThisImage(event)) return;
        dispatch({ type: "AGENT_STATUS", status: "planning_tool" });
        onStatusChange?.("planning_tool");
      })
    );

    // Stream events - tool_use_start (create planning ToolBlock)
    unsubscribes.push(
      agentx.on("tool_use_start", (event) => {
        if (!isForThisImage(event)) return;
        const data = event.data as { toolCallId: string; toolName: string };
        dispatch({
          type: "TOOL_BLOCK_PLANNING",
          toolCallId: data.toolCallId,
          toolName: data.toolName,
        });
      })
    );

    // Message events - assistant_message finishes current TextBlock
    unsubscribes.push(
      agentx.on("assistant_message", (event) => {
        if (!isForThisImage(event)) return;
        // Finish current text block (content was accumulated via text_delta)
        dispatch({ type: "TEXT_BLOCK_FINISH" });
      })
    );

    unsubscribes.push(
      agentx.on("tool_call_message", (event) => {
        if (!isForThisImage(event)) return;
        const message = event.data as Message;
        dispatch({
          type: "TOOL_BLOCK_ADD",
          message: message as import("agentxjs").ToolCallMessage,
        });
      })
    );

    unsubscribes.push(
      agentx.on("tool_result_message", (event) => {
        if (!isForThisImage(event)) return;
        const message = event.data as Message;
        dispatch({
          type: "TOOL_BLOCK_RESULT",
          message: message as import("agentxjs").ToolResultMessage,
        });
      })
    );

    unsubscribes.push(
      agentx.on("error_message", (event) => {
        if (!isForThisImage(event)) return;
        const message = event.data as Message;
        dispatch({ type: "ERROR_CONVERSATION_ADD", message });
      })
    );

    // Error events
    unsubscribes.push(
      agentx.on("error_occurred", (event) => {
        if (!isForThisImage(event)) return;
        const error = event.data as UIError;
        dispatch({ type: "ERROR_ADD", error });
        dispatch({ type: "AGENT_STATUS", status: "error" });
        dispatch({ type: "USER_CONVERSATION_STATUS", status: "error", errorCode: error.code });
        onError?.(error);
        onStatusChange?.("error");
      })
    );

    logger.debug("Subscribed to agent events", { imageId });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
      logger.debug("Unsubscribed from agent events", { imageId });
    };
  }, [agentx, imageId, onStatusChange, onError]);

  // Send message
  const send = useCallback(
    async (content: string | UserContentPart[]) => {
      if (!agentx || !imageId) return;

      // Clear errors
      dispatch({ type: "ERRORS_CLEAR" });
      onSend?.(content);

      // Add user conversation immediately
      const userConversation: UserConversationData = {
        type: "user",
        id: generateId("user"),
        content: content,
        timestamp: Date.now(),
        status: "pending",
      };
      dispatch({ type: "USER_CONVERSATION_ADD", conversation: userConversation });

      try {
        // Send to agent
        const response = await agentx.request("message_send_request", {
          imageId,
          content: content,
        });

        // Update agent ID
        if (response.data.agentId) {
          agentIdRef.current = response.data.agentId;
          logger.debug("Agent activated", { imageId, agentId: response.data.agentId });
        }

        // Mark user conversation as success
        dispatch({ type: "USER_CONVERSATION_STATUS", status: "success" });

        // Create assistant conversation immediately (queued state)
        const assistantConversationId = generateId("assistant");
        dispatch({ type: "ASSISTANT_CONVERSATION_START", id: assistantConversationId });
      } catch (error) {
        logger.error("Failed to send message", { imageId, error });
        dispatch({ type: "USER_CONVERSATION_STATUS", status: "error", errorCode: "SEND_FAILED" });
        dispatch({ type: "AGENT_STATUS", status: "error" });
        onStatusChange?.("error");
      }
    },
    [agentx, imageId, onSend, onStatusChange]
  );

  // Interrupt
  const interrupt = useCallback(() => {
    if (!agentx || !imageId) return;

    dispatch({ type: "USER_CONVERSATION_STATUS", status: "interrupted" });

    agentx.request("agent_interrupt_request", { imageId }).catch((error) => {
      logger.error("Failed to interrupt agent", { imageId, error });
    });
  }, [agentx, imageId]);

  // Clear conversations
  const clearConversations = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  // Clear errors
  const clearErrors = useCallback(() => {
    dispatch({ type: "ERRORS_CLEAR" });
  }, []);

  return {
    conversations: state.conversations,
    streamingText: state.streamingText,
    currentTextBlockId: state.currentTextBlockId,
    status: state.agentStatus,
    errors: state.errors,
    send,
    interrupt,
    isLoading,
    clearConversations,
    clearErrors,
    agentId: agentIdRef.current,
  };
}

// Re-export types
export type {
  AgentStatus,
  ConversationData,
  UserConversationData,
  AssistantConversationData,
  ErrorConversationData,
  BlockData,
  TextBlockData,
  ToolBlockData,
  UserConversationStatus,
  AssistantConversationStatus,
  UIError,
  UseAgentResult,
  UseAgentOptions,
} from "./types";
