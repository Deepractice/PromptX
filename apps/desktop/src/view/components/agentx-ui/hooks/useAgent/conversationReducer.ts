/**
 * Conversation Reducer
 *
 * Conversation-first, Block-based state management.
 * All AssistantConversation content is stored in blocks (TextBlock, ToolBlock, etc.)
 */

import type {
  Message,
  ToolCallMessage,
  ToolResultMessage,
  AssistantMessage,
  ErrorMessage,
  UserMessage,
} from "agentxjs";
import type {
  ConversationState,
  ConversationAction,
  ConversationData,
  UserConversationData,
  AssistantConversationData,
  ErrorConversationData,
  BlockData,
  TextBlockData,
  ToolBlockData,
} from "./types";

/**
 * Generate unique ID
 */
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Initial state
 */
export const initialConversationState: ConversationState = {
  conversations: [],
  conversationIds: new Set(),
  pendingToolCalls: new Map(),
  streamingConversationId: null,
  currentTextBlockId: null,
  streamingText: "",
  errors: [],
  agentStatus: "idle",
};

// ============================================================================
// History Processing
// ============================================================================

/**
 * Convert history messages to conversations with blocks
 */
function processHistoryMessages(messages: Message[]): {
  conversations: ConversationData[];
  conversationIds: Set<string>;
  pendingToolCalls: Map<string, string>;
} {
  const conversations: ConversationData[] = [];
  const conversationIds = new Set<string>();
  const pendingToolCalls = new Map<string, string>();

  // First pass: collect tool results by toolCallId
  const toolResultMap = new Map<string, ToolResultMessage>();
  for (const msg of messages) {
    if (msg.subtype === "tool-result") {
      const toolResult = msg as ToolResultMessage;
      toolResultMap.set(toolResult.toolCallId, toolResult);
      conversationIds.add(msg.id);
    }
  }

  // Second pass: collect tool-calls by parentId
  const toolCallsByParent = new Map<string, ToolCallMessage[]>();
  for (const msg of messages) {
    if (msg.subtype === "tool-call") {
      const toolCall = msg as ToolCallMessage;
      const parentId = toolCall.parentId || "orphan";
      const existing = toolCallsByParent.get(parentId) || [];
      existing.push(toolCall);
      toolCallsByParent.set(parentId, existing);
      conversationIds.add(msg.id);
    }
  }

  // Third pass: build conversations with blocks
  let currentAssistantConversation: AssistantConversationData | null = null;

  for (const msg of messages) {
    if (msg.subtype === "tool-call" || msg.subtype === "tool-result") {
      continue;
    }

    conversationIds.add(msg.id);

    switch (msg.subtype) {
      case "user": {
        // Finalize any pending assistant conversation
        if (currentAssistantConversation) {
          conversations.push(currentAssistantConversation);
          currentAssistantConversation = null;
        }

        const userMsg = msg as UserMessage;
        const content =
          typeof userMsg.content === "string"
            ? userMsg.content
            : userMsg.content
                .filter((part) => part.type === "text")
                .map((part) => (part as { type: "text"; text: string }).text)
                .join("");

        conversations.push({
          type: "user",
          id: msg.id,
          content,
          timestamp: msg.timestamp,
          status: "success",
        } as UserConversationData);
        break;
      }

      case "assistant": {
        const assistantMsg = msg as AssistantMessage;
        const textContent =
          typeof assistantMsg.content === "string"
            ? assistantMsg.content
            : assistantMsg.content
                .filter((part) => part.type === "text")
                .map((part) => (part as { type: "text"; text: string }).text)
                .join("");

        // Create text block if there's content
        const textBlock: TextBlockData | null = textContent
          ? {
              type: "text",
              id: `text_${msg.id}`,
              content: textContent,
              timestamp: msg.timestamp,
              status: "completed",
            }
          : null;

        // Create tool blocks for this message
        const toolCalls = toolCallsByParent.get(msg.id) || [];
        const toolBlocks: ToolBlockData[] = toolCalls.map((tc) => {
          const result = toolResultMap.get(tc.toolCall.id);
          const hasResult = !!result;
          const isError =
            hasResult &&
            typeof result.toolResult.output === "object" &&
            result.toolResult.output !== null &&
            "type" in result.toolResult.output &&
            (result.toolResult.output as { type: string }).type === "error-text";

          return {
            type: "tool",
            id: tc.id,
            toolCallId: tc.toolCall.id,
            name: tc.toolCall.name,
            input: tc.toolCall.input,
            timestamp: tc.timestamp,
            status: hasResult ? (isError ? "error" : "success") : "executing",
            output: result?.toolResult.output,
            duration: result ? (result.timestamp - tc.timestamp) / 1000 : undefined,
          } as ToolBlockData;
        });

        // Combine blocks: text first, then tools
        const newBlocks: BlockData[] = [];
        if (textBlock) newBlocks.push(textBlock);
        newBlocks.push(...toolBlocks);

        // Accumulate into current conversation or create new one
        if (currentAssistantConversation !== null) {
          const existing: AssistantConversationData = currentAssistantConversation;
          currentAssistantConversation = {
            ...existing,
            messageIds: [...existing.messageIds, msg.id],
            blocks: [...existing.blocks, ...newBlocks],
          };
        } else {
          currentAssistantConversation = {
            type: "assistant",
            id: `assistant_${msg.id}`,
            messageIds: [msg.id],
            timestamp: msg.timestamp,
            status: "completed",
            blocks: newBlocks,
          };
        }
        break;
      }

      case "error": {
        // Finalize any pending assistant conversation
        if (currentAssistantConversation) {
          conversations.push(currentAssistantConversation);
          currentAssistantConversation = null;
        }

        const errorMsg = msg as ErrorMessage;
        conversations.push({
          type: "error",
          id: msg.id,
          content: errorMsg.content,
          timestamp: msg.timestamp,
          errorCode: errorMsg.errorCode,
        } as ErrorConversationData);
        break;
      }
    }
  }

  // Finalize any pending assistant conversation
  if (currentAssistantConversation) {
    conversations.push(currentAssistantConversation);
  }

  // Handle orphan tool-calls (no parentId)
  const orphanToolCalls = toolCallsByParent.get("orphan") || [];
  if (orphanToolCalls.length > 0) {
    const blocks: ToolBlockData[] = orphanToolCalls.map((tc) => {
      const result = toolResultMap.get(tc.toolCall.id);
      const hasResult = !!result;
      const isError =
        hasResult &&
        typeof result.toolResult.output === "object" &&
        result.toolResult.output !== null &&
        "type" in result.toolResult.output &&
        (result.toolResult.output as { type: string }).type === "error-text";

      return {
        type: "tool",
        id: tc.id,
        toolCallId: tc.toolCall.id,
        name: tc.toolCall.name,
        input: tc.toolCall.input,
        timestamp: tc.timestamp,
        status: hasResult ? (isError ? "error" : "success") : "executing",
        output: result?.toolResult.output,
        duration: result ? (result.timestamp - tc.timestamp) / 1000 : undefined,
      } as ToolBlockData;
    });

    conversations.push({
      type: "assistant",
      id: `assistant_orphan_${Date.now()}`,
      messageIds: [],
      timestamp: orphanToolCalls[0].timestamp,
      status: "completed",
      blocks,
    } as AssistantConversationData);
  }

  return { conversations, conversationIds, pendingToolCalls };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Find the index of the streaming assistant conversation
 */
function findStreamingConversationIndex(state: ConversationState): number {
  if (!state.streamingConversationId) return -1;
  return state.conversations.findIndex(
    (c) => c.type === "assistant" && c.id === state.streamingConversationId
  );
}

/**
 * Finish current text block (set content from streamingText and mark as completed)
 */
function finishCurrentTextBlock(state: ConversationState): ConversationState {
  if (!state.currentTextBlockId || !state.streamingConversationId) {
    return state;
  }

  const convIndex = findStreamingConversationIndex(state);
  if (convIndex === -1) return state;

  const conversations = [...state.conversations];
  const conv = conversations[convIndex] as AssistantConversationData;

  const blockIndex = conv.blocks.findIndex(
    (b) => b.type === "text" && b.id === state.currentTextBlockId
  );

  if (blockIndex === -1) return state;

  const textBlock = conv.blocks[blockIndex] as TextBlockData;
  const updatedBlock: TextBlockData = {
    ...textBlock,
    content: state.streamingText,
    status: "completed",
  };

  const newBlocks = [...conv.blocks];
  newBlocks[blockIndex] = updatedBlock;

  conversations[convIndex] = {
    ...conv,
    blocks: newBlocks,
  };

  return {
    ...state,
    conversations,
    currentTextBlockId: null,
    streamingText: "",
  };
}

// ============================================================================
// Reducer
// ============================================================================

/**
 * Conversation reducer
 */
export function conversationReducer(
  state: ConversationState,
  action: ConversationAction
): ConversationState {
  switch (action.type) {
    case "RESET":
      return initialConversationState;

    case "LOAD_HISTORY": {
      const { conversations, conversationIds, pendingToolCalls } = processHistoryMessages(
        action.messages
      );
      return {
        ...state,
        conversations,
        conversationIds,
        pendingToolCalls,
        streamingConversationId: null,
        currentTextBlockId: null,
        streamingText: "",
      };
    }

    // ========== User Conversation ==========

    case "USER_CONVERSATION_ADD": {
      if (state.conversationIds.has(action.conversation.id)) {
        return state;
      }

      const newConversationIds = new Set(state.conversationIds);
      newConversationIds.add(action.conversation.id);

      return {
        ...state,
        conversations: [...state.conversations, action.conversation],
        conversationIds: newConversationIds,
      };
    }

    case "USER_CONVERSATION_STATUS": {
      const conversations = [...state.conversations];
      for (let i = conversations.length - 1; i >= 0; i--) {
        const conv = conversations[i];
        if (conv.type === "user" && conv.status === "pending") {
          conversations[i] = {
            ...conv,
            status: action.status,
            errorCode: action.errorCode,
          };
          break;
        }
      }
      return { ...state, conversations };
    }

    // ========== Assistant Conversation ==========

    case "ASSISTANT_CONVERSATION_START": {
      if (state.conversationIds.has(action.id)) {
        return state;
      }

      const newConversation: AssistantConversationData = {
        type: "assistant",
        id: action.id,
        messageIds: [],
        timestamp: Date.now(),
        status: "queued",
        blocks: [],
      };

      const newConversationIds = new Set(state.conversationIds);
      newConversationIds.add(action.id);

      return {
        ...state,
        conversations: [...state.conversations, newConversation],
        conversationIds: newConversationIds,
        streamingConversationId: action.id,
        currentTextBlockId: null,
        streamingText: "",
      };
    }

    case "ASSISTANT_CONVERSATION_STATUS": {
      const index = findStreamingConversationIndex(state);
      if (index === -1) return state;

      const conversations = [...state.conversations];
      const conv = conversations[index] as AssistantConversationData;
      conversations[index] = { ...conv, status: action.status };

      return { ...state, conversations };
    }

    case "ASSISTANT_CONVERSATION_MESSAGE_START": {
      const index = findStreamingConversationIndex(state);
      if (index === -1) return state;

      const conversations = [...state.conversations];
      const conv = conversations[index] as AssistantConversationData;
      conversations[index] = {
        ...conv,
        messageIds: [...conv.messageIds, action.messageId],
      };

      return { ...state, conversations };
    }

    case "ASSISTANT_CONVERSATION_FINISH": {
      // First finish any current text block
      let newState = finishCurrentTextBlock(state);

      const index = findStreamingConversationIndex(newState);
      if (index === -1) return newState;

      const conversations = [...newState.conversations];
      const conv = conversations[index] as AssistantConversationData;

      conversations[index] = {
        ...conv,
        status: "completed",
      };

      return {
        ...newState,
        conversations,
        streamingConversationId: null,
        currentTextBlockId: null,
        streamingText: "",
      };
    }

    // ========== Text Block ==========

    case "TEXT_BLOCK_DELTA": {
      const convIndex = findStreamingConversationIndex(state);
      if (convIndex === -1) return state;

      // If no current text block, create one
      if (!state.currentTextBlockId) {
        const conversations = [...state.conversations];
        const conv = conversations[convIndex] as AssistantConversationData;

        const newTextBlock: TextBlockData = {
          type: "text",
          id: generateId("text"),
          content: "",
          timestamp: Date.now(),
          status: "streaming",
        };

        conversations[convIndex] = {
          ...conv,
          blocks: [...conv.blocks, newTextBlock],
        };

        return {
          ...state,
          conversations,
          currentTextBlockId: newTextBlock.id,
          streamingText: action.text,
        };
      }

      // Append to existing streaming text
      return {
        ...state,
        streamingText: state.streamingText + action.text,
      };
    }

    case "TEXT_BLOCK_FINISH": {
      return finishCurrentTextBlock(state);
    }

    // ========== Tool Block ==========

    case "TOOL_BLOCK_PLANNING": {
      // First, finish any current text block
      let newState = state;
      if (state.currentTextBlockId) {
        newState = finishCurrentTextBlock(state);
      }

      const convIndex = findStreamingConversationIndex(newState);
      if (convIndex === -1) {
        // No streaming conversation, create one
        const newConversation: AssistantConversationData = {
          type: "assistant",
          id: generateId("assistant"),
          messageIds: [],
          timestamp: Date.now(),
          status: "streaming",
          blocks: [
            {
              type: "tool",
              id: generateId("tool"),
              toolCallId: action.toolCallId,
              name: action.toolName,
              input: {},
              timestamp: Date.now(),
              status: "planning",
              startTime: Date.now(),
            } as ToolBlockData,
          ],
        };

        const newConversationIds = new Set(newState.conversationIds);
        newConversationIds.add(newConversation.id);

        const newPendingToolCalls = new Map(newState.pendingToolCalls);
        newPendingToolCalls.set(action.toolCallId, newConversation.id);

        return {
          ...newState,
          conversations: [...newState.conversations, newConversation],
          conversationIds: newConversationIds,
          pendingToolCalls: newPendingToolCalls,
          streamingConversationId: newConversation.id,
        };
      }

      // Add planning block to existing streaming conversation
      const conversations = [...newState.conversations];
      const conv = conversations[convIndex] as AssistantConversationData;

      const newBlock: ToolBlockData = {
        type: "tool",
        id: generateId("tool"),
        toolCallId: action.toolCallId,
        name: action.toolName,
        input: {},
        timestamp: Date.now(),
        status: "planning",
        startTime: Date.now(),
      };

      conversations[convIndex] = {
        ...conv,
        blocks: [...conv.blocks, newBlock],
      };

      const newPendingToolCalls = new Map(newState.pendingToolCalls);
      newPendingToolCalls.set(action.toolCallId, conv.id);

      return {
        ...newState,
        conversations,
        pendingToolCalls: newPendingToolCalls,
      };
    }

    case "TOOL_BLOCK_ADD": {
      const msg = action.message;

      // First, finish any current text block
      let newState = state;
      if (state.currentTextBlockId) {
        newState = finishCurrentTextBlock(state);
      }

      // Check if there's already a planning block for this toolCallId
      const parentConversationId = newState.pendingToolCalls.get(msg.toolCall.id);
      if (parentConversationId) {
        // Find the conversation and update the planning block to executing
        const parentIndex = newState.conversations.findIndex(
          (c) => c.type === "assistant" && c.id === parentConversationId
        );

        if (parentIndex !== -1) {
          const conversations = [...newState.conversations];
          const parentConv = conversations[parentIndex] as AssistantConversationData;

          const blockIndex = parentConv.blocks.findIndex(
            (b) => b.type === "tool" && (b as ToolBlockData).toolCallId === msg.toolCall.id
          );

          if (blockIndex !== -1) {
            // Update existing planning block to executing with full input
            const existingBlock = parentConv.blocks[blockIndex] as ToolBlockData;
            const updatedBlock: ToolBlockData = {
              ...existingBlock,
              input: msg.toolCall.input,
              status: "executing",
            };

            const newBlocks = [...parentConv.blocks];
            newBlocks[blockIndex] = updatedBlock;

            conversations[parentIndex] = {
              ...parentConv,
              blocks: newBlocks,
            };

            return {
              ...newState,
              conversations,
            };
          }
        }
      }

      // No planning block found, create new tool block (fallback)
      const parentMessageId = msg.parentId;

      // Find parent conversation by messageId
      let parentIndex = -1;
      if (parentMessageId) {
        parentIndex = newState.conversations.findIndex(
          (c) =>
            c.type === "assistant" &&
            (c as AssistantConversationData).messageIds.includes(parentMessageId)
        );
      }

      // If not found by messageId, try streaming conversation
      if (parentIndex === -1 && newState.streamingConversationId) {
        parentIndex = findStreamingConversationIndex(newState);
      }

      if (parentIndex === -1) {
        // No parent found, create orphan assistant conversation
        const orphanConversation: AssistantConversationData = {
          type: "assistant",
          id: `assistant_for_${msg.id}`,
          messageIds: parentMessageId ? [parentMessageId] : [],
          timestamp: msg.timestamp,
          status: "streaming",
          blocks: [
            {
              type: "tool",
              id: msg.id,
              toolCallId: msg.toolCall.id,
              name: msg.toolCall.name,
              input: msg.toolCall.input,
              timestamp: msg.timestamp,
              status: "executing",
              startTime: Date.now(),
            } as ToolBlockData,
          ],
        };

        const newConversationIds = new Set(newState.conversationIds);
        newConversationIds.add(orphanConversation.id);

        const newPendingToolCalls = new Map(newState.pendingToolCalls);
        newPendingToolCalls.set(msg.toolCall.id, orphanConversation.id);

        return {
          ...newState,
          conversations: [...newState.conversations, orphanConversation],
          conversationIds: newConversationIds,
          pendingToolCalls: newPendingToolCalls,
          streamingConversationId: orphanConversation.id,
        };
      }

      // Add block to parent conversation
      const conversations = [...newState.conversations];
      const parentConv = conversations[parentIndex] as AssistantConversationData;

      const newBlock: ToolBlockData = {
        type: "tool",
        id: msg.id,
        toolCallId: msg.toolCall.id,
        name: msg.toolCall.name,
        input: msg.toolCall.input,
        timestamp: msg.timestamp,
        status: "executing",
        startTime: Date.now(),
      };

      conversations[parentIndex] = {
        ...parentConv,
        blocks: [...parentConv.blocks, newBlock],
      };

      const newPendingToolCalls = new Map(newState.pendingToolCalls);
      newPendingToolCalls.set(msg.toolCall.id, parentConv.id);

      return {
        ...newState,
        conversations,
        pendingToolCalls: newPendingToolCalls,
      };
    }

    case "TOOL_BLOCK_RESULT": {
      const msg = action.message;
      const parentConversationId = state.pendingToolCalls.get(msg.toolCallId);

      if (!parentConversationId) {
        return state;
      }

      const parentIndex = state.conversations.findIndex(
        (c) => c.type === "assistant" && c.id === parentConversationId
      );

      if (parentIndex === -1) {
        return state;
      }

      const conversations = [...state.conversations];
      const parentConv = conversations[parentIndex] as AssistantConversationData;

      const blockIndex = parentConv.blocks.findIndex(
        (b) => b.type === "tool" && (b as ToolBlockData).toolCallId === msg.toolCallId
      );

      if (blockIndex === -1) {
        return state;
      }

      const block = parentConv.blocks[blockIndex] as ToolBlockData;
      const isError =
        typeof msg.toolResult.output === "object" &&
        msg.toolResult.output !== null &&
        "type" in msg.toolResult.output &&
        (msg.toolResult.output as { type: string }).type === "error-text";

      const now = Date.now();
      const duration = block.startTime ? (now - block.startTime) / 1000 : 0;

      const updatedBlock: ToolBlockData = {
        ...block,
        status: isError ? "error" : "success",
        output: msg.toolResult.output,
        duration,
      };

      const newBlocks = [...parentConv.blocks];
      newBlocks[blockIndex] = updatedBlock;

      conversations[parentIndex] = {
        ...parentConv,
        blocks: newBlocks,
      };

      const newPendingToolCalls = new Map(state.pendingToolCalls);
      newPendingToolCalls.delete(msg.toolCallId);

      return {
        ...state,
        conversations,
        pendingToolCalls: newPendingToolCalls,
      };
    }

    // ========== Error Conversation ==========

    case "ERROR_CONVERSATION_ADD": {
      const msg = action.message as ErrorMessage;

      if (state.conversationIds.has(msg.id)) {
        return state;
      }

      const newConversation: ErrorConversationData = {
        type: "error",
        id: msg.id,
        content: msg.content,
        timestamp: msg.timestamp,
        errorCode: msg.errorCode,
      };

      const newConversationIds = new Set(state.conversationIds);
      newConversationIds.add(msg.id);

      return {
        ...state,
        conversations: [...state.conversations, newConversation],
        conversationIds: newConversationIds,
        streamingConversationId: null,
        currentTextBlockId: null,
        streamingText: "",
      };
    }

    case "ERROR_ADD": {
      return {
        ...state,
        errors: [...state.errors, action.error],
      };
    }

    case "ERRORS_CLEAR": {
      return {
        ...state,
        errors: [],
      };
    }

    // ========== Agent Status ==========

    case "AGENT_STATUS": {
      return {
        ...state,
        agentStatus: action.status,
      };
    }

    default:
      return state;
  }
}
