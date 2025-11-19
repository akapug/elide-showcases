/**
 * Redis client implementation
 */

import * as types from './types';
import { StringCommands } from './commands/strings';
import { HashCommands } from './commands/hashes';
import { ListCommands } from './commands/lists';
import { SetCommands } from './commands/sets';
import { SortedSetCommands } from './commands/zsets';
import { RedisPipeline } from './pipeline';
import { RedisPubSub } from './pubsub';

/**
 * Redis client with full command support
 */
export class RedisClient {
  private options: types.RedisOptions;
  private connection: any;
  private connected: boolean = false;
  private ready: boolean = false;
  private commandQueue: Array<{ command: string[]; resolve: Function; reject: Function }> = [];
  private subscriptionMode: boolean = false;

  // Command mixins
  private stringCommands: StringCommands;
  private hashCommands: HashCommands;
  private listCommands: ListCommands;
  private setCommands: SetCommands;
  private zsetCommands: SortedSetCommands;

  constructor(options: types.RedisOptions = {}) {
    this.options = {
      host: 'localhost',
      port: 6379,
      db: 0,
      connectTimeout: 10000,
      commandTimeout: 5000,
      enableOfflineQueue: true,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      keepAlive: 30000,
      noDelay: true,
      ...options
    };

    // Initialize command handlers
    this.stringCommands = new StringCommands(this);
    this.hashCommands = new HashCommands(this);
    this.listCommands = new ListCommands(this);
    this.setCommands = new SetCommands(this);
    this.zsetCommands = new SortedSetCommands(this);

    if (!this.options.lazyConnect) {
      this.connect();
    }
  }

  /**
   * Connect to Redis server
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new types.TimeoutError('Connection timeout'));
      }, this.options.connectTimeout);

      try {
        // Use Elide's native Redis connection
        this.connection = this.nativeConnect(this.options);
        this.connected = true;
        this.ready = true;

        clearTimeout(timeout);

        // Process queued commands
        this.processQueue();

        // Select database if specified
        if (this.options.db && this.options.db !== 0) {
          this.sendCommand(['SELECT', String(this.options.db)]);
        }

        // Authenticate if password provided
        if (this.options.password) {
          const authArgs = this.options.username
            ? ['AUTH', this.options.username, this.options.password]
            : ['AUTH', this.options.password];
          this.sendCommand(authArgs);
        }

        resolve();
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from Redis server
   */
  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    await this.sendCommand(['QUIT']);
    this.nativeDisconnect(this.connection);
    this.connected = false;
    this.ready = false;
  }

  /**
   * Send raw command to Redis
   */
  async sendCommand(args: types.CommandArgs): Promise<any> {
    if (!this.connected && !this.options.enableOfflineQueue) {
      throw new types.ConnectionError('Client is not connected');
    }

    return new Promise((resolve, reject) => {
      const command = args.map(arg => String(arg));

      if (!this.ready && this.options.enableOfflineQueue) {
        this.commandQueue.push({ command, resolve, reject });
        return;
      }

      try {
        const result = this.nativeSendCommand(this.connection, command);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Process queued commands
   */
  private processQueue(): void {
    while (this.commandQueue.length > 0) {
      const { command, resolve, reject } = this.commandQueue.shift()!;
      this.nativeSendCommand(this.connection, command)
        .then(resolve)
        .catch(reject);
    }
  }

  // ==================== STRING COMMANDS ====================

  async get(key: types.RedisKey): Promise<string | null> {
    return this.stringCommands.get(key);
  }

  async set(key: types.RedisKey, value: types.RedisValue, options?: any): Promise<'OK' | null> {
    return this.stringCommands.set(key, value, options);
  }

  async setex(key: types.RedisKey, seconds: number, value: types.RedisValue): Promise<'OK'> {
    return this.stringCommands.setex(key, seconds, value);
  }

  async setnx(key: types.RedisKey, value: types.RedisValue): Promise<0 | 1> {
    return this.stringCommands.setnx(key, value);
  }

  async mget(...keys: types.RedisKey[]): Promise<Array<string | null>> {
    return this.stringCommands.mget(...keys);
  }

  async mset(...args: Array<types.RedisKey | types.RedisValue>): Promise<'OK'> {
    return this.stringCommands.mset(...args);
  }

  async incr(key: types.RedisKey): Promise<number> {
    return this.stringCommands.incr(key);
  }

  async incrby(key: types.RedisKey, increment: number): Promise<number> {
    return this.stringCommands.incrby(key, increment);
  }

  async decr(key: types.RedisKey): Promise<number> {
    return this.stringCommands.decr(key);
  }

  async decrby(key: types.RedisKey, decrement: number): Promise<number> {
    return this.stringCommands.decrby(key, decrement);
  }

  async append(key: types.RedisKey, value: types.RedisValue): Promise<number> {
    return this.stringCommands.append(key, value);
  }

  async strlen(key: types.RedisKey): Promise<number> {
    return this.stringCommands.strlen(key);
  }

  // ==================== HASH COMMANDS ====================

  async hget(key: types.RedisKey, field: string): Promise<string | null> {
    return this.hashCommands.hget(key, field);
  }

  async hset(key: types.RedisKey, field: string, value: types.RedisValue): Promise<0 | 1> {
    return this.hashCommands.hset(key, field, value);
  }

  async hmset(key: types.RedisKey, ...args: any[]): Promise<'OK'> {
    return this.hashCommands.hmset(key, ...args);
  }

  async hmget(key: types.RedisKey, ...fields: string[]): Promise<Array<string | null>> {
    return this.hashCommands.hmget(key, ...fields);
  }

  async hgetall(key: types.RedisKey): Promise<Record<string, string>> {
    return this.hashCommands.hgetall(key);
  }

  async hdel(key: types.RedisKey, ...fields: string[]): Promise<number> {
    return this.hashCommands.hdel(key, ...fields);
  }

  async hexists(key: types.RedisKey, field: string): Promise<0 | 1> {
    return this.hashCommands.hexists(key, field);
  }

  async hincrby(key: types.RedisKey, field: string, increment: number): Promise<number> {
    return this.hashCommands.hincrby(key, field, increment);
  }

  async hkeys(key: types.RedisKey): Promise<string[]> {
    return this.hashCommands.hkeys(key);
  }

  async hvals(key: types.RedisKey): Promise<string[]> {
    return this.hashCommands.hvals(key);
  }

  async hlen(key: types.RedisKey): Promise<number> {
    return this.hashCommands.hlen(key);
  }

  // ==================== LIST COMMANDS ====================

  async lpush(key: types.RedisKey, ...values: types.RedisValue[]): Promise<number> {
    return this.listCommands.lpush(key, ...values);
  }

  async rpush(key: types.RedisKey, ...values: types.RedisValue[]): Promise<number> {
    return this.listCommands.rpush(key, ...values);
  }

  async lpop(key: types.RedisKey): Promise<string | null> {
    return this.listCommands.lpop(key);
  }

  async rpop(key: types.RedisKey): Promise<string | null> {
    return this.listCommands.rpop(key);
  }

  async lrange(key: types.RedisKey, start: number, stop: number): Promise<string[]> {
    return this.listCommands.lrange(key, start, stop);
  }

  async llen(key: types.RedisKey): Promise<number> {
    return this.listCommands.llen(key);
  }

  async lindex(key: types.RedisKey, index: number): Promise<string | null> {
    return this.listCommands.lindex(key, index);
  }

  async lset(key: types.RedisKey, index: number, value: types.RedisValue): Promise<'OK'> {
    return this.listCommands.lset(key, index, value);
  }

  async ltrim(key: types.RedisKey, start: number, stop: number): Promise<'OK'> {
    return this.listCommands.ltrim(key, start, stop);
  }

  // ==================== SET COMMANDS ====================

  async sadd(key: types.RedisKey, ...members: types.RedisValue[]): Promise<number> {
    return this.setCommands.sadd(key, ...members);
  }

  async srem(key: types.RedisKey, ...members: types.RedisValue[]): Promise<number> {
    return this.setCommands.srem(key, ...members);
  }

  async smembers(key: types.RedisKey): Promise<string[]> {
    return this.setCommands.smembers(key);
  }

  async sismember(key: types.RedisKey, member: types.RedisValue): Promise<0 | 1> {
    return this.setCommands.sismember(key, member);
  }

  async scard(key: types.RedisKey): Promise<number> {
    return this.setCommands.scard(key);
  }

  async spop(key: types.RedisKey, count?: number): Promise<string | string[] | null> {
    return this.setCommands.spop(key, count);
  }

  async srandmember(key: types.RedisKey, count?: number): Promise<string | string[] | null> {
    return this.setCommands.srandmember(key, count);
  }

  // ==================== SORTED SET COMMANDS ====================

  async zadd(key: types.RedisKey, ...args: any[]): Promise<number> {
    return this.zsetCommands.zadd(key, ...args);
  }

  async zrem(key: types.RedisKey, ...members: string[]): Promise<number> {
    return this.zsetCommands.zrem(key, ...members);
  }

  async zscore(key: types.RedisKey, member: string): Promise<string | null> {
    return this.zsetCommands.zscore(key, member);
  }

  async zrange(key: types.RedisKey, start: number, stop: number, withScores?: boolean): Promise<string[]> {
    return this.zsetCommands.zrange(key, start, stop, withScores);
  }

  async zcard(key: types.RedisKey): Promise<number> {
    return this.zsetCommands.zcard(key);
  }

  async zcount(key: types.RedisKey, min: string | number, max: string | number): Promise<number> {
    return this.zsetCommands.zcount(key, min, max);
  }

  async zincrby(key: types.RedisKey, increment: number, member: string): Promise<string> {
    return this.zsetCommands.zincrby(key, increment, member);
  }

  // ==================== KEY COMMANDS ====================

  async del(...keys: types.RedisKey[]): Promise<number> {
    return this.sendCommand(['DEL', ...keys]);
  }

  async exists(...keys: types.RedisKey[]): Promise<number> {
    return this.sendCommand(['EXISTS', ...keys]);
  }

  async expire(key: types.RedisKey, seconds: number): Promise<0 | 1> {
    return this.sendCommand(['EXPIRE', key, seconds]);
  }

  async expireat(key: types.RedisKey, timestamp: number): Promise<0 | 1> {
    return this.sendCommand(['EXPIREAT', key, timestamp]);
  }

  async ttl(key: types.RedisKey): Promise<number> {
    return this.sendCommand(['TTL', key]);
  }

  async persist(key: types.RedisKey): Promise<0 | 1> {
    return this.sendCommand(['PERSIST', key]);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.sendCommand(['KEYS', pattern]);
  }

  async scan(cursor: string, options?: any): Promise<types.ScanResult> {
    const args = ['SCAN', cursor];
    if (options?.match) args.push('MATCH', options.match);
    if (options?.count) args.push('COUNT', options.count);

    const result = await this.sendCommand(args);
    return { cursor: result[0], keys: result[1] };
  }

  async type(key: types.RedisKey): Promise<string> {
    return this.sendCommand(['TYPE', key]);
  }

  async rename(key: types.RedisKey, newKey: types.RedisKey): Promise<'OK'> {
    return this.sendCommand(['RENAME', key, newKey]);
  }

  // ==================== TRANSACTION COMMANDS ====================

  async multi(): Promise<RedisPipeline> {
    await this.sendCommand(['MULTI']);
    return new RedisPipeline(this, true);
  }

  async watch(...keys: types.RedisKey[]): Promise<'OK'> {
    return this.sendCommand(['WATCH', ...keys]);
  }

  async unwatch(): Promise<'OK'> {
    return this.sendCommand(['UNWATCH']);
  }

  // ==================== PIPELINE ====================

  pipeline(): RedisPipeline {
    return new RedisPipeline(this);
  }

  // ==================== PUB/SUB ====================

  createPubSub(): RedisPubSub {
    return new RedisPubSub(this);
  }

  async publish(channel: string, message: string): Promise<number> {
    return this.sendCommand(['PUBLISH', channel, message]);
  }

  // ==================== SCRIPT COMMANDS ====================

  async eval(script: string, numKeys: number, ...args: types.CommandArgs): Promise<any> {
    return this.sendCommand(['EVAL', script, numKeys, ...args]);
  }

  async evalsha(sha: string, numKeys: number, ...args: types.CommandArgs): Promise<any> {
    return this.sendCommand(['EVALSHA', sha, numKeys, ...args]);
  }

  async scriptLoad(script: string): Promise<string> {
    return this.sendCommand(['SCRIPT', 'LOAD', script]);
  }

  async scriptExists(...shas: string[]): Promise<number[]> {
    return this.sendCommand(['SCRIPT', 'EXISTS', ...shas]);
  }

  async scriptFlush(): Promise<'OK'> {
    return this.sendCommand(['SCRIPT', 'FLUSH']);
  }

  // ==================== SERVER COMMANDS ====================

  async ping(message?: string): Promise<string> {
    return message
      ? this.sendCommand(['PING', message])
      : this.sendCommand(['PING']);
  }

  async echo(message: string): Promise<string> {
    return this.sendCommand(['ECHO', message]);
  }

  async select(db: number): Promise<'OK'> {
    return this.sendCommand(['SELECT', db]);
  }

  async dbsize(): Promise<number> {
    return this.sendCommand(['DBSIZE']);
  }

  async flushdb(async?: boolean): Promise<'OK'> {
    return async
      ? this.sendCommand(['FLUSHDB', 'ASYNC'])
      : this.sendCommand(['FLUSHDB']);
  }

  async flushall(async?: boolean): Promise<'OK'> {
    return async
      ? this.sendCommand(['FLUSHALL', 'ASYNC'])
      : this.sendCommand(['FLUSHALL']);
  }

  async info(section?: types.InfoSection): Promise<string> {
    return section
      ? this.sendCommand(['INFO', section])
      : this.sendCommand(['INFO']);
  }

  async time(): Promise<[string, string]> {
    return this.sendCommand(['TIME']);
  }

  // Connection state
  get isConnected(): boolean {
    return this.connected;
  }

  get isReady(): boolean {
    return this.ready;
  }

  // Native bindings (implemented via Elide's Redis integration)
  private nativeConnect(options: types.RedisOptions): any {
    return (globalThis as any).__elide_redis_connect?.(options) || { mock: true };
  }

  private nativeDisconnect(connection: any): void {
    (globalThis as any).__elide_redis_disconnect?.(connection);
  }

  private nativeSendCommand(connection: any, args: string[]): Promise<any> {
    return (globalThis as any).__elide_redis_command?.(connection, args) || Promise.resolve(null);
  }
}
