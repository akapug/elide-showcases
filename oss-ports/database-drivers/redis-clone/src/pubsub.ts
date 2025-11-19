/**
 * Redis Pub/Sub implementation
 */

import * as types from './types';

export class RedisPubSub {
  private client: any;
  private subscriptions: Map<string, Set<types.MessageHandler>> = new Map();
  private patternSubscriptions: Map<string, Set<types.PatternHandler>> = new Map();
  private subscribing: boolean = false;

  constructor(client: any) {
    this.client = client;
  }

  /**
   * Subscribe to channel(s)
   */
  async subscribe(...channels: string[]): Promise<void> {
    if (!this.subscribing) {
      this.subscribing = true;
      this.startListening();
    }

    await this.client.sendCommand(['SUBSCRIBE', ...channels]);

    for (const channel of channels) {
      if (!this.subscriptions.has(channel)) {
        this.subscriptions.set(channel, new Set());
      }
    }
  }

  /**
   * Unsubscribe from channel(s)
   */
  async unsubscribe(...channels: string[]): Promise<void> {
    if (channels.length === 0) {
      // Unsubscribe from all
      await this.client.sendCommand(['UNSUBSCRIBE']);
      this.subscriptions.clear();
    } else {
      await this.client.sendCommand(['UNSUBSCRIBE', ...channels]);
      for (const channel of channels) {
        this.subscriptions.delete(channel);
      }
    }

    if (this.subscriptions.size === 0 && this.patternSubscriptions.size === 0) {
      this.subscribing = false;
    }
  }

  /**
   * Subscribe to pattern(s)
   */
  async psubscribe(...patterns: string[]): Promise<void> {
    if (!this.subscribing) {
      this.subscribing = true;
      this.startListening();
    }

    await this.client.sendCommand(['PSUBSCRIBE', ...patterns]);

    for (const pattern of patterns) {
      if (!this.patternSubscriptions.has(pattern)) {
        this.patternSubscriptions.set(pattern, new Set());
      }
    }
  }

  /**
   * Unsubscribe from pattern(s)
   */
  async punsubscribe(...patterns: string[]): Promise<void> {
    if (patterns.length === 0) {
      // Unsubscribe from all patterns
      await this.client.sendCommand(['PUNSUBSCRIBE']);
      this.patternSubscriptions.clear();
    } else {
      await this.client.sendCommand(['PUNSUBSCRIBE', ...patterns]);
      for (const pattern of patterns) {
        this.patternSubscriptions.delete(pattern);
      }
    }

    if (this.subscriptions.size === 0 && this.patternSubscriptions.size === 0) {
      this.subscribing = false;
    }
  }

  /**
   * Add message handler for channel
   */
  on(channel: string, handler: types.MessageHandler): this {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }
    this.subscriptions.get(channel)!.add(handler);
    return this;
  }

  /**
   * Add pattern message handler
   */
  onPattern(pattern: string, handler: types.PatternHandler): this {
    if (!this.patternSubscriptions.has(pattern)) {
      this.patternSubscriptions.set(pattern, new Set());
    }
    this.patternSubscriptions.get(pattern)!.add(handler);
    return this;
  }

  /**
   * Remove message handler
   */
  off(channel: string, handler: types.MessageHandler): this {
    const handlers = this.subscriptions.get(channel);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.subscriptions.delete(channel);
      }
    }
    return this;
  }

  /**
   * Remove pattern message handler
   */
  offPattern(pattern: string, handler: types.PatternHandler): this {
    const handlers = this.patternSubscriptions.get(pattern);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.patternSubscriptions.delete(pattern);
      }
    }
    return this;
  }

  /**
   * Start listening for messages
   */
  private startListening(): void {
    // Set up native message listener
    this.nativeSetupListener(this.client.connection, (type: string, data: any) => {
      if (type === 'message') {
        const [channel, message] = data;
        this.handleMessage(channel, message);
      } else if (type === 'pmessage') {
        const [pattern, channel, message] = data;
        this.handlePatternMessage(pattern, channel, message);
      }
    });
  }

  /**
   * Handle channel message
   */
  private handleMessage(channel: string, message: string): void {
    const handlers = this.subscriptions.get(channel);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(channel, message);
        } catch (error) {
          console.error('Error in message handler:', error);
        }
      }
    }
  }

  /**
   * Handle pattern message
   */
  private handlePatternMessage(pattern: string, channel: string, message: string): void {
    const handlers = this.patternSubscriptions.get(pattern);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(pattern, channel, message);
        } catch (error) {
          console.error('Error in pattern message handler:', error);
        }
      }
    }
  }

  /**
   * Get active subscriptions
   */
  get channels(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * Get active pattern subscriptions
   */
  get patterns(): string[] {
    return Array.from(this.patternSubscriptions.keys());
  }

  /**
   * Check if in subscription mode
   */
  get isSubscribing(): boolean {
    return this.subscribing;
  }

  // Native bindings
  private nativeSetupListener(connection: any, callback: Function): void {
    (globalThis as any).__elide_redis_setup_pubsub?.(connection, callback);
  }
}
