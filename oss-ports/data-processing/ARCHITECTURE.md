# Data Processing Tools - Architecture & Design

## Overview

This document describes the architecture and design decisions for the Elide data processing tools collection.

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                          │
│  (User Code, Business Logic, Event Handlers)                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Data Processing Layer                       │
│  ┌──────────┬──────────┬──────┬────────┬─────────┐         │
│  │ KafkaJS  │ AMQPLIB  │ Bull │ Agenda │ N-Cron  │         │
│  │  Clone   │  Clone   │Clone │ Clone  │  Clone  │         │
│  └──────────┴──────────┴──────┴────────┴─────────┘         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Storage/Backend Layer                      │
│  ┌────────┬──────────┬────────┬────────────┬────────┐      │
│  │ Kafka  │ RabbitMQ │ Redis  │  MongoDB   │  None  │      │
│  │Cluster │ Cluster  │Cluster │  Cluster   │        │      │
│  └────────┴──────────┴────────┴────────────┴────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Component Design

### 1. KafkaJS Clone Architecture

#### Producer Architecture

```
┌─────────────────┐
│   Application   │
└────────┬────────┘
         │ send()
         ↓
┌─────────────────┐
│    Producer     │
│  ┌───────────┐  │
│  │ Batching  │  │
│  └─────┬─────┘  │
│  ┌─────↓─────┐  │
│  │Compression│  │
│  └─────┬─────┘  │
│  ┌─────↓─────┐  │
│  │Partitioner│  │
│  └─────┬─────┘  │
└────────┼────────┘
         │
         ↓
┌─────────────────┐
│  Kafka Broker   │
└─────────────────┘
```

**Key Components:**
- **Producer**: Main entry point for message publishing
- **Batching**: Groups messages for efficient transmission
- **Compression**: Reduces message size (GZIP, Snappy, LZ4, ZSTD)
- **Partitioner**: Routes messages to appropriate partitions
- **Transaction Manager**: Handles exactly-once semantics

**Design Decisions:**
- Async-first API for high throughput
- Configurable batching for latency vs throughput tradeoff
- Pluggable compression codecs
- Custom partitioner support for advanced routing

#### Consumer Architecture

```
┌─────────────────┐
│   Application   │
└────────┬────────┘
         │ run()
         ↓
┌─────────────────┐
│    Consumer     │
│  ┌───────────┐  │
│  │  Fetcher  │  │
│  └─────┬─────┘  │
│  ┌─────↓─────┐  │
│  │Rebalancer │  │
│  └─────┬─────┘  │
│  ┌─────↓─────┐  │
│  │  Offset   │  │
│  │  Manager  │  │
│  └───────────┘  │
└─────────────────┘
```

**Key Components:**
- **Consumer**: Main message consumption interface
- **Fetcher**: Retrieves messages from brokers
- **Rebalancer**: Manages partition assignments
- **Offset Manager**: Tracks and commits message offsets
- **Heartbeat**: Keeps consumer group membership active

**Design Decisions:**
- Push-based consumption model
- Automatic offset management with manual override
- Configurable prefetch for flow control
- Support for both eachMessage and eachBatch patterns

### 2. AMQPLIB Clone Architecture

#### Connection & Channel Model

```
┌─────────────────────────┐
│      Application        │
└────────────────────────┘
         │
         ↓
┌─────────────────────────┐
│      Connection         │
│   ┌───────────────┐     │
│   │   Heartbeat   │     │
│   └───────────────┘     │
│   ┌───────────────┐     │
│   │Channel Manager│     │
│   └───────┬───────┘     │
└───────────┼─────────────┘
            │
    ┌───────┼───────┐
    ↓       ↓       ↓
┌────────┬────────┬────────┐
│Channel1│Channel2│Channel3│
│ ┌────┐ │ ┌────┐ │ ┌────┐ │
│ │Pub │ │ │Sub │ │ │Both│ │
│ └────┘ │ └────┘ │ └────┘ │
└────────┴────────┴────────┘
         │
         ↓
┌─────────────────────────┐
│     RabbitMQ Broker     │
└─────────────────────────┘
```

**Key Components:**
- **Connection**: Manages TCP connection to RabbitMQ
- **Channel**: Lightweight virtual connection for operations
- **Publisher**: Sends messages to exchanges
- **Consumer**: Receives messages from queues
- **Acknowledgment Manager**: Handles message confirmations

**Design Decisions:**
- Multi-channel support for concurrent operations
- Confirm channels for reliability
- Separate prefetch limits per channel
- Event-driven architecture

### 3. Bull Clone Architecture

#### Job Processing Pipeline

```
┌─────────────────┐
│  add() job      │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   Job Queue     │
│ ┌─────────────┐ │
│ │  Waiting    │ │
│ │  Delayed    │ │
│ │  Priority   │ │
│ └──────┬──────┘ │
└────────┼────────┘
         │
         ↓
┌─────────────────┐
│     Worker      │
│ ┌─────────────┐ │
│ │   Process   │ │
│ └──────┬──────┘ │
└────────┼────────┘
         │
    ┌────┴────┐
    ↓         ↓
┌────────┬────────┐
│Complete│ Failed │
│  Jobs  │  Jobs  │
└────────┴────────┘
```

**Key Components:**
- **Queue**: Manages job storage and retrieval
- **Job**: Represents unit of work with metadata
- **Worker**: Processes jobs concurrently
- **Scheduler**: Handles delayed and repeatable jobs
- **Event Emitter**: Broadcasts job lifecycle events

**Design Decisions:**
- Redis-backed for persistence and clustering
- Separate queues for different job states
- Configurable concurrency per worker
- Exponential backoff for retries
- Job priority support

### 4. Agenda Clone Architecture

#### Job Scheduling System

```
┌─────────────────┐
│   define()      │
│   schedule()    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│     Agenda      │
│ ┌─────────────┐ │
│ │ Definitions │ │
│ ├─────────────┤ │
│ │   Jobs DB   │ │
│ ├─────────────┤ │
│ │  Processor  │ │
│ └──────┬──────┘ │
└────────┼────────┘
         │
         ↓
┌─────────────────┐
│    MongoDB      │
└─────────────────┘
```

**Key Components:**
- **Agenda**: Main scheduler instance
- **Job Definition**: Processor function with options
- **Job**: Scheduled task instance
- **Processor**: Executes job definitions
- **Lock Manager**: Prevents duplicate execution

**Design Decisions:**
- MongoDB for job persistence
- Job locking for distributed systems
- Configurable concurrency per job type
- Priority-based scheduling
- Cron and interval support

### 5. Node-Cron Clone Architecture

#### Task Scheduling

```
┌─────────────────┐
│  schedule()     │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Cron Task      │
│ ┌─────────────┐ │
│ │  Expression │ │
│ │   Parser    │ │
│ ├─────────────┤ │
│ │  Scheduler  │ │
│ ├─────────────┤ │
│ │   Timer     │ │
│ └──────┬──────┘ │
└────────┼────────┘
         │
         ↓
┌─────────────────┐
│    Callback     │
└─────────────────┘
```

**Key Components:**
- **Cron Expression**: Parses and validates cron syntax
- **Scheduler**: Calculates next run times
- **Task**: Manages task lifecycle
- **Timer**: Executes tasks at scheduled times

**Design Decisions:**
- In-memory only (no persistence)
- Full cron expression support
- Timezone handling
- Simple start/stop/destroy API

## Data Flow Patterns

### 1. Event Streaming (KafkaJS)

```
Producer → Kafka → Consumer Group
                  → Consumer 1
                  → Consumer 2
                  → Consumer 3
```

**Characteristics:**
- High throughput
- Persistent event log
- Horizontal scalability
- At-least-once/exactly-once delivery

### 2. Message Queue (AMQPLIB)

```
Publisher → Exchange → Queue → Consumer
                      → Queue → Consumer
                      → Queue → Consumer
```

**Characteristics:**
- Flexible routing
- Message acknowledgments
- Work distribution
- Priority queues

### 3. Background Jobs (Bull)

```
Add Job → Queue → Worker Pool
                 → Worker 1
                 → Worker 2
                 → Worker N
```

**Characteristics:**
- Job persistence
- Automatic retries
- Job priorities
- Progress tracking

### 4. Scheduled Tasks (Agenda)

```
Define → Schedule → Process
                  → Process (cron)
                  → Process (interval)
```

**Characteristics:**
- Cron-based scheduling
- MongoDB persistence
- Job locking
- Concurrency control

### 5. Time-based Tasks (Node-Cron)

```
Schedule → Timer → Execute
```

**Characteristics:**
- Lightweight
- No persistence
- Simple API
- Timezone support

## Scalability Patterns

### Horizontal Scaling

**KafkaJS:**
- Add more consumer instances
- Increase partition count
- Use consumer groups

**AMQPLIB:**
- Add more consumers
- Use multiple channels
- Implement prefetch limits

**Bull:**
- Add more workers
- Use Redis cluster
- Separate queues by priority

**Agenda:**
- Add more Agenda instances
- Use job locking
- MongoDB replica sets

### Vertical Scaling

**All Tools:**
- Increase concurrency
- Optimize processing logic
- Use batching
- Implement caching

## Error Handling Strategies

### 1. Retry Logic

**Exponential Backoff:**
```typescript
attempts: 5
backoff: {
  type: 'exponential',
  delay: 1000
}
// Delays: 1s, 2s, 4s, 8s, 16s
```

**Fixed Backoff:**
```typescript
attempts: 3
backoff: {
  type: 'fixed',
  delay: 5000
}
// Delays: 5s, 5s, 5s
```

### 2. Dead Letter Handling

**AMQPLIB:**
```typescript
deadLetterExchange: 'dlx'
deadLetterRoutingKey: 'failed'
```

**KafkaJS:**
```typescript
// Manual DLQ implementation
if (processingFailed) {
  await producer.send({
    topic: 'dead-letter-queue',
    messages: [failedMessage]
  });
}
```

### 3. Circuit Breaker

```typescript
let failureCount = 0;
const threshold = 5;

async function processWithCircuitBreaker(job) {
  if (failureCount >= threshold) {
    throw new Error('Circuit breaker open');
  }

  try {
    await process(job);
    failureCount = 0;
  } catch (error) {
    failureCount++;
    throw error;
  }
}
```

## Performance Optimization

### Batching

**KafkaJS:**
```typescript
// Batch 1000 messages
const messages = Array(1000).fill(0).map((_, i) => ({
  value: `Message ${i}`
}));

await producer.send({ topic, messages });
```

**Bull:**
```typescript
// Process in batches
queue.process(async (job) => {
  const batch = await getBatch();
  await Promise.all(batch.map(process));
});
```

### Connection Pooling

**AMQPLIB:**
```typescript
// Reuse connections
const connection = await amqp.connect(url);

// Multiple channels
const channel1 = await connection.createChannel();
const channel2 = await connection.createChannel();
```

### Caching

**All Tools:**
```typescript
const cache = new Map();

async function processWithCache(key, processor) {
  if (cache.has(key)) {
    return cache.get(key);
  }

  const result = await processor();
  cache.set(key, result);
  return result;
}
```

## Monitoring & Observability

### Metrics Collection

**Key Metrics:**
- Throughput (messages/second)
- Latency (processing time)
- Error rate
- Queue depth
- Consumer lag

**Implementation:**
```typescript
// KafkaJS
const metrics = await producer.getMetrics();
console.log('Request rate:', metrics.requestRate);

// Bull
const metrics = await queue.getMetrics();
console.log('Wait time:', metrics.wait.avg);

// AMQPLIB
const stats = channel.getStats();
console.log('Publish count:', stats.publishCount);
```

### Logging

**Structured Logging:**
```typescript
logger.info('Processing job', {
  jobId: job.id,
  jobName: job.name,
  timestamp: Date.now()
});
```

### Health Checks

```typescript
async function healthCheck() {
  return {
    kafka: await kafka.isConnected(),
    amqp: connection.isConnected(),
    bull: await queue.count() >= 0,
    agenda: agenda.isRunning()
  };
}
```

## Security Considerations

### Authentication

**KafkaJS - SASL:**
```typescript
sasl: {
  mechanism: 'scram-sha-256',
  username: 'user',
  password: 'pass'
}
```

**AMQPLIB - Credentials:**
```typescript
connection = await amqp.connect({
  username: 'user',
  password: 'pass'
});
```

### Encryption

**TLS/SSL:**
```typescript
// KafkaJS
ssl: true

// AMQPLIB
protocol: 'amqps'
```

### Input Validation

```typescript
function validateJobData(data: unknown): JobData {
  if (!isValidJobData(data)) {
    throw new Error('Invalid job data');
  }
  return data as JobData;
}
```

## Testing Strategy

### Unit Tests
- Test individual components
- Mock external dependencies
- Cover edge cases

### Integration Tests
- Test with real backends
- Verify end-to-end flows
- Test error scenarios

### Performance Tests
- Measure throughput
- Test under load
- Identify bottlenecks

## Deployment Patterns

### Docker Compose

```yaml
version: '3'
services:
  kafka:
    image: confluentinc/cp-kafka
  rabbitmq:
    image: rabbitmq:management
  redis:
    image: redis:alpine
  mongodb:
    image: mongo
  app:
    build: .
    depends_on:
      - kafka
      - rabbitmq
      - redis
      - mongodb
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: worker
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: worker
        image: myapp:latest
        env:
        - name: KAFKA_BROKERS
          value: kafka:9092
```

## Conclusion

This architecture provides:
- **Flexibility**: Choose the right tool for each use case
- **Scalability**: Horizontal and vertical scaling options
- **Reliability**: Retry logic and error handling
- **Performance**: Batching and optimization techniques
- **Observability**: Comprehensive monitoring and logging

For specific implementation details, refer to each tool's README and examples.
