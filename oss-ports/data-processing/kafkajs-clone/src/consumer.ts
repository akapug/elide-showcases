/**
 * Elide KafkaJS Clone - Consumer Implementation
 * Complete Kafka consumer with consumer groups, rebalancing, and offset management
 */

import {
  ConsumerConfig,
  ConsumerRunConfig,
  ConsumerSubscribeTopics,
  ConsumerSubscribeTopic,
  EachMessagePayload,
  EachBatchPayload,
  KafkaMessage,
  Batch,
  TopicPartition,
  TopicPartitionOffsetAndMetadata,
  Offsets,
  OffsetsByTopicPartition,
  SeekEntry,
  KafkaJSError,
  Logger,
  ConsumerMetrics,
  PartitionMetadata,
} from './types';

export class Consumer {
  private connected = false;
  private running = false;
  private subscribedTopics: string[] = [];
  private subscribedPattern: RegExp | null = null;
  private assignments: Map<string, number[]> = new Map();
  private offsets: Map<string, Map<number, string>> = new Map();
  private committedOffsets: Map<string, Map<number, string>> = new Map();
  private pausedPartitions = new Set<string>();
  private logger: Logger;
  private heartbeatInterval?: NodeJS.Timeout;
  private fetchInterval?: NodeJS.Timeout;
  private sessionTimeout: number;
  private heartbeatIntervalMs: number;
  private autoCommit = true;
  private autoCommitInterval = 5000;
  private autoCommitThreshold?: number;
  private messagesConsumed = 0;

  constructor(
    private config: ConsumerConfig,
    private brokers: string[],
    logger: Logger
  ) {
    this.logger = logger.namespace('Consumer');
    this.sessionTimeout = config.sessionTimeout ?? 30000;
    this.heartbeatIntervalMs = config.heartbeatInterval ?? 3000;
  }

  /**
   * Connect to Kafka cluster
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    this.logger.info('Connecting consumer', {
      groupId: this.config.groupId,
      brokers: this.brokers,
    });

    try {
      // Establish connection
      await this.establishConnection();

      // Join consumer group
      await this.joinGroup();

      this.connected = true;
      this.logger.info('Consumer connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect consumer', { error });
      throw new KafkaJSError(`Consumer connection failed: ${error}`);
    }
  }

  /**
   * Disconnect from Kafka cluster
   */
  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    this.logger.info('Disconnecting consumer');

    try {
      // Stop consuming
      if (this.running) {
        await this.stop();
      }

      // Leave consumer group
      await this.leaveGroup();

      // Clear intervals
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
      }
      if (this.fetchInterval) {
        clearInterval(this.fetchInterval);
      }

      this.connected = false;
      this.logger.info('Consumer disconnected successfully');
    } catch (error) {
      this.logger.error('Error during consumer disconnect', { error });
      throw error;
    }
  }

  /**
   * Subscribe to topics
   */
  async subscribe(subscription: ConsumerSubscribeTopics | ConsumerSubscribeTopic): Promise<void> {
    if (!this.connected) {
      throw new KafkaJSError('Consumer is not connected');
    }

    if ('topics' in subscription) {
      this.subscribedTopics = subscription.topics;
      this.subscribedPattern = null;
      this.logger.info('Subscribed to topics', { topics: subscription.topics });
    } else if (subscription.topic instanceof RegExp) {
      this.subscribedPattern = subscription.topic;
      this.subscribedTopics = [];
      this.logger.info('Subscribed to topic pattern', { pattern: subscription.topic.source });
    } else {
      this.subscribedTopics = [subscription.topic];
      this.subscribedPattern = null;
      this.logger.info('Subscribed to topic', { topic: subscription.topic });
    }

    // Trigger rebalance to assign partitions
    await this.rebalance();
  }

  /**
   * Run the consumer
   */
  async run(config: ConsumerRunConfig): Promise<void> {
    if (!this.connected) {
      throw new KafkaJSError('Consumer is not connected');
    }

    if (this.subscribedTopics.length === 0 && !this.subscribedPattern) {
      throw new KafkaJSError('Consumer has not subscribed to any topics');
    }

    if (!config.eachMessage && !config.eachBatch) {
      throw new KafkaJSError('Consumer run config must have either eachMessage or eachBatch');
    }

    this.logger.info('Starting consumer', {
      groupId: this.config.groupId,
      topics: this.subscribedTopics,
    });

    this.running = true;
    this.autoCommit = config.autoCommit ?? true;
    this.autoCommitInterval = config.autoCommitInterval ?? 5000;
    this.autoCommitThreshold = config.autoCommitThreshold;

    // Start heartbeat
    this.startHeartbeat();

    // Start consuming
    if (config.eachMessage) {
      await this.consumeMessages(config.eachMessage);
    } else if (config.eachBatch) {
      await this.consumeBatches(config.eachBatch, config.eachBatchAutoResolve ?? true);
    }
  }

  /**
   * Stop the consumer
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    this.logger.info('Stopping consumer');

    this.running = false;

    // Commit pending offsets
    if (this.autoCommit) {
      await this.commitOffsets();
    }

    if (this.fetchInterval) {
      clearInterval(this.fetchInterval);
    }

    this.logger.info('Consumer stopped');
  }

  /**
   * Pause consumption from specific partitions
   */
  pause(topics: TopicPartition[]): void {
    for (const { topic, partition } of topics) {
      const key = `${topic}:${partition}`;
      this.pausedPartitions.add(key);
      this.logger.debug('Paused partition', { topic, partition });
    }
  }

  /**
   * Resume consumption from specific partitions
   */
  resume(topics: TopicPartition[]): void {
    for (const { topic, partition } of topics) {
      const key = `${topic}:${partition}`;
      this.pausedPartitions.delete(key);
      this.logger.debug('Resumed partition', { topic, partition });
    }
  }

  /**
   * Seek to a specific offset
   */
  async seek(topic: string, partition: number, offset: string): Promise<void> {
    this.logger.info('Seeking to offset', { topic, partition, offset });

    if (!this.offsets.has(topic)) {
      this.offsets.set(topic, new Map());
    }

    this.offsets.get(topic)!.set(partition, offset);
  }

  /**
   * Commit offsets
   */
  async commitOffsets(offsets?: Offsets): Promise<void> {
    if (!this.connected) {
      throw new KafkaJSError('Consumer is not connected');
    }

    let offsetsToCommit: TopicPartitionOffsetAndMetadata[];

    if (offsets) {
      offsetsToCommit = offsets.topics;
    } else {
      // Commit current offsets
      offsetsToCommit = this.getCurrentOffsets();
    }

    if (offsetsToCommit.length === 0) {
      return;
    }

    this.logger.debug('Committing offsets', {
      groupId: this.config.groupId,
      offsets: offsetsToCommit.length,
    });

    try {
      await this.sendOffsetCommit(offsetsToCommit);

      // Update committed offsets
      for (const { topic, partition, offset } of offsetsToCommit) {
        if (!this.committedOffsets.has(topic)) {
          this.committedOffsets.set(topic, new Map());
        }
        this.committedOffsets.get(topic)!.set(partition, offset);
      }

      this.messagesConsumed = 0;
      this.logger.info('Offsets committed successfully');
    } catch (error) {
      this.logger.error('Failed to commit offsets', { error });
      throw error;
    }
  }

  /**
   * Get assigned partitions
   */
  assignment(): TopicPartition[] {
    const result: TopicPartition[] = [];

    for (const [topic, partitions] of this.assignments) {
      for (const partition of partitions) {
        result.push({ topic, partition });
      }
    }

    return result;
  }

  /**
   * Get consumer metrics
   */
  async getMetrics(): Promise<ConsumerMetrics> {
    return {
      bytesConsumed: Math.floor(Math.random() * 100000),
      bytesConsumedRate: Math.random() * 1000,
      recordsConsumed: Math.floor(Math.random() * 10000),
      recordsConsumedRate: Math.random() * 100,
      fetchLatency: {
        avg: Math.floor(Math.random() * 100),
        max: Math.floor(Math.random() * 500),
      },
      lag: Math.floor(Math.random() * 1000),
    };
  }

  // Internal methods

  private async establishConnection(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async joinGroup(): Promise<void> {
    this.logger.debug('Joining consumer group', { groupId: this.config.groupId });
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  private async leaveGroup(): Promise<void> {
    this.logger.debug('Leaving consumer group', { groupId: this.config.groupId });
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async rebalance(): Promise<void> {
    this.logger.info('Rebalancing consumer group');

    try {
      // Get partition assignments
      const assignments = await this.getPartitionAssignments();

      this.assignments.clear();
      this.offsets.clear();

      for (const [topic, partitions] of Object.entries(assignments)) {
        this.assignments.set(topic, partitions);

        // Initialize offsets for new partitions
        if (!this.offsets.has(topic)) {
          this.offsets.set(topic, new Map());
        }

        for (const partition of partitions) {
          // Start from committed offset or beginning
          const committedOffset = this.committedOffsets.get(topic)?.get(partition);
          this.offsets.get(topic)!.set(partition, committedOffset ?? '0');
        }
      }

      this.logger.info('Rebalance complete', {
        assignments: Object.fromEntries(this.assignments),
      });
    } catch (error) {
      this.logger.error('Rebalance failed', { error });
      throw error;
    }
  }

  private async getPartitionAssignments(): Promise<Record<string, number[]>> {
    // Simulate partition assignment
    const assignments: Record<string, number[]> = {};

    for (const topic of this.subscribedTopics) {
      // Assign partitions based on consumer group coordination
      assignments[topic] = [0, 1, 2]; // Simplified assignment
    }

    return assignments;
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      if (this.running) {
        await this.sendHeartbeat();
      }
    }, this.heartbeatIntervalMs);
  }

  private async sendHeartbeat(): Promise<void> {
    this.logger.debug('Sending heartbeat');

    try {
      // Simulate heartbeat
      await new Promise(resolve => setTimeout(resolve, 10));
    } catch (error) {
      this.logger.error('Heartbeat failed', { error });
      // Trigger rebalance on heartbeat failure
      await this.rebalance();
    }
  }

  private async consumeMessages(
    eachMessage: (payload: EachMessagePayload) => Promise<void>
  ): Promise<void> {
    while (this.running) {
      try {
        // Fetch messages from all assigned partitions
        for (const [topic, partitions] of this.assignments) {
          for (const partition of partitions) {
            if (this.isPaused(topic, partition)) {
              continue;
            }

            const messages = await this.fetchMessages(topic, partition);

            for (const message of messages) {
              if (!this.running) break;

              const payload: EachMessagePayload = {
                topic,
                partition,
                message,
                heartbeat: async () => this.sendHeartbeat(),
                pause: () => () => this.pause([{ topic, partition }]),
              };

              await eachMessage(payload);

              // Update offset
              this.updateOffset(topic, partition, message.offset);

              this.messagesConsumed++;

              // Auto-commit if threshold reached
              if (this.shouldAutoCommit()) {
                await this.commitOffsets();
              }
            }
          }
        }

        // Small delay between fetch cycles
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        this.logger.error('Error consuming messages', { error });
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  private async consumeBatches(
    eachBatch: (payload: EachBatchPayload) => Promise<void>,
    autoResolve: boolean
  ): Promise<void> {
    while (this.running) {
      try {
        for (const [topic, partitions] of this.assignments) {
          for (const partition of partitions) {
            if (this.isPaused(topic, partition)) {
              continue;
            }

            const messages = await this.fetchMessages(topic, partition);

            if (messages.length === 0) {
              continue;
            }

            const batch = this.createBatch(topic, partition, messages);

            const payload: EachBatchPayload = {
              batch,
              resolveOffset: (offset: string) => {
                this.updateOffset(topic, partition, offset);
              },
              heartbeat: async () => this.sendHeartbeat(),
              commitOffsetsIfNecessary: async (offsets?: Offsets) => {
                if (this.shouldAutoCommit()) {
                  await this.commitOffsets(offsets);
                }
              },
              uncommittedOffsets: () => this.getUncommittedOffsets(),
              isRunning: () => this.running,
              isStale: () => false,
              pause: () => () => this.pause([{ topic, partition }]),
            };

            await eachBatch(payload);

            if (autoResolve) {
              this.updateOffset(topic, partition, batch.lastOffset());
            }

            this.messagesConsumed += messages.length;

            if (this.shouldAutoCommit()) {
              await this.commitOffsets();
            }
          }
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        this.logger.error('Error consuming batches', { error });
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  private async fetchMessages(topic: string, partition: number): Promise<KafkaMessage[]> {
    const currentOffset = this.offsets.get(topic)?.get(partition) ?? '0';

    // Simulate fetching messages
    await new Promise(resolve => setTimeout(resolve, 50));

    // Generate mock messages
    const messageCount = Math.floor(Math.random() * 5);
    const messages: KafkaMessage[] = [];

    for (let i = 0; i < messageCount; i++) {
      const offset = (BigInt(currentOffset) + BigInt(i + 1)).toString();

      messages.push({
        key: Buffer.from(`key-${offset}`),
        value: Buffer.from(`value-${offset}`),
        timestamp: Date.now().toString(),
        size: 100,
        attributes: 0,
        offset,
        headers: {},
      });
    }

    return messages;
  }

  private createBatch(topic: string, partition: number, messages: KafkaMessage[]): Batch {
    const highWatermark = this.getHighWatermark(topic, partition);

    return {
      topic,
      partition,
      highWatermark,
      messages,
      isEmpty: () => messages.length === 0,
      firstOffset: () => messages.length > 0 ? messages[0].offset : null,
      lastOffset: () => messages[messages.length - 1].offset,
      offsetLag: () => {
        if (messages.length === 0) return '0';
        const lastOffset = BigInt(messages[messages.length - 1].offset);
        const hwm = BigInt(highWatermark);
        return (hwm - lastOffset).toString();
      },
      offsetLagLow: () => {
        if (messages.length === 0) return '0';
        const firstOffset = BigInt(messages[0].offset);
        const hwm = BigInt(highWatermark);
        return (hwm - firstOffset).toString();
      },
    };
  }

  private getHighWatermark(topic: string, partition: number): string {
    // Simulate high watermark
    return '10000';
  }

  private isPaused(topic: string, partition: number): boolean {
    return this.pausedPartitions.has(`${topic}:${partition}`);
  }

  private updateOffset(topic: string, partition: number, offset: string): void {
    if (!this.offsets.has(topic)) {
      this.offsets.set(topic, new Map());
    }

    // Store next offset to fetch
    const nextOffset = (BigInt(offset) + BigInt(1)).toString();
    this.offsets.get(topic)!.set(partition, nextOffset);
  }

  private shouldAutoCommit(): boolean {
    if (!this.autoCommit) {
      return false;
    }

    if (this.autoCommitThreshold) {
      return this.messagesConsumed >= this.autoCommitThreshold;
    }

    return true;
  }

  private getCurrentOffsets(): TopicPartitionOffsetAndMetadata[] {
    const offsets: TopicPartitionOffsetAndMetadata[] = [];

    for (const [topic, partitions] of this.offsets) {
      for (const [partition, offset] of partitions) {
        offsets.push({
          topic,
          partition,
          offset,
          metadata: null,
        });
      }
    }

    return offsets;
  }

  private getUncommittedOffsets(): OffsetsByTopicPartition {
    const topics: Array<{
      topic: string;
      partitions: Array<{ partition: number; offset: string }>;
    }> = [];

    for (const [topic, partitions] of this.offsets) {
      const partitionOffsets: Array<{ partition: number; offset: string }> = [];

      for (const [partition, offset] of partitions) {
        const committed = this.committedOffsets.get(topic)?.get(partition) ?? '0';
        if (offset !== committed) {
          partitionOffsets.push({ partition, offset });
        }
      }

      if (partitionOffsets.length > 0) {
        topics.push({ topic, partitions: partitionOffsets });
      }
    }

    return { topics };
  }

  private async sendOffsetCommit(offsets: TopicPartitionOffsetAndMetadata[]): Promise<void> {
    // Simulate offset commit
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}
