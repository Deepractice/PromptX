# @agentxjs/runtime

> Runtime for AI Agents - Agent execution, SystemBus, Environment, and complete lifecycle management

## Overview

The `@agentxjs/runtime` package provides complete runtime infrastructure for executing AI agents. It manages the full lifecycle from agent creation to destruction, handles communication through a centralized event bus, and integrates with the Claude SDK.

**Key Features:**

- **Docker-Style Lifecycle**: Definition -> Image -> Agent -> Session pattern
- **Event-Driven Architecture**: Central SystemBus for all runtime communication
- **Image-First Model**: Persistent conversations with transient runtime agents
- **Environment Abstraction**: Pluggable receptor/effector pattern for LLM integration
- **Request/Response Pattern**: Command-based API with correlation support

## Installation

```bash
bun add @agentxjs/runtime
```

## Architecture

```
+------------------------------------------------------------------+
|                           Runtime                                 |
|                                                                   |
|  +----------------------+    +-----------------------------+      |
|  |     SystemBus        |    |      CommandHandler         |      |
|  |  (Event Routing)     |<-->|  (Request/Response Logic)   |      |
|  +----------------------+    +-----------------------------+      |
|           |                                                       |
|           v                                                       |
|  +------------------------------------------------------------+  |
|  |                       Container                             |  |
|  |  +------------------------------------------------------+  |  |
|  |  |                    RuntimeAgent                      |  |  |
|  |  |  +----------------+  +----------------+              |  |  |
|  |  |  |  AgentEngine   |  |   Session      |              |  |  |
|  |  |  | (MealyMachine) |  |   (Storage)    |              |  |  |
|  |  |  +----------------+  +----------------+              |  |  |
|  |  |                                                      |  |  |
|  |  |  +------------------------------------------------+ |  |  |
|  |  |  |              Environment                       | |  |  |
|  |  |  |  +------------------+  +------------------+    | |  |  |
|  |  |  |  |    Receptor      |  |    Effector      |    | |  |  |
|  |  |  |  | (Claude -> Bus)  |  | (Bus -> Claude)  |    | |  |  |
|  |  |  |  +------------------+  +------------------+    | |  |  |
|  |  |  +------------------------------------------------+ |  |  |
|  |  +------------------------------------------------------+  |  |
|  +------------------------------------------------------------+  |
+------------------------------------------------------------------+
```

## Quick Start

```typescript
import { createRuntime, createPersistence, memoryDriver } from "@agentxjs/runtime";

// Create runtime with in-memory storage
const persistence = await createPersistence(memoryDriver());

const runtime = createRuntime({
  persistence,
  llmProvider: {
    provide: () => ({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    }),
  },
  basePath: "./data",
});

// Create container for user
await runtime.request("container_create_request", {
  containerId: "user-123",
});

// Create conversation (image)
const imageRes = await runtime.request("image_create_request", {
  containerId: "user-123",
  config: {
    name: "My Assistant",
    systemPrompt: "You are a helpful assistant.",
  },
});

// Subscribe to text deltas
runtime.on("text_delta", (e) => {
  process.stdout.write(e.data.text);
});

// Send message (auto-runs image if needed)
await runtime.request("message_send_request", {
  imageId: imageRes.data.record.imageId,
  content: "Hello, how are you?",
});

// Cleanup
await runtime.dispose();
```

## Core Components

### Runtime

Top-level API orchestrating all operations. Implements SystemBus interface and delegates to CommandHandler for request processing.

```typescript
const runtime = createRuntime({
  persistence,
  llmProvider: { provide: () => ({ apiKey: "..." }) },
  basePath: "/path/to/.agentx",
  defaultAgent: { name: "Assistant", systemPrompt: "..." },
});
```

### Container

Isolation boundary managing multiple agents. Tracks `imageId -> agentId` mapping for the Image-First model.

### Agent (RuntimeAgent)

Transient runtime entity processing user messages. Created by running an Image, destroyed when stopped.

### Session (RuntimeSession)

Manages conversation history storage and retrieval via persistence layer.

### Image (RuntimeImage)

Persistent conversation entity. Users interact with Images (conversations), while Agents are transient instances.

### SystemBus

Central event bus using RxJS. Supports pub/sub, request/response, priority-based dispatch, and filtering.

```typescript
// Subscribe to events
runtime.on("text_delta", (e) => console.log(e.data.text));
runtime.on(["message_start", "message_stop"], (e) => console.log(e.type));
runtime.onAny((e) => console.log(e.type));

// Request/response pattern
const response = await runtime.request("image_get_request", { imageId: "..." });
```

### Environment

Abstraction for LLM integration using Receptor/Effector pattern:

- **ClaudeReceptor**: Perceives Claude SDK responses, emits DriveableEvents to SystemBus
- **ClaudeEffector**: Subscribes to SystemBus events, sends to Claude SDK

## Command API

### Container Commands

| Command                    | Description            |
| -------------------------- | ---------------------- |
| `container_create_request` | Create a new container |
| `container_get_request`    | Get container by ID    |
| `container_list_request`   | List all containers    |

### Image Commands

| Command                  | Description                       |
| ------------------------ | --------------------------------- |
| `image_create_request`   | Create a new image (conversation) |
| `image_run_request`      | Run an image (create agent)       |
| `image_stop_request`     | Stop an image (destroy agent)     |
| `image_update_request`   | Update image metadata             |
| `image_list_request`     | List all images                   |
| `image_get_request`      | Get image by ID                   |
| `image_delete_request`   | Delete an image                   |
| `image_messages_request` | Get messages for an image         |

### Agent Commands

| Command                     | Description                       |
| --------------------------- | --------------------------------- |
| `message_send_request`      | Send message to agent             |
| `agent_interrupt_request`   | Interrupt agent operation         |
| `agent_get_request`         | Get agent by ID                   |
| `agent_list_request`        | List agents in a container        |
| `agent_destroy_request`     | Destroy an agent                  |
| `agent_destroy_all_request` | Destroy all agents in a container |

## Event Types

### Stream Events (from Environment)

```typescript
{ type: "message_start", data: { message: { id, model } } }
{ type: "text_delta", data: { text: string } }
{ type: "message_stop", data: { stopReason: "end_turn" | "tool_use" | "max_tokens" } }
```

### Lifecycle Events

```typescript
{ type: "container_created", data: { containerId, createdAt } }
{ type: "agent_registered", data: { containerId, agentId, registeredAt } }
{ type: "session_created", data: { sessionId, imageId, containerId, createdAt } }
```

## Configuration

```typescript
interface RuntimeConfig {
  /** Persistence layer for data storage */
  persistence: Persistence;

  /** LLM provider for AI model access */
  llmProvider: LLMProvider<ClaudeLLMConfig>;

  /** Base path for runtime data (containers, workdirs, etc.) */
  basePath: string;

  /** Optional environment factory for dependency injection */
  environmentFactory?: EnvironmentFactory;

  /** Default agent definition used when creating new images */
  defaultAgent?: AgentDefinition;
}
```

## Environment Variables

| Variable             | Description    | Default           |
| -------------------- | -------------- | ----------------- |
| `ANTHROPIC_API_KEY`  | Claude API key | Required          |
| `ANTHROPIC_BASE_URL` | API endpoint   | Anthropic default |
| `LOG_LEVEL`          | Logging level  | `info`            |

## Dependencies

- `@agentxjs/agent` - Agent engine and event processing
- `@agentxjs/common` - Logging, ID generation
- `@agentxjs/persistence` - Storage layer
- `@agentxjs/types` - Type definitions
- `@anthropic-ai/claude-agent-sdk` - Claude SDK integration
- `rxjs` - Reactive event handling

## Related Packages

- [@agentxjs/agent](../agent) - Agent engine and event processing
- [@agentxjs/persistence](../persistence) - Storage layer
- [@agentxjs/types](../types) - Type definitions
- [agentxjs](../agentx) - Unified entry point

## Full Documentation

See [docs/packages/runtime.md](../../docs/packages/runtime.md) for complete documentation including advanced usage, custom environment factories, and integration examples.

## License

MIT
