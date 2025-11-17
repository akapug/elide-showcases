/**
 * Redis sorted set commands implementation
 */

import * as types from '../types';

export class SortedSetCommands {
  constructor(private client: any) {}

  async zadd(key: types.RedisKey, ...args: any[]): Promise<number> {
    return this.client.sendCommand(['ZADD', key, ...args]);
  }

  async zrem(key: types.RedisKey, ...members: string[]): Promise<number> {
    return this.client.sendCommand(['ZREM', key, ...members]);
  }

  async zscore(key: types.RedisKey, member: string): Promise<string | null> {
    return this.client.sendCommand(['ZSCORE', key, member]);
  }

  async zincrby(key: types.RedisKey, increment: number, member: string): Promise<string> {
    return this.client.sendCommand(['ZINCRBY', key, increment, member]);
  }

  async zcard(key: types.RedisKey): Promise<number> {
    return this.client.sendCommand(['ZCARD', key]);
  }

  async zcount(key: types.RedisKey, min: string | number, max: string | number): Promise<number> {
    return this.client.sendCommand(['ZCOUNT', key, min, max]);
  }

  async zrange(key: types.RedisKey, start: number, stop: number, withScores?: boolean): Promise<string[]> {
    return withScores
      ? this.client.sendCommand(['ZRANGE', key, start, stop, 'WITHSCORES'])
      : this.client.sendCommand(['ZRANGE', key, start, stop]);
  }

  async zrevrange(key: types.RedisKey, start: number, stop: number, withScores?: boolean): Promise<string[]> {
    return withScores
      ? this.client.sendCommand(['ZREVRANGE', key, start, stop, 'WITHSCORES'])
      : this.client.sendCommand(['ZREVRANGE', key, start, stop]);
  }

  async zrangebyscore(
    key: types.RedisKey,
    min: string | number,
    max: string | number,
    options?: {
      WITHSCORES?: boolean;
      LIMIT?: { offset: number; count: number };
    }
  ): Promise<string[]> {
    const args: any[] = ['ZRANGEBYSCORE', key, min, max];

    if (options?.WITHSCORES) args.push('WITHSCORES');
    if (options?.LIMIT) {
      args.push('LIMIT', options.LIMIT.offset, options.LIMIT.count);
    }

    return this.client.sendCommand(args);
  }

  async zrevrangebyscore(
    key: types.RedisKey,
    max: string | number,
    min: string | number,
    options?: {
      WITHSCORES?: boolean;
      LIMIT?: { offset: number; count: number };
    }
  ): Promise<string[]> {
    const args: any[] = ['ZREVRANGEBYSCORE', key, max, min];

    if (options?.WITHSCORES) args.push('WITHSCORES');
    if (options?.LIMIT) {
      args.push('LIMIT', options.LIMIT.offset, options.LIMIT.count);
    }

    return this.client.sendCommand(args);
  }

  async zrank(key: types.RedisKey, member: string): Promise<number | null> {
    return this.client.sendCommand(['ZRANK', key, member]);
  }

  async zrevrank(key: types.RedisKey, member: string): Promise<number | null> {
    return this.client.sendCommand(['ZREVRANK', key, member]);
  }

  async zremrangebyrank(key: types.RedisKey, start: number, stop: number): Promise<number> {
    return this.client.sendCommand(['ZREMRANGEBYRANK', key, start, stop]);
  }

  async zremrangebyscore(key: types.RedisKey, min: string | number, max: string | number): Promise<number> {
    return this.client.sendCommand(['ZREMRANGEBYSCORE', key, min, max]);
  }

  async zpopmin(key: types.RedisKey, count?: number): Promise<string[]> {
    return count
      ? this.client.sendCommand(['ZPOPMIN', key, count])
      : this.client.sendCommand(['ZPOPMIN', key]);
  }

  async zpopmax(key: types.RedisKey, count?: number): Promise<string[]> {
    return count
      ? this.client.sendCommand(['ZPOPMAX', key, count])
      : this.client.sendCommand(['ZPOPMAX', key]);
  }

  async bzpopmin(timeout: number, ...keys: types.RedisKey[]): Promise<[string, string, string] | null> {
    return this.client.sendCommand(['BZPOPMIN', ...keys, timeout]);
  }

  async bzpopmax(timeout: number, ...keys: types.RedisKey[]): Promise<[string, string, string] | null> {
    return this.client.sendCommand(['BZPOPMAX', ...keys, timeout]);
  }

  async zscan(key: types.RedisKey, cursor: string, options?: {
    MATCH?: string;
    COUNT?: number;
  }): Promise<types.ZScanResult> {
    const args: any[] = ['ZSCAN', key, cursor];

    if (options?.MATCH) args.push('MATCH', options.MATCH);
    if (options?.COUNT) args.push('COUNT', options.COUNT);

    const result = await this.client.sendCommand(args);
    const members: Array<{ member: string; score: number }> = [];

    for (let i = 0; i < result[1].length; i += 2) {
      members.push({
        member: result[1][i],
        score: parseFloat(result[1][i + 1])
      });
    }

    return { cursor: result[0], members };
  }

  async zunion(keys: types.RedisKey[], options?: {
    WEIGHTS?: number[];
    AGGREGATE?: 'SUM' | 'MIN' | 'MAX';
    WITHSCORES?: boolean;
  }): Promise<string[]> {
    const args: any[] = ['ZUNION', keys.length, ...keys];

    if (options?.WEIGHTS) {
      args.push('WEIGHTS', ...options.WEIGHTS);
    }
    if (options?.AGGREGATE) {
      args.push('AGGREGATE', options.AGGREGATE);
    }
    if (options?.WITHSCORES) {
      args.push('WITHSCORES');
    }

    return this.client.sendCommand(args);
  }

  async zinter(keys: types.RedisKey[], options?: {
    WEIGHTS?: number[];
    AGGREGATE?: 'SUM' | 'MIN' | 'MAX';
    WITHSCORES?: boolean;
  }): Promise<string[]> {
    const args: any[] = ['ZINTER', keys.length, ...keys];

    if (options?.WEIGHTS) {
      args.push('WEIGHTS', ...options.WEIGHTS);
    }
    if (options?.AGGREGATE) {
      args.push('AGGREGATE', options.AGGREGATE);
    }
    if (options?.WITHSCORES) {
      args.push('WITHSCORES');
    }

    return this.client.sendCommand(args);
  }
}
