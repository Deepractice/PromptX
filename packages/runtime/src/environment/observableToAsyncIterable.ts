/**
 * Convert RxJS Observable to AsyncIterable
 *
 * Utility for converting Observable streams to AsyncIterable
 * for use with SDKs that accept AsyncIterable input.
 */

import type { Observable } from "rxjs";

export async function* observableToAsyncIterable<T>(observable: Observable<T>): AsyncIterable<T> {
  const queue: T[] = [];
  let resolve: ((value: IteratorResult<T>) => void) | null = null;
  let reject: ((error: Error) => void) | null = null;
  let done = false;
  let error: Error | null = null;

  const subscription = observable.subscribe({
    next: (value) => {
      if (resolve) {
        resolve({ value, done: false });
        resolve = null;
        reject = null;
      } else {
        queue.push(value);
      }
    },
    error: (err) => {
      error = err instanceof Error ? err : new Error(String(err));
      done = true;
      if (reject) {
        reject(error);
        resolve = null;
        reject = null;
      }
    },
    complete: () => {
      done = true;
      if (resolve) {
        resolve({ value: undefined as any, done: true });
        resolve = null;
        reject = null;
      }
    },
  });

  try {
    while (!done || queue.length > 0) {
      if (error) {
        throw error;
      }

      if (queue.length > 0) {
        yield queue.shift()!;
      } else if (!done) {
        const result = await new Promise<{ value: T; done: false } | { done: true }>((res, rej) => {
          resolve = (iterResult) => {
            if (iterResult.done) {
              done = true;
              res({ done: true });
            } else {
              res({ value: iterResult.value, done: false });
            }
          };
          reject = rej;
        });

        if (!result.done) {
          yield result.value;
        }
      }
    }
  } finally {
    subscription.unsubscribe();
  }
}
