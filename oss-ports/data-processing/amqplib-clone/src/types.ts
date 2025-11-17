/**
 * Elide AMQPLIB Clone - Type Definitions
 * Complete TypeScript types for AMQP/RabbitMQ client
 */

// Connection Types
export interface ConnectionOptions {
  protocol?: 'amqp' | 'amqps';
  hostname?: string;
  port?: number;
  username?: string;
  password?: string;
  locale?: string;
  frameMax?: number;
  heartbeat?: number;
  vhost?: string;
  timeout?: number;
}

export interface Connection {
  createChannel(): Promise<Channel>;
  createConfirmChannel(): Promise<ConfirmChannel>;
  close(): Promise<void>;
  on(event: string, callback: Function): void;
  once(event: string, callback: Function): void;
  removeListener(event: string, callback: Function): void;
}

// Channel Types
export interface Channel {
  // Queue operations
  assertQueue(queue: string, options?: AssertQueueOptions): Promise<AssertQueueReply>;
  checkQueue(queue: string): Promise<AssertQueueReply>;
  deleteQueue(queue: string, options?: DeleteQueueOptions): Promise<DeleteQueueReply>;
  purgeQueue(queue: string): Promise<PurgeQueueReply>;
  bindQueue(queue: string, source: string, pattern: string, args?: any): Promise<void>;
  unbindQueue(queue: string, source: string, pattern: string, args?: any): Promise<void>;

  // Exchange operations
  assertExchange(exchange: string, type: string, options?: AssertExchangeOptions): Promise<AssertExchangeReply>;
  checkExchange(exchange: string): Promise<AssertExchangeReply>;
  deleteExchange(exchange: string, options?: DeleteExchangeOptions): Promise<void>;
  bindExchange(destination: string, source: string, pattern: string, args?: any): Promise<void>;
  unbindExchange(destination: string, source: string, pattern: string, args?: any): Promise<void>;

  // Publishing
  publish(exchange: string, routingKey: string, content: Buffer, options?: PublishOptions): boolean;
  sendToQueue(queue: string, content: Buffer, options?: PublishOptions): boolean;

  // Consuming
  consume(queue: string, onMessage: (msg: Message | null) => void, options?: ConsumeOptions): Promise<ConsumeReply>;
  cancel(consumerTag: string): Promise<void>;
  get(queue: string, options?: GetOptions): Promise<Message | false>;

  // Acknowledgments
  ack(message: Message, allUpTo?: boolean): void;
  ackAll(): void;
  nack(message: Message, allUpTo?: boolean, requeue?: boolean): void;
  nackAll(requeue?: boolean): void;
  reject(message: Message, requeue?: boolean): void;

  // Prefetch
  prefetch(count: number, global?: boolean): Promise<void>;

  // Flow control
  recover(): Promise<void>;

  // Channel management
  close(): Promise<void>;
  on(event: string, callback: Function): void;
  once(event: string, callback: Function): void;
  removeListener(event: string, callback: Function): void;
}

export interface ConfirmChannel extends Channel {
  publish(
    exchange: string,
    routingKey: string,
    content: Buffer,
    options?: PublishOptions,
    callback?: (err: Error | null, ok: boolean) => void
  ): boolean;

  sendToQueue(
    queue: string,
    content: Buffer,
    options?: PublishOptions,
    callback?: (err: Error | null, ok: boolean) => void
  ): boolean;

  waitForConfirms(): Promise<void>;
}

// Queue Options
export interface AssertQueueOptions {
  exclusive?: boolean;
  durable?: boolean;
  autoDelete?: boolean;
  arguments?: any;
  messageTtl?: number;
  expires?: number;
  deadLetterExchange?: string;
  deadLetterRoutingKey?: string;
  maxLength?: number;
  maxPriority?: number;
}

export interface AssertQueueReply {
  queue: string;
  messageCount: number;
  consumerCount: number;
}

export interface DeleteQueueOptions {
  ifUnused?: boolean;
  ifEmpty?: boolean;
}

export interface DeleteQueueReply {
  messageCount: number;
}

export interface PurgeQueueReply {
  messageCount: number;
}

// Exchange Options
export interface AssertExchangeOptions {
  durable?: boolean;
  internal?: boolean;
  autoDelete?: boolean;
  alternateExchange?: string;
  arguments?: any;
}

export interface AssertExchangeReply {
  exchange: string;
}

export interface DeleteExchangeOptions {
  ifUnused?: boolean;
}

// Publishing Options
export interface PublishOptions {
  expiration?: string | number;
  userId?: string;
  CC?: string | string[];
  mandatory?: boolean;
  persistent?: boolean;
  deliveryMode?: number;
  BCC?: string | string[];
  contentType?: string;
  contentEncoding?: string;
  headers?: any;
  priority?: number;
  correlationId?: string;
  replyTo?: string;
  messageId?: string;
  timestamp?: number;
  type?: string;
  appId?: string;
}

// Consuming Options
export interface ConsumeOptions {
  consumerTag?: string;
  noLocal?: boolean;
  noAck?: boolean;
  exclusive?: boolean;
  priority?: number;
  arguments?: any;
}

export interface ConsumeReply {
  consumerTag: string;
}

export interface GetOptions {
  noAck?: boolean;
}

// Message Types
export interface Message {
  content: Buffer;
  fields: MessageFields;
  properties: MessageProperties;
}

export interface MessageFields {
  deliveryTag: number;
  redelivered: boolean;
  exchange: string;
  routingKey: string;
  messageCount?: number;
  consumerTag?: string;
}

export interface MessageProperties {
  contentType?: string;
  contentEncoding?: string;
  headers?: any;
  deliveryMode?: number;
  priority?: number;
  correlationId?: string;
  replyTo?: string;
  expiration?: string;
  messageId?: string;
  timestamp?: number;
  type?: string;
  userId?: string;
  appId?: string;
  clusterId?: string;
}

// Error Types
export class AMQPError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AMQPError';
  }
}

export class AMQPConnectionError extends AMQPError {
  constructor(message: string) {
    super(message, 'CONNECTION_ERROR');
    this.name = 'AMQPConnectionError';
  }
}

export class AMQPChannelError extends AMQPError {
  constructor(message: string) {
    super(message, 'CHANNEL_ERROR');
    this.name = 'AMQPChannelError';
  }
}

// Statistics Types
export interface ChannelStats {
  publishCount: number;
  publishRate: number;
  deliverCount: number;
  deliverRate: number;
  ackCount: number;
  ackRate: number;
  unackedMessages: number;
}

export interface ConnectionStats {
  channelCount: number;
  framesSent: number;
  framesReceived: number;
  bytesSent: number;
  bytesReceived: number;
}
