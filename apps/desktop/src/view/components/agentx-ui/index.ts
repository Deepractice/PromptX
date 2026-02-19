/**
 * AgentX UI
 *
 * React component library for building AI agent interfaces.
 * Provides chat components, hooks for agent binding, and design system.
 *
 * ## Design Principles
 *
 * 1. **Headless + Styled**: Core logic in hooks, styling via Tailwind
 * 2. **Atomic Design**: Elements → Chat → Layout composition
 * 3. **Agent-First**: Components designed for AI streaming UX
 * 4. **Design Tokens**: Semantic colors for AI concepts
 *
 * ## Module Structure
 *
 * | Module             | Purpose                                      |
 * |--------------------|----------------------------------------------|
 * | hooks/             | React hooks (useAgent, useAgentX)            |
 * | components/agent/  | Agent status indicator                       |
 * | components/chat/   | Chat UI (messages, input, streaming)         |
 * | components/elements/| Atomic UI (Button, Input, Card, etc.)       |
 * | components/layout/ | Page layout (Header, Sidebar, etc.)          |
 * | styles/            | Tailwind CSS and design tokens               |
 *
 * ## Key Design Decisions
 *
 * ### 1. Why useAgent Hook for Event Binding?
 *
 * **Problem**: React needs to re-render when agent events arrive.
 * How to connect Agent's event-driven API to React's state model?
 *
 * **Decision**: useAgent hook subscribes to agent events and updates React state.
 *
 * **Flow**:
 * ```
 * Agent → events → useAgent → React state → UI render
 * ```
 *
 * **Benefits**:
 * - Declarative: Just pass agent to hook
 * - Automatic cleanup on unmount
 * - Streaming text accumulation built-in
 * - Error state management included
 *
 * ### 2. Why Separate Streaming Text from Messages?
 *
 * **Problem**: Streaming text needs special handling:
 * - Renders incrementally (character by character)
 * - Not yet a complete message
 * - Should not be in message array
 *
 * **Decision**: `streaming` is separate state from `messages`.
 *
 * **Usage**:
 * ```tsx
 * const { messages, streaming } = useAgent(agent);
 * return (
 *   <>
 *     {messages.map(m => <Message {...m} />)}
 *     {streaming && <StreamingText text={streaming} />}
 *   </>
 * );
 * ```
 *
 * **Benefits**:
 * - Clear separation of complete vs in-progress
 * - Easy to style streaming differently
 * - No message flickering during stream
 *
 * ### 3. Why Design Tokens for AI Concepts?
 *
 * **Problem**: AI interfaces have unique concepts:
 * - "Thinking" state vs "Responding" state
 * - User vs Assistant messages
 * - Tool execution feedback
 *
 * **Decision**: Semantic color tokens for AI concepts:
 * - `primary`: Computational intelligence (Blue)
 * - `secondary`: Generative creativity (Amber)
 * - `accent`: Interactive highlights (Orange)
 *
 * **Benefits**:
 * - Consistent visual language
 * - Easy to theme
 * - Meaningful color associations
 *
 * ### 4. Why Storybook for Development?
 *
 * **Problem**: UI components need isolated development environment.
 *
 * **Decision**: Use Storybook for component development.
 *
 * **Benefits**:
 * - Visual component documentation
 * - Isolated testing of edge cases
 * - Design system reference
 * - Enables UI-first development
 *
 * ### 5. UI-Backend API Consistency (ADR)
 *
 * **Problem**: UI state management can diverge from backend API structure,
 * leading to naming confusion, concept mismatch, and maintenance burden.
 *
 * **Decision**: UI types, hooks, and components MUST align with `agentx-types`:
 *
 * | Backend (agentx)     | UI Hook        | UI Component    |
 * |----------------------|----------------|-----------------|
 * | `agentx.sessions`    | `useSession`   | `SessionPane`   |
 * | `agentx.agents`      | `useAgent`     | `AgentPane`     |
 * | `Session`            | `SessionItem`  | -               |
 * | `Agent`              | -              | -               |
 * | `Message`            | (in useAgent)  | `MessagePane`   |
 *
 * **Rules**:
 * 1. **Type Consistency**: UI types mirror `agentx-types` (e.g., `SessionItem` matches `Session`)
 * 2. **Naming Consistency**: Use backend names (session, not topic/conversation)
 * 3. **No Invented Concepts**: Don't add concepts that don't exist in backend
 * 4. **Studio as Integration**: `Studio` is the ONLY frontend-specific concept,
 *    responsible for integrating UI components with backend hooks
 *
 * **Architecture**:
 * ```
 * Studio (frontend integration layer)
 * ├── useSession (maps to agentx.sessions)
 * ├── useAgent (maps to agentx.agents)
 * └── ContainerView (pure UI layout)
 *     ├── DefinitionPane
 *     ├── SessionPane
 *     ├── AgentPane
 *     └── InputPane
 * ```
 *
 * **Benefits**:
 * - Single source of truth (agentx-types)
 * - No naming confusion across frontend/backend
 * - Easier onboarding (learn once, use everywhere)
 * - Reduced maintenance (changes propagate naturally)
 *
 * ### 6. Isomorphic Agent Architecture (ADR)
 *
 * **Problem**: Browser and server need different implementations (SSE vs local),
 * but application code should be the same.
 *
 * **Decision**: Isomorphic design where browser and server use SAME Agent API:
 *
 * ```
 * Node.js (Server)                    Browser (Client)
 * ─────────────────────────────────────────────────────────
 * const agent = agentx.agents         const runtime = createSSERuntime({
 *   .create(ClaudeAgent, config);       serverUrl, agentId
 *                                     });
 *                                     const agentx = createAgentX(runtime);
 *                                     const agent = agentx.agents.create(def);
 *
 * // SAME API!                        // SAME API!
 * await agent.receive("Hello");       await agent.receive("Hello");
 * agent.on("text_delta", ...);        agent.on("text_delta", ...);
 * ```
 *
 * **Key Insight**: `create()` means different things:
 * - Node.js: Create agent + local ClaudeSDKDriver
 * - Browser: Create local proxy + SSEDriver connects to remote agent
 *
 * **Flow** (Browser):
 * ```
 * 1. POST /agents → server creates agent, returns agentId
 * 2. createSSERuntime({ serverUrl, agentId }) → runtime knows which agent
 * 3. agentx.agents.create(def) → creates local proxy with SSEDriver
 * 4. agent.receive(msg) → SSEDriver POSTs to /agents/:id/messages
 * 5. Events arrive via SSE /agents/:id/sse → agent emits events
 * ```
 *
 * **useAgent is Isomorphic**:
 * ```tsx
 * // Works with ANY agent (local or remote)
 * const { messages, streaming, send } = useAgent(agent);
 * ```
 *
 * **Benefits**:
 * - Write once, run on both platforms
 * - Same hooks work with local and remote agents
 * - Easy to test (mock agent works the same)
 * - Clean separation of transport (Driver) from logic (Agent)
 *
 * @example
 * ```tsx
 * import { useAgent, ChatInput, MessageList } from "@agentxjs/ui";
 * import "@agentxjs/ui/styles.css";
 *
 * function ChatPage({ agent }) {
 *   const { messages, streaming, send, isLoading } = useAgent(agent);
 *
 *   return (
 *     <div>
 *       <MessageList messages={messages} streaming={streaming} />
 *       <ChatInput onSend={send} disabled={isLoading} />
 *     </div>
 *   );
 * }
 * ```
 *
 * @packageDocumentation
 */

// Import global styles (will be extracted during build)
import "./styles/globals.css";

// Re-export components from api layer
export * from "./api";

// Re-export types
export * from "./types";
