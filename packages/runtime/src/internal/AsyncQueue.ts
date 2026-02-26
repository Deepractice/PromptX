/**
 * AsyncQueue - Lock-free async queue for producer-consumer pattern
 *
 * Solves the classic race condition in push/pull patterns:
 * - Producer pushes items
 * - Consumer pulls items via async iteration
 *
 * Key insight: When an item arrives, we check if there's a waiting consumer.
 * If yes, deliver directly. If no, buffer the item.
 *
 * This is the same pattern used in:
 * - Go channels
 * - Rust async channels
 * - main branch's SSEDriver
 *
 * @example
 * ```typescript
 * const queue = new AsyncQueue<Event>();
 *
 * // Producer side
 * bus.on('event', (e) => queue.push(e));
 *
 * // Consumer side (no race condition!)
 * for await (const event of queue) {
 *   console.log(event);
 * }
 * ```
 */

/**
 * AsyncQueue - Thread-safe async queue
 */
export class AsyncQueue<T> {
  private buffer: T[] = [];
  private waiting: ((result: IteratorResult<T>) => void)[] = [];
  private closed = false;

  /**
   * Push an item to the queue
   *
   * If there's a waiting consumer, deliver directly (no buffering).
   * Otherwise, buffer the item for later consumption.
   */
  push(item: T): void {
    if (this.closed) return;

    // Key: Check if there's a waiting consumer FIRST
    if (this.waiting.length > 0) {
      // Deliver directly to waiting consumer (no race condition)
      const resolve = this.waiting.shift()!;
      resolve({ done: false, value: item });
    } else {
      // No waiting consumer, buffer the item
      this.buffer.push(item);
    }
  }

  /**
   * Close the queue
   *
   * Signals end of stream. All waiting consumers will receive { done: true }.
   * Future pushes are ignored.
   */
  close(): void {
    if (this.closed) return;
    this.closed = true;

    // Notify all waiting consumers that stream is done
    for (const resolve of this.waiting) {
      resolve({ done: true, value: undefined as unknown as T });
    }
    this.waiting = [];
  }

  /**
   * Check if queue is closed
   */
  isClosed(): boolean {
    return this.closed;
  }

  /**
   * Async iterator implementation
   *
   * Allows using `for await (const item of queue)` syntax.
   */
  async *[Symbol.asyncIterator](): AsyncGenerator<T, void, undefined> {
    while (true) {
      // Check buffer first
      if (this.buffer.length > 0) {
        yield this.buffer.shift()!;
        continue;
      }

      // Buffer empty, check if closed
      if (this.closed) {
        return;
      }

      // Wait for next item
      const result = await new Promise<IteratorResult<T>>((resolve) => {
        // Double-check buffer (item might have arrived while we were setting up)
        if (this.buffer.length > 0) {
          resolve({ done: false, value: this.buffer.shift()! });
          return;
        }

        // Double-check closed status
        if (this.closed) {
          resolve({ done: true, value: undefined as unknown as T });
          return;
        }

        // Register as waiting consumer
        this.waiting.push(resolve);
      });

      if (result.done) {
        return;
      }

      yield result.value;
    }
  }
}
