/**
 * Redis pipeline implementation for batch operations
 */

import * as types from './types';

export class RedisPipeline {
  private commands: Array<{ args: types.CommandArgs; resolve: Function; reject: Function }> = [];
  private client: any;
  private isTransaction: boolean;
  private executing: boolean = false;

  constructor(client: any, isTransaction: boolean = false) {
    this.client = client;
    this.isTransaction = isTransaction;
  }

  /**
   * Add command to pipeline
   */
  private addCommand(args: types.CommandArgs): this {
    if (this.executing) {
      throw new Error('Cannot add commands after pipeline execution');
    }

    this.commands.push({
      args,
      resolve: () => {},
      reject: () => {}
    });

    return this;
  }

  // ==================== STRING COMMANDS ====================

  get(key: types.RedisKey): this {
    return this.addCommand(['GET', key]);
  }

  set(key: types.RedisKey, value: types.RedisValue): this {
    return this.addCommand(['SET', key, value]);
  }

  setex(key: types.RedisKey, seconds: number, value: types.RedisValue): this {
    return this.addCommand(['SETEX', key, seconds, value]);
  }

  incr(key: types.RedisKey): this {
    return this.addCommand(['INCR', key]);
  }

  decr(key: types.RedisKey): this {
    return this.addCommand(['DECR', key]);
  }

  // ==================== HASH COMMANDS ====================

  hget(key: types.RedisKey, field: string): this {
    return this.addCommand(['HGET', key, field]);
  }

  hset(key: types.RedisKey, field: string, value: types.RedisValue): this {
    return this.addCommand(['HSET', key, field, value]);
  }

  hgetall(key: types.RedisKey): this {
    return this.addCommand(['HGETALL', key]);
  }

  hdel(key: types.RedisKey, ...fields: string[]): this {
    return this.addCommand(['HDEL', key, ...fields]);
  }

  // ==================== LIST COMMANDS ====================

  lpush(key: types.RedisKey, ...values: types.RedisValue[]): this {
    return this.addCommand(['LPUSH', key, ...values]);
  }

  rpush(key: types.RedisKey, ...values: types.RedisValue[]): this {
    return this.addCommand(['RPUSH', key, ...values]);
  }

  lpop(key: types.RedisKey): this {
    return this.addCommand(['LPOP', key]);
  }

  rpop(key: types.RedisKey): this {
    return this.addCommand(['RPOP', key]);
  }

  lrange(key: types.RedisKey, start: number, stop: number): this {
    return this.addCommand(['LRANGE', key, start, stop]);
  }

  // ==================== SET COMMANDS ====================

  sadd(key: types.RedisKey, ...members: types.RedisValue[]): this {
    return this.addCommand(['SADD', key, ...members]);
  }

  srem(key: types.RedisKey, ...members: types.RedisValue[]): this {
    return this.addCommand(['SREM', key, ...members]);
  }

  smembers(key: types.RedisKey): this {
    return this.addCommand(['SMEMBERS', key]);
  }

  // ==================== SORTED SET COMMANDS ====================

  zadd(key: types.RedisKey, ...args: any[]): this {
    return this.addCommand(['ZADD', key, ...args]);
  }

  zrange(key: types.RedisKey, start: number, stop: number): this {
    return this.addCommand(['ZRANGE', key, start, stop]);
  }

  zrem(key: types.RedisKey, ...members: string[]): this {
    return this.addCommand(['ZREM', key, ...members]);
  }

  // ==================== KEY COMMANDS ====================

  del(...keys: types.RedisKey[]): this {
    return this.addCommand(['DEL', ...keys]);
  }

  exists(...keys: types.RedisKey[]): this {
    return this.addCommand(['EXISTS', ...keys]);
  }

  expire(key: types.RedisKey, seconds: number): this {
    return this.addCommand(['EXPIRE', key, seconds]);
  }

  ttl(key: types.RedisKey): this {
    return this.addCommand(['TTL', key]);
  }

  // ==================== EXECUTION ====================

  /**
   * Execute all pipelined commands
   */
  async exec(): Promise<any[]> {
    if (this.executing) {
      throw new Error('Pipeline already executing');
    }

    this.executing = true;

    if (this.isTransaction) {
      // For transactions, send EXEC command
      const results = await this.client.sendCommand(['EXEC']);
      return results || [];
    }

    // For regular pipeline, execute commands in batch
    const results: any[] = [];

    for (const { args } of this.commands) {
      try {
        const result = await this.client.sendCommand(args);
        results.push(result);
      } catch (error) {
        results.push(error);
      }
    }

    return results;
  }

  /**
   * Discard pipeline/transaction
   */
  discard(): void {
    if (this.isTransaction) {
      this.client.sendCommand(['DISCARD']);
    }
    this.commands = [];
    this.executing = false;
  }

  /**
   * Get number of queued commands
   */
  get length(): number {
    return this.commands.length;
  }
}
