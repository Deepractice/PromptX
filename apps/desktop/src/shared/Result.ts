export type Result<T, E = Error> = 
  | { ok: true; value: T }
  | { ok: false; error: E }

export class ResultUtil {
  static ok<T, E = Error>(value: T): Result<T, E> {
    return { ok: true, value }
  }

  static fail<T, E = Error>(error: E): Result<T, E> {
    return { ok: false, error }
  }

  static isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
    return result.ok
  }

  static isFail<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
    return !result.ok
  }

  static map<T, U, E>(
    result: Result<T, E>,
    fn: (value: T) => U
  ): Result<U, E> {
    if (result.ok) {
      return ResultUtil.ok(fn(result.value))
    }
    return result
  }

  static mapError<T, E, F>(
    result: Result<T, E>,
    fn: (error: E) => F
  ): Result<T, F> {
    if (!result.ok) {
      return ResultUtil.fail(fn(result.error))
    }
    return result as Result<T, F>
  }

  static async fromPromise<T, E = Error>(
    promise: Promise<T>,
    errorHandler?: (error: unknown) => E
  ): Promise<Result<T, E>> {
    try {
      const value = await promise
      return ResultUtil.ok(value)
    } catch (error) {
      const mappedError = errorHandler 
        ? errorHandler(error)
        : error as E
      return ResultUtil.fail(mappedError)
    }
  }

  static unwrap<T, E>(result: Result<T, E>): T {
    if (result.ok) {
      return result.value
    }
    throw result.error
  }

  static unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
    if (result.ok) {
      return result.value
    }
    return defaultValue
  }
}