/**
 * React Hooks for AgentX integration
 *
 * Image-First Architecture:
 * - Image = persistent conversation entity
 * - Agent = transient runtime instance (auto-activated)
 * - Session = internal message storage (not exposed to UI)
 *
 * Conversation-First, Block-Based Design:
 * - useAgent returns ConversationData[] directly for UI rendering
 * - Conversation = one party's complete utterance (user, assistant, error)
 * - Block = content unit within AssistantConversation (TextBlock, ToolBlock, etc.)
 *
 * Hooks:
 * - useAgentX: Create and manage AgentX instance
 * - useAgent: Subscribe to agent events, returns ConversationData[]
 * - useImages: Manage conversations (list, create, run, stop, delete)
 *
 * @example
 * ```tsx
 * import { useAgentX, useAgent, useImages } from "@agentxjs/ui";
 *
 * function App() {
 *   const agentx = useAgentX("ws://localhost:5200");
 *   const [currentImageId, setCurrentImageId] = useState<string | null>(null);
 *
 *   // Image management (conversations)
 *   const { images, createImage, runImage, stopImage, deleteImage } = useImages(agentx);
 *
 *   // Current conversation - use imageId, agent auto-activates on first message
 *   const { conversations, streamingText, currentTextBlockId, send, isLoading } = useAgent(agentx, currentImageId);
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

export {
  useAgent,
  type UseAgentResult,
  type UseAgentOptions,
  type AgentStatus,
  type ConversationData,
  type UserConversationData,
  type AssistantConversationData,
  type ErrorConversationData,
  type BlockData,
  type TextBlockData,
  type ToolBlockData,
  type UserConversationStatus,
  type AssistantConversationStatus,
  type UIError,
} from "./useAgent";

export { useAgentX } from "./useAgentX";

export { useImages, type UseImagesResult, type UseImagesOptions } from "./useImages";

export { useIsMobile, MOBILE_BREAKPOINT } from "./useIsMobile";
