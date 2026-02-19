# @agentxjs/runtime

## 1.9.0

### Minor Changes

- 8f84a87: Add SDK warmup and UI hook tests

  **Runtime Package**:
  - Add `warmup()` method to `SDKQueryLifecycle` for pre-initializing Claude SDK
  - Add `warmup()` method to `ClaudeEffector` and `ClaudeEnvironment`
  - RuntimeAgent now calls warmup() on construction (fire-and-forget)
  - Reduces first message latency by starting SDK subprocess early

  **Types Package**:
  - Add optional `warmup()` method to `Environment` interface

  **UI Package**:
  - Add happy-dom test setup for React hook testing in Bun
  - Add useAgent hook tests for event filtering (imageId matching)

### Patch Changes

- Updated dependencies [8f84a87]
- Updated dependencies [8f84a87]
  - @agentxjs/common@1.9.0
  - @agentxjs/persistence@1.9.0
  - @agentxjs/types@1.9.0
  - @agentxjs/agent@1.9.0

## 1.8.1

### Patch Changes

- @agentxjs/persistence@1.8.1
- @agentxjs/agent@1.8.1
- @agentxjs/types@1.8.1
- @agentxjs/common@1.8.1

## 1.8.0

### Patch Changes

- @agentxjs/persistence@1.8.0
- @agentxjs/agent@1.8.0
- @agentxjs/types@1.8.0
- @agentxjs/common@1.8.0

## 1.7.0

### Patch Changes

- Updated dependencies [09b990b]
  - @agentxjs/types@1.7.0
  - @agentxjs/agent@1.7.0
  - @agentxjs/common@1.7.0
  - @agentxjs/persistence@1.7.0

## 1.6.0

### Patch Changes

- 51eab14: fix(runtime): resolve memory leak and timeout issues in ClaudeEffector (#196)

  **Memory Leak Fix:**
  - Fix `resetState()` to properly terminate Claude subprocess by calling `promptSubject.complete()` and `claudeQuery.interrupt()` before resetting state
  - Fix `dispose()` to call `claudeQuery.interrupt()` before cleanup to ensure subprocess termination
  - Fix error handling to always call `resetState()` on any error (not just abort errors) to prevent stale state
  - Add `AGENTX_ENVIRONMENT=true` environment variable to mark AgentX-spawned processes for debugging

  **Timeout Mechanism Fix:**
  - Refactor timeout handling to use RxJS `timeout()` operator for request-response correlation
  - Add `pendingRequest$` Subject to track active requests and auto-cancel timeout when result is received
  - Replace manual `setTimeout/clearTimeout` with RxJS-managed timeout that properly fires even after `send()` returns
  - On timeout, call `claudeQuery.interrupt()` and emit timeout error to receptor

  Closes #196

- 51eab14: feat(portagent): add PromptX MCP server as default agent

  **Portagent:**
  - Add `defaultAgent.ts` with PromptX MCP server configuration
  - Integrate default agent into server startup
  - Add `ENABLE_PROMPTX` environment variable to control (default: enabled)
  - Update Dockerfile to install `@promptx/cli` globally
  - Add multi-stage Dockerfile with `--target local` for development builds

  **Runtime:**
  - Increase default request timeout from 30s to 10 minutes (600000ms)
  - Better support for long-running tool executions and code generation

- 51eab14: refactor(runtime): extract SDKQueryLifecycle from ClaudeEffector

  Extract SDK lifecycle management into a dedicated `SDKQueryLifecycle` class:
  - `SDKQueryLifecycle`: Handles SDK query initialization, background listener, interrupt, reset, and dispose
  - `ClaudeEffector`: Now focuses on event coordination and timeout management, delegates SDK operations to lifecycle

  This separation improves:
  - Single responsibility: Each class has a clear purpose
  - Testability: SDK lifecycle can be tested independently
  - Maintainability: Smaller, focused classes are easier to understand and modify
  - @agentxjs/persistence@1.6.0
  - @agentxjs/agent@1.6.0
  - @agentxjs/types@1.6.0
  - @agentxjs/common@1.6.0

## 1.5.11

### Patch Changes

- cf039bb: feat(persistence): add Node.js 22+ compatibility for SQLite driver

  The SQLite driver now automatically detects the runtime environment:
  - Bun: uses `bun:sqlite` (built-in)
  - Node.js 22+: uses `node:sqlite` (built-in)

  This fixes the `ERR_UNSUPPORTED_ESM_URL_SCHEME` error when running on Node.js.

  Also adds `engines.node >= 22.0.0` constraint to all packages.

- Updated dependencies [cf039bb]
  - @agentxjs/persistence@1.5.11
  - @agentxjs/types@1.5.11
  - @agentxjs/common@1.5.11
  - @agentxjs/agent@1.5.11

## 1.5.10

### Patch Changes

- Updated dependencies [363d42d]
  - @agentxjs/persistence@1.5.10
  - @agentxjs/agent@1.5.10
  - @agentxjs/types@1.5.10
  - @agentxjs/common@1.5.10

## 1.5.9

### Patch Changes

- @agentxjs/persistence@1.5.9
- @agentxjs/agent@1.5.9
- @agentxjs/types@1.5.9
- @agentxjs/common@1.5.9

## 1.5.8

### Patch Changes

- @agentxjs/persistence@1.5.8
- @agentxjs/agent@1.5.8
- @agentxjs/types@1.5.8
- @agentxjs/common@1.5.8

## 1.5.7

### Patch Changes

- @agentxjs/persistence@1.5.7
- @agentxjs/agent@1.5.7
- @agentxjs/types@1.5.7
- @agentxjs/common@1.5.7

## 1.5.6

### Patch Changes

- Updated dependencies [cc51adb]
  - @agentxjs/common@1.5.6
  - @agentxjs/agent@1.5.6
  - @agentxjs/persistence@1.5.6
  - @agentxjs/types@1.5.6

## 1.5.5

### Patch Changes

- Updated dependencies [6d6df00]
  - @agentxjs/common@1.5.5
  - @agentxjs/agent@1.5.5
  - @agentxjs/persistence@1.5.5
  - @agentxjs/types@1.5.5

## 1.5.4

### Patch Changes

- Updated dependencies [b15f05a]
  - @agentxjs/common@1.5.4
  - @agentxjs/agent@1.5.4
  - @agentxjs/persistence@1.5.4
  - @agentxjs/types@1.5.4

## 1.5.3

### Patch Changes

- Updated dependencies [07bb2b0]
  - @agentxjs/persistence@1.5.3
  - @agentxjs/agent@1.5.3
  - @agentxjs/types@1.5.3
  - @agentxjs/common@1.5.3

## 1.5.2

### Patch Changes

- Updated dependencies [89b8c9d]
  - @agentxjs/persistence@1.5.2
  - @agentxjs/agent@1.5.2
  - @agentxjs/types@1.5.2
  - @agentxjs/common@1.5.2

## 1.5.1

### Patch Changes

- @agentxjs/agent@1.5.1
- @agentxjs/types@1.5.1
- @agentxjs/common@1.5.1

## 1.5.0

### Minor Changes

- dcde556: Migrate from pnpm to Bun as package manager and runtime
  - Replace pnpm with Bun for package management and script execution
  - Update GitHub workflows to use oven-sh/setup-bun
  - Fix CSS loading in Vite dev mode with postcss-import resolver
  - Unify Tailwind to version 3.x (remove 4.x dependencies)
  - Update TypeScript config: moduleResolution "bundler", add bun-types
  - Support external DOTENV_CONFIG_PATH injection for dev environment

### Patch Changes

- @agentxjs/agent@1.5.0
- @agentxjs/types@1.5.0
- @agentxjs/common@1.5.0

## 1.4.0

### Patch Changes

- 38217f0: Add multimodal content support (images and files/PDFs)
  - Add ImageBlock and FileBlock components for displaying attachments
  - Add MessageContent component for rendering multimodal messages
  - Update InputPane with attachment support (paste, drag & drop, file picker)
  - Expand drag & drop zone to full Chat area with dark overlay
  - Accept all file types by default
  - Simplify toolbar to emoji + folder buttons (WeChat style)
  - Enable full multimodal content flow from UI to runtime

- Updated dependencies [38217f0]
  - @agentxjs/types@1.4.0
  - @agentxjs/agent@1.4.0
  - @agentxjs/common@1.4.0

## 1.3.0

### Patch Changes

- @agentxjs/agent@1.3.0
- @agentxjs/types@1.3.0
- @agentxjs/common@1.3.0

## 1.2.0

### Minor Changes

- 884eb6a: feat: MCP configuration refactor - ImageRecord as single source of truth
  - Add `mcpServers` field to ImageRecord for persistent storage
  - Add `defaultAgent` to LocalConfig for system-level agent defaults
  - RuntimeAgent reads config (name, systemPrompt, mcpServers) from ImageRecord
  - Export McpServerConfig from runtime/internal barrel
  - Dev-server uses stdio transport for MCP servers

### Patch Changes

- Updated dependencies [884eb6a]
  - @agentxjs/types@1.2.0
  - @agentxjs/agent@1.2.0
  - @agentxjs/common@1.2.0

## 1.1.4

### Patch Changes

- @agentxjs/agent@1.1.4
- @agentxjs/types@1.1.4
- @agentxjs/common@1.1.4

## 1.1.3

### Patch Changes

- Updated dependencies [2068a66]
  - @agentxjs/agent@1.1.3
  - @agentxjs/types@1.1.3
  - @agentxjs/common@1.1.3

## 1.1.2

## 1.1.1

## 1.1.0

### Patch Changes

- 5749112: refactor(ui): unify assistant message lifecycle with single component

  **Major Changes:**
  - Consolidated `ThinkingMessage` and `StreamingMessage` into a single `AssistantMessage` component that handles all lifecycle states
  - Added message-level status types: `UserMessageStatus` and `AssistantMessageStatus`
  - Implemented complete status flow: `queued → thinking → responding → success`
  - Created comprehensive Stories for `AssistantMessage` and `ToolMessage` components

  **Technical Improvements:**
  - Applied single responsibility principle - one component manages all assistant message states
  - Added `useAgent` hook to manage assistant message status transitions automatically
  - Improved Chat component with unified message rendering logic
  - Fixed `RuntimeOperations.getImageMessages` type signature to use proper `Message[]` type

  **UI Enhancements:**
  - `queued` state: "Queue..." with animated dots
  - `thinking` state: "Thinking..." with animated dots
  - `responding` state: Streaming text with cursor animation
  - `success` state: Complete rendered message

  This refactoring significantly improves code maintainability and provides a clearer mental model for message lifecycle management.

## 1.0.2

## 1.0.1

## 1.0.0

## 0.1.9

## 0.1.8

## 0.1.7

### Patch Changes

- da67096: fix(runtime): pass sandbox workdir path as cwd to Claude SDK

  Previously, the cwd parameter was not being passed from RuntimeAgent to ClaudeEnvironment, causing the Claude SDK to run in the default working directory instead of the agent's isolated sandbox workdir. This fix ensures each agent operates within its designated working directory at `~/.agentx/containers/{containerId}/workdirs/{agentId}/`.

## 0.1.6

### Patch Changes

- 2474559: fix: properly configure SDK subprocess environment
  - Properly copy process.env to ensure PATH is available for SDK subprocess
  - Add stderr callback for debugging SDK subprocess errors

## 0.1.5

### Patch Changes

- 275f120: fix: correct Claude Agent SDK options configuration
  - Remove incorrect `executable` option (was passing process.execPath instead of 'node'/'bun'/'deno')
  - Add required `allowDangerouslySkipPermissions: true` when using `bypassPermissions` mode

## 0.1.4

### Patch Changes

- faa35d4: fix: remove private packages from npm dependencies
  - Move internal packages to devDependencies
  - Bundle via tsup noExternal config
  - Fixes npm install errors for end users

## 0.1.3

### Patch Changes

- 02171e5: fix: remove private packages from published dependencies

  Move @agentxjs/types, @agentxjs/common, @agentxjs/agent from dependencies
  to devDependencies. These packages are bundled via tsup noExternal config
  and should not appear in the published package.json dependencies.

## 0.1.2

### Patch Changes

- 0fa60d4: fix: bundle internal packages to avoid npm dependency issues
  - Configure tsup to bundle @agentxjs/types, @agentxjs/common, @agentxjs/agent
  - Remove @agentxjs/types dependency from portagent
  - These private packages are now bundled instead of being external dependencies

## 0.1.1

### Patch Changes

- aa60143: test: verify CI publish workflow
