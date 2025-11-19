# Performance Optimization Guide

Complete guide for optimizing performance across all Elide data processing tools.

## Table of Contents

1. [General Principles](#general-principles)
2. [KafkaJS Optimization](#kafkajs-optimization)
3. [AMQPLIB Optimization](#amqplib-optimization)
4. [Bull Optimization](#bull-optimization)
5. [Agenda Optimization](#agenda-optimization)
6. [Node-Cron Optimization](#node-cron-optimization)
7. [Benchmarking](#benchmarking)
8. [Monitoring](#monitoring)

## General Principles

### Connection Pooling

Reuse connections across operations:

```typescript
// Bad - Creating new connections each time
async function processMessage(msg: string) {
  const connection = await connect();
  await doWork(connection, msg);
  await connection.close();
}

// Good - Reuse connections
const connection = await connect();

async function processMessage(msg: string) {
  await doWork(connection, msg);
}

// Cleanup on shutdown
process.on('SIGTERM', () => connection.close());
```

### Batching

Process multiple items together:

```typescript
// Bad - Process one at a time
for (const item of items) {
  await processItem(item);
}

// Good - Process in batches
const batchSize = 100;
for (let i = 0; i < items.length; i += batchSize) {
  const batch = items.slice(i, i + batchSize);
  await Promise.all(batch.map(processItem));
}
```

### Async Processing

Use async/await properly:

```typescript
// Bad - Sequential processing
for (const task of tasks) {
  await processTask(task);
}

// Good - Parallel processing with limit
const limit = 10;
const chunks = [];

for (let i = 0; i < tasks.length; i += limit) {
  chunks.push(tasks.slice(i, i + limit));
}

for (const chunk of chunks) {
  await Promise.all(chunk.map(processTask));
}
```

### Memory Management

Control memory usage:

```typescript
// Bad - Unlimited growth
const cache = new Map();

function process(item: any) {
  cache.set(item.id, item);
  return doWork(item);
}

// Good - Limited cache size
const MAX_CACHE_SIZE = 1000;
const cache = new Map();

function process(item: any) {
  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }

  cache.set(item.id, item);
  return doWork(item);
}
```

## KafkaJS Optimization

### Producer Optimization

#### 1. Batching Messages

```typescript
// Bad - Send one message at a time
for (const message of messages) {
  await producer.send({
    topic: 'my-topic',
    messages: [message],
  });
}

// Good - Send in batches
await producer.send({
  topic: 'my-topic',
  messages: messages, // All at once
});
```

#### 2. Compression

```typescript
import { CompressionTypes } from '@elide/kafkajs-clone';

const producer = kafka.producer({
  compression: CompressionTypes.Snappy, // Fast compression
  // or CompressionTypes.GZIP for better compression ratio
});

// Use compression per message
await producer.send({
  topic: 'my-topic',
  messages: largeMessages,
  compression: CompressionTypes.Snappy,
});
```

#### 3. Increase Parallelism

```typescript
const producer = kafka.producer({
  maxInFlightRequests: 5, // Default is 5
  idempotent: true,       // Required for > 1
});
```

#### 4. Async Sending

```typescript
// Don't await every send
const promises = [];

for (const message of messages) {
  promises.push(
    producer.send({
      topic: 'my-topic',
      messages: [message],
    })
  );
}

// Wait for all at once
await Promise.all(promises);
```

#### 5. Custom Partitioner

```typescript
const producer = kafka.producer({
  createPartitioner: () => {
    return ({ topic, partitionMetadata, message }) => {
      // Custom logic for better distribution
      const key = message.key?.toString() || '';
      const hash = hashCode(key);
      return Math.abs(hash) % partitionMetadata.length;
    };
  },
});

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}
```

### Consumer Optimization

#### 1. Batch Processing

```typescript
// Better throughput with eachBatch
await consumer.run({
  eachBatch: async ({ batch, resolveOffset, heartbeat }) => {
    const messages = batch.messages;

    // Process in parallel
    await Promise.all(
      messages.map(async (message) => {
        await processMessage(message);
      })
    );

    resolveOffset(batch.lastOffset());
    await heartbeat();
  },
});
```

#### 2. Concurrent Partitions

```typescript
await consumer.run({
  partitionsConsumedConcurrently: 3, // Process 3 partitions at once
  eachMessage: async ({ message }) => {
    await processMessage(message);
  },
});
```

#### 3. Optimize Fetch Size

```typescript
const consumer = kafka.consumer({
  groupId: 'my-group',
  maxBytesPerPartition: 1048576, // 1MB
  minBytes: 1,                   // Don't wait for minimum
  maxBytes: 10485760,            // 10MB total
  maxWaitTimeInMs: 5000,         // Max wait 5s
});
```

#### 4. Manual Offset Management

```typescript
await consumer.run({
  autoCommit: false, // Disable auto-commit

  eachBatch: async ({ batch, resolveOffset, commitOffsetsIfNecessary }) => {
    // Process messages
    for (const message of batch.messages) {
      await processMessage(message);
      resolveOffset(message.offset);
    }

    // Commit manually
    await commitOffsetsIfNecessary();
  },
});
```

## AMQPLIB Optimization

### Connection Optimization

#### 1. Connection Pooling

```typescript
class ConnectionPool {
  private connections: any[] = [];
  private size: number;

  constructor(size: number) {
    this.size = size;
  }

  async getConnection() {
    if (this.connections.length < this.size) {
      const conn = await amqp.connect('amqp://localhost');
      this.connections.push(conn);
      return conn;
    }

    return this.connections[
      Math.floor(Math.random() * this.connections.length)
    ];
  }

  async closeAll() {
    await Promise.all(this.connections.map(c => c.close()));
  }
}

const pool = new ConnectionPool(5);
const connection = await pool.getConnection();
```

### Channel Optimization

#### 1. Prefetch Limit

```typescript
// Limit unacked messages
await channel.prefetch(10); // Process max 10 at a time

await channel.consume('my-queue', async (msg) => {
  if (msg) {
    await processMessage(msg);
    channel.ack(msg);
  }
});
```

#### 2. Multiple Channels

```typescript
// Use separate channels for publishing and consuming
const publishChannel = await connection.createChannel();
const consumeChannel = await connection.createChannel();

// Publish on one
publishChannel.sendToQueue('queue', Buffer.from('msg'));

// Consume on another
await consumeChannel.consume('queue', handler);
```

### Publishing Optimization

#### 1. Publisher Confirms

```typescript
const channel = await connection.createConfirmChannel();

const promises = [];

for (const message of messages) {
  promises.push(
    new Promise((resolve, reject) => {
      channel.sendToQueue(
        'queue',
        Buffer.from(message),
        {},
        (err) => {
          if (err) reject(err);
          else resolve(true);
        }
      );
    })
  );
}

await Promise.all(promises);
```

#### 2. Persistent Messages

```typescript
// Only persist important messages
channel.sendToQueue('queue', Buffer.from('important'), {
  persistent: true, // Writes to disk
});

channel.sendToQueue('queue', Buffer.from('transient'), {
  persistent: false, // Faster, but can be lost
});
```

### Consumption Optimization

#### 1. Batch Processing

```typescript
const batchSize = 100;
const batch: any[] = [];

await channel.consume('queue', async (msg) => {
  if (msg) {
    batch.push(msg);

    if (batch.length >= batchSize) {
      await processBatch(batch);

      batch.forEach(m => channel.ack(m));
      batch.length = 0;
    }
  }
});
```

#### 2. Multiple Consumers

```typescript
// Start multiple consumers
const consumerCount = 5;

for (let i = 0; i < consumerCount; i++) {
  const channel = await connection.createChannel();

  await channel.consume('queue', async (msg) => {
    if (msg) {
      await processMessage(msg);
      channel.ack(msg);
    }
  });
}
```

## Bull Optimization

### Queue Optimization

#### 1. Concurrency

```typescript
// Process multiple jobs simultaneously
queue.process(10, async (job) => {
  return await processJob(job.data);
});

// Named jobs with different concurrency
queue.process('email', 5, emailProcessor);
queue.process('video', 2, videoProcessor);
```

#### 2. Rate Limiting

```typescript
const queue = createQueue('rate-limited', {
  limiter: {
    max: 100,      // Max 100 jobs
    duration: 1000, // Per second
  },
});
```

#### 3. Job Options

```typescript
await queue.add(data, {
  removeOnComplete: 100,   // Keep last 100 completed
  removeOnFail: 50,        // Keep last 50 failed
  attempts: 3,             // Retry up to 3 times
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
});
```

### Processing Optimization

#### 1. Batch Processing

```typescript
queue.process(async (job) => {
  const items = await getBatch();

  // Process in parallel
  await Promise.all(items.map(processItem));

  return { processed: items.length };
});
```

#### 2. Progress Tracking

```typescript
queue.process(async (job) => {
  const total = job.data.items.length;

  for (let i = 0; i < total; i++) {
    await processItem(job.data.items[i]);

    // Update progress (don't overdo it)
    if (i % 10 === 0) {
      await job.progress((i / total) * 100);
    }
  }
});
```

### Memory Management

#### 1. Clean Old Jobs

```typescript
// Periodically clean completed jobs
setInterval(async () => {
  await queue.clean(3600000, 'completed'); // 1 hour old
  await queue.clean(86400000, 'failed');   // 1 day old
}, 3600000); // Run every hour
```

#### 2. Limit Queue Size

```typescript
// Monitor queue size
setInterval(async () => {
  const counts = await queue.getJobCounts();

  if (counts.waiting > 10000) {
    // Pause new jobs or alert
    await queue.pause();
  }
}, 60000);
```

## Agenda Optimization

### Job Definition Optimization

#### 1. Concurrency

```typescript
agenda.define('email', {
  concurrency: 5, // Process 5 at once
  priority: 'high',
  lockLifetime: 60000,
}, async (job) => {
  await sendEmail(job.attrs.data);
});
```

#### 2. Processing Interval

```typescript
const agenda = new Agenda({
  processEvery: '10 seconds', // Check for jobs every 10s
  maxConcurrency: 20,         // Max 20 jobs total
});
```

### Job Scheduling Optimization

#### 1. Batch Scheduling

```typescript
// Instead of scheduling one at a time
const jobs = [];

for (const user of users) {
  const job = agenda.create('send-reminder', {
    userId: user.id,
  });

  jobs.push(job.save());
}

await Promise.all(jobs);
```

#### 2. Unique Jobs

```typescript
// Prevent duplicate jobs
const job = agenda.create('process-user', { userId: '123' });

job.unique({ userId: '123' });

await job.save();
```

### MongoDB Optimization

#### 1. Indexes

```typescript
// Create indexes on MongoDB collection
// Run in MongoDB shell or migration:

db.agendaJobs.createIndex({ name: 1, nextRunAt: 1 });
db.agendaJobs.createIndex({ name: 1, lockedAt: 1 });
```

#### 2. Clean Old Jobs

```typescript
// Remove old completed jobs
agenda.on('complete', async (job) => {
  if (shouldRemove(job)) {
    await job.remove();
  }
});
```

## Node-Cron Optimization

### Task Management

#### 1. Minimize Tasks

```typescript
// Bad - Create many similar tasks
for (const user of users) {
  cron.schedule('0 9 * * *', () => {
    sendReminder(user);
  });
}

// Good - Single task that processes all
cron.schedule('0 9 * * *', async () => {
  const users = await getUsers();
  await Promise.all(users.map(sendReminder));
});
```

#### 2. Efficient Execution

```typescript
cron.schedule('* * * * *', async () => {
  try {
    // Use timeout
    await Promise.race([
      doWork(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 30000)
      ),
    ]);
  } catch (error) {
    console.error('Task failed:', error);
  }
});
```

## Benchmarking

### KafkaJS Benchmark

```typescript
async function benchmarkProducer() {
  const producer = kafka.producer();
  await producer.connect();

  const messageCount = 100000;
  const batchSize = 1000;
  const startTime = Date.now();

  for (let i = 0; i < messageCount; i += batchSize) {
    const messages = Array.from({ length: batchSize }, (_, j) => ({
      value: `Message ${i + j}`,
    }));

    await producer.send({
      topic: 'benchmark',
      messages,
    });
  }

  const elapsed = (Date.now() - startTime) / 1000;
  const rate = messageCount / elapsed;

  console.log(`Produced ${messageCount} messages in ${elapsed}s`);
  console.log(`Rate: ${rate.toFixed(0)} msg/s`);

  await producer.disconnect();
}
```

### Bull Benchmark

```typescript
async function benchmarkBull() {
  const queue = createQueue('benchmark');

  let processed = 0;
  const startTime = Date.now();

  queue.process(10, async (job) => {
    processed++;
    return { done: true };
  });

  const jobCount = 10000;

  for (let i = 0; i < jobCount; i++) {
    await queue.add({ index: i });
  }

  // Wait for processing
  while (processed < jobCount) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const elapsed = (Date.now() - startTime) / 1000;
  const rate = jobCount / elapsed;

  console.log(`Processed ${jobCount} jobs in ${elapsed}s`);
  console.log(`Rate: ${rate.toFixed(0)} jobs/s`);

  await queue.close();
}
```

## Monitoring

### Performance Metrics

```typescript
// Collect metrics periodically
setInterval(async () => {
  const metrics = {
    kafka: await producer.getMetrics(),
    bull: await queue.getMetrics(),
    amqp: channel.getStats(),
    timestamp: Date.now(),
  };

  // Log or send to monitoring service
  console.log('Performance metrics:', metrics);
}, 60000); // Every minute
```

### Health Checks

```typescript
async function healthCheck() {
  const checks = {
    kafka: await checkKafka(),
    rabbitmq: await checkRabbitMQ(),
    redis: await checkRedis(),
    mongodb: await checkMongoDB(),
  };

  const healthy = Object.values(checks).every(c => c);

  return {
    healthy,
    checks,
    timestamp: Date.now(),
  };
}

async function checkKafka() {
  try {
    const admin = kafka.admin();
    await admin.connect();
    await admin.listTopics();
    await admin.disconnect();
    return true;
  } catch {
    return false;
  }
}
```

## Best Practices Summary

### KafkaJS
- Use batching for high throughput
- Enable compression for large messages
- Configure appropriate `maxInFlightRequests`
- Use `eachBatch` for better performance
- Monitor consumer lag

### AMQPLIB
- Reuse connections and channels
- Use prefetch limits
- Enable publisher confirms
- Use multiple consumers
- Monitor queue depth

### Bull
- Set appropriate concurrency
- Clean old jobs regularly
- Use rate limiting when needed
- Monitor queue metrics
- Remove completed jobs

### Agenda
- Optimize `processEvery` interval
- Use job concurrency wisely
- Index MongoDB properly
- Remove old jobs
- Monitor job execution time

### Node-Cron
- Minimize number of tasks
- Use efficient callbacks
- Handle errors properly
- Add timeouts
- Monitor execution time

## Conclusion

Performance optimization is an ongoing process. Start with these optimizations and measure their impact. Use monitoring and benchmarking to identify bottlenecks and optimize accordingly.

Key principles:
1. Batch when possible
2. Reuse connections
3. Process in parallel
4. Manage memory
5. Monitor continuously
