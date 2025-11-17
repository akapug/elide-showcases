/**
 * Type definitions for @elide/redis
 */

/**
 * Redis client options
 */
export interface RedisOptions {
  host?: string;
  port?: number;
  password?: string;
  username?: string;
  db?: number;
  tls?: boolean;
  connectTimeout?: number;
  commandTimeout?: number;
  retryStrategy?: (times: number) => number | false;
  enableOfflineQueue?: boolean;
  enableReadyCheck?: boolean;
  maxRetriesPerRequest?: number;
  connectionName?: string;
  lazyConnect?: boolean;
  keepAlive?: number;
  noDelay?: boolean;
  family?: 4 | 6;
  path?: string;
}

/**
 * Connection pool options
 */
export interface PoolOptions extends RedisOptions {
  min?: number;
  max?: number;
  acquireTimeout?: number;
  idleTimeout?: number;
  evictionInterval?: number;
}

/**
 * Cluster options
 */
export interface ClusterOptions {
  nodes: Array<{ host: string; port: number }>;
  redisOptions?: RedisOptions;
  clusterRetryStrategy?: (times: number) => number | false;
  enableReadyCheck?: boolean;
  scaleReads?: 'master' | 'slave' | 'all';
  maxRedirections?: number;
  natMap?: Record<string, { host: string; port: number }>;
}

/**
 * Pub/Sub message handler
 */
export type MessageHandler = (channel: string, message: string) => void;

/**
 * Pattern message handler
 */
export type PatternHandler = (pattern: string, channel: string, message: string) => void;

/**
 * Redis value types
 */
export type RedisValue = string | number | Buffer;
export type RedisKey = string | Buffer;

/**
 * Command argument types
 */
export type CommandArgs = Array<RedisValue | RedisValue[]>;

/**
 * Scan result
 */
export interface ScanResult {
  cursor: string;
  keys: string[];
}

/**
 * HScan result
 */
export interface HScanResult {
  cursor: string;
  entries: Record<string, string>;
}

/**
 * SScan result
 */
export interface SScanResult {
  cursor: string;
  members: string[];
}

/**
 * ZScan result
 */
export interface ZScanResult {
  cursor: string;
  members: Array<{ member: string; score: number }>;
}

/**
 * Sorted set member with score
 */
export interface ZMember {
  member: string;
  score: number;
}

/**
 * GEO coordinates
 */
export interface GeoCoordinates {
  longitude: number;
  latitude: number;
}

/**
 * GEO position
 */
export interface GeoPosition extends GeoCoordinates {
  member: string;
}

/**
 * GEO radius result
 */
export interface GeoRadiusResult {
  member: string;
  distance?: number;
  hash?: number;
  coordinates?: GeoCoordinates;
}

/**
 * Stream entry
 */
export interface StreamEntry {
  id: string;
  fields: Record<string, string>;
}

/**
 * Stream read result
 */
export interface StreamReadResult {
  stream: string;
  entries: StreamEntry[];
}

/**
 * Info sections
 */
export type InfoSection =
  | 'server'
  | 'clients'
  | 'memory'
  | 'persistence'
  | 'stats'
  | 'replication'
  | 'cpu'
  | 'commandstats'
  | 'cluster'
  | 'keyspace'
  | 'all'
  | 'default';

/**
 * Client list entry
 */
export interface ClientInfo {
  id: number;
  addr: string;
  fd: number;
  name: string;
  age: number;
  idle: number;
  flags: string;
  db: number;
  sub: number;
  psub: number;
  multi: number;
  qbuf: number;
  qbufFree: number;
  obl: number;
  oll: number;
  omem: number;
  events: string;
  cmd: string;
}

/**
 * Slowlog entry
 */
export interface SlowlogEntry {
  id: number;
  timestamp: number;
  duration: number;
  command: string[];
  clientAddr: string;
  clientName: string;
}

/**
 * Pipeline commands
 */
export interface PipelineCommands {
  exec(): Promise<any[]>;
  discard(): void;
}

/**
 * Transaction commands
 */
export interface MultiCommands extends PipelineCommands {
  watch(...keys: RedisKey[]): Promise<'OK'>;
  unwatch(): Promise<'OK'>;
}

/**
 * Script load result
 */
export type ScriptSHA = string;

/**
 * Redis error
 */
export class RedisError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'RedisError';
  }
}

/**
 * Connection error
 */
export class ConnectionError extends RedisError {
  constructor(message: string) {
    super(message, 'CONNECTION_ERROR');
    this.name = 'ConnectionError';
  }
}

/**
 * Timeout error
 */
export class TimeoutError extends RedisError {
  constructor(message: string) {
    super(message, 'TIMEOUT_ERROR');
    this.name = 'TimeoutError';
  }
}

/**
 * Cluster error
 */
export class ClusterError extends RedisError {
  constructor(message: string) {
    super(message, 'CLUSTER_ERROR');
    this.name = 'ClusterError';
  }
}
