/**
 * DataLoader - Batching and Caching for GraphQL
 *
 * Provides utilities for batching and caching data loading operations.
 */

export interface DataLoaderOptions<K, V> {
  batch?: boolean
  cache?: boolean
  cacheKeyFn?: (key: K) => any
  cacheMap?: Map<any, Promise<V>>
  maxBatchSize?: number
}

/**
 * DataLoader class for batching and caching
 */
export class DataLoader<K, V> {
  private batchLoadFn: (keys: K[]) => Promise<Array<V | Error>>
  private options: DataLoaderOptions<K, V>
  private cache: Map<any, Promise<V>>
  private queue: Array<{
    key: K
    resolve: (value: V) => void
    reject: (error: Error) => void
  }>
  private batchTimer: any

  constructor(
    batchLoadFn: (keys: K[]) => Promise<Array<V | Error>>,
    options: DataLoaderOptions<K, V> = {}
  ) {
    this.batchLoadFn = batchLoadFn
    this.options = {
      batch: true,
      cache: true,
      maxBatchSize: Infinity,
      ...options
    }
    this.cache = options.cacheMap || new Map()
    this.queue = []
    this.batchTimer = null
  }

  /**
   * Load a single value
   */
  load(key: K): Promise<V> {
    if (this.options.cache) {
      const cacheKey = this.options.cacheKeyFn ? this.options.cacheKeyFn(key) : key
      const cached = this.cache.get(cacheKey)

      if (cached) {
        return cached
      }

      const promise = this.loadInternal(key)
      this.cache.set(cacheKey, promise)

      return promise
    }

    return this.loadInternal(key)
  }

  /**
   * Load multiple values
   */
  loadMany(keys: K[]): Promise<Array<V | Error>> {
    return Promise.all(keys.map(key => this.load(key).catch(error => error)))
  }

  /**
   * Clear cache for a specific key
   */
  clear(key: K): this {
    const cacheKey = this.options.cacheKeyFn ? this.options.cacheKeyFn(key) : key
    this.cache.delete(cacheKey)
    return this
  }

  /**
   * Clear all cache
   */
  clearAll(): this {
    this.cache.clear()
    return this
  }

  /**
   * Prime cache with a value
   */
  prime(key: K, value: V): this {
    const cacheKey = this.options.cacheKeyFn ? this.options.cacheKeyFn(key) : key
    this.cache.set(cacheKey, Promise.resolve(value))
    return this
  }

  /**
   * Internal load implementation
   */
  private loadInternal(key: K): Promise<V> {
    if (!this.options.batch) {
      return this.batchLoadFn([key]).then(values => {
        const value = values[0]
        if (value instanceof Error) {
          throw value
        }
        return value
      })
    }

    return new Promise((resolve, reject) => {
      this.queue.push({ key, resolve, reject })

      if (this.queue.length >= (this.options.maxBatchSize || Infinity)) {
        this.dispatchBatch()
      } else if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => this.dispatchBatch(), 0)
      }
    })
  }

  /**
   * Dispatch batch
   */
  private dispatchBatch(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }

    const queue = this.queue
    this.queue = []

    if (queue.length === 0) {
      return
    }

    const keys = queue.map(item => item.key)

    this.batchLoadFn(keys)
      .then(values => {
        if (values.length !== keys.length) {
          throw new Error(
            `DataLoader batch function must return array of same length as input array. Expected ${keys.length}, got ${values.length}`
          )
        }

        for (let i = 0; i < queue.length; i++) {
          const value = values[i]

          if (value instanceof Error) {
            queue[i].reject(value)
          } else {
            queue[i].resolve(value)
          }
        }
      })
      .catch(error => {
        for (const item of queue) {
          item.reject(error)
        }
      })
  }
}

/**
 * Create a DataLoader instance
 */
export function createDataLoader<K, V>(
  batchLoadFn: (keys: K[]) => Promise<Array<V | Error>>,
  options?: DataLoaderOptions<K, V>
): DataLoader<K, V> {
  return new DataLoader(batchLoadFn, options)
}

/**
 * Example usage:
 *
 * const userLoader = new DataLoader(async (userIds) => {
 *   const users = await db.users.findMany({ where: { id: { in: userIds } } })
 *   return userIds.map(id => users.find(u => u.id === id) || new Error('Not found'))
 * })
 *
 * // In resolver:
 * const user = await userLoader.load(userId)
 */
