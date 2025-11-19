/**
 * Elide AMQPLIB Clone - Channel Implementation
 * AMQP channel operations for queues, exchanges, and messages
 */

import { EventEmitter } from 'events';
import {
  Channel,
  Message,
  AssertQueueOptions,
  AssertQueueReply,
  DeleteQueueOptions,
  DeleteQueueReply,
  PurgeQueueReply,
  AssertExchangeOptions,
  AssertExchangeReply,
  DeleteExchangeOptions,
  PublishOptions,
  ConsumeOptions,
  ConsumeReply,
  GetOptions,
  AMQPChannelError,
  ChannelStats,
} from './types';
import type { ConnectionImpl } from './connection';

export class ChannelImpl extends EventEmitter implements Channel {
  protected open_ = false;
  protected closed = false;
  protected consumers: Map<string, ConsumerState> = new Map();
  protected queues: Map<string, QueueState> = new Map();
  protected exchanges: Map<string, ExchangeState> = new Map();
  protected prefetchCount = 0;
  protected unackedMessages: Map<number, Message> = new Map();
  protected nextDeliveryTag = 1;
  protected stats: ChannelStats = {
    publishCount: 0,
    publishRate: 0,
    deliverCount: 0,
    deliverRate: 0,
    ackCount: 0,
    ackRate: 0,
    unackedMessages: 0,
  };

  constructor(
    protected channelId: number,
    protected connection: ConnectionImpl
  ) {
    super();
  }

  /**
   * Open the channel
   */
  async open(): Promise<void> {
    if (this.open_) {
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 10));
    this.open_ = true;
    this.emit('open');
  }

  /**
   * Assert a queue exists, create if not
   */
  async assertQueue(queue: string, options: AssertQueueOptions = {}): Promise<AssertQueueReply> {
    this.ensureOpen();

    const {
      exclusive = false,
      durable = true,
      autoDelete = false,
      arguments: args = {},
    } = options;

    console.log(`Asserting queue: ${queue}`);

    // Simulate queue assertion
    await new Promise(resolve => setTimeout(resolve, 20));

    const state: QueueState = {
      name: queue,
      durable,
      exclusive,
      autoDelete,
      arguments: args,
      messages: [],
      messageCount: 0,
      consumerCount: 0,
    };

    this.queues.set(queue, state);

    return {
      queue,
      messageCount: state.messageCount,
      consumerCount: state.consumerCount,
    };
  }

  /**
   * Check if a queue exists
   */
  async checkQueue(queue: string): Promise<AssertQueueReply> {
    this.ensureOpen();

    const state = this.queues.get(queue);

    if (!state) {
      throw new AMQPChannelError(`Queue '${queue}' does not exist`);
    }

    return {
      queue,
      messageCount: state.messageCount,
      consumerCount: state.consumerCount,
    };
  }

  /**
   * Delete a queue
   */
  async deleteQueue(queue: string, options: DeleteQueueOptions = {}): Promise<DeleteQueueReply> {
    this.ensureOpen();

    const state = this.queues.get(queue);

    if (!state) {
      throw new AMQPChannelError(`Queue '${queue}' does not exist`);
    }

    const { ifUnused = false, ifEmpty = false } = options;

    if (ifUnused && state.consumerCount > 0) {
      throw new AMQPChannelError(`Queue '${queue}' is in use`);
    }

    if (ifEmpty && state.messageCount > 0) {
      throw new AMQPChannelError(`Queue '${queue}' is not empty`);
    }

    const messageCount = state.messageCount;
    this.queues.delete(queue);

    return { messageCount };
  }

  /**
   * Purge all messages from a queue
   */
  async purgeQueue(queue: string): Promise<PurgeQueueReply> {
    this.ensureOpen();

    const state = this.queues.get(queue);

    if (!state) {
      throw new AMQPChannelError(`Queue '${queue}' does not exist`);
    }

    const messageCount = state.messageCount;
    state.messages = [];
    state.messageCount = 0;

    return { messageCount };
  }

  /**
   * Bind a queue to an exchange
   */
  async bindQueue(queue: string, source: string, pattern: string, args: any = {}): Promise<void> {
    this.ensureOpen();

    console.log(`Binding queue ${queue} to exchange ${source} with pattern ${pattern}`);

    await new Promise(resolve => setTimeout(resolve, 10));

    const queueState = this.queues.get(queue);
    if (queueState) {
      queueState.bindings = queueState.bindings || [];
      queueState.bindings.push({ exchange: source, routingKey: pattern });
    }
  }

  /**
   * Unbind a queue from an exchange
   */
  async unbindQueue(queue: string, source: string, pattern: string, args: any = {}): Promise<void> {
    this.ensureOpen();

    console.log(`Unbinding queue ${queue} from exchange ${source}`);

    await new Promise(resolve => setTimeout(resolve, 10));

    const queueState = this.queues.get(queue);
    if (queueState && queueState.bindings) {
      queueState.bindings = queueState.bindings.filter(
        b => !(b.exchange === source && b.routingKey === pattern)
      );
    }
  }

  /**
   * Assert an exchange exists, create if not
   */
  async assertExchange(
    exchange: string,
    type: string,
    options: AssertExchangeOptions = {}
  ): Promise<AssertExchangeReply> {
    this.ensureOpen();

    const { durable = true, internal = false, autoDelete = false, arguments: args = {} } = options;

    console.log(`Asserting exchange: ${exchange} (${type})`);

    await new Promise(resolve => setTimeout(resolve, 20));

    this.exchanges.set(exchange, {
      name: exchange,
      type,
      durable,
      internal,
      autoDelete,
      arguments: args,
    });

    return { exchange };
  }

  /**
   * Check if an exchange exists
   */
  async checkExchange(exchange: string): Promise<AssertExchangeReply> {
    this.ensureOpen();

    if (!this.exchanges.has(exchange)) {
      throw new AMQPChannelError(`Exchange '${exchange}' does not exist`);
    }

    return { exchange };
  }

  /**
   * Delete an exchange
   */
  async deleteExchange(exchange: string, options: DeleteExchangeOptions = {}): Promise<void> {
    this.ensureOpen();

    console.log(`Deleting exchange: ${exchange}`);

    await new Promise(resolve => setTimeout(resolve, 20));

    this.exchanges.delete(exchange);
  }

  /**
   * Bind an exchange to another exchange
   */
  async bindExchange(destination: string, source: string, pattern: string, args: any = {}): Promise<void> {
    this.ensureOpen();

    console.log(`Binding exchange ${destination} to ${source} with pattern ${pattern}`);

    await new Promise(resolve => setTimeout(resolve, 10));
  }

  /**
   * Unbind an exchange from another exchange
   */
  async unbindExchange(destination: string, source: string, pattern: string, args: any = {}): Promise<void> {
    this.ensureOpen();

    console.log(`Unbinding exchange ${destination} from ${source}`);

    await new Promise(resolve => setTimeout(resolve, 10));
  }

  /**
   * Publish a message to an exchange
   */
  publish(exchange: string, routingKey: string, content: Buffer, options: PublishOptions = {}): boolean {
    this.ensureOpen();

    this.stats.publishCount++;

    const message: Message = {
      content,
      fields: {
        deliveryTag: 0,
        redelivered: false,
        exchange,
        routingKey,
      },
      properties: {
        contentType: options.contentType,
        contentEncoding: options.contentEncoding,
        headers: options.headers,
        deliveryMode: options.deliveryMode ?? (options.persistent ? 2 : 1),
        priority: options.priority,
        correlationId: options.correlationId,
        replyTo: options.replyTo,
        expiration: options.expiration?.toString(),
        messageId: options.messageId,
        timestamp: options.timestamp,
        type: options.type,
        userId: options.userId,
        appId: options.appId,
      },
    };

    // Route message to bound queues
    this.routeMessage(exchange, routingKey, message);

    return true;
  }

  /**
   * Send a message directly to a queue
   */
  sendToQueue(queue: string, content: Buffer, options: PublishOptions = {}): boolean {
    this.ensureOpen();

    this.stats.publishCount++;

    const message: Message = {
      content,
      fields: {
        deliveryTag: 0,
        redelivered: false,
        exchange: '',
        routingKey: queue,
      },
      properties: {
        contentType: options.contentType,
        contentEncoding: options.contentEncoding,
        headers: options.headers,
        deliveryMode: options.deliveryMode ?? (options.persistent ? 2 : 1),
        priority: options.priority,
        correlationId: options.correlationId,
        replyTo: options.replyTo,
        expiration: options.expiration?.toString(),
        messageId: options.messageId,
        timestamp: options.timestamp,
        type: options.type,
        userId: options.userId,
        appId: options.appId,
      },
    };

    const queueState = this.queues.get(queue);

    if (queueState) {
      queueState.messages.push(message);
      queueState.messageCount++;

      // Deliver to consumers
      this.deliverToConsumers(queue);
    }

    return true;
  }

  /**
   * Start consuming from a queue
   */
  async consume(
    queue: string,
    onMessage: (msg: Message | null) => void,
    options: ConsumeOptions = {}
  ): Promise<ConsumeReply> {
    this.ensureOpen();

    const consumerTag = options.consumerTag || `ctag-${Date.now()}-${Math.random()}`;

    const consumer: ConsumerState = {
      tag: consumerTag,
      queue,
      callback: onMessage,
      noAck: options.noAck ?? false,
      exclusive: options.exclusive ?? false,
      priority: options.priority ?? 0,
    };

    this.consumers.set(consumerTag, consumer);

    const queueState = this.queues.get(queue);
    if (queueState) {
      queueState.consumerCount++;
    }

    // Start delivering messages
    setImmediate(() => this.deliverToConsumers(queue));

    return { consumerTag };
  }

  /**
   * Cancel a consumer
   */
  async cancel(consumerTag: string): Promise<void> {
    this.ensureOpen();

    const consumer = this.consumers.get(consumerTag);

    if (consumer) {
      const queueState = this.queues.get(consumer.queue);
      if (queueState) {
        queueState.consumerCount--;
      }

      this.consumers.delete(consumerTag);
    }
  }

  /**
   * Get a single message from a queue
   */
  async get(queue: string, options: GetOptions = {}): Promise<Message | false> {
    this.ensureOpen();

    const queueState = this.queues.get(queue);

    if (!queueState || queueState.messages.length === 0) {
      return false;
    }

    const message = queueState.messages.shift()!;
    queueState.messageCount--;

    message.fields.deliveryTag = this.nextDeliveryTag++;
    message.fields.messageCount = queueState.messageCount;

    if (!options.noAck) {
      this.unackedMessages.set(message.fields.deliveryTag, message);
      this.stats.unackedMessages++;
    }

    this.stats.deliverCount++;

    return message;
  }

  /**
   * Acknowledge a message
   */
  ack(message: Message, allUpTo: boolean = false): void {
    this.ensureOpen();

    if (allUpTo) {
      for (const [tag, msg] of this.unackedMessages) {
        if (tag <= message.fields.deliveryTag) {
          this.unackedMessages.delete(tag);
          this.stats.ackCount++;
          this.stats.unackedMessages--;
        }
      }
    } else {
      this.unackedMessages.delete(message.fields.deliveryTag);
      this.stats.ackCount++;
      this.stats.unackedMessages--;
    }
  }

  /**
   * Acknowledge all messages
   */
  ackAll(): void {
    this.ensureOpen();

    this.stats.ackCount += this.unackedMessages.size;
    this.unackedMessages.clear();
    this.stats.unackedMessages = 0;
  }

  /**
   * Negatively acknowledge a message
   */
  nack(message: Message, allUpTo: boolean = false, requeue: boolean = true): void {
    this.ensureOpen();

    if (allUpTo) {
      for (const [tag, msg] of this.unackedMessages) {
        if (tag <= message.fields.deliveryTag) {
          this.unackedMessages.delete(tag);
          this.stats.unackedMessages--;

          if (requeue) {
            this.requeueMessage(msg);
          }
        }
      }
    } else {
      this.unackedMessages.delete(message.fields.deliveryTag);
      this.stats.unackedMessages--;

      if (requeue) {
        this.requeueMessage(message);
      }
    }
  }

  /**
   * Negatively acknowledge all messages
   */
  nackAll(requeue: boolean = true): void {
    this.ensureOpen();

    if (requeue) {
      for (const message of this.unackedMessages.values()) {
        this.requeueMessage(message);
      }
    }

    this.unackedMessages.clear();
    this.stats.unackedMessages = 0;
  }

  /**
   * Reject a message
   */
  reject(message: Message, requeue: boolean = true): void {
    this.nack(message, false, requeue);
  }

  /**
   * Set prefetch count
   */
  async prefetch(count: number, global: boolean = false): Promise<void> {
    this.ensureOpen();

    console.log(`Setting prefetch count to ${count} (global: ${global})`);

    await new Promise(resolve => setTimeout(resolve, 10));

    this.prefetchCount = count;
  }

  /**
   * Recover unacknowledged messages
   */
  async recover(): Promise<void> {
    this.ensureOpen();

    console.log('Recovering unacknowledged messages');

    for (const message of this.unackedMessages.values()) {
      message.fields.redelivered = true;
      this.requeueMessage(message);
    }

    this.unackedMessages.clear();
    this.stats.unackedMessages = 0;
  }

  /**
   * Close the channel
   */
  async close(): Promise<void> {
    if (this.closed) {
      return;
    }

    console.log(`Closing channel ${this.channelId}`);

    // Cancel all consumers
    for (const consumerTag of this.consumers.keys()) {
      await this.cancel(consumerTag);
    }

    this.closed = true;
    this.open_ = false;
    this.emit('close');
  }

  /**
   * Get channel statistics
   */
  getStats(): ChannelStats {
    return { ...this.stats };
  }

  // Internal methods

  protected ensureOpen(): void {
    if (!this.open_ || this.closed) {
      throw new AMQPChannelError('Channel is not open');
    }
  }

  private routeMessage(exchange: string, routingKey: string, message: Message): void {
    // Find queues bound to this exchange
    for (const [queueName, queueState] of this.queues) {
      if (queueState.bindings) {
        for (const binding of queueState.bindings) {
          if (binding.exchange === exchange && this.matchRoutingKey(binding.routingKey, routingKey)) {
            queueState.messages.push({ ...message });
            queueState.messageCount++;

            this.deliverToConsumers(queueName);
          }
        }
      }
    }
  }

  private matchRoutingKey(pattern: string, key: string): boolean {
    // Simplified routing key matching
    if (pattern === key) return true;
    if (pattern === '#') return true;

    // Convert pattern to regex
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '[^.]+')
      .replace(/#/g, '.*');

    return new RegExp(`^${regexPattern}$`).test(key);
  }

  private deliverToConsumers(queue: string): void {
    const queueState = this.queues.get(queue);

    if (!queueState) return;

    for (const consumer of this.consumers.values()) {
      if (consumer.queue !== queue) continue;

      // Check prefetch limit
      if (this.prefetchCount > 0 && this.unackedMessages.size >= this.prefetchCount) {
        continue;
      }

      while (queueState.messages.length > 0) {
        const message = queueState.messages.shift()!;
        queueState.messageCount--;

        message.fields.deliveryTag = this.nextDeliveryTag++;
        message.fields.consumerTag = consumer.tag;

        if (!consumer.noAck) {
          this.unackedMessages.set(message.fields.deliveryTag, message);
          this.stats.unackedMessages++;
        }

        this.stats.deliverCount++;

        setImmediate(() => consumer.callback(message));

        if (this.prefetchCount > 0 && this.unackedMessages.size >= this.prefetchCount) {
          break;
        }
      }
    }
  }

  private requeueMessage(message: Message): void {
    const queue = message.fields.routingKey;
    const queueState = this.queues.get(queue);

    if (queueState) {
      message.fields.redelivered = true;
      queueState.messages.unshift(message);
      queueState.messageCount++;

      setImmediate(() => this.deliverToConsumers(queue));
    }
  }
}

// Internal types
interface QueueState {
  name: string;
  durable: boolean;
  exclusive: boolean;
  autoDelete: boolean;
  arguments: any;
  messages: Message[];
  messageCount: number;
  consumerCount: number;
  bindings?: Array<{ exchange: string; routingKey: string }>;
}

interface ExchangeState {
  name: string;
  type: string;
  durable: boolean;
  internal: boolean;
  autoDelete: boolean;
  arguments: any;
}

interface ConsumerState {
  tag: string;
  queue: string;
  callback: (msg: Message | null) => void;
  noAck: boolean;
  exclusive: boolean;
  priority: number;
}
