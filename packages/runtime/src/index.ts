/**
 * @agentxjs/runtime - Runtime for AI Agents
 *
 * @example
 * ```typescript
 * import { createRuntime } from "@agentxjs/runtime";
 * import { createPersistence } from "@agentxjs/persistence";
 * import { sqliteDriver } from "@agentxjs/persistence/sqlite";
 *
 * const persistence = await createPersistence(sqliteDriver({ path: "./data.db" }));
 * const runtime = createRuntime({ persistence, ... });
 *
 * // Use request/response pattern
 * const res = await runtime.request("container_create_request", {
 *   containerId: "my-container"
 * });
 *
 * runtime.on("text_delta", (e) => console.log(e.data.text));
 *
 * await runtime.dispose();
 * ```
 *
 * @packageDocumentation
 */

export { createRuntime, type RuntimeConfig } from "./createRuntime";

// Runtime environment singleton (for advanced use cases like binary distribution)
export { RuntimeEnvironment } from "./RuntimeEnvironment";

// Re-export from @agentxjs/persistence for convenience
export { createPersistence, memoryDriver } from "@agentxjs/persistence";
export type { PersistenceDriver } from "@agentxjs/persistence";
