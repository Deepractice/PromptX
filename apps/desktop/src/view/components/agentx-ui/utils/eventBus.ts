/**
 * EventBus - Lightweight event system using mitt
 * Replaces heavy RxJS dependency with a simple, type-safe event emitter
 */

import mitt, { type Emitter } from "mitt";

/**
 * Application Events
 * Define all possible events with their payload types
 */
export type AppEvents = {
  // Session events
  "session:created": { sessionId: string; name?: string };
  "session:selected": { sessionId: string };
  "session:deleted": { sessionId: string };
  "session:updated": { sessionId: string; updates: Record<string, unknown> };

  // Message events
  "message:received": { sessionId: string; content: string; role: string };
  "message:sent": { sessionId: string; content: string };
  "message:streaming": { sessionId: string; delta: string };

  // UI events
  "notification:show": { message: string; type: "success" | "error" | "info" };
  "notification:hide": { id: string };

  // System events
  error: { error: Error; context?: string };
  "loading:start": { source: string };
  "loading:end": { source: string };
};

/**
 * EventBus class wrapper
 * Provides debugging and convenience methods
 */
class EventBus {
  private emitter: Emitter<AppEvents>;
  private debugMode: boolean = false;

  constructor() {
    this.emitter = mitt<AppEvents>();
  }

  /**
   * Emit an event
   */
  emit<K extends keyof AppEvents>(type: K, data: AppEvents[K]): void {
    if (this.debugMode) {
      console.log("[EventBus]", type, data);
    }
    this.emitter.emit(type, data);
  }

  /**
   * Subscribe to an event
   */
  on<K extends keyof AppEvents>(type: K, handler: (data: AppEvents[K]) => void): void {
    this.emitter.on(type, handler);
  }

  /**
   * Unsubscribe from an event
   */
  off<K extends keyof AppEvents>(type: K, handler: (data: AppEvents[K]) => void): void {
    this.emitter.off(type, handler);
  }

  /**
   * Subscribe to all events (use sparingly)
   */
  onAll(handler: (type: keyof AppEvents, data: unknown) => void): void {
    this.emitter.on("*", handler as any);
  }

  /**
   * Clear all event handlers
   */
  clear(): void {
    this.emitter.all.clear();
  }

  /**
   * Enable debug logging
   */
  enableDebug(): void {
    this.debugMode = true;
    if (typeof console !== "undefined") {
      console.log("[EventBus] Debug mode enabled");
    }
  }

  /**
   * Disable debug logging
   */
  disableDebug(): void {
    this.debugMode = false;
    if (typeof console !== "undefined") {
      console.log("[EventBus] Debug mode disabled");
    }
  }
}

// Export singleton instance
export const eventBus: EventBus = new EventBus();

// Enable debug in development (lazy initialization to avoid SSR issues)
// Will be called when first used in browser environment
if (typeof window !== "undefined") {
  // Use setTimeout to defer execution until after module initialization
  setTimeout(() => {
    if (import.meta.env?.DEV) {
      eventBus.enableDebug();
    }
  }, 0);
}
