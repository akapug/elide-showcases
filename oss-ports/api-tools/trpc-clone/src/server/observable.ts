/**
 * tRPC Observable - Subscription Implementation
 *
 * Provides observable functionality for subscriptions.
 */

export interface Observer<T> {
  next: (value: T) => void
  error?: (err: any) => void
  complete?: () => void
}

export interface Unsubscribable {
  unsubscribe(): void
}

export type TeardownLogic = Unsubscribable | (() => void) | void

/**
 * Observable class
 */
export class Observable<T> implements AsyncIterable<T> {
  constructor(
    private subscriber: (emit: Observer<T>) => TeardownLogic
  ) {}

  /**
   * Subscribe to observable
   */
  subscribe(observer: Partial<Observer<T>>): Unsubscribable {
    let teardown: TeardownLogic

    const emit: Observer<T> = {
      next: (value: T) => {
        if (observer.next) {
          observer.next(value)
        }
      },
      error: (err: any) => {
        if (observer.error) {
          observer.error(err)
        }
      },
      complete: () => {
        if (observer.complete) {
          observer.complete()
        }
      }
    }

    try {
      teardown = this.subscriber(emit)
    } catch (err) {
      if (observer.error) {
        observer.error(err)
      }
    }

    return {
      unsubscribe: () => {
        if (typeof teardown === 'function') {
          teardown()
        } else if (teardown && 'unsubscribe' in teardown) {
          teardown.unsubscribe()
        }
      }
    }
  }

  /**
   * Async iterator implementation
   */
  [Symbol.asyncIterator](): AsyncIterator<T> {
    const buffer: T[] = []
    const resolvers: Array<(value: IteratorResult<T>) => void> = []
    let completed = false
    let error: any = null

    const subscription = this.subscribe({
      next: (value) => {
        if (resolvers.length > 0) {
          const resolve = resolvers.shift()!
          resolve({ value, done: false })
        } else {
          buffer.push(value)
        }
      },
      error: (err) => {
        error = err
        while (resolvers.length > 0) {
          const resolve = resolvers.shift()!
          resolve({ value: undefined as any, done: true })
        }
      },
      complete: () => {
        completed = true
        while (resolvers.length > 0) {
          const resolve = resolvers.shift()!
          resolve({ value: undefined as any, done: true })
        }
      }
    })

    return {
      next(): Promise<IteratorResult<T>> {
        if (error) {
          return Promise.reject(error)
        }

        if (buffer.length > 0) {
          return Promise.resolve({
            value: buffer.shift()!,
            done: false
          })
        }

        if (completed) {
          return Promise.resolve({
            value: undefined as any,
            done: true
          })
        }

        return new Promise((resolve) => {
          resolvers.push(resolve)
        })
      },

      return(): Promise<IteratorResult<T>> {
        subscription.unsubscribe()
        return Promise.resolve({
          value: undefined as any,
          done: true
        })
      }
    }
  }

  /**
   * Map operator
   */
  map<U>(fn: (value: T) => U): Observable<U> {
    return new Observable((emit) => {
      return this.subscribe({
        next: (value) => emit.next(fn(value)),
        error: (err) => emit.error?.(err),
        complete: () => emit.complete?.()
      })
    })
  }

  /**
   * Filter operator
   */
  filter(fn: (value: T) => boolean): Observable<T> {
    return new Observable((emit) => {
      return this.subscribe({
        next: (value) => {
          if (fn(value)) {
            emit.next(value)
          }
        },
        error: (err) => emit.error?.(err),
        complete: () => emit.complete?.()
      })
    })
  }

  /**
   * Take operator
   */
  take(count: number): Observable<T> {
    return new Observable((emit) => {
      let taken = 0

      const subscription = this.subscribe({
        next: (value) => {
          if (taken < count) {
            emit.next(value)
            taken++

            if (taken === count) {
              emit.complete?.()
              subscription.unsubscribe()
            }
          }
        },
        error: (err) => emit.error?.(err),
        complete: () => emit.complete?.()
      })

      return subscription
    })
  }

  /**
   * First operator
   */
  first(): Promise<T> {
    return new Promise((resolve, reject) => {
      const subscription = this.subscribe({
        next: (value) => {
          resolve(value)
          subscription.unsubscribe()
        },
        error: reject,
        complete: () => {
          reject(new Error('Observable completed without emitting'))
        }
      })
    })
  }
}

/**
 * Create observable
 */
export function observable<T>(
  subscriber: (emit: Observer<T>) => TeardownLogic
): Observable<T> {
  return new Observable(subscriber)
}

/**
 * Create observable from array
 */
export function from<T>(array: T[]): Observable<T> {
  return new Observable((emit) => {
    for (const item of array) {
      emit.next(item)
    }
    emit.complete?.()
  })
}

/**
 * Create observable from promise
 */
export function fromPromise<T>(promise: Promise<T>): Observable<T> {
  return new Observable((emit) => {
    promise
      .then((value) => {
        emit.next(value)
        emit.complete?.()
      })
      .catch((err) => {
        emit.error?.(err)
      })
  })
}

/**
 * Create observable that emits at interval
 */
export function interval(ms: number): Observable<number> {
  return new Observable((emit) => {
    let count = 0
    const timer = setInterval(() => {
      emit.next(count++)
    }, ms)

    return () => clearInterval(timer)
  })
}

/**
 * Merge multiple observables
 */
export function merge<T>(...observables: Observable<T>[]): Observable<T> {
  return new Observable((emit) => {
    const subscriptions = observables.map((obs) =>
      obs.subscribe({
        next: (value) => emit.next(value),
        error: (err) => emit.error?.(err),
        complete: () => {
          // Complete when all observables complete
          if (subscriptions.every((s) => !s)) {
            emit.complete?.()
          }
        }
      })
    )

    return () => {
      subscriptions.forEach((s) => s.unsubscribe())
    }
  })
}
