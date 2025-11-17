# KafkaJS Clone - Elide Kafka Client

Production-ready Apache Kafka client for Elide, providing a complete feature-compatible implementation of KafkaJS with full TypeScript support.

## Features

- **Producer API** - High-performance message production with batching and compression
- **Consumer API** - Robust message consumption with consumer groups and rebalancing
- **Admin API** - Complete cluster management operations
- **Transactions** - Full transactional support for exactly-once semantics
- **SASL Authentication** - Multiple authentication mechanisms (PLAIN, SCRAM, OAuth)
- **Compression** - Support for GZIP, Snappy, LZ4, and ZSTD compression
- **Idempotent Producer** - Automatic deduplication for at-least-once delivery
- **Error Handling** - Comprehensive retry logic and error recovery
- **TypeScript** - Full type safety and IntelliSense support
- **Performance** - Optimized for high throughput and low latency

## Installation

```bash
npm install @elide/kafkajs-clone
```

## Quick Start

### Producer Example

```typescript
import { Kafka } from '@elide/kafkajs-clone';

const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092'],
});

const producer = kafka.producer();

await producer.connect();

// Send messages
await producer.send({
  topic: 'my-topic',
  messages: [
    { key: 'key1', value: 'Hello Kafka!' },
    { key: 'key2', value: 'Message 2' },
  ],
});

await producer.disconnect();
```

### Consumer Example

```typescript
import { Kafka } from '@elide/kafkajs-clone';

const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'my-group' });

await consumer.connect();
await consumer.subscribe({ topics: ['my-topic'] });

await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    console.log({
      topic,
      partition,
      offset: message.offset,
      value: message.value?.toString(),
    });
  },
});
```

### Admin Example

```typescript
import { Kafka } from '@elide/kafkajs-clone';

const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092'],
});

const admin = kafka.admin();

await admin.connect();

// Create topics
await admin.createTopics({
  topics: [
    {
      topic: 'my-topic',
      numPartitions: 3,
      replicationFactor: 1,
    },
  ],
});

// List topics
const topics = await admin.listTopics();
console.log(topics);

await admin.disconnect();
```

## Advanced Features

### Transactions

```typescript
const producer = kafka.producer({
  transactionalId: 'my-transactional-producer',
  maxInFlightRequests: 1,
  idempotent: true,
});

await producer.connect();

const transaction = producer.transaction();

try {
  await transaction.send({
    topic: 'topic-1',
    messages: [{ value: 'Message 1' }],
  });

  await transaction.send({
    topic: 'topic-2',
    messages: [{ value: 'Message 2' }],
  });

  await transaction.commit();
} catch (error) {
  await transaction.abort();
  throw error;
}
```

### SASL Authentication

```typescript
const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092'],
  sasl: {
    mechanism: 'scram-sha-256',
    username: 'my-username',
    password: 'my-password',
  },
  ssl: true,
});
```

### Compression

```typescript
import { CompressionTypes } from '@elide/kafkajs-clone';

await producer.send({
  topic: 'my-topic',
  compression: CompressionTypes.GZIP,
  messages: [
    { value: 'Compressed message' },
  ],
});
```

### Consumer Groups

```typescript
const consumer = kafka.consumer({
  groupId: 'my-group',
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
  rebalanceTimeout: 60000,
});

await consumer.run({
  eachBatch: async ({ batch, resolveOffset, heartbeat }) => {
    for (const message of batch.messages) {
      console.log(message.value?.toString());
      resolveOffset(message.offset);
      await heartbeat();
    }
  },
});
```

### Custom Partitioning

```typescript
const producer = kafka.producer({
  createPartitioner: () => {
    return ({ topic, partitionMetadata, message }) => {
      // Custom partitioning logic
      const key = message.key?.toString() || '';
      const hash = hashCode(key);
      return Math.abs(hash) % partitionMetadata.length;
    };
  },
});
```

### Offset Management

```typescript
// Seek to specific offset
await consumer.seek({ topic: 'my-topic', partition: 0, offset: '100' });

// Commit specific offsets
await consumer.commitOffsets({
  topics: [
    {
      topic: 'my-topic',
      partition: 0,
      offset: '200',
    },
  ],
});

// Reset offsets
const admin = kafka.admin();
await admin.resetOffsets({
  groupId: 'my-group',
  topic: 'my-topic',
  earliest: true,
});
```

## Configuration

### Kafka Config

```typescript
interface KafkaConfig {
  clientId: string;              // Client identifier
  brokers: string[];             // List of broker addresses
  ssl?: SSLOptions | boolean;    // SSL/TLS configuration
  sasl?: SASLOptions;            // SASL authentication
  connectionTimeout?: number;    // Connection timeout (ms)
  requestTimeout?: number;       // Request timeout (ms)
  retry?: RetryOptions;          // Retry configuration
  logLevel?: LogLevel;           // Logging level
}
```

### Producer Config

```typescript
interface ProducerConfig {
  createPartitioner?: ICustomPartitioner;  // Custom partitioner
  retry?: RetryOptions;                    // Retry options
  metadataMaxAge?: number;                 // Metadata refresh interval
  allowAutoTopicCreation?: boolean;        // Auto-create topics
  transactionTimeout?: number;             // Transaction timeout
  idempotent?: boolean;                    // Enable idempotence
  maxInFlightRequests?: number;            // Max concurrent requests
  compression?: CompressionTypes;          // Default compression
}
```

### Consumer Config

```typescript
interface ConsumerConfig {
  groupId: string;                    // Consumer group ID
  partitionAssignors?: PartitionAssigner[];  // Partition assignors
  sessionTimeout?: number;            // Session timeout
  rebalanceTimeout?: number;          // Rebalance timeout
  heartbeatInterval?: number;         // Heartbeat interval
  metadataMaxAge?: number;            // Metadata refresh interval
  allowAutoTopicCreation?: boolean;   // Auto-create topics
  maxBytesPerPartition?: number;      // Max bytes per fetch
  minBytes?: number;                  // Min bytes for fetch
  maxBytes?: number;                  // Max bytes for fetch
  maxWaitTimeInMs?: number;           // Max wait time for fetch
}
```

## Error Handling

```typescript
import {
  KafkaJSError,
  KafkaJSProtocolError,
  KafkaJSNumberOfRetriesExceeded,
  KafkaJSConnectionError,
  KafkaJSRequestTimeoutError,
} from '@elide/kafkajs-clone';

try {
  await producer.send({ topic: 'my-topic', messages: [{ value: 'test' }] });
} catch (error) {
  if (error instanceof KafkaJSNumberOfRetriesExceeded) {
    console.error('Exceeded max retries:', error.originalError);
  } else if (error instanceof KafkaJSConnectionError) {
    console.error('Connection error:', error.broker);
  } else if (error instanceof KafkaJSRequestTimeoutError) {
    console.error('Request timeout:', error.broker);
  }
}
```

## Performance Considerations

### Producer Performance

- **Batching**: Group multiple messages for better throughput
- **Compression**: Use compression for large messages (GZIP, Snappy, LZ4, ZSTD)
- **Async sends**: Don't await every send for higher throughput
- **Connection pooling**: Reuse producer instances

```typescript
// High-throughput producer
const producer = kafka.producer({
  compression: CompressionTypes.Snappy,
  maxInFlightRequests: 5,
  idempotent: true,
});

// Batch sends
const messages = Array.from({ length: 1000 }, (_, i) => ({
  value: `Message ${i}`,
}));

await producer.send({
  topic: 'high-throughput-topic',
  messages,
});
```

### Consumer Performance

- **Batch processing**: Use `eachBatch` for better throughput
- **Parallel processing**: Process multiple partitions concurrently
- **Offset commits**: Batch offset commits to reduce overhead

```typescript
await consumer.run({
  eachBatch: async ({ batch, resolveOffset, heartbeat }) => {
    const messages = batch.messages;

    // Process in parallel
    await Promise.all(
      messages.map(async (message) => {
        await processMessage(message);
      })
    );

    // Commit batch
    resolveOffset(batch.lastOffset());
    await heartbeat();
  },
  partitionsConsumedConcurrently: 3,
});
```

## Monitoring

```typescript
// Producer metrics
const metrics = await producer.getMetrics();
console.log({
  requestTotal: metrics.requestTotal,
  requestRate: metrics.requestRate,
  requestSize: metrics.requestSize,
  errorTotal: metrics.errorTotal,
  errorRate: metrics.errorRate,
});

// Consumer metrics
const consumerMetrics = await consumer.getMetrics();
console.log({
  bytesConsumed: consumerMetrics.bytesConsumed,
  recordsConsumed: consumerMetrics.recordsConsumed,
  fetchLatency: consumerMetrics.fetchLatency,
  lag: consumerMetrics.lag,
});
```

## Testing

Run the test suite:

```bash
npm test
```

## Examples

See the `examples/` directory for complete examples:

- `examples/producer.ts` - Basic producer example
- `examples/consumer.ts` - Basic consumer example
- `examples/transactions.ts` - Transactional producer
- `examples/admin.ts` - Admin operations
- `examples/high-throughput.ts` - High-performance patterns

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guidelines.
