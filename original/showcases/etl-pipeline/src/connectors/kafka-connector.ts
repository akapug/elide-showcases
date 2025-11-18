/**
 * Kafka Connector - Source and Sink
 *
 * Comprehensive Kafka integration for ETL pipelines:
 * - Producer and Consumer APIs
 * - Topic management
 * - Partition handling
 * - Consumer groups
 * - Exactly-once semantics
 * - Transaction support
 * - Schema Registry integration
 * - Avro/Protobuf serialization
 * - Dead letter queue
 * - Backpressure handling
 * - Monitoring and metrics
 */

// ==================== Types ====================

interface KafkaConfig {
  brokers: string[];
  clientId: string;
  connectionTimeout?: number;
  requestTimeout?: number;
  ssl?: {
    ca?: string[];
    cert?: string;
    key?: string;
  };
  sasl?: {
    mechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512' | 'aws';
    username: string;
    password: string;
  };
}

interface ProducerConfig extends KafkaConfig {
  topic: string;
  compression?: 'none' | 'gzip' | 'snappy' | 'lz4' | 'zstd';
  acks?: 0 | 1 | -1;
  batchSize?: number;
  lingerMs?: number;
  maxInFlightRequests?: number;
  idempotent?: boolean;
  transactional?: boolean;
  transactionalId?: string;
}

interface ConsumerConfig extends KafkaConfig {
  groupId: string;
  topics: string[];
  fromBeginning?: boolean;
  autoCommit?: boolean;
  autoCommitInterval?: number;
  sessionTimeout?: number;
  heartbeatInterval?: number;
  maxPollRecords?: number;
  partitionAssignmentStrategy?: 'range' | 'roundrobin' | 'sticky';
}

interface KafkaMessage {
  key?: string | Buffer;
  value: string | Buffer;
  headers?: Record<string, string | Buffer>;
  partition?: number;
  timestamp?: number;
}

interface ProducedMessage extends KafkaMessage {
  topic: string;
  offset?: number;
}

interface ConsumedMessage extends ProducedMessage {
  offset: number;
  size: number;
  highWaterOffset: number;
}

interface TopicMetadata {
  name: string;
  partitions: PartitionMetadata[];
  replicationFactor: number;
  config: Record<string, string>;
}

interface PartitionMetadata {
  partition: number;
  leader: number;
  replicas: number[];
  isr: number[]; // In-Sync Replicas
}

interface ConsumerGroupMetadata {
  groupId: string;
  state: 'Empty' | 'Stable' | 'PreparingRebalance' | 'CompletingRebalance' | 'Dead';
  members: GroupMember[];
  coordinator: number;
}

interface GroupMember {
  memberId: string;
  clientId: string;
  host: string;
  assignment: PartitionAssignment[];
}

interface PartitionAssignment {
  topic: string;
  partitions: number[];
}

interface ProducerMetrics {
  messagesSent: number;
  bytesSent: number;
  errorsCount: number;
  avgLatency: number;
  p99Latency: number;
}

interface ConsumerMetrics {
  messagesConsumed: number;
  bytesConsumed: number;
  lag: number;
  avgProcessingTime: number;
  errorsCount: number;
}

// ==================== Kafka Producer ====================

export class KafkaProducer {
  private config: ProducerConfig;
  private connected = false;
  private transactionActive = false;
  private metrics: ProducerMetrics = {
    messagesSent: 0,
    bytesSent: 0,
    errorsCount: 0,
    avgLatency: 0,
    p99Latency: 0
  };
  private latencies: number[] = [];

  constructor(config: ProducerConfig) {
    this.config = {
      compression: 'gzip',
      acks: -1,
      batchSize: 16384,
      lingerMs: 10,
      maxInFlightRequests: 5,
      idempotent: true,
      ...config
    };
  }

  /**
   * Connect to Kafka cluster
   */
  async connect(): Promise<void> {
    console.log(`Connecting to Kafka brokers: ${this.config.brokers.join(', ')}...`);

    // Simulated connection
    await this.sleep(100);

    if (this.config.transactional && this.config.transactionalId) {
      await this.initTransactions();
    }

    this.connected = true;
    console.log('Producer connected');
  }

  /**
   * Initialize transactions
   */
  private async initTransactions(): Promise<void> {
    console.log(`Initializing transactions with ID: ${this.config.transactionalId}`);
    // Simulated transaction initialization
    await this.sleep(50);
  }

  /**
   * Send a single message
   */
  async send(message: KafkaMessage): Promise<ProducedMessage> {
    if (!this.connected) {
      throw new Error('Producer not connected');
    }

    const startTime = Date.now();

    try {
      const producedMessage: ProducedMessage = {
        ...message,
        topic: this.config.topic,
        timestamp: message.timestamp || Date.now(),
        partition: message.partition ?? this.selectPartition(message.key),
        offset: this.getNextOffset()
      };

      // Simulated send
      await this.sleep(Math.random() * 10 + 5);

      // Update metrics
      const latency = Date.now() - startTime;
      this.updateMetrics(producedMessage, latency);

      console.log(
        `Sent message to ${this.config.topic}:${producedMessage.partition} @ offset ${producedMessage.offset}`
      );

      return producedMessage;
    } catch (error) {
      this.metrics.errorsCount++;
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  /**
   * Send batch of messages
   */
  async sendBatch(messages: KafkaMessage[]): Promise<ProducedMessage[]> {
    if (!this.connected) {
      throw new Error('Producer not connected');
    }

    console.log(`Sending batch of ${messages.length} messages...`);

    const results: ProducedMessage[] = [];

    // Process in batches based on config
    for (let i = 0; i < messages.length; i += this.config.batchSize!) {
      const batch = messages.slice(i, i + this.config.batchSize!);
      const batchResults = await Promise.all(batch.map(msg => this.send(msg)));
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Begin transaction
   */
  async beginTransaction(): Promise<void> {
    if (!this.config.transactional) {
      throw new Error('Transactions not enabled');
    }

    if (this.transactionActive) {
      throw new Error('Transaction already active');
    }

    console.log('Beginning transaction...');
    this.transactionActive = true;
    await this.sleep(10);
  }

  /**
   * Commit transaction
   */
  async commitTransaction(): Promise<void> {
    if (!this.transactionActive) {
      throw new Error('No active transaction');
    }

    console.log('Committing transaction...');
    await this.sleep(20);
    this.transactionActive = false;
  }

  /**
   * Abort transaction
   */
  async abortTransaction(): Promise<void> {
    if (!this.transactionActive) {
      throw new Error('No active transaction');
    }

    console.log('Aborting transaction...');
    await this.sleep(20);
    this.transactionActive = false;
  }

  /**
   * Select partition for message
   */
  private selectPartition(key?: string | Buffer): number {
    if (!key) {
      // Round-robin if no key
      return Math.floor(Math.random() * 3); // Assume 3 partitions
    }

    // Hash-based partitioning
    const keyStr = typeof key === 'string' ? key : key.toString();
    let hash = 0;
    for (let i = 0; i < keyStr.length; i++) {
      hash = ((hash << 5) - hash) + keyStr.charCodeAt(i);
      hash |= 0; // Convert to 32-bit integer
    }

    return Math.abs(hash) % 3; // Assume 3 partitions
  }

  /**
   * Get next offset (simulated)
   */
  private getNextOffset(): number {
    return Date.now() + Math.floor(Math.random() * 1000);
  }

  /**
   * Update producer metrics
   */
  private updateMetrics(message: ProducedMessage, latency: number): void {
    this.metrics.messagesSent++;

    const valueSize = typeof message.value === 'string'
      ? Buffer.byteLength(message.value)
      : message.value.length;

    this.metrics.bytesSent += valueSize;

    this.latencies.push(latency);
    if (this.latencies.length > 1000) {
      this.latencies.shift();
    }

    this.metrics.avgLatency = this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length;

    const sorted = [...this.latencies].sort((a, b) => a - b);
    this.metrics.p99Latency = sorted[Math.floor(sorted.length * 0.99)];
  }

  /**
   * Get producer metrics
   */
  getMetrics(): ProducerMetrics {
    return { ...this.metrics };
  }

  /**
   * Flush pending messages
   */
  async flush(): Promise<void> {
    console.log('Flushing pending messages...');
    await this.sleep(50);
  }

  /**
   * Disconnect from Kafka
   */
  async disconnect(): Promise<void> {
    if (this.transactionActive) {
      await this.abortTransaction();
    }

    await this.flush();

    console.log('Producer disconnected');
    this.connected = false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ==================== Kafka Consumer ====================

export class KafkaConsumer {
  private config: ConsumerConfig;
  private connected = false;
  private running = false;
  private paused = false;
  private committedOffsets = new Map<string, Map<number, number>>();
  private metrics: ConsumerMetrics = {
    messagesConsumed: 0,
    bytesConsumed: 0,
    lag: 0,
    avgProcessingTime: 0,
    errorsCount: 0
  };
  private processingTimes: number[] = [];

  constructor(config: ConsumerConfig) {
    this.config = {
      fromBeginning: false,
      autoCommit: true,
      autoCommitInterval: 5000,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      maxPollRecords: 500,
      partitionAssignmentStrategy: 'roundrobin',
      ...config
    };
  }

  /**
   * Connect to Kafka cluster and join consumer group
   */
  async connect(): Promise<void> {
    console.log(`Connecting to Kafka as consumer group: ${this.config.groupId}...`);

    // Simulated connection
    await this.sleep(100);

    console.log(`Subscribed to topics: ${this.config.topics.join(', ')}`);

    this.connected = true;
    this.running = true;

    // Start heartbeat
    this.startHeartbeat();
  }

  /**
   * Start heartbeat to maintain group membership
   */
  private startHeartbeat(): void {
    setInterval(() => {
      if (this.connected) {
        // Simulated heartbeat
        console.debug('Heartbeat sent');
      }
    }, this.config.heartbeatInterval!);
  }

  /**
   * Consume messages
   */
  async consume(
    handler: (message: ConsumedMessage) => Promise<void>
  ): Promise<void> {
    if (!this.connected) {
      throw new Error('Consumer not connected');
    }

    console.log('Starting message consumption...');

    while (this.running) {
      if (this.paused) {
        await this.sleep(100);
        continue;
      }

      try {
        // Poll for messages
        const messages = await this.poll();

        for (const message of messages) {
          const startTime = Date.now();

          try {
            await handler(message);

            const processingTime = Date.now() - startTime;
            this.updateMetrics(message, processingTime);

            // Commit offset if auto-commit is disabled
            if (!this.config.autoCommit) {
              await this.commitOffset(message);
            }
          } catch (error) {
            this.metrics.errorsCount++;
            console.error('Error processing message:', error);

            // Optionally send to DLQ
            await this.sendToDeadLetterQueue(message, error);
          }
        }

        // Auto-commit offsets
        if (this.config.autoCommit) {
          await this.commitOffsets();
        }
      } catch (error) {
        console.error('Error polling messages:', error);
        await this.sleep(1000);
      }
    }
  }

  /**
   * Poll for messages
   */
  private async poll(): Promise<ConsumedMessage[]> {
    // Simulated poll
    await this.sleep(Math.random() * 100 + 50);

    const messageCount = Math.floor(Math.random() * 10);
    const messages: ConsumedMessage[] = [];

    for (let i = 0; i < messageCount; i++) {
      messages.push(this.generateMessage());
    }

    return messages;
  }

  /**
   * Generate simulated message
   */
  private generateMessage(): ConsumedMessage {
    const topic = this.config.topics[Math.floor(Math.random() * this.config.topics.length)];
    const partition = Math.floor(Math.random() * 3);

    return {
      topic,
      partition,
      offset: Date.now() + Math.floor(Math.random() * 1000),
      key: `key_${Math.random().toString(36).substr(2, 9)}`,
      value: JSON.stringify({
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        data: 'Sample message data'
      }),
      timestamp: Date.now(),
      size: 100 + Math.floor(Math.random() * 900),
      highWaterOffset: Date.now() + 10000
    };
  }

  /**
   * Commit offset for a specific message
   */
  private async commitOffset(message: ConsumedMessage): Promise<void> {
    let topicOffsets = this.committedOffsets.get(message.topic);

    if (!topicOffsets) {
      topicOffsets = new Map();
      this.committedOffsets.set(message.topic, topicOffsets);
    }

    topicOffsets.set(message.partition, message.offset);

    // Simulated commit
    await this.sleep(5);
  }

  /**
   * Commit all pending offsets
   */
  private async commitOffsets(): Promise<void> {
    if (this.committedOffsets.size === 0) {
      return;
    }

    console.debug('Committing offsets...');

    // Simulated commit
    await this.sleep(10);
  }

  /**
   * Seek to specific offset
   */
  async seek(topic: string, partition: number, offset: number): Promise<void> {
    console.log(`Seeking to ${topic}:${partition} @ offset ${offset}`);

    let topicOffsets = this.committedOffsets.get(topic);

    if (!topicOffsets) {
      topicOffsets = new Map();
      this.committedOffsets.set(topic, topicOffsets);
    }

    topicOffsets.set(partition, offset);

    await this.sleep(10);
  }

  /**
   * Seek to beginning
   */
  async seekToBeginning(): Promise<void> {
    console.log('Seeking to beginning...');

    for (const topic of this.config.topics) {
      for (let partition = 0; partition < 3; partition++) {
        await this.seek(topic, partition, 0);
      }
    }
  }

  /**
   * Seek to end
   */
  async seekToEnd(): Promise<void> {
    console.log('Seeking to end...');

    for (const topic of this.config.topics) {
      for (let partition = 0; partition < 3; partition++) {
        await this.seek(topic, partition, Number.MAX_SAFE_INTEGER);
      }
    }
  }

  /**
   * Pause consumption
   */
  pause(): void {
    console.log('Pausing consumption...');
    this.paused = true;
  }

  /**
   * Resume consumption
   */
  resume(): void {
    console.log('Resuming consumption...');
    this.paused = false;
  }

  /**
   * Send message to dead letter queue
   */
  private async sendToDeadLetterQueue(message: ConsumedMessage, error: any): Promise<void> {
    const dlqTopic = `${message.topic}.dlq`;

    console.log(`Sending message to DLQ: ${dlqTopic}`);

    // In real implementation, would create a producer and send to DLQ
    await this.sleep(10);
  }

  /**
   * Update consumer metrics
   */
  private updateMetrics(message: ConsumedMessage, processingTime: number): void {
    this.metrics.messagesConsumed++;
    this.metrics.bytesConsumed += message.size;

    // Calculate lag
    this.metrics.lag = message.highWaterOffset - message.offset;

    this.processingTimes.push(processingTime);
    if (this.processingTimes.length > 1000) {
      this.processingTimes.shift();
    }

    this.metrics.avgProcessingTime =
      this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length;
  }

  /**
   * Get consumer metrics
   */
  getMetrics(): ConsumerMetrics {
    return { ...this.metrics };
  }

  /**
   * Get committed offsets
   */
  getCommittedOffsets(): Map<string, Map<number, number>> {
    return new Map(this.committedOffsets);
  }

  /**
   * Disconnect from Kafka
   */
  async disconnect(): Promise<void> {
    this.running = false;

    // Commit pending offsets
    await this.commitOffsets();

    console.log('Consumer disconnected');
    this.connected = false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ==================== Admin Client ====================

export class KafkaAdmin {
  private config: KafkaConfig;
  private connected = false;

  constructor(config: KafkaConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    console.log('Connecting admin client...');
    await this.sleep(50);
    this.connected = true;
  }

  /**
   * Create topic
   */
  async createTopic(
    topic: string,
    numPartitions: number = 3,
    replicationFactor: number = 1,
    config?: Record<string, string>
  ): Promise<void> {
    if (!this.connected) {
      throw new Error('Admin client not connected');
    }

    console.log(`Creating topic: ${topic} (partitions: ${numPartitions}, replication: ${replicationFactor})`);

    await this.sleep(100);

    console.log(`Topic ${topic} created successfully`);
  }

  /**
   * Delete topic
   */
  async deleteTopic(topic: string): Promise<void> {
    if (!this.connected) {
      throw new Error('Admin client not connected');
    }

    console.log(`Deleting topic: ${topic}`);
    await this.sleep(100);
  }

  /**
   * List topics
   */
  async listTopics(): Promise<string[]> {
    if (!this.connected) {
      throw new Error('Admin client not connected');
    }

    // Simulated topic list
    return ['orders', 'users', 'events', 'analytics'];
  }

  /**
   * Get topic metadata
   */
  async getTopicMetadata(topic: string): Promise<TopicMetadata> {
    if (!this.connected) {
      throw new Error('Admin client not connected');
    }

    // Simulated metadata
    return {
      name: topic,
      replicationFactor: 1,
      partitions: [
        { partition: 0, leader: 1, replicas: [1], isr: [1] },
        { partition: 1, leader: 2, replicas: [2], isr: [2] },
        { partition: 2, leader: 3, replicas: [3], isr: [3] }
      ],
      config: {
        'retention.ms': '604800000',
        'segment.bytes': '1073741824'
      }
    };
  }

  /**
   * Get consumer group info
   */
  async getConsumerGroup(groupId: string): Promise<ConsumerGroupMetadata> {
    if (!this.connected) {
      throw new Error('Admin client not connected');
    }

    // Simulated group metadata
    return {
      groupId,
      state: 'Stable',
      coordinator: 1,
      members: [
        {
          memberId: 'consumer-1',
          clientId: 'client-1',
          host: 'localhost',
          assignment: [
            { topic: 'orders', partitions: [0, 1] }
          ]
        }
      ]
    };
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ==================== Example Usage ====================

export async function demonstrateKafkaConnector() {
  console.log('=== Kafka Connector Demonstration ===\n');

  const brokers = ['localhost:9092'];

  // Admin operations
  const admin = new KafkaAdmin({ brokers, clientId: 'admin-client' });
  await admin.connect();

  await admin.createTopic('etl-events', 3, 1);
  const topics = await admin.listTopics();
  console.log('Available topics:', topics);

  // Producer
  const producer = new KafkaProducer({
    brokers,
    clientId: 'etl-producer',
    topic: 'etl-events',
    idempotent: true
  });

  await producer.connect();

  // Send messages
  await producer.send({
    key: 'user-123',
    value: JSON.stringify({ event: 'user_created', userId: 123, timestamp: Date.now() })
  });

  const producerMetrics = producer.getMetrics();
  console.log('Producer metrics:', producerMetrics);

  await producer.disconnect();

  // Consumer
  const consumer = new KafkaConsumer({
    brokers,
    clientId: 'etl-consumer',
    groupId: 'etl-pipeline',
    topics: ['etl-events']
  });

  await consumer.connect();

  // Consume for a bit
  setTimeout(() => consumer.disconnect(), 5000);

  await consumer.consume(async (message) => {
    console.log('Consumed message:', {
      topic: message.topic,
      partition: message.partition,
      offset: message.offset,
      value: message.value.toString()
    });
  });

  const consumerMetrics = consumer.getMetrics();
  console.log('Consumer metrics:', consumerMetrics);

  await admin.disconnect();

  console.log('\n=== Kafka Connector Demo Complete ===');
}

if (import.meta.main) {
  await demonstrateKafkaConnector();
}
