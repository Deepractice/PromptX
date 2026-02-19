/**
 * BaseEventHandler - Base class for all event handlers
 *
 * Provides unified error handling and event subscription management.
 * All handlers should extend this class to get automatic error boundary.
 *
 * Pattern:
 * ```
 * class MyHandler extends BaseEventHandler {
 *   protected bindHandlers() {
 *     this.subscribe(
 *       this.bus.on("some_event", (e) => this.handleSomeEvent(e))
 *     );
 *   }
 *
 *   private async handleSomeEvent(event) {
 *     await this.safeHandleAsync(
 *       async () => {
 *         // Business logic
 *       },
 *       {
 *         requestId: event.data.requestId,
 *         operation: "some_operation",
 *       }
 *     );
 *   }
 * }
 * ```
 */

import type { SystemBus, Unsubscribe, ErrorContext } from "@agentxjs/types/runtime/internal";
import type { SystemError } from "@agentxjs/types/event";
import { createLogger } from "@agentxjs/common";

const logger = createLogger("runtime/BaseEventHandler");

/**
 * BaseEventHandler - Abstract base class for event handlers
 */
export abstract class BaseEventHandler {
  protected readonly bus: SystemBus;
  private unsubscribes: Unsubscribe[] = [];

  constructor(bus: SystemBus) {
    this.bus = bus;
  }

  /**
   * Subclasses must implement this to bind event handlers
   */
  protected abstract bindHandlers(): void;

  /**
   * Safe execution wrapper for synchronous handlers
   *
   * Automatically catches errors and emits ErrorEvent.
   */
  protected safeHandle<T>(handler: () => T, context: ErrorContext): T | undefined {
    try {
      return handler();
    } catch (err) {
      this.handleError(err, context);
      return undefined;
    }
  }

  /**
   * Safe execution wrapper for asynchronous handlers
   *
   * Automatically catches errors and emits ErrorEvent.
   */
  protected async safeHandleAsync<T>(
    handler: () => Promise<T>,
    context: ErrorContext
  ): Promise<T | undefined> {
    try {
      return await handler();
    } catch (err) {
      this.handleError(err, context);
      return undefined;
    }
  }

  /**
   * Handle error: log + emit ErrorEvent + optional callback
   */
  protected handleError(err: unknown, context: ErrorContext): void {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;

    // Log error
    logger.error(`Error in ${context.operation || "handler"}`, {
      message,
      requestId: context.requestId,
      details: context.details,
    });

    // Emit ErrorEvent
    const errorEvent: SystemError = {
      type: "system_error",
      timestamp: Date.now(),
      source: context.source || "command",
      category: "error",
      intent: "notification",
      data: {
        message,
        requestId: context.requestId,
        severity: context.severity || "error",
        details: {
          operation: context.operation,
          stack,
          ...context.details,
        },
      },
    };
    this.bus.emit(errorEvent);

    // Optional error callback (e.g., emit error response)
    if (context.onError) {
      try {
        context.onError(err);
      } catch (callbackErr) {
        logger.error("Error in onError callback", { error: callbackErr });
      }
    }
  }

  /**
   * Register subscription and track for cleanup
   */
  protected subscribe(unsubscribe: Unsubscribe): void {
    this.unsubscribes.push(unsubscribe);
  }

  /**
   * Dispose handler and cleanup all subscriptions
   */
  dispose(): void {
    for (const unsubscribe of this.unsubscribes) {
      unsubscribe();
    }
    this.unsubscribes = [];
    logger.debug(`${this.constructor.name} disposed`);
  }
}
