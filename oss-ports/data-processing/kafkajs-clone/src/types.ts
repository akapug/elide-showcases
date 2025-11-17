/**
 * Elide KafkaJS Clone - Type Definitions
 * Complete TypeScript types for Kafka client
 */

// Connection Types
export interface KafkaConfig {
  clientId: string;
  brokers: string[];
  ssl?: SSLOptions | boolean;
  sasl?: SASLOptions;
  connectionTimeout?: number;
  requestTimeout?: number;
  retry?: RetryOptions;
  logLevel?: LogLevel;
  logCreator?: LogCreator;
}

export interface SSLOptions {
  rejectUnauthorized?: boolean;
  ca?: string[];
  cert?: string;
  key?: string;
}

export interface SASLOptions {
  mechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512' | 'aws' | 'oauthbearer';
  username?: string;
  password?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  oauthBearerProvider?: () => Promise<OAuthBearerToken>;
}

export interface OAuthBearerToken {
  value: string;
  extensions?: Record<string, string>;
  lifetime?: number;
}

export interface RetryOptions {
  maxRetryTime?: number;
  initialRetryTime?: number;
  factor?: number;
  multiplier?: number;
  retries?: number;
}

export enum LogLevel {
  NOTHING = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 4,
  DEBUG = 5,
}

export type LogEntry = {
  level: LogLevel;
  log: {
    timestamp: string;
    logger: string;
    message: string;
    [key: string]: any;
  };
};

export type LogCreator = (logLevel: LogLevel) => (entry: LogEntry) => void;

// Producer Types
export interface ProducerConfig {
  createPartitioner?: ICustomPartitioner;
  retry?: RetryOptions;
  metadataMaxAge?: number;
  allowAutoTopicCreation?: boolean;
  transactionTimeout?: number;
  idempotent?: boolean;
  maxInFlightRequests?: number;
  compression?: CompressionTypes;
}

export enum CompressionTypes {
  None = 0,
  GZIP = 1,
  Snappy = 2,
  LZ4 = 3,
  ZSTD = 4,
}

export enum CompressionCodecs {
  None = 0,
  GZIP = 1,
  Snappy = 2,
  LZ4 = 3,
  ZSTD = 4,
}

export interface ICustomPartitioner {
  (): Partitioner;
}

export type Partitioner = (args: {
  topic: string;
  partitionMetadata: PartitionMetadata[];
  message: Message;
}) => number;

export interface PartitionMetadata {
  partitionId: number;
  leader: number;
  replicas: number[];
  isr: number[];
  offlineReplicas?: number[];
}

export interface Message {
  key?: Buffer | string | null;
  value: Buffer | string | null;
  partition?: number;
  headers?: IHeaders;
  timestamp?: string;
}

export interface IHeaders {
  [key: string]: Buffer | string | (Buffer | string)[] | undefined;
}

export interface ProducerRecord {
  topic: string;
  messages: Message[];
  acks?: number;
  timeout?: number;
  compression?: CompressionTypes;
}

export interface RecordMetadata {
  topicName: string;
  partition: number;
  errorCode: number;
  offset?: string;
  timestamp?: string;
  baseOffset?: string;
  logAppendTime?: string;
  logStartOffset?: string;
}

export interface ProducerBatch {
  topicName: string;
  partition: number;
  highWatermark: string;
  messages: Message[];
}

// Consumer Types
export interface ConsumerConfig {
  groupId: string;
  partitionAssignors?: PartitionAssigner[];
  sessionTimeout?: number;
  rebalanceTimeout?: number;
  heartbeatInterval?: number;
  metadataMaxAge?: number;
  allowAutoTopicCreation?: boolean;
  maxBytesPerPartition?: number;
  minBytes?: number;
  maxBytes?: number;
  maxWaitTimeInMs?: number;
  retry?: RetryOptions;
  readUncommitted?: boolean;
  maxInFlightRequests?: number;
  rackId?: string;
}

export interface PartitionAssigner {
  name: string;
  version: number;
  assign(group: {
    members: Member[];
    topics: string[];
  }): Promise<Assignment[]>;
  protocol(subscription: { topics: string[] }): GroupMemberAssignment;
}

export interface Member {
  memberId: string;
  memberMetadata: MemberMetadata;
}

export interface MemberMetadata {
  version: number;
  topics: string[];
  userData?: Buffer;
}

export interface Assignment {
  memberId: string;
  memberAssignment: MemberAssignment;
}

export interface MemberAssignment {
  version: number;
  assignment: { [topic: string]: number[] };
  userData?: Buffer;
}

export interface GroupMemberAssignment {
  version: number;
  metadata: Buffer;
}

export interface TopicPartition {
  topic: string;
  partition: number;
}

export interface TopicPartitionOffset extends TopicPartition {
  offset: string;
}

export interface TopicPartitionOffsetAndMetadata extends TopicPartitionOffset {
  metadata?: string | null;
  leaderEpoch?: number;
}

export interface EachMessagePayload {
  topic: string;
  partition: number;
  message: KafkaMessage;
  heartbeat(): Promise<void>;
  pause(): () => void;
}

export interface EachBatchPayload {
  batch: Batch;
  resolveOffset(offset: string): void;
  heartbeat(): Promise<void>;
  commitOffsetsIfNecessary(offsets?: Offsets): Promise<void>;
  uncommittedOffsets(): OffsetsByTopicPartition;
  isRunning(): boolean;
  isStale(): boolean;
  pause(): () => void;
}

export interface Batch {
  topic: string;
  partition: number;
  highWatermark: string;
  messages: KafkaMessage[];
  isEmpty(): boolean;
  firstOffset(): string | null;
  lastOffset(): string;
  offsetLag(): string;
  offsetLagLow(): string;
}

export interface KafkaMessage {
  key: Buffer | null;
  value: Buffer | null;
  timestamp: string;
  size: number;
  attributes: number;
  offset: string;
  headers: IHeaders;
}

export interface Offsets {
  topics: TopicPartitionOffsetAndMetadata[];
}

export interface OffsetsByTopicPartition {
  topics: Array<{
    topic: string;
    partitions: Array<{
      partition: number;
      offset: string;
    }>;
  }>;
}

export interface ConsumerRunConfig {
  autoCommit?: boolean;
  autoCommitInterval?: number | null;
  autoCommitThreshold?: number | null;
  eachBatchAutoResolve?: boolean;
  partitionsConsumedConcurrently?: number;
  eachBatch?: (payload: EachBatchPayload) => Promise<void>;
  eachMessage?: (payload: EachMessagePayload) => Promise<void>;
}

export interface ConsumerSubscribeTopics {
  topics: string[];
  fromBeginning?: boolean;
}

export interface ConsumerSubscribeTopic {
  topic: string | RegExp;
  fromBeginning?: boolean;
}

// Admin Types
export interface AdminConfig {
  retry?: RetryOptions;
}

export interface ITopicConfig {
  topic: string;
  numPartitions?: number;
  replicationFactor?: number;
  replicaAssignment?: ReplicaAssignment[];
  configEntries?: ConfigEntry[];
}

export interface ReplicaAssignment {
  partition: number;
  replicas: number[];
}

export interface ConfigEntry {
  name: string;
  value: string;
}

export interface ITopicMetadata {
  name: string;
  partitions: PartitionMetadata[];
}

export interface ConfigResourceTypes {
  TOPIC: 2;
  BROKER: 4;
}

export interface ResourceConfigQuery {
  type: number;
  name: string;
  configNames?: string[];
}

export interface DescribeConfigResponse {
  resources: Array<{
    resourceType: number;
    resourceName: string;
    configEntries: Array<{
      configName: string;
      configValue: string;
      isDefault: boolean;
      isSensitive: boolean;
      readOnly: boolean;
      configSource: number;
      configSynonyms: ConfigSynonym[];
    }>;
  }>;
  throttleTime: number;
}

export interface ConfigSynonym {
  configName: string;
  configValue: string;
  configSource: number;
}

export interface AlterConfigEntry {
  name: string;
  value: string;
}

export interface AlterConfigResource {
  type: number;
  name: string;
  configEntries: AlterConfigEntry[];
}

export interface SeekEntry {
  partition: number;
  offset: string;
}

export interface TopicOffsets {
  topic: string;
  partitions: Array<{
    partition: number;
    offset: string;
    high?: string;
    low?: string;
  }>;
}

export interface OffsetCommitRequest {
  groupId: string;
  memberId: string;
  groupGenerationId: number;
  topics: Array<{
    topic: string;
    partitions: Array<{
      partition: number;
      offset: string;
    }>;
  }>;
}

export interface PartitionOffset {
  partition: number;
  offset: string;
  metadata?: string | null;
}

export interface TopicMessages {
  topic: string;
  messages: Message[];
}

// Transaction Types
export interface TransactionConfig {
  transactionalId: string;
  transactionTimeout?: number;
}

export interface Transaction {
  send(record: ProducerRecord): Promise<RecordMetadata[]>;
  sendOffsets(offsets: {
    consumerGroupId: string;
    topics: TopicPartitionOffsetAndMetadata[];
  }): Promise<void>;
  commit(): Promise<void>;
  abort(): Promise<void>;
  isActive(): boolean;
}

// Error Types
export class KafkaJSError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'KafkaJSError';
  }
}

export class KafkaJSProtocolError extends KafkaJSError {
  constructor(
    message: string,
    public readonly type: string,
    public readonly code: number
  ) {
    super(message, type);
    this.name = 'KafkaJSProtocolError';
  }
}

export class KafkaJSNumberOfRetriesExceeded extends KafkaJSError {
  constructor(
    message: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'KafkaJSNumberOfRetriesExceeded';
  }
}

export class KafkaJSConnectionError extends KafkaJSError {
  constructor(
    message: string,
    public readonly broker?: string
  ) {
    super(message);
    this.name = 'KafkaJSConnectionError';
  }
}

export class KafkaJSRequestTimeoutError extends KafkaJSError {
  constructor(
    message: string,
    public readonly broker?: string
  ) {
    super(message);
    this.name = 'KafkaJSRequestTimeoutError';
  }
}

// Instrumentation Types
export interface InstrumentationEvent<T = any> {
  id: string;
  type: string;
  timestamp: number;
  payload: T;
}

export type RemoveInstrumentationEventListener<T> = () => void;

export interface InstrumentationEventEmitter {
  addListener<T = any>(
    eventName: string,
    listener: (event: InstrumentationEvent<T>) => void
  ): RemoveInstrumentationEventListener<T>;
}

// Cluster Types
export interface Broker {
  nodeId: number;
  host: string;
  port: number;
  rack?: string;
}

export interface ClusterMetadata {
  brokers: Broker[];
  topics: ITopicMetadata[];
  controllerId: number;
}

// Logger Types
export interface Logger {
  info(message: string, extra?: object): void;
  error(message: string, extra?: object): void;
  warn(message: string, extra?: object): void;
  debug(message: string, extra?: object): void;
  namespace(namespace: string): Logger;
  setLogLevel(level: LogLevel): void;
}

// Metrics Types
export interface ProducerMetrics {
  requestTotal: number;
  requestRate: number;
  requestSize: {
    avg: number;
    max: number;
  };
  errorTotal: number;
  errorRate: number;
}

export interface ConsumerMetrics {
  bytesConsumed: number;
  bytesConsumedRate: number;
  recordsConsumed: number;
  recordsConsumedRate: number;
  fetchLatency: {
    avg: number;
    max: number;
  };
  lag: number;
}
