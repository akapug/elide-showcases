# Data Processing Tools - Elide OSS Ports

Production-ready data processing tools for Elide, providing complete implementations of popular Node.js data processing libraries.

## Overview

This collection includes 5 production-ready data processing tools:

1. **kafkajs-clone** - Apache Kafka client
2. **amqplib-clone** - RabbitMQ/AMQP client
3. **bull-clone** - Redis-based queue system
4. **agenda-clone** - MongoDB-based job scheduler
5. **node-cron-clone** - Cron job scheduler

## Tools

### 1. KafkaJS Clone

Full-featured Apache Kafka client for high-throughput data streaming.

**Features:**
- Producer API with batching and compression
- Consumer API with consumer groups
- Admin API for cluster management
- Transactional support for exactly-once semantics
- SASL authentication (PLAIN, SCRAM, OAuth)
- Multiple compression algorithms (GZIP, Snappy, LZ4, ZSTD)
- Idempotent producer for at-least-once delivery
- Full TypeScript support

**Use Cases:**
- Event streaming
- Log aggregation
- Real-time analytics
- Microservices communication
- CDC (Change Data Capture)

**Quick Start:**
```typescript
import { Kafka } from '@elide/kafkajs-clone';

const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092'],
});

const producer = kafka.producer();
await producer.connect();

await producer.send({
  topic: 'events',
  messages: [{ value: 'Hello Kafka!' }],
});
```

### 2. AMQPLIB Clone

Complete RabbitMQ/AMQP 0-9-1 client for message queuing.

**Features:**
- Connection and channel management
- All exchange types (direct, topic, fanout, headers)
- Queue lifecycle management
- Publisher confirms for reliability
- Consumer acknowledgments
- Prefetch for flow control
- Dead letter exchanges

**Use Cases:**
- Task queues
- Pub/sub messaging
- RPC patterns
- Work distribution
- Message routing

**Quick Start:**
```typescript
import * as amqp from '@elide/amqplib-clone';

const connection = await amqp.connect('amqp://localhost');
const channel = await connection.createChannel();

await channel.assertQueue('tasks');
channel.sendToQueue('tasks', Buffer.from('Task data'));

await channel.consume('tasks', (msg) => {
  if (msg) {
    console.log('Received:', msg.content.toString());
    channel.ack(msg);
  }
});
```

### 3. Bull Clone

Redis-backed queue system with job processing and scheduling.

**Features:**
- Job queue with Redis persistence
- Concurrent job processing
- Automatic retry with backoff
- Delayed job scheduling
- Job prioritization
- Job lifecycle events
- Repeatable jobs (cron and intervals)
- Rate limiting

**Use Cases:**
- Background job processing
- Email/notification queues
- Video processing
- Data import/export
- Scheduled tasks

**Quick Start:**
```typescript
import { createQueue } from '@elide/bull-clone';

const queue = createQueue('my-queue');

queue.process(async (job) => {
  console.log('Processing:', job.data);
  return { completed: true };
});

await queue.add({ task: 'Send email' });
```

### 4. Agenda Clone

MongoDB-based job scheduler with cron support.

**Features:**
- Job definitions with concurrency
- Cron and interval scheduling
- One-time job scheduling
- Job priorities
- Job locking to prevent duplicates
- MongoDB persistence
- Full event system

**Use Cases:**
- Scheduled reports
- Periodic cleanups
- Recurring notifications
- Data synchronization
- Batch processing

**Quick Start:**
```typescript
import Agenda from '@elide/agenda-clone';

const agenda = new Agenda({
  db: { address: 'mongodb://localhost/agenda' },
});

agenda.define('send email', async (job) => {
  await sendEmail(job.attrs.data);
});

await agenda.start();
await agenda.every('1 day', 'send email', { to: 'user@example.com' });
```

### 5. Node-Cron Clone

Lightweight cron job scheduler with timezone support.

**Features:**
- Full cron expression support
- Task management (start/stop/destroy)
- Timezone support
- Async task support
- No external dependencies
- Simple API

**Use Cases:**
- Periodic tasks
- Scheduled cleanups
- Time-based triggers
- Automated backups
- Health checks

**Quick Start:**
```typescript
import cron from '@elide/node-cron-clone';

cron.schedule('0 9 * * *', () => {
  console.log('Runs every day at 9 AM');
});
```

## Comparison Matrix

| Feature | KafkaJS | AMQPLIB | Bull | Agenda | Node-Cron |
|---------|---------|---------|------|--------|-----------|
| **Persistence** | Kafka | RabbitMQ | Redis | MongoDB | None |
| **Pub/Sub** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Job Queue** | ❌ | ✅ | ✅ | ✅ | ❌ |
| **Scheduling** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Priorities** | ❌ | ✅ | ✅ | ✅ | ❌ |
| **Retries** | ✅ | Manual | ✅ | ✅ | ❌ |
| **Transactions** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Cron** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Clustering** | ✅ | ✅ | ✅ | ✅ | ❌ |

## When to Use Each Tool

### Use KafkaJS Clone when:
- You need high-throughput event streaming
- Building event-driven architectures
- Implementing log aggregation
- Need strong durability guarantees
- Working with distributed systems
- Require exactly-once semantics

### Use AMQPLIB Clone when:
- You need flexible message routing
- Implementing work queues
- Building RPC systems
- Need message acknowledgments
- Require dead letter handling
- Want publisher confirms

### Use Bull Clone when:
- You need job processing with retries
- Building background task systems
- Require job prioritization
- Need delayed job execution
- Want job progress tracking
- Need repeatable jobs

### Use Agenda Clone when:
- You need MongoDB integration
- Building scheduled job systems
- Require job persistence
- Need cron-style scheduling
- Want job concurrency control
- Building periodic tasks

### Use Node-Cron Clone when:
- You need simple cron scheduling
- Don't require persistence
- Want lightweight solution
- Need timezone support
- Building time-based triggers
- Require minimal dependencies

## Architecture Patterns

### Event Sourcing with KafkaJS

```typescript
// Event Producer
const kafka = new Kafka({ brokers: ['localhost:9092'] });
const producer = kafka.producer();

await producer.send({
  topic: 'user-events',
  messages: [
    {
      key: userId,
      value: JSON.stringify({
        type: 'USER_CREATED',
        timestamp: Date.now(),
        data: userData,
      }),
    },
  ],
});

// Event Consumer
const consumer = kafka.consumer({ groupId: 'event-processor' });
await consumer.subscribe({ topic: 'user-events' });

await consumer.run({
  eachMessage: async ({ message }) => {
    const event = JSON.parse(message.value.toString());
    await processEvent(event);
  },
});
```

### Task Queue with Bull

```typescript
// Task Producer
const queue = createQueue('tasks');

await queue.add('process-video', {
  videoId: '123',
  url: 'https://example.com/video.mp4',
}, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 },
});

// Task Worker
queue.process('process-video', 5, async (job) => {
  await processVideo(job.data.url);
});
```

### Scheduled Jobs with Agenda

```typescript
const agenda = new Agenda({ db: { address: 'mongodb://localhost' } });

// Daily report
agenda.define('daily-report', async (job) => {
  const report = await generateReport();
  await sendReport(report);
});

await agenda.every('0 9 * * *', 'daily-report');
```

### Microservices Communication with AMQP

```typescript
// Service A - Publisher
const channel = await connection.createChannel();
await channel.assertExchange('services', 'topic');

channel.publish('services', 'user.created', Buffer.from(JSON.stringify({
  userId: '123',
  email: 'user@example.com',
})));

// Service B - Subscriber
await channel.assertQueue('user-notifications');
await channel.bindQueue('user-notifications', 'services', 'user.*');

await channel.consume('user-notifications', async (msg) => {
  if (msg) {
    const data = JSON.parse(msg.content.toString());
    await sendWelcomeEmail(data);
    channel.ack(msg);
  }
});
```

## Performance Considerations

### KafkaJS Optimization

```typescript
// Batch messages for better throughput
const messages = Array.from({ length: 1000 }, (_, i) => ({
  value: `Message ${i}`,
}));

await producer.send({
  topic: 'high-throughput',
  messages,
  compression: CompressionTypes.Snappy,
});

// Use multiple partitions for parallelism
const producer = kafka.producer({
  createPartitioner: () => {
    return ({ topic, partitionMetadata, message }) => {
      const hash = hashCode(message.key);
      return Math.abs(hash) % partitionMetadata.length;
    };
  },
});
```

### Bull Optimization

```typescript
// Process jobs in batches
queue.process(10, async (job) => {
  return await processJob(job.data);
});

// Use rate limiting
const queue = createQueue('rate-limited', {
  limiter: {
    max: 100,
    duration: 60000,
  },
});
```

### AMQPLIB Optimization

```typescript
// Use prefetch for flow control
await channel.prefetch(10);

// Batch publish with confirm channel
const channel = await connection.createConfirmChannel();

for (const message of messages) {
  channel.sendToQueue('queue', Buffer.from(message), {}, (err) => {
    if (err) console.error('Message not confirmed');
  });
}

await channel.waitForConfirms();
```

## Error Handling

### KafkaJS

```typescript
try {
  await producer.send({ topic, messages });
} catch (error) {
  if (error instanceof KafkaJSNumberOfRetriesExceeded) {
    console.error('Max retries exceeded');
  } else if (error instanceof KafkaJSConnectionError) {
    console.error('Connection error');
  }
}
```

### Bull

```typescript
queue.process(async (job) => {
  try {
    return await riskyOperation(job.data);
  } catch (error) {
    await job.log(`Error: ${error.message}`);

    if (error instanceof NetworkError) {
      throw error; // Will retry
    } else {
      await job.discard(); // Won't retry
    }
  }
});
```

### AMQPLIB

```typescript
channel.consume('queue', async (msg) => {
  if (msg) {
    try {
      await processMessage(msg);
      channel.ack(msg);
    } catch (error) {
      console.error('Processing failed:', error);
      channel.nack(msg, false, true); // Requeue
    }
  }
});
```

## Monitoring and Observability

### Metrics Collection

```typescript
// KafkaJS metrics
const producerMetrics = await producer.getMetrics();
console.log('Request rate:', producerMetrics.requestRate);

// Bull metrics
const queueMetrics = await queue.getMetrics();
console.log('Wait time avg:', queueMetrics.wait.avg);

// AMQPLIB stats
const stats = channel.getStats();
console.log('Publish count:', stats.publishCount);
```

### Event Logging

```typescript
// KafkaJS events
kafka.on('producer.connect', () => console.log('Producer connected'));
kafka.on('consumer.crash', (err) => console.error('Consumer crashed:', err));

// Bull events
queue.on('completed', (job) => console.log('Job completed:', job.id));
queue.on('failed', (job, err) => console.error('Job failed:', err));

// Agenda events
agenda.on('start', (job) => console.log('Job starting:', job.attrs.name));
agenda.on('fail', (err, job) => console.error('Job failed:', err));
```

## Testing

Each tool includes comprehensive test suites:

```bash
# Test all tools
cd kafkajs-clone && npm test
cd ../amqplib-clone && npm test
cd ../bull-clone && npm test
cd ../agenda-clone && npm test
cd ../node-cron-clone && npm test
```

## Contributing

Contributions are welcome! Please read our contributing guidelines for each tool.

## License

All tools are licensed under MIT.

## Support

For issues and questions:
- Open an issue in the repository
- Check the README for each tool
- Review the examples directory
- Consult the official documentation

## Roadmap

### Planned Features

**KafkaJS Clone:**
- Schema Registry support
- Kafka Streams API
- Connect API integration

**AMQPLIB Clone:**
- Cluster connection handling
- Advanced routing patterns
- Stream processing

**Bull Clone:**
- Queue metrics dashboard
- Advanced job dependencies
- Job batching

**Agenda Clone:**
- Job dependencies
- Advanced scheduling patterns
- Job history tracking

**Node-Cron Clone:**
- Advanced timezone handling
- Job dependencies
- Execution history

## Acknowledgments

These tools are inspired by and compatible with:
- [KafkaJS](https://github.com/tulios/kafkajs)
- [amqplib](https://github.com/amqp-node/amqplib)
- [Bull](https://github.com/OptimalBits/bull)
- [Agenda](https://github.com/agenda/agenda)
- [node-cron](https://github.com/node-cron/node-cron)

Special thanks to the maintainers and contributors of these excellent libraries.
