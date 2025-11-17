# AMQPLIB Clone - Elide RabbitMQ Client

Production-ready RabbitMQ/AMQP 0-9-1 client for Elide, providing a complete feature-compatible implementation of amqplib with full TypeScript support.

## Features

- **Connection Management** - Robust connection handling with automatic reconnection
- **Channels** - Multiple channels per connection for concurrent operations
- **Exchanges** - Support for all exchange types (direct, topic, fanout, headers)
- **Queues** - Complete queue lifecycle management
- **Publishing** - Reliable message publishing with confirmations
- **Consuming** - Push and pull message consumption models
- **Acknowledgments** - Manual and automatic message acknowledgments
- **Prefetch** - Consumer flow control with prefetch limits
- **Dead Letter Exchanges** - Automatic handling of failed messages
- **TypeScript** - Full type safety and IntelliSense support
- **Performance** - Optimized for high throughput and low latency

## Installation

```bash
npm install @elide/amqplib-clone
```

## Quick Start

### Basic Producer

```typescript
import * as amqp from '@elide/amqplib-clone';

const connection = await amqp.connect('amqp://localhost');
const channel = await connection.createChannel();

await channel.assertQueue('my-queue');

channel.sendToQueue('my-queue', Buffer.from('Hello RabbitMQ!'));

await channel.close();
await connection.close();
```

### Basic Consumer

```typescript
import * as amqp from '@elide/amqplib-clone';

const connection = await amqp.connect('amqp://localhost');
const channel = await connection.createChannel();

await channel.assertQueue('my-queue');

await channel.consume('my-queue', (msg) => {
  if (msg) {
    console.log('Received:', msg.content.toString());
    channel.ack(msg);
  }
});
```

## Connection

### Connect with URL

```typescript
// Basic connection
const conn = await amqp.connect('amqp://localhost');

// With credentials
const conn = await amqp.connect('amqp://user:password@localhost');

// With custom port and vhost
const conn = await amqp.connect('amqp://user:password@localhost:5672/my-vhost');

// SSL/TLS
const conn = await amqp.connect('amqps://localhost:5671');
```

### Connect with Options

```typescript
const conn = await amqp.connect({
  protocol: 'amqp',
  hostname: 'localhost',
  port: 5672,
  username: 'guest',
  password: 'guest',
  vhost: '/',
  heartbeat: 60,
  frameMax: 131072,
});
```

### Connection Events

```typescript
connection.on('connect', () => console.log('Connected'));
connection.on('close', () => console.log('Connection closed'));
connection.on('error', (err) => console.error('Connection error:', err));
connection.on('heartbeat', () => console.log('Heartbeat'));
```

## Channels

### Regular Channel

```typescript
const channel = await connection.createChannel();

// Channel events
channel.on('open', () => console.log('Channel opened'));
channel.on('close', () => console.log('Channel closed'));
channel.on('error', (err) => console.error('Channel error:', err));
```

### Confirm Channel (Publisher Confirms)

```typescript
const channel = await connection.createConfirmChannel();

// Publish with callback
channel.sendToQueue('my-queue', Buffer.from('message'), {}, (err, ok) => {
  if (err) {
    console.error('Message not confirmed:', err);
  } else {
    console.log('Message confirmed');
  }
});

// Wait for all confirms
await channel.waitForConfirms();
```

## Queues

### Assert Queue

```typescript
// Create or verify queue exists
const { queue, messageCount, consumerCount } = await channel.assertQueue('my-queue', {
  durable: true,           // Survive broker restart
  exclusive: false,        // Not exclusive to connection
  autoDelete: false,       // Don't delete when unused
  messageTtl: 60000,       // Message TTL in ms
  maxLength: 10000,        // Max queue length
  deadLetterExchange: 'dlx', // DLX for rejected messages
  deadLetterRoutingKey: 'failed',
  maxPriority: 10,         // Enable priority queue
});

console.log(`Queue: ${queue}, Messages: ${messageCount}, Consumers: ${consumerCount}`);
```

### Check Queue

```typescript
// Check if queue exists without creating it
try {
  const info = await channel.checkQueue('my-queue');
  console.log('Queue exists:', info);
} catch (err) {
  console.log('Queue does not exist');
}
```

### Delete Queue

```typescript
// Delete queue
const { messageCount } = await channel.deleteQueue('my-queue', {
  ifUnused: false,  // Delete even if it has consumers
  ifEmpty: false,   // Delete even if it has messages
});

console.log(`Deleted queue with ${messageCount} messages`);
```

### Purge Queue

```typescript
// Remove all messages from queue
const { messageCount } = await channel.purgeQueue('my-queue');
console.log(`Purged ${messageCount} messages`);
```

### Bind Queue to Exchange

```typescript
// Bind queue to exchange
await channel.bindQueue('my-queue', 'my-exchange', 'routing.key');

// Unbind
await channel.unbindQueue('my-queue', 'my-exchange', 'routing.key');
```

## Exchanges

### Assert Exchange

```typescript
// Direct exchange
await channel.assertExchange('my-direct', 'direct', {
  durable: true,
  autoDelete: false,
});

// Topic exchange
await channel.assertExchange('my-topic', 'topic', {
  durable: true,
});

// Fanout exchange
await channel.assertExchange('my-fanout', 'fanout', {
  durable: true,
});

// Headers exchange
await channel.assertExchange('my-headers', 'headers', {
  durable: true,
});
```

### Delete Exchange

```typescript
await channel.deleteExchange('my-exchange', {
  ifUnused: true,  // Only delete if no queue bindings
});
```

### Bind Exchanges

```typescript
// Exchange-to-exchange binding
await channel.bindExchange('destination-exchange', 'source-exchange', 'routing.key');
await channel.unbindExchange('destination-exchange', 'source-exchange', 'routing.key');
```

## Publishing Messages

### Basic Publishing

```typescript
// Publish to exchange
channel.publish('my-exchange', 'routing.key', Buffer.from('message'));

// Send directly to queue
channel.sendToQueue('my-queue', Buffer.from('message'));
```

### Publishing with Options

```typescript
channel.publish('my-exchange', 'routing.key', Buffer.from('message'), {
  persistent: true,          // Persist to disk
  contentType: 'application/json',
  contentEncoding: 'utf-8',
  headers: {
    'x-custom-header': 'value',
  },
  priority: 5,               // Message priority (0-255)
  correlationId: '12345',    // Correlation ID for RPC
  replyTo: 'callback-queue', // Reply queue for RPC
  expiration: '60000',       // Message expiration (ms)
  messageId: 'msg-001',
  timestamp: Date.now(),
  type: 'user.created',
  appId: 'my-app',
});
```

### Publisher Confirms

```typescript
const channel = await connection.createConfirmChannel();

// Individual confirms
channel.sendToQueue('my-queue', Buffer.from('msg1'), {}, (err, ok) => {
  console.log('Message 1 confirmed');
});

channel.sendToQueue('my-queue', Buffer.from('msg2'), {}, (err, ok) => {
  console.log('Message 2 confirmed');
});

// Wait for all pending confirms
await channel.waitForConfirms();
console.log('All messages confirmed');
```

## Consuming Messages

### Push-based Consumption

```typescript
await channel.consume('my-queue', (msg) => {
  if (msg) {
    console.log('Received:', msg.content.toString());
    console.log('Routing key:', msg.fields.routingKey);
    console.log('Headers:', msg.properties.headers);

    // Acknowledge message
    channel.ack(msg);
  }
}, {
  noAck: false,       // Manual acknowledgment
  exclusive: false,   // Allow multiple consumers
  priority: 0,        // Consumer priority
  consumerTag: 'my-consumer',
});
```

### Pull-based Consumption

```typescript
// Get single message
const msg = await channel.get('my-queue', { noAck: false });

if (msg) {
  console.log('Message:', msg.content.toString());
  channel.ack(msg);
} else {
  console.log('No messages available');
}
```

### Cancel Consumer

```typescript
const { consumerTag } = await channel.consume('my-queue', callback);

// Later, cancel the consumer
await channel.cancel(consumerTag);
```

## Message Acknowledgments

### Acknowledge (ACK)

```typescript
// Acknowledge single message
channel.ack(msg);

// Acknowledge all up to this message
channel.ack(msg, true);

// Acknowledge all messages
channel.ackAll();
```

### Negative Acknowledge (NACK)

```typescript
// Reject and requeue
channel.nack(msg, false, true);

// Reject without requeue
channel.nack(msg, false, false);

// Reject all up to this message
channel.nack(msg, true, true);

// Reject all messages
channel.nackAll(true);
```

### Reject

```typescript
// Reject message (requeue)
channel.reject(msg, true);

// Reject message (discard)
channel.reject(msg, false);
```

## Flow Control

### Prefetch

```typescript
// Limit unacknowledged messages per consumer
await channel.prefetch(10);

// Global prefetch (all consumers on channel)
await channel.prefetch(100, true);
```

### Recover

```typescript
// Redeliver all unacknowledged messages
await channel.recover();
```

## Advanced Patterns

### Work Queue

```typescript
// Producer
const channel = await connection.createChannel();
await channel.assertQueue('tasks', { durable: true });

for (let i = 0; i < 100; i++) {
  channel.sendToQueue('tasks', Buffer.from(`Task ${i}`), {
    persistent: true,
  });
}

// Worker
const channel = await connection.createChannel();
await channel.assertQueue('tasks', { durable: true });
await channel.prefetch(1);

await channel.consume('tasks', async (msg) => {
  if (msg) {
    const task = msg.content.toString();
    console.log('Processing:', task);

    // Simulate work
    await processTask(task);

    channel.ack(msg);
  }
}, { noAck: false });
```

### Pub/Sub (Fanout)

```typescript
// Publisher
await channel.assertExchange('logs', 'fanout');
channel.publish('logs', '', Buffer.from('Log message'));

// Subscriber
await channel.assertExchange('logs', 'fanout');
const { queue } = await channel.assertQueue('', { exclusive: true });
await channel.bindQueue(queue, 'logs', '');

await channel.consume(queue, (msg) => {
  if (msg) {
    console.log('Log:', msg.content.toString());
  }
}, { noAck: true });
```

### Routing (Direct Exchange)

```typescript
// Publisher
await channel.assertExchange('direct_logs', 'direct');
channel.publish('direct_logs', 'error', Buffer.from('Error message'));
channel.publish('direct_logs', 'info', Buffer.from('Info message'));

// Consumer (errors only)
const { queue } = await channel.assertQueue('', { exclusive: true });
await channel.bindQueue(queue, 'direct_logs', 'error');

await channel.consume(queue, (msg) => {
  if (msg) {
    console.log('Error:', msg.content.toString());
  }
}, { noAck: true });
```

### Topics

```typescript
// Publisher
await channel.assertExchange('topic_logs', 'topic');
channel.publish('topic_logs', 'user.created', Buffer.from('User created'));
channel.publish('topic_logs', 'user.deleted', Buffer.from('User deleted'));
channel.publish('topic_logs', 'order.shipped', Buffer.from('Order shipped'));

// Consumer (all user events)
await channel.bindQueue(queue, 'topic_logs', 'user.*');

// Consumer (all events)
await channel.bindQueue(queue, 'topic_logs', '#');
```

### RPC Pattern

```typescript
// Server
await channel.consume('rpc_queue', async (msg) => {
  if (msg) {
    const n = parseInt(msg.content.toString());
    const result = fibonacci(n);

    channel.sendToQueue(msg.properties.replyTo!, Buffer.from(result.toString()), {
      correlationId: msg.properties.correlationId,
    });

    channel.ack(msg);
  }
});

// Client
const { queue } = await channel.assertQueue('', { exclusive: true });
const correlationId = generateUuid();

channel.sendToQueue('rpc_queue', Buffer.from('10'), {
  correlationId,
  replyTo: queue,
});

await channel.consume(queue, (msg) => {
  if (msg && msg.properties.correlationId === correlationId) {
    console.log('Result:', msg.content.toString());
  }
}, { noAck: true });
```

### Dead Letter Exchange

```typescript
// Create DLX
await channel.assertExchange('dlx', 'direct');
await channel.assertQueue('failed-messages');
await channel.bindQueue('failed-messages', 'dlx', 'failed');

// Create main queue with DLX
await channel.assertQueue('my-queue', {
  deadLetterExchange: 'dlx',
  deadLetterRoutingKey: 'failed',
  messageTtl: 60000,  // Messages expire after 60s
});

// Failed/expired messages go to DLX
```

## Error Handling

```typescript
import { AMQPError, AMQPConnectionError, AMQPChannelError } from '@elide/amqplib-clone';

try {
  await channel.assertQueue('my-queue');
} catch (error) {
  if (error instanceof AMQPConnectionError) {
    console.error('Connection error:', error);
  } else if (error instanceof AMQPChannelError) {
    console.error('Channel error:', error);
  }
}
```

## Performance Tips

1. **Reuse Connections**: Create one connection per application
2. **Use Multiple Channels**: One channel per thread/operation
3. **Prefetch**: Set appropriate prefetch for workers
4. **Batching**: Publish multiple messages in batches
5. **Persistent Messages**: Only use for critical messages
6. **Confirm Channels**: Use for guaranteed delivery

## Testing

```bash
npm test
```

## Examples

See the `examples/` directory for complete examples.

## License

MIT
