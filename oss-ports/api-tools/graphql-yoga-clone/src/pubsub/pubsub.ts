/**
 * PubSub - Event Publishing and Subscription System
 *
 * Provides publish/subscribe functionality for GraphQL subscriptions.
 */

export interface PubSubEngine {
  publish(triggerName: string, payload: any): Promise<void>
  subscribe(triggerName: string, onMessage: (payload: any) => void): Promise<number>
  unsubscribe(subId: number): void
  asyncIterator<T>(triggers: string | string[]): AsyncIterator<T>
}

/**
 * In-memory PubSub implementation
 */
export class PubSub implements PubSubEngine {
  private subscriptions: Map<number, Subscription>
  private subIdCounter: number
  private triggerSubscriptions: Map<string, Set<number>>

  constructor() {
    this.subscriptions = new Map()
    this.subIdCounter = 0
    this.triggerSubscriptions = new Map()
  }

  /**
   * Publish a message to all subscribers of a trigger
   */
  async publish(triggerName: string, payload: any): Promise<void> {
    const subIds = this.triggerSubscriptions.get(triggerName)

    if (!subIds || subIds.size === 0) {
      return
    }

    for (const subId of subIds) {
      const subscription = this.subscriptions.get(subId)

      if (subscription) {
        subscription.callback(payload)
      }
    }
  }

  /**
   * Subscribe to a trigger
   */
  async subscribe(
    triggerName: string,
    onMessage: (payload: any) => void
  ): Promise<number> {
    const id = this.subIdCounter++

    this.subscriptions.set(id, {
      id,
      triggerName,
      callback: onMessage
    })

    if (!this.triggerSubscriptions.has(triggerName)) {
      this.triggerSubscriptions.set(triggerName, new Set())
    }

    this.triggerSubscriptions.get(triggerName)!.add(id)

    return id
  }

  /**
   * Unsubscribe from a trigger
   */
  unsubscribe(subId: number): void {
    const subscription = this.subscriptions.get(subId)

    if (!subscription) {
      return
    }

    this.subscriptions.delete(subId)

    const triggerSubs = this.triggerSubscriptions.get(subscription.triggerName)

    if (triggerSubs) {
      triggerSubs.delete(subId)

      if (triggerSubs.size === 0) {
        this.triggerSubscriptions.delete(subscription.triggerName)
      }
    }
  }

  /**
   * Create an async iterator for triggers
   */
  asyncIterator<T>(triggers: string | string[]): AsyncIterator<T> {
    const triggerArray = Array.isArray(triggers) ? triggers : [triggers]
    return new PubSubAsyncIterator<T>(this, triggerArray)
  }

  /**
   * Clear all subscriptions
   */
  clear(): void {
    this.subscriptions.clear()
    this.triggerSubscriptions.clear()
  }
}

interface Subscription {
  id: number
  triggerName: string
  callback: (payload: any) => void
}

/**
 * Async iterator for PubSub
 */
class PubSubAsyncIterator<T> implements AsyncIterator<T> {
  private pubsub: PubSub
  private triggers: string[]
  private subscriptionIds: number[]
  private pullQueue: Array<(value: IteratorResult<T>) => void>
  private pushQueue: T[]
  private listening: boolean
  private eventsArray: string[]

  constructor(pubsub: PubSub, triggers: string[]) {
    this.pubsub = pubsub
    this.triggers = triggers
    this.subscriptionIds = []
    this.pullQueue = []
    this.pushQueue = []
    this.listening = true
    this.eventsArray = []

    this.subscribeAll()
  }

  private async subscribeAll(): Promise<void> {
    for (const trigger of this.triggers) {
      const id = await this.pubsub.subscribe(trigger, this.pushValue.bind(this))
      this.subscriptionIds.push(id)
    }
  }

  private pushValue(payload: T): void {
    if (!this.listening) {
      return
    }

    if (this.pullQueue.length > 0) {
      const resolver = this.pullQueue.shift()!
      resolver({ value: payload, done: false })
    } else {
      this.pushQueue.push(payload)
    }
  }

  private pullValue(): Promise<IteratorResult<T>> {
    return new Promise((resolve) => {
      if (this.pushQueue.length > 0) {
        const value = this.pushQueue.shift()!
        resolve({ value, done: false })
      } else {
        this.pullQueue.push(resolve)
      }
    })
  }

  async next(): Promise<IteratorResult<T>> {
    if (!this.listening) {
      return { value: undefined, done: true }
    }

    return this.pullValue()
  }

  async return(): Promise<IteratorResult<T>> {
    this.emptyQueue()
    return { value: undefined, done: true }
  }

  async throw(error: any): Promise<IteratorResult<T>> {
    this.emptyQueue()
    return Promise.reject(error)
  }

  private emptyQueue(): void {
    if (this.listening) {
      this.listening = false
      this.unsubscribeAll()
      this.pullQueue.forEach(resolve => resolve({ value: undefined, done: true }))
      this.pullQueue = []
      this.pushQueue = []
    }
  }

  private unsubscribeAll(): void {
    for (const id of this.subscriptionIds) {
      this.pubsub.unsubscribe(id)
    }

    this.subscriptionIds = []
  }

  [Symbol.asyncIterator](): AsyncIterator<T> {
    return this
  }
}

/**
 * Create a new PubSub instance
 */
export function createPubSub(): PubSub {
  return new PubSub()
}

/**
 * Filter helper for subscriptions
 */
export function withFilter<T>(
  asyncIteratorFn: () => AsyncIterator<T>,
  filterFn: (payload: T, variables: any, context: any) => boolean | Promise<boolean>
): any {
  return (rootValue: any, args: any, context: any, info: any) => {
    const asyncIterator = asyncIteratorFn()

    return {
      async next() {
        while (true) {
          const result = await asyncIterator.next()

          if (result.done) {
            return result
          }

          const shouldPublish = await filterFn(result.value, args, context)

          if (shouldPublish) {
            return result
          }
        }
      },

      return() {
        return asyncIterator.return ? asyncIterator.return() : Promise.resolve({ value: undefined, done: true })
      },

      throw(error: any) {
        return asyncIterator.throw ? asyncIterator.throw(error) : Promise.reject(error)
      },

      [Symbol.asyncIterator]() {
        return this
      }
    }
  }
}

/**
 * Redis PubSub implementation for distributed systems
 */
export class RedisPubSub implements PubSubEngine {
  private redisPublisher: any
  private redisSubscriber: any
  private subscriptions: Map<number, Subscription>
  private subIdCounter: number
  private channelSubscriptions: Map<string, Set<number>>

  constructor(options: { publisher: any; subscriber: any }) {
    this.redisPublisher = options.publisher
    this.redisSubscriber = options.subscriber
    this.subscriptions = new Map()
    this.subIdCounter = 0
    this.channelSubscriptions = new Map()

    this.redisSubscriber.on('message', (channel: string, message: string) => {
      this.onMessage(channel, JSON.parse(message))
    })
  }

  async publish(triggerName: string, payload: any): Promise<void> {
    await this.redisPublisher.publish(triggerName, JSON.stringify(payload))
  }

  async subscribe(
    triggerName: string,
    onMessage: (payload: any) => void
  ): Promise<number> {
    const id = this.subIdCounter++

    this.subscriptions.set(id, {
      id,
      triggerName,
      callback: onMessage
    })

    if (!this.channelSubscriptions.has(triggerName)) {
      this.channelSubscriptions.set(triggerName, new Set())
      await this.redisSubscriber.subscribe(triggerName)
    }

    this.channelSubscriptions.get(triggerName)!.add(id)

    return id
  }

  unsubscribe(subId: number): void {
    const subscription = this.subscriptions.get(subId)

    if (!subscription) {
      return
    }

    this.subscriptions.delete(subId)

    const channelSubs = this.channelSubscriptions.get(subscription.triggerName)

    if (channelSubs) {
      channelSubs.delete(subId)

      if (channelSubs.size === 0) {
        this.channelSubscriptions.delete(subscription.triggerName)
        this.redisSubscriber.unsubscribe(subscription.triggerName)
      }
    }
  }

  asyncIterator<T>(triggers: string | string[]): AsyncIterator<T> {
    const triggerArray = Array.isArray(triggers) ? triggers : [triggers]
    return new PubSubAsyncIterator<T>(this as any, triggerArray)
  }

  private onMessage(channel: string, message: any): void {
    const subIds = this.channelSubscriptions.get(channel)

    if (!subIds) {
      return
    }

    for (const subId of subIds) {
      const subscription = this.subscriptions.get(subId)

      if (subscription) {
        subscription.callback(message)
      }
    }
  }
}
